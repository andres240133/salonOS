import type { Request, Response } from 'express';
import { z } from 'zod';
import { withTransaction } from '../config/database.js';
import { findBookingsByDate } from '../models/booking.js';
import { createBooking as createBookingSvc } from '../services/booking.js';
import { safeDecryptField } from '../services/pii.js';
import {
  BookingValidationError,
  SlotUnavailableError,
  ServiceNotFoundError,
} from '../classes/errors.js';

const TIMEZONE = 'America/Costa_Rica';
const CR_OFFSET_MS = 6 * 60 * 60 * 1000;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

// ── Schemas de Validación ───────────────────────────────────

const uuidParamSchema = z.uuid({ error: 'ID de cita inválido' });

const completeBookingSchema = z.object({
  amount: z
    .number({ error: 'El monto debe ser un número' })
    .min(0, { error: 'El monto no puede ser negativo' })
    .max(99999999.99, { error: 'El monto excede el límite permitido' }),
  paymentMethod: z.enum(['cash', 'transfer', 'card'], {
    error: 'Método de pago inválido (cash, transfer, card)',
  }),
});

const cancelBookingSchema = z.object({
  reason: z
    .string()
    .trim()
    .max(300, { error: 'El motivo no puede superar los 300 caracteres' })
    .optional(),
});

const createAdminBookingSchema = z.object({
  serviceId: z.number().int().positive({ error: 'Seleccione un servicio válido' }),
  scheduledAt: z.iso.datetime({ offset: true, error: 'Formato de fecha y hora ISO inválido' }),
  clientName: z.string().trim().min(2, { error: 'El nombre debe tener al menos 2 caracteres' }).max(100),
  clientPhone: z.string().trim().min(1, { error: 'El teléfono es requerido' }).max(30),
  notes: z.string().max(500, { error: 'Las notas no pueden superar 500 caracteres' }).optional(),
});

// ── Helpers ─────────────────────────────────────────────────

function getTodayCR(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: TIMEZONE });
}

