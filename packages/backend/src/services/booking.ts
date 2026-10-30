import { withTransaction } from '../config/database.js';
import { encrypt, hashPhone } from './crypto.js';
import { createBooking as insertBooking } from '../models/booking.js';
import { findOrCreateClient } from '../models/booking.js';
import { getAvailableSlots, isSlotAvailable } from './availability.js';
import {
  BookingValidationError,
  SlotUnavailableError,
  ServiceNotFoundError,
} from '../classes/errors.js';

const TIMEZONE = 'America/Costa_Rica';
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

// ── Types ───────────────────────────────────────────────────

export interface BookingInput {
  serviceId: number;
  date: string;
  startTime: string;
  clientName: string;
  clientPhone: string;
  notes?: string;
}

export interface CreateBookingOptions {
  enforceSchedule?: boolean;
  origin?: 'self_service' | 'manual_admin';
}

export interface BookingResult {
  booking: {
    id: string;
    status: string;
    scheduledAt: Date;
  };
  confirmation: {
    clientName: string;
    clientPhone: string;
    serviceName: string;
    date: string;
    startTime: string;
    endTime: string;
    price: number;
  };
}

// ── Helpers ─────────────────────────────────────────────────

function packEncrypted(payload: { encrypted: string; iv: string }): string {
  return `${payload.encrypted}:${payload.iv}`;
}

function computeEndTime(startTime: string, durationMinutes: number): string {
  const [h, m] = startTime.split(':').map(Number);
  const total  = h * 60 + m + durationMinutes;
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
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

// ── Public API ──────────────────────────────────────────────

/**
 * Normaliza un número telefónico de Costa Rica al formato E.164 (+506XXXXXXXX).
 * @throws {BookingValidationError} Si no tiene 8 dígitos locales o 11 con prefijo 506.
 */
export function normalizePhoneCR(raw: string): string {
  const digits = raw.replace(/\D/g, '');

  if (digits.length === 8) {
    return `+506${digits}`;
  }

  if (digits.length === 11 && digits.startsWith('506')) {
    return `+${digits}`;
  }

  throw new BookingValidationError(
    'Teléfono inválido (8 dígitos de Costa Rica)',
    'clientPhone',
  );
}

/**
 * Orquesta la creación completa de una reserva dentro de una transacción.
 *
 * Flujo:
 * 1. Normaliza el teléfono a E.164 (+506XXXXXXXX) y valida reglas de agenda pública si enforceSchedule=true
 * 2. Cifra PII de la clienta (AES-256-GCM) y hashea el teléfono (SHA-256)
 * 3. Busca o crea la clienta por phone_hash (upsert atómico)
 * 4. Valida que el servicio exista y esté activo
 * 5. Verifica disponibilidad del slot con bloqueo pesimista (LOCK TABLE + SELECT FOR UPDATE)
 * 6. Inserta la reserva con snapshot de duración y notas opcionales
 * 7. Retorna datos de confirmación para notificación WhatsApp
 */
export async function createBooking(
  input: BookingInput,
  options: CreateBookingOptions = {},
): Promise<BookingResult> {
  const { enforceSchedule = true, origin = 'self_service' } = options;

  const normalizedPhone = normalizePhoneCR(input.clientPhone);

  if (enforceSchedule) {
    if (!isValidDateString(input.date)) {
      throw new BookingValidationError('Formato de fecha inválido (YYYY-MM-DD)', 'date');
    }

    const todayCR = getTodayCR();
    const tomorrowCR = addDaysUTC(todayCR, 1);
    const maxDateCR = addDaysUTC(todayCR, 14);

    if (input.date < tomorrowCR || input.date > maxDateCR) {
      throw new BookingValidationError(
        'La fecha de reserva debe estar entre mañana y los próximos 14 días',
        'date',
      );
    }

    const dayOfWeek = new Date(`${input.date}T12:00:00Z`).getUTCDay();
    if (dayOfWeek === 0) {
      throw new BookingValidationError(
        'El salón permanece cerrado los domingos',
        'date',
      );
    }

    const availableSlots = await getAvailableSlots(input.date, input.serviceId);
    const slotExists = availableSlots.some((s) => s.startTime === input.startTime);
    if (!slotExists) {
      throw new SlotUnavailableError();
    }
  }

  return withTransaction(async (client) => {
    const encryptedName  = packEncrypted(encrypt(input.clientName));
    const encryptedPhone = packEncrypted(encrypt(normalizedPhone));
    const phoneHash      = hashPhone(normalizedPhone);

    const clientRecord = await findOrCreateClient(
      encryptedName,
      encryptedPhone,
      phoneHash,
      client,
    );

    const { rows: svcRows } = await client.query<{
      id: number;
      name: string;
      duration_minutes: number;
      price: string;
    }>(
      'SELECT id, name, duration_minutes, price FROM services WHERE id = $1 AND is_active = true',
      [input.serviceId],
    );

    if (svcRows.length === 0) throw new ServiceNotFoundError();

    const service = svcRows[0];
    const endTime = computeEndTime(input.startTime, service.duration_minutes);

    const { available } = await isSlotAvailable(input.date, input.startTime, endTime, client);
    if (!available) throw new SlotUnavailableError();

    // America/Costa_Rica es UTC-6 permanente (sin horario de verano desde 1992)
    const scheduledAt = new Date(`${input.date}T${input.startTime}:00-06:00`);

    const booking = await insertBooking(
      {
        clientId: clientRecord.id,
        serviceId: service.id,
        scheduledAt,
        durationMinutes: service.duration_minutes,
        origin,
        notes: input.notes,
      },
      client,
    );

    return {
      booking: {
        id: booking.id,
        status: booking.status,
        scheduledAt: booking.scheduled_at,
      },
      confirmation: {
        clientName: input.clientName,
        clientPhone: normalizedPhone,
        serviceName: service.name,
        date: input.date,
        startTime: input.startTime,
        endTime,
        price: parseFloat(service.price),
      },
    };
  });
}
