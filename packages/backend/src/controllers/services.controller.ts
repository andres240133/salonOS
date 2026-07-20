import type { Request, Response } from 'express';
import { pool } from '../config/database.js';

// ── Handlers ────────────────────────────────────────────────

/** GET /api/services — Catálogo de servicios activos (endpoint público) */
export async function list(_req: Request, res: Response): Promise<void> {
  try {
    const { rows } = await pool.query(
      'SELECT id, name, price, duration_minutes, category FROM services WHERE is_active = true ORDER BY category, name'
    );
    res.json({ services: rows });
  } catch (err) {
    console.error('[services] Error al listar catálogo:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}
