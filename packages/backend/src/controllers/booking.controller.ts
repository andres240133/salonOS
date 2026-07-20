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
  SlotUnavailableError,
  ServiceNotFoundError,
  BookingNotFoundError,
} from '../classes/errors.js';
import { decrypt } from '../services/crypto.js';
import { pool } from '../config/database.js';
import { WhatsAppService } from '../services/whatsapp.js';

const TIMEZONE = 'America/Costa_Rica';

// ── Validation ──────────────────────────────────────────────

const createBookingSchema = z.object({
  serviceId:   z.number().int().positive(),
  date:        z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)'),
  startTime:   z.string().regex(/^\d{2}:\d{2}$/, 'Formato de hora inválido (HH:MM)'),
  clientName:  z.string().min(2, 'Nombre muy corto').max(100),
  clientPhone: z.string().min(8, 'Teléfono muy corto').max(20),
});

const updateStatusSchema = z.object({
  status: z.enum(['confirmed', 'cancelled', 'completed']),
});

// ── Helpers ─────────────────────────────────────────────────

function decryptField(stored: string): string {
  const [encrypted, iv] = stored.split(':');
  return decrypt(encrypted, iv);
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
    if (err instanceof SlotUnavailableError) {
      res.status(409).json({ error: err.message });
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

/** GET /api/bookings — Lista citas con datos desencriptados (admin, requireAuth) */
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

/** PATCH /api/bookings/:id/status — Actualiza estado de cita (admin, requireAuth) */
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
