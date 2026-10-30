import type { Request, Response } from 'express';
import { z } from 'zod';
import { pool } from '../config/database.js';
import { safeDecryptField } from '../services/pii.js';

// ── Schemas de Validación ───────────────────────────────────

const clientIdParamSchema = z.coerce
  .number()
  .int('ID de clienta inválido')
  .positive('ID de clienta inválido');

const saveFormulaSchema = z.object({
  bookingId: z.string().uuid('ID de cita inválido'),
  formula: z
    .string({ required_error: 'La fórmula es requerida' })
    .trim()
    .min(1, 'La fórmula no puede estar vacía')
    .max(1000, 'La fórmula no puede superar los 1000 caracteres'),
});

// ── Handlers ────────────────────────────────────────────────

/**
 * GET /api/admin/clients
 * Retorna el padrón completo de clientas con PII descifrada en memoria,
 * la fecha de su última cita completada (`lastVisit`) y orden alfabético en español.
 */
export async function listAdminClients(_req: Request, res: Response): Promise<void> {
  try {
    const { rows } = await pool.query<{
      id: number;
      name: string;
      phone: string;
      last_visit: Date | null;
    }>(
      `SELECT
         c.id,
         c.name,
         c.phone,
         MAX(b.scheduled_at) FILTER (WHERE b.status = 'completed') AS last_visit
       FROM clients c
       LEFT JOIN bookings b ON b.client_id = c.id
       GROUP BY c.id, c.name, c.phone`,
    );

    const clients = rows
      .map((row) => ({
        id: row.id,
        name: safeDecryptField(row.name, `client id=${row.id}`),
        phone: safeDecryptField(row.phone, `client id=${row.id}`),
        lastVisit: row.last_visit ? row.last_visit.toISOString() : null,
      }))
      .sort((a, b) => a.name.localeCompare(b.name, 'es'));

    res.json({ clients });
  } catch (err) {
    console.error('[adminClient] Error al listar clientas:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

/**
 * GET /api/admin/clients/:id/history
 * Retorna el historial de citas no canceladas de una clienta (más recientes primero),
 * incluyendo notas y fórmula técnica de color.
 */
export async function getClientHistory(req: Request, res: Response): Promise<void> {
  const idParsed = clientIdParamSchema.safeParse(req.params.id);
  if (!idParsed.success) {
    res.status(400).json({ error: 'ID de clienta inválido' });
    return;
  }

  const clientId = idParsed.data;

  try {
    const { rows: clientRows } = await pool.query<{ id: number }>(
      'SELECT id FROM clients WHERE id = $1 LIMIT 1',
      [clientId],
    );

    if (clientRows.length === 0) {
      res.status(404).json({ error: 'Clienta no encontrada' });
      return;
    }

    const { rows } = await pool.query<{
      id: string;
      scheduled_at: Date;
      status: 'pending' | 'confirmed' | 'completed';
      service_name: string;
      notes: string | null;
      technical_formula: string | null;
    }>(
      `SELECT
         b.id,
         b.scheduled_at,
         b.status,
         s.name AS service_name,
         b.notes,
         b.technical_formula
       FROM bookings b
       JOIN services s ON s.id = b.service_id
       WHERE b.client_id = $1
         AND b.status <> 'cancelled'
       ORDER BY b.scheduled_at DESC`,
      [clientId],
    );

    const history = rows.map((r) => ({
      id: r.id,
      date: r.scheduled_at.toISOString(),
      status: r.status,
      serviceName: r.service_name,
      notes: r.notes ?? null,
      technicalFormula: r.technical_formula ?? null,
    }));

    res.json({ history });
  } catch (err) {
    console.error('[adminClient] Error al obtener historial de clienta:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

/**
 * POST /api/admin/clients/:id/formulas
 * Registra o actualiza la fórmula técnica de color asociada a una cita completada
 * perteneciente a la clienta indicada.
 */
export async function saveClientFormula(req: Request, res: Response): Promise<void> {
  const idParsed = clientIdParamSchema.safeParse(req.params.id);
  if (!idParsed.success) {
    res.status(400).json({ error: 'ID de clienta inválido' });
    return;
  }

  const bodyParsed = saveFormulaSchema.safeParse(req.body);
  if (!bodyParsed.success) {
    res.status(400).json({
      error: 'Datos inválidos',
      details: bodyParsed.error.flatten().fieldErrors,
    });
    return;
  }

  const clientId = idParsed.data;
  const { bookingId, formula } = bodyParsed.data;

  try {
    const { rows } = await pool.query<{ id: string; technical_formula: string }>(
      `UPDATE bookings
       SET technical_formula = $1,
           technical_formula_updated_at = NOW()
       WHERE id = $2
         AND client_id = $3
         AND status = 'completed'
       RETURNING id, technical_formula`,
      [formula, bookingId, clientId],
    );

    if (rows.length === 0) {
      res.status(404).json({ error: 'Cita no encontrada para esta clienta' });
      return;
    }

    res.json({
      bookingId: rows[0].id,
      technicalFormula: rows[0].technical_formula,
    });
  } catch (err) {
    console.error('[adminClient] Error al guardar fórmula técnica:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}
