import type { Request, Response } from 'express';
import { z } from 'zod';
import { createBooking as createBookingSvc } from '../services/booking.js';
import { getAvailableSlots } from '../services/availability.js';
import {
  findBookingsByDate,
  findBookingById,
  updateBookingStatus,
  type BookingStatus,
} from '../models/booking.js';
import {
  BookingValidationError,
  SlotUnavailableError,
  ServiceNotFoundError,
  BookingNotFoundError,
} from '../classes/errors.js';
import { decrypt } from '../services/crypto.js';
import { pool } from '../config/database.js';
import { WhatsAppService } from '../services/whatsapp.js';

const TIMEZONE = 'America/Costa_Rica';
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

// ── Validation ──────────────────────────────────────────────

const createBookingSchema = z.object({
  serviceId:   z.number().int().positive(),
  date:        z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)'),
  startTime:   z.string().regex(/^\d{2}:\d{2}$/, 'Formato de hora inválido (HH:MM)'),
  clientName:  z.string().min(2, 'Nombre muy corto').max(100),
  clientPhone: z.string().min(1, 'Teléfono requerido').max(30),
  notes:       z.string().max(500, 'Las notas no pueden superar 500 caracteres').optional(),
});

const updateStatusSchema = z.object({
  status: z.enum(['confirmed', 'cancelled', 'completed']),
});

// ── Helpers ─────────────────────────────────────────────────

function decryptField(stored: string): string {
  const [encrypted, iv] = stored.split(':');
  return decrypt(encrypted, iv);
}

/**
 * Valida que una cadena YYYY-MM-DD represente una fecha calendario real
 * usando aritmética UTC al mediodía para evitar desfases de huso horario.
 */
function isValidDateString(dateStr: string): boolean {
  if (!DATE_REGEX.test(dateStr)) return false;
  const d = new Date(`${dateStr}T12:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === dateStr;
}

/**
 * Suma días a una fecha YYYY-MM-DD en UTC puro (sin depender del TZ del servidor).
 */
function addDaysUTC(dateStr: string, daysToAdd: number): string {
  const d = new Date(`${dateStr}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + daysToAdd);
  return d.toISOString().slice(0, 10);
}

/**
 * Obtiene la fecha actual YYYY-MM-DD en America/Costa_Rica (UTC-6).
 */
function getTodayCR(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: TIMEZONE });
}

/** Dispara asíncronamente el envío del recordatorio de confirmación por WhatsApp */
function notifyWhatsApp(bookingId: string): void {
  WhatsAppService.sendBookingConfirmation(bookingId).catch((err) => {
    console.error('[whatsapp] Error asíncrono en notifyWhatsApp (fire-and-forget):', err);
  });
}

// ── Handlers ────────────────────────────────────────────────