function isValidDateString(dateStr: string): boolean {
  if (!DATE_REGEX.test(dateStr)) return false;
  const d = new Date(`${dateStr}T12:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === dateStr;
}

/**
 * Extrae la fecha (YYYY-MM-DD) y hora (HH:MM) en America/Costa_Rica (UTC-6 fijo)
 * a partir de un timestamp ISO utilizando aritmética UTC pura, sin depender del TZ del servidor.
 */
function extractCRDateAndTime(isoString: string): { date: string; startTime: string; epochMs: number } {
  const epochMs = Date.parse(isoString);
  const crShiftedISO = new Date(epochMs - CR_OFFSET_MS).toISOString();
  return {
    date: crShiftedISO.slice(0, 10),
    startTime: crShiftedISO.slice(11, 16),
    epochMs,
  };
}

class HttpConflictError extends Error {
  readonly statusCode: number;
  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

// ── Handlers ────────────────────────────────────────────────

/**
 * GET /api/admin/bookings/today
 * Lista todas las reservas de la fecha indicada (?date=YYYY-MM-DD, por defecto hoy en CR)
 * con PII descifrado y la estructura anidada requerida por AdminBooking.
 */
export async function listDayBookings(req: Request, res: Response): Promise<void> {
  const rawDate = req.query.date;
  let targetDate: string;

  if (rawDate === undefined || rawDate === '') {
    targetDate = getTodayCR();
  } else if (typeof rawDate === 'string' && isValidDateString(rawDate)) {
    targetDate = rawDate;
  } else {
    res.status(400).json({ error: 'Formato de fecha inválido (YYYY-MM-DD)' });
    return;
  }

  try {
    const rows = await findBookingsByDate(targetDate);

    const bookings = rows.map((b) => ({
      id: b.id,
      scheduledAt: b.scheduled_at.toISOString(),
      status: b.status,
      origin: b.origin as 'self_service' | 'manual_admin',
      notes: b.notes ?? null,
      service: {
        id: b.service_id,
        name: b.service_name,
        price: parseFloat(b.service_price),
      },
      client: {
        id: b.client_id,
        name: safeDecryptField(b.client_name, b.id),
        phone: safeDecryptField(b.client_phone, b.id),
      },
    }));

    res.json({ bookings });
  } catch (err) {
    console.error('[adminBooking] Error al listar citas del día:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

/**
 * PATCH /api/admin/bookings/:id/complete
 * Registra el pago en `payments` y marca la cita como `completed` dentro de una única
 * transacción con bloqueo pesimista (SELECT ... FOR UPDATE) para evitar pagos duplicados.
 */
export async function completeAdminBooking(req: Request, res: Response): Promise<void> {
  const idParsed = uuidParamSchema.safeParse(req.params.id);
  if (!idParsed.success) {
    res.status(400).json({ error: 'ID de cita inválido' });
    return;
  }

  const bodyParsed = completeBookingSchema.safeParse(req.body);
  if (!bodyParsed.success) {
    res.status(400).json({
      error: 'Datos de pago inválidos',
      details: z.flattenError(bodyParsed.error).fieldErrors,
    });
    return;
  }

  const bookingId = idParsed.data;
  const { amount, paymentMethod } = bodyParsed.data;

  try {
    await withTransaction(async (client) => {
      const { rows } = await client.query<{ id: string; status: string }>(
        'SELECT id, status FROM bookings WHERE id = $1 FOR UPDATE',
        [bookingId],
      );

      if (rows.length === 0) {
        throw new HttpConflictError(404, 'Cita no encontrada');
      }

      const currentStatus = rows[0].status;
      if (currentStatus !== 'pending' && currentStatus !== 'confirmed') {
        throw new HttpConflictError(
          409,
          currentStatus === 'completed'
            ? 'Esta cita ya fue completada previamente'
            : 'No se puede completar una cita cancelada',
        );
      }

      await client.query(
        `INSERT INTO payments (booking_id, amount, payment_method)
         VALUES ($1, $2, $3)`,
        [bookingId, amount, paymentMethod],
      );

      await client.query(
        `UPDATE bookings SET status = 'completed' WHERE id = $1`,
        [bookingId],
      );
    });

    res.json({ id: bookingId, status: 'completed' });
  } catch (err) {
    if (err instanceof HttpConflictError) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }
    console.error('[adminBooking] Error al completar cita:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

/**
 * PATCH /api/admin/bookings/:id/cancel
 * Marca una cita como `cancelled` y almacena `cancellation_reason` usando bloqueo
 * pesimista (SELECT ... FOR UPDATE) para evitar condiciones de carrera con `/complete`.
 */
export async function cancelAdminBooking(req: Request, res: Response): Promise<void> {
  const idParsed = uuidParamSchema.safeParse(req.params.id);
  if (!idParsed.success) {
    res.status(400).json({ error: 'ID de cita inválido' });
    return;
  }

  const bodyParsed = cancelBookingSchema.safeParse(req.body ?? {});
  if (!bodyParsed.success) {
    res.status(400).json({
      error: 'Datos de cancelación inválidos',
      details: z.flattenError(bodyParsed.error).fieldErrors,
    });
    return;
  }

  const bookingId = idParsed.data;
  const reason = bodyParsed.data.reason || null;

  try {
    await withTransaction(async (client) => {
      const { rows } = await client.query<{ id: string; status: string }>(
        'SELECT id, status FROM bookings WHERE id = $1 FOR UPDATE',
        [bookingId],
      );

      if (rows.length === 0) {
        throw new HttpConflictError(404, 'Cita no encontrada');
      }

      const currentStatus = rows[0].status;
      if (currentStatus === 'completed' || currentStatus === 'cancelled') {
        throw new HttpConflictError(
          409,
          currentStatus === 'completed'
            ? 'No se puede cancelar una cita que ya fue completada'
            : 'Esta cita ya se encuentra cancelada',
        );
      }

      await client.query(
        `UPDATE bookings
         SET status = 'cancelled',
             cancellation_reason = $2
         WHERE id = $1`,
        [bookingId, reason],
      );
    });

    res.json({ id: bookingId, status: 'cancelled' });
  } catch (err) {
    if (err instanceof HttpConflictError) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }
    console.error('[adminBooking] Error al cancelar cita:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

/**
 * POST /api/admin/bookings
 * Crea una cita manual desde el panel de administración (`origin: 'manual_admin'`,
 * `enforceSchedule: false`). Permite agendar fuera de horario o en días cerrados,
 * manteniendo la validación de capacidad máxima simultánea y no agendar en el pasado.
 */
export async function createAdminBooking(req: Request, res: Response): Promise<void> {
  const parsed = createAdminBookingSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: 'Datos inválidos',
      details: z.flattenError(parsed.error).fieldErrors,
    });
    return;
  }

  const { serviceId, scheduledAt, clientName, clientPhone, notes } = parsed.data;
  const { date, startTime, epochMs } = extractCRDateAndTime(scheduledAt);

  if (epochMs < Date.now()) {
    res.status(400).json({
      error: 'No se pueden crear citas en el pasado',
    });
    return;
  }

  try {
    const result = await createBookingSvc(
      {
        serviceId,
        date,
        startTime,
        clientName,
        clientPhone,
        notes,
      },
      {
        enforceSchedule: false,
        origin: 'manual_admin',
      },
    );

    // TODO: decidir con la estilista si enviar confirmación por WhatsApp para citas manuales
    res.status(201).json({ id: result.booking.id });
  } catch (err) {
    if (err instanceof BookingValidationError) {
      res.status(400).json({
        error: err.message,
        ...(err.field ? { details: { [err.field]: [err.message] } } : {}),
      });
      return;
    }
    if (err instanceof SlotUnavailableError) {
      res.status(409).json({
        error: 'Capacidad máxima alcanzada en ese horario (máximo 2 citas simultáneas)',
      });
      return;
    }
    if (err instanceof ServiceNotFoundError) {
      res.status(404).json({ error: err.message });
      return;
    }
    console.error('[adminBooking] Error al crear cita manual:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}
