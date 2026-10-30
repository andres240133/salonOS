import type { Request, Response } from 'express';
import { z } from 'zod';
import { pool, withTransaction } from '../config/database.js';

const TIMEZONE = 'America/Costa_Rica';
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

// ── Helpers ─────────────────────────────────────────────────

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
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

/**
 * Calcula el lunes de la semana actual en America/Costa_Rica usando aritmética UTC.
 */
function getCurrentMondayCR(todayCR: string): string {
  const d = new Date(`${todayCR}T12:00:00Z`);
  const dayOfWeek = d.getUTCDay();
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  d.setUTCDate(d.getUTCDate() + diffToMonday);
  return d.toISOString().slice(0, 10);
}

// ── Schemas Zod ─────────────────────────────────────────────

const getAvailabilityQuerySchema = z
  .object({
    from: z.string().refine(isValidDateString, 'Formato de fecha from inválido (YYYY-MM-DD)'),
    to: z.string().refine(isValidDateString, 'Formato de fecha to inválido (YYYY-MM-DD)'),
  })
  .refine((data) => data.to >= data.from, {
    message: 'La fecha final (to) debe ser mayor o igual a la fecha inicial (from)',
    path: ['to'],
  });

const weekDayInputSchema = z
  .object({
    dayOfWeek: z
      .number()
      .int()
      .min(1, 'Domingo (0) no es configurable; use valores de 1 (lunes) a 6 (sábado)')
      .max(6, 'dayOfWeek debe estar entre 1 (lunes) y 6 (sábado)'),
    startTime: z.string().regex(TIME_REGEX, 'Formato de hora inválido (HH:MM)'),
    lastStartTime: z.string().regex(TIME_REGEX, 'Formato de hora inválido (HH:MM)'),
    endTime: z.string().regex(TIME_REGEX, 'Formato de hora inválido (HH:MM)'),
  })
  .refine((day) => timeToMinutes(day.startTime) <= timeToMinutes(day.lastStartTime), {
    message: 'La última cita (lastStartTime) debe ser igual o posterior a la primera cita (startTime)',
    path: ['lastStartTime'],
  })
  .refine((day) => timeToMinutes(day.lastStartTime) < timeToMinutes(day.endTime), {
    message: 'La hora de cierre (endTime) debe ser posterior a la última cita (lastStartTime)',
    path: ['endTime'],
  });

const saveWeekSchema = z
  .object({
    weekStart: z
      .string()
      .refine(isValidDateString, 'Formato de weekStart inválido (YYYY-MM-DD)')
      .refine(
        (val) => new Date(`${val}T12:00:00Z`).getUTCDay() === 1,
        'weekStart debe corresponder a un día lunes',
      ),
    days: z.array(weekDayInputSchema).max(6),
  })
  .refine(
    (data) => {
      const seen = new Set<number>();
      for (const d of data.days) {
        if (seen.has(d.dayOfWeek)) return false;
        seen.add(d.dayOfWeek);
      }
      return true;
    },
    {
      message: 'No se permiten días duplicados en la misma semana',
      path: ['days'],
    },
  );

const templateItemSchema = z
  .object({
    dayOfWeek: z
      .number()
      .int()
      .min(1, 'Domingo (0) no es configurable; use valores de 1 (lunes) a 6 (sábado)')
      .max(6, 'dayOfWeek debe estar entre 1 (lunes) y 6 (sábado)'),
    startTime: z.string().regex(TIME_REGEX, 'Formato de hora inválido (HH:MM)'),
    lastStartTime: z.string().regex(TIME_REGEX, 'Formato de hora inválido (HH:MM)'),
    endTime: z.string().regex(TIME_REGEX, 'Formato de hora inválido (HH:MM)'),
    isActive: z.boolean(),
  })
  .refine((item) => timeToMinutes(item.startTime) <= timeToMinutes(item.lastStartTime), {
    message: 'La última cita (lastStartTime) debe ser igual o posterior a la primera cita (startTime)',
    path: ['lastStartTime'],
  })
  .refine((item) => timeToMinutes(item.lastStartTime) < timeToMinutes(item.endTime), {
    message: 'La hora de cierre (endTime) debe ser posterior a la última cita (lastStartTime)',
    path: ['endTime'],
  });

const updateTemplatesSchema = z
  .object({
    templates: z.array(templateItemSchema).min(1).max(6),
  })
  .refine(
    (data) => {
      const seen = new Set<number>();
      for (const t of data.templates) {
        if (seen.has(t.dayOfWeek)) return false;
        seen.add(t.dayOfWeek);
      }
      return true;
    },
    {
      message: 'No se permiten días duplicados en las plantillas',
      path: ['templates'],
    },
  );