/** POST /api/bookings — Crea una reserva (endpoint público) */
export async function create(req: Request, res: Response): Promise<void> {
  const parsed = createBookingSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      error: 'Datos inválidos',
      details: parsed.error.flatten().fieldErrors,
    });
    return;
  }

  try {
    const result = await createBookingSvc(parsed.data);

    res.status(201).json(result);

    // Fire-and-forget: no bloquea la respuesta al cliente
    notifyWhatsApp(result.booking.id);
  } catch (err) {
    if (err instanceof BookingValidationError) {
      res.status(400).json({
        error: err.message,
        ...(err.field ? { details: { [err.field]: [err.message] } } : {}),
      });
      return;
    }
    if (err instanceof SlotUnavailableError) {
      try {
        const isSunday = new Date(`${parsed.data.date}T12:00:00Z`).getUTCDay() === 0;
        const rawSlots = isSunday
          ? []
          : await getAvailableSlots(parsed.data.date, parsed.data.serviceId);
        const availableSlots = rawSlots
          .filter((s) => s.spotsLeft > 0)
          .map((s) => ({
            date: parsed.data.date,
            time: s.startTime,
            spotsLeft: s.spotsLeft,
          }));

        res.status(409).json({
          error: err.message,
          availableSlots,
        });
      } catch (slotErr) {
        console.error('[booking] Error al consultar alternativas tras 409:', slotErr);
        res.status(409).json({
          error: err.message,
          availableSlots: [],
        });
      }
      return;
    }
    if (err instanceof ServiceNotFoundError) {
      res.status(404).json({ error: err.message });
      return;
    }
    console.error('[booking] Error al crear reserva:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

/**
 * GET /api/bookings/availability/range — Consulta slots disponibles en un rango de hasta 14 días (público).
 * Si `from` es anterior a mañana (hora CR), se ajusta a mañana para tolerar cruces de medianoche.
 */
export async function getAvailabilityRange(req: Request, res: Response): Promise<void> {
  const { serviceId, from: rawFrom, to: rawTo } = req.query;

  if (!serviceId || typeof rawFrom !== 'string' || typeof rawTo !== 'string') {
    res.status(400).json({ error: 'Parámetros serviceId, from y to son requeridos' });
    return;
  }

  const parsedServiceId = parseInt(serviceId as string, 10);
  if (Number.isNaN(parsedServiceId) || parsedServiceId <= 0) {
    res.status(400).json({ error: 'serviceId debe ser un número entero positivo' });
    return;
  }

  if (!isValidDateString(rawFrom) || !isValidDateString(rawTo)) {
    res.status(400).json({ error: 'Formato de fecha inválido (YYYY-MM-DD)' });
    return;
  }

  if (rawTo < rawFrom) {
    res.status(400).json({ error: 'La fecha final (to) debe ser mayor o igual a la fecha inicial (from)' });
    return;
  }

  // Máximo 14 días inclusive desde el from solicitado (from + 13 días = 14 fechas)
  const maxAllowedTo = addDaysUTC(rawFrom, 13);
  if (rawTo > maxAllowedTo) {
    res.status(400).json({ error: 'El rango máximo permitido es de 14 días' });
    return;
  }

  const tomorrowCR = addDaysUTC(getTodayCR(), 1);
  const effectiveFrom = rawFrom < tomorrowCR ? tomorrowCR : rawFrom;

  if (rawTo < effectiveFrom) {
    res.status(400).json({ error: 'El rango solicitado debe ser a partir de mañana' });
    return;
  }

  try {
    const slots: Array<{ date: string; time: string; spotsLeft: number }> = [];

    for (let curr = effectiveFrom; curr <= rawTo; curr = addDaysUTC(curr, 1)) {
      const dayOfWeek = new Date(`${curr}T12:00:00Z`).getUTCDay();
      if (dayOfWeek === 0) continue;

      const daySlots = await getAvailableSlots(curr, parsedServiceId);
      for (const s of daySlots) {
        if (s.spotsLeft <= 0) continue;
        slots.push({
          date: curr,
          time: s.startTime,
          spotsLeft: s.spotsLeft,
        });
      }
    }

    res.json({ slots });
  } catch (err) {
    console.error('[booking] Error al obtener rango de disponibilidad:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

/** GET /api/bookings/availability — Consulta slots disponibles (endpoint público) */
export async function getAvailability(req: Request, res: Response): Promise<void> {
  const { date, serviceId } = req.query;

  if (!date || !serviceId) {
    res.status(400).json({ error: 'Parámetros date y serviceId son requeridos' });
    return;
  }

  const parsedServiceId = parseInt(serviceId as string, 10);

  if (Number.isNaN(parsedServiceId) || parsedServiceId <= 0) {
    res.status(400).json({ error: 'serviceId debe ser un número entero positivo' });
    return;
  }

  try {
    const slots = await getAvailableSlots(date as string, parsedServiceId);
    res.json({ date, slots });
  } catch (err) {
    console.error('[booking] Error al obtener disponibilidad:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

/**
 * GET /api/bookings — Lista citas con datos desencriptados (admin, requireAuth)
 * @deprecated Usar GET /api/admin/bookings/today en su lugar.
 */
export async function list(req: Request, res: Response): Promise<void> {
  const dateParam = (req.query.date as string) ??
    new Date().toLocaleDateString('en-CA', { timeZone: TIMEZONE });

  try {
    const bookings = await findBookingsByDate(
      dateParam,
      req.query.status as BookingStatus | undefined,
    );

    const decrypted = bookings.map((b) => ({
      ...b,
      client_name:  decryptField(b.client_name),
      client_phone: decryptField(b.client_phone),
    }));

    res.json({ bookings: decrypted });
  } catch (err) {
    console.error('[booking] Error al listar citas:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

/**
 * PATCH /api/bookings/:id/status — Actualiza estado de cita (admin, requireAuth)
 * @deprecated Usar PATCH /api/admin/bookings/:id/complete o PATCH /api/admin/bookings/:id/cancel en su lugar.
 */
export async function updateStatus(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  const parsed = updateStatusSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Estado inválido. Valores: confirmed, cancelled, completed' });
    return;
  }

  try {
    const booking = await findBookingById(id);
    if (!booking) {
      res.status(404).json({ error: 'Cita no encontrada' });
      return;
    }

    if (parsed.data.status === 'completed') {
      const { rows } = await pool.query(
        'SELECT id FROM payments WHERE booking_id = $1',
        [id],
      );
      if (rows.length === 0) {
        res.status(400).json({ error: 'Debe registrar el pago antes de completar la cita' });
        return;
      }
    }

    await updateBookingStatus(id, parsed.data.status);
    res.json({ message: 'Estado actualizado', id, status: parsed.data.status });
  } catch (err) {
    if (err instanceof BookingNotFoundError) {
      res.status(404).json({ error: err.message });
      return;
    }
    console.error('[booking] Error al actualizar estado:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}
