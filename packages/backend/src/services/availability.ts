import type { PoolClient } from 'pg';
import { pool } from '../config/database.js';

/** Máximo de clientas simultáneas que acepta el salón */
const MAX_CONCURRENT_BOOKINGS = 2;

/** Minutos de margen que representa el ciclo completo de atención */
const BUFFER_MINUTES = 90;

/** Granularidad de generación de slots (cada cuántos minutos se ofrece un horario) */
const SLOT_GRANULARITY_MINUTES = 30;

const TIMEZONE = 'America/Costa_Rica';

// ── Types ───────────────────────────────────────────────────

export interface TimeSlot {
  startTime: string;
  endTime: string;
  available: boolean;
  spotsLeft: number;
}

interface MinuteRange {
  start: number;
  end: number;
}

// ── Helpers ─────────────────────────────────────────────────

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function rangesOverlap(a: MinuteRange, b: MinuteRange): boolean {
  return a.start < b.end && a.end > b.start;
}

// ── Public API ──────────────────────────────────────────────

/**
 * Calcula los slots disponibles para una fecha y servicio.
 *
 * Proceso:
 * 1. Verifica que la fecha tenga un availability_slot activo
 * 2. Obtiene la duración del servicio solicitado
 * 3. Descarta rangos bloqueados por time_blocks
 * 4. Cuenta bookings solapadas (con buffer de 90 min) para cada candidato
 * 5. Filtra slots sin capacidad (spotsLeft === 0 no se retorna)
 */
export async function getAvailableSlots(
  date: string,
  serviceId: number,
): Promise<TimeSlot[]> {
  const { rows: availRows } = await pool.query<{ start_time: string; end_time: string }>(
    `SELECT TO_CHAR(start_time, 'HH24:MI') AS start_time,
            TO_CHAR(end_time,   'HH24:MI') AS end_time
     FROM availability_slots
     WHERE date = $1 AND is_active = true`,
    [date],
  );

  if (availRows.length === 0) return [];

  const windowStart = timeToMinutes(availRows[0].start_time);
  const windowEnd   = timeToMinutes(availRows[0].end_time);

  const { rows: svcRows } = await pool.query<{ duration_minutes: number }>(
    'SELECT duration_minutes FROM services WHERE id = $1 AND is_active = true',
    [serviceId],
  );

  if (svcRows.length === 0) return [];

  const duration = svcRows[0].duration_minutes;

  const { rows: blockRows } = await pool.query<{ block_start: string; block_end: string }>(
    `SELECT
       TO_CHAR(GREATEST(start_at AT TIME ZONE $2, $1::timestamp), 'HH24:MI') AS block_start,
       TO_CHAR(LEAST(end_at AT TIME ZONE $2, ($1::date + 1)::timestamp),     'HH24:MI') AS block_end
     FROM time_blocks
     WHERE start_at AT TIME ZONE $2 < ($1::date + 1)::timestamp
       AND end_at   AT TIME ZONE $2 > $1::timestamp`,
    [date, TIMEZONE],
  );

  const { rows: bookingRows } = await pool.query<{ start_minutes: string; end_minutes: string }>(
    `SELECT
       (EXTRACT(HOUR   FROM scheduled_at AT TIME ZONE $2) * 60 +
        EXTRACT(MINUTE FROM scheduled_at AT TIME ZONE $2))::int AS start_minutes,
       (EXTRACT(HOUR   FROM scheduled_at AT TIME ZONE $2) * 60 +
        EXTRACT(MINUTE FROM scheduled_at AT TIME ZONE $2) + duration_minutes)::int AS end_minutes
     FROM bookings
     WHERE status IN ('pending', 'confirmed')
       AND (scheduled_at AT TIME ZONE $2)::date = $1::date`,
    [date, TIMEZONE],
  );

  const blocks: MinuteRange[] = blockRows.map(b => ({
    start: timeToMinutes(b.block_start),
    end:   timeToMinutes(b.block_end),
  }));

  const bookings: MinuteRange[] = bookingRows.map(b => ({
    start: Number(b.start_minutes),
    end:   Number(b.end_minutes),
  }));

  const slots: TimeSlot[] = [];

  for (let slotStart = windowStart; slotStart + duration <= windowEnd; slotStart += SLOT_GRANULARITY_MINUTES) {
    const slotEnd   = slotStart + duration;
    const slotRange: MinuteRange = { start: slotStart, end: slotEnd };

    if (blocks.some(b => rangesOverlap(slotRange, b))) continue;

    const bufferedRange: MinuteRange = {
      start: slotStart - BUFFER_MINUTES,
      end:   slotEnd   + BUFFER_MINUTES,
    };

    const overlapCount = bookings.filter(b => rangesOverlap(b, bufferedRange)).length;
    const spotsLeft    = MAX_CONCURRENT_BOOKINGS - overlapCount;

    if (spotsLeft <= 0) continue;

    slots.push({
      startTime: minutesToTime(slotStart),
      endTime:   minutesToTime(slotEnd),
      available: true,
      spotsLeft,
    });
  }

  return slots;
}

/**
 * Verifica disponibilidad de un slot DENTRO de una transacción con bloqueo pesimista.
 *
 * Estrategia de prevención de race conditions:
 *
 * 1. LOCK TABLE bookings IN SHARE ROW EXCLUSIVE MODE
 *    Previene INSERTs concurrentes mientras esta transacción verifica disponibilidad.
 *    Necesario porque SELECT FOR UPDATE no puede bloquear filas que aún no existen
 *    (phantom reads): si dos requests llegan simultáneamente a un slot vacío, ambos
 *    leerían "0 solapamientos" y procederían a insertar, excediendo la capacidad.
 *
 * 2. SELECT COUNT(*) ... FOR UPDATE
 *    Bloquea las filas de bookings existentes que se solapan, previniendo que otra
 *    transacción cambie su estado (e.g., cancelación) entre la verificación y el INSERT.
 *
 * El BUFFER_MINUTES (90 min) expande la ventana de verificación para representar
 * el ciclo completo de atención del salón.
 */
export async function isSlotAvailable(
  date: string,
  startTime: string,
  endTime: string,
  client: PoolClient,
): Promise<{ available: boolean; spotsLeft: number }> {
  await client.query('LOCK TABLE bookings IN SHARE ROW EXCLUSIVE MODE');

  const { rows } = await client.query<{ overlap_count: string }>(
    `SELECT COUNT(*) AS overlap_count
     FROM bookings
     WHERE status IN ('pending', 'confirmed')
       AND scheduled_at < (($1 || ' ' || $3)::timestamp AT TIME ZONE $4) + ($5 || ' minutes')::interval
       AND (scheduled_at + (duration_minutes || ' minutes')::interval) > (($1 || ' ' || $2)::timestamp AT TIME ZONE $4) - ($5 || ' minutes')::interval
     FOR UPDATE`,
    [date, startTime, endTime, TIMEZONE, BUFFER_MINUTES],
  );

  const overlapCount = parseInt(rows[0].overlap_count, 10);
  const spotsLeft    = Math.max(MAX_CONCURRENT_BOOKINGS - overlapCount, 0);

  return { available: spotsLeft > 0, spotsLeft };
}
