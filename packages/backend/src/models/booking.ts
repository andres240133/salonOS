import type { PoolClient } from 'pg';
import { pool } from '../config/database.js';
import { BookingNotFoundError } from '../classes/errors.js';

const TIMEZONE = 'America/Costa_Rica';

// ── Types ───────────────────────────────────────────────────

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

export interface CreateBookingData {
  clientId: number;
  serviceId: number;
  scheduledAt: Date;
  durationMinutes: number;
  origin: 'self_service' | 'manual_admin';
  notes?: string;
}

export interface BookingRow {
  id: string;
  client_id: number;
  service_id: number;
  scheduled_at: Date;
  duration_minutes: number;
  status: BookingStatus;
  origin: string;
  notes: string | null;
  created_at: Date;
}

export interface BookingWithDetails extends BookingRow {
  client_name: string;
  client_phone: string;
  service_name: string;
  service_price: string;
}

export interface ClientRow {
  id: number;
  name: string;
  phone: string;
  phone_hash: string;
  created_at: Date;
}

// ── Queries ─────────────────────────────────────────────────

/**
 * Inserta una nueva reserva dentro de una transacción existente.
 * `duration_minutes` es un snapshot del servicio al momento de reservar,
 * inmune a cambios posteriores en el catálogo.
 */
export async function createBooking(
  data: CreateBookingData,
  client: PoolClient,
): Promise<BookingRow> {
  const { rows } = await client.query<BookingRow>(
    `INSERT INTO bookings (client_id, service_id, scheduled_at, duration_minutes, status, origin, notes)
     VALUES ($1, $2, $3, $4, 'pending', $5, $6)
     RETURNING *`,
    [data.clientId, data.serviceId, data.scheduledAt, data.durationMinutes, data.origin, data.notes ?? null],
  );

  return rows[0];
}

/** Busca una reserva por UUID. Retorna null si no existe. */
export async function findBookingById(id: string): Promise<BookingRow | null> {
  const { rows } = await pool.query<BookingRow>(
    'SELECT * FROM bookings WHERE id = $1 LIMIT 1',
    [id],
  );

  return rows[0] ?? null;
}

/**
 * Retorna las reservas del día con datos de clienta y servicio.
 * Los campos `client_name` y `client_phone` vienen cifrados — el llamador
 * es responsable de descifrarlos antes de exponerlos.
 */
export async function findBookingsByDate(
  date: string,
  status?: BookingStatus,
): Promise<BookingWithDetails[]> {
  const params: unknown[] = [date, TIMEZONE];

  let query = `
    SELECT
      b.id, b.client_id, b.service_id, b.scheduled_at, b.duration_minutes,
      b.status, b.origin, b.notes, b.created_at,
      c.name  AS client_name,
      c.phone AS client_phone,
      s.name  AS service_name,
      s.price AS service_price
    FROM bookings b
    JOIN clients  c ON b.client_id  = c.id
    JOIN services s ON b.service_id = s.id
    WHERE (b.scheduled_at AT TIME ZONE $2)::date = $1::date`;

  if (status) {
    params.push(status);
    query += ` AND b.status = $${params.length}`;
  }

  query += '\n    ORDER BY b.scheduled_at ASC';

  const { rows } = await pool.query<BookingWithDetails>(query, params);
  return rows;
}

/**
 * Actualiza el estado de una reserva.
 * @throws {BookingNotFoundError} si el ID no existe.
 */
export async function updateBookingStatus(
  id: string,
  status: BookingStatus,
): Promise<void> {
  const result = await pool.query(
    'UPDATE bookings SET status = $2 WHERE id = $1',
    [id, status],
  );

  if (result.rowCount === 0) {
    throw new BookingNotFoundError();
  }
}

/**
 * Upsert atómico de clienta por phone_hash.
 *
 * INSERT ... ON CONFLICT DO NOTHING + SELECT posterior:
 * - DO NOTHING (no DO UPDATE) evita sobrescribir datos cifrados existentes
 *   con nueva encriptación (diferente IV cada vez invalidaría el ciphertext original).
 * - El SELECT posterior garantiza retornar la fila canónica, sea recién
 *   insertada o preexistente.
 * - Ambas queries dentro de la misma transacción eliminan la ventana donde
 *   otra transacción podría insertar un phone_hash duplicado entre el INSERT
 *   y el SELECT.
 */
export async function findOrCreateClient(
  name: string,
  phone: string,
  phoneHash: string,
  client?: PoolClient,
): Promise<ClientRow> {
  const runner = client ?? pool;

  await runner.query(
    `INSERT INTO clients (name, phone, phone_hash)
     VALUES ($1, $2, $3)
     ON CONFLICT (phone_hash) DO NOTHING`,
    [name, phone, phoneHash],
  );

  const { rows } = await runner.query<ClientRow>(
    'SELECT id, name, phone, phone_hash, created_at FROM clients WHERE phone_hash = $1',
    [phoneHash],
  );

  return rows[0];
}