// ── Types ───────────────────────────────────────────────────

export interface AvailabilityConflict {
  date: string;
  bookingsCount: number;
  reason: 'has_bookings' | 'outside_hours';
}

// ── Handlers ────────────────────────────────────────────────

/**
 * GET /api/admin/availability?from=YYYY-MM-DD&to=YYYY-MM-DD
 * Devuelve los bloques de disponibilidad configurados dentro del rango de fechas.
 */
export async function getAvailabilityRange(req: Request, res: Response): Promise<void> {
  const parsed = getAvailabilityQuerySchema.safeParse(req.query);

  if (!parsed.success) {
    res.status(400).json({
      error: 'Parámetros de consulta inválidos',
      details: parsed.error.flatten().fieldErrors,
    });
    return;
  }

  try {
    const { from, to } = parsed.data;

    const { rows } = await pool.query<{
      date: string;
      start_time: string;
      last_start_time: string;
      end_time: string;
      is_active: boolean;
    }>(
      `SELECT
         TO_CHAR(date, 'YYYY-MM-DD') AS date,
         TO_CHAR(start_time, 'HH24:MI') AS start_time,
         TO_CHAR(last_start_time, 'HH24:MI') AS last_start_time,
         TO_CHAR(end_time, 'HH24:MI') AS end_time,
         is_active
       FROM availability_slots
       WHERE date >= $1::date AND date <= $2::date
       ORDER BY date ASC`,
      [from, to],
    );

    res.json({
      days: rows.map((r) => ({
        date: r.date,
        startTime: r.start_time,
        lastStartTime: r.last_start_time,
        endTime: r.end_time,
        isActive: r.is_active,
      })),
    });
  } catch (err) {
    console.error('[availability] Error al consultar disponibilidad:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

/**
 * POST /api/admin/availability/week
 * Configura los días laborables (lunes a sábado) de una semana específica en una única transacción.
 * Ignora fechas ya pasadas respecto a hoy (hora Costa Rica) y preserva días con citas conflictivas.
 */
export async function saveWeekAvailability(req: Request, res: Response): Promise<void> {
  const parsed = saveWeekSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      error: 'Datos de disponibilidad inválidos',
      details: parsed.error.flatten().fieldErrors,
    });
    return;
  }

  const { weekStart, days } = parsed.data;
  const todayCR = getTodayCR();
  const currentMondayCR = getCurrentMondayCR(todayCR);

  if (weekStart < currentMondayCR) {
    res.status(400).json({
      error: 'No se puede configurar una semana en el pasado',
    });
    return;
  }

  const dayMap = new Map(days.map((d) => [d.dayOfWeek, d]));

  try {
    const conflicts = await withTransaction(async (client) => {
      const detectedConflicts: AvailabilityConflict[] = [];

      for (let dow = 1; dow <= 6; dow++) {
        const dateStr = addDaysUTC(weekStart, dow - 1);

        // Al guardar "Esta semana", las fechas anteriores a hoy en CR no se tocan
        if (dateStr < todayCR) {
          continue;
        }

        const dayConfig = dayMap.get(dow);

        if (dayConfig) {
          const newStartMin = timeToMinutes(dayConfig.startTime);
          const newLastStartMin = timeToMinutes(dayConfig.lastStartTime);
          const newEndMin = timeToMinutes(dayConfig.endTime);

          // Una cita queda fuera si empieza antes de startTime, empieza después de lastStartTime,
          // o termina después de endTime (calculado en zona horaria America/Costa_Rica).
          const { rows: outsideRows } = await client.query<{ count: number }>(
            `SELECT COUNT(*)::int AS count
             FROM bookings
             WHERE status IN ('pending', 'confirmed')
               AND (scheduled_at AT TIME ZONE $2)::date = $1::date
               AND (
                 (EXTRACT(HOUR FROM scheduled_at AT TIME ZONE $2) * 60 +
                  EXTRACT(MINUTE FROM scheduled_at AT TIME ZONE $2)) < $3
                 OR
                 (EXTRACT(HOUR FROM scheduled_at AT TIME ZONE $2) * 60 +
                  EXTRACT(MINUTE FROM scheduled_at AT TIME ZONE $2)) > $4
                 OR
                 (EXTRACT(HOUR FROM scheduled_at AT TIME ZONE $2) * 60 +
                  EXTRACT(MINUTE FROM scheduled_at AT TIME ZONE $2) + duration_minutes) > $5
               )`,
            [dateStr, TIMEZONE, newStartMin, newLastStartMin, newEndMin],
          );

          const outsideCount = outsideRows[0]?.count ?? 0;

          if (outsideCount > 0) {
            detectedConflicts.push({
              date: dateStr,
              bookingsCount: outsideCount,
              reason: 'outside_hours',
            });
            continue;
          }

          await client.query(
            `INSERT INTO availability_slots (date, start_time, last_start_time, end_time, is_active)
             VALUES ($1::date, $2::time, $3::time, $4::time, TRUE)
             ON CONFLICT (date) DO UPDATE
               SET start_time      = EXCLUDED.start_time,
                   last_start_time = EXCLUDED.last_start_time,
                   end_time        = EXCLUDED.end_time,
                   is_active       = TRUE`,
            [dateStr, dayConfig.startTime, dayConfig.lastStartTime, dayConfig.endTime],
          );
        } else {
          // Día no incluido en el body: verificar citas antes de desactivar
          const { rows: activeRows } = await client.query<{ count: number }>(
            `SELECT COUNT(*)::int AS count
             FROM bookings
             WHERE status IN ('pending', 'confirmed')
               AND (scheduled_at AT TIME ZONE $2)::date = $1::date`,
            [dateStr, TIMEZONE],
          );

          const bookingsCount = activeRows[0]?.count ?? 0;

          if (bookingsCount > 0) {
            detectedConflicts.push({
              date: dateStr,
              bookingsCount,
              reason: 'has_bookings',
            });
            continue;
          }

          await client.query(
            `UPDATE availability_slots
             SET is_active = FALSE
             WHERE date = $1::date`,
            [dateStr],
          );
        }
      }

      return detectedConflicts;
    });

    res.json({
      weekStart,
      conflicts,
    });
  } catch (err) {
    console.error('[availability] Error al guardar semana:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

/**
 * GET /api/admin/availability/templates
 * Obtiene la plantilla de "semana típica" (lunes a sábado).
 */
export async function getTemplates(_req: Request, res: Response): Promise<void> {
  try {
    const { rows } = await pool.query<{
      day_of_week: number;
      start_time: string;
      last_start_time: string;
      end_time: string;
      is_active: boolean;
    }>(
      `SELECT
         day_of_week,
         TO_CHAR(start_time, 'HH24:MI') AS start_time,
         TO_CHAR(last_start_time, 'HH24:MI') AS last_start_time,
         TO_CHAR(end_time, 'HH24:MI') AS end_time,
         is_active
       FROM availability_templates
       WHERE day_of_week BETWEEN 1 AND 6
       ORDER BY day_of_week ASC`,
    );

    res.json({
      templates: rows.map((r) => ({
        dayOfWeek: r.day_of_week,
        startTime: r.start_time,
        lastStartTime: r.last_start_time,
        endTime: r.end_time,
        isActive: r.is_active,
      })),
    });
  } catch (err) {
    console.error('[availability] Error al obtener plantillas:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

/**
 * PUT /api/admin/availability/templates
 * Actualiza la plantilla de "semana típica" (lunes a sábado) mediante upsert.
 */
export async function updateTemplates(req: Request, res: Response): Promise<void> {
  const parsed = updateTemplatesSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      error: 'Datos de plantillas inválidos',
      details: parsed.error.flatten().fieldErrors,
    });
    return;
  }

  try {
    const updated = await withTransaction(async (client) => {
      for (const item of parsed.data.templates) {
        await client.query(
          `INSERT INTO availability_templates (day_of_week, start_time, last_start_time, end_time, is_active)
           VALUES ($1, $2::time, $3::time, $4::time, $5)
           ON CONFLICT (day_of_week) DO UPDATE
             SET start_time      = EXCLUDED.start_time,
                 last_start_time = EXCLUDED.last_start_time,
                 end_time        = EXCLUDED.end_time,
                 is_active       = EXCLUDED.is_active`,
          [item.dayOfWeek, item.startTime, item.lastStartTime, item.endTime, item.isActive],
        );
      }

      const { rows } = await client.query<{
        day_of_week: number;
        start_time: string;
        last_start_time: string;
        end_time: string;
        is_active: boolean;
      }>(
        `SELECT
           day_of_week,
           TO_CHAR(start_time, 'HH24:MI') AS start_time,
           TO_CHAR(last_start_time, 'HH24:MI') AS last_start_time,
           TO_CHAR(end_time, 'HH24:MI') AS end_time,
           is_active
         FROM availability_templates
         WHERE day_of_week BETWEEN 1 AND 6
         ORDER BY day_of_week ASC`,
      );

      return rows.map((r) => ({
        dayOfWeek: r.day_of_week,
        startTime: r.start_time,
        lastStartTime: r.last_start_time,
        endTime: r.end_time,
        isActive: r.is_active,
      }));
    });

    res.json({ templates: updated });
  } catch (err) {
    console.error('[availability] Error al actualizar plantillas:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}
