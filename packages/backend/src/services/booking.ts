import { withTransaction } from '../config/database.js';
import { encrypt, hashPhone } from './crypto.js';
import { createBooking as insertBooking } from '../models/booking.js';
import { findOrCreateClient } from '../models/booking.js';
import { isSlotAvailable } from './availability.js';
import { SlotUnavailableError, ServiceNotFoundError } from '../classes/errors.js';

// ── Types ───────────────────────────────────────────────────

export interface BookingInput {
  serviceId: number;
  date: string;
  startTime: string;
  clientName: string;
  clientPhone: string;
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

// ── Public API ──────────────────────────────────────────────

/**
 * Orquesta la creación completa de una reserva dentro de una transacción.
 *
 * Flujo transaccional:
 * 1. Cifra PII de la clienta (AES-256-GCM) y hashea el teléfono (SHA-256)
 * 2. Busca o crea la clienta por phone_hash (upsert atómico)
 * 3. Valida que el servicio exista y esté activo
 * 4. Verifica disponibilidad del slot con bloqueo pesimista (LOCK TABLE + SELECT FOR UPDATE)
 * 5. Inserta la reserva con snapshot de duración
 * 6. Retorna datos de confirmación para notificación WhatsApp
 */
export async function createBooking(input: BookingInput): Promise<BookingResult> {
  return withTransaction(async (client) => {
    const encryptedName  = packEncrypted(encrypt(input.clientName));
    const encryptedPhone = packEncrypted(encrypt(input.clientPhone));
    const phoneHash      = hashPhone(input.clientPhone);

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
        origin: 'self_service',
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
        clientPhone: input.clientPhone,
        serviceName: service.name,
        date: input.date,
        startTime: input.startTime,
        endTime,
        price: parseFloat(service.price),
      },
    };
  });
}
