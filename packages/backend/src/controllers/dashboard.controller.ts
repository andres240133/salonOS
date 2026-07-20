import type { Request, Response } from 'express';
import { z } from 'zod';
import { DashboardService } from '../services/dashboard.js';
import { pool } from '../config/database.js';

// Esquema de validación para los parámetros del query.
// Permite filtrar por un rango rápido preestablecido ('week', 'month', 'year')
// o bien ingresar fechas manuales 'startDate' y 'endDate' en formato ISO 8601.
const getFinanceMetricsSchema = z.object({
  range: z.enum(['week', 'month', 'year']).optional(),
  startDate: z.string().datetime({ message: 'startDate debe ser un ISO string válido' }).optional(),
  endDate: z.string().datetime({ message: 'endDate debe ser un ISO string válido' }).optional(),
}).refine(
  (data) => {
    // Si se especifica una fecha manual, se debe especificar obligatoriamente la otra
    // para evitar consultas con rangos abiertos infinitos.
    if ((data.startDate && !data.endDate) || (!data.startDate && data.endDate)) {
      return false;
    }
    return true;
  },
  {
    message: 'Se deben proveer ambos startDate y endDate, o ninguno.',
    path: ['startDate'],
  }
);

/**
 * Calcula y desplaza límites de fecha al huso horario oficial del salón (America/Costa_Rica, UTC-6)
 * para delimitar exactamente las fechas analíticas de inicio y fin correspondientes.
 *
 * @param range Rango rápido opcional ('week', 'month', 'year') o 'default'.
 * @returns Rango de fechas ISO delimitado a la medianoche local en Costa Rica.
 */
function getLocalRange(range: 'week' | 'month' | 'year' | 'default'): { startDate: string; endDate: string } {
  const now = new Date();

  // Obtenemos año, mes y día locales en Costa Rica mediante formateador oficial del sistema
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Costa_Rica',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(now);
  const findPart = (type: string) => parts.find((p) => p.type === type)?.value ?? '';

  const year = parseInt(findPart('year'), 10);
  const month = parseInt(findPart('month'), 10) - 1; // 0-indexed en Date
  const day = parseInt(findPart('day'), 10);

  // Fecha local base a medianoche representada en el constructo UTC
  const localToday = new Date(Date.UTC(year, month, day));

  let start: Date;
  let end: Date;

  if (range === 'week') {
    // En Costa Rica, el lunes marca el inicio de la semana laboral.
    const dayOfWeek = localToday.getUTCDay();
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    start = new Date(Date.UTC(year, month, day + diffToMonday));
    end = new Date(Date.UTC(year, month, day + diffToMonday + 6, 23, 59, 59, 999));
  } else if (range === 'year') {
    start = new Date(Date.UTC(year, 0, 1));
    end = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));
  } else {
    // Rango 'month' o fallback por defecto al mes actual
    start = new Date(Date.UTC(year, month, 1));
    end = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999));
  }

  // DESFASE DE HUSO HORARIO (America/Costa_Rica es UTC-6):
  // 00:00:00 del día local en Costa Rica corresponde a las 06:00:00 del mismo día en UTC.
  // Sumamos el desfase (6 horas en milisegundos) para generar el ISO string correcto que representa
  // el inicio exacto del día local en la marca temporal absoluta en la base de datos (TIMESTAMPTZ).
  const offsetMs = 6 * 60 * 60 * 1000;
  const startDateISO = new Date(start.getTime() + offsetMs).toISOString();
  const endDateISO = new Date(end.getTime() + offsetMs).toISOString();

  return {
    startDate: startDateISO,
    endDate: endDateISO,
  };
}

/**
 * Controlador para la obtención de métricas financieras y operativas del dashboard.
 * Responde a peticiones GET /api/dashboard/finance.
 *
 * @param req Objeto de petición Express.
 * @param res Objeto de respuesta Express.
 * @returns Promesa void de Express.
 */
export async function getFinanceMetrics(req: Request, res: Response): Promise<void> {
  const parsed = getFinanceMetricsSchema.safeParse(req.query);

  if (!parsed.success) {
    res.status(400).json({
      error: 'Parámetros de consulta inválidos',
      details: parsed.error.flatten().fieldErrors,
    });
    return;
  }

  try {
    let startDate = parsed.data.startDate;
    let endDate = parsed.data.endDate;

    // Si no se proporcionaron fechas manuales, calculamos el rango en base al range preestablecido
    // o aplicamos el mes actual como fallback predeterminado.
    if (!startDate || !endDate) {
      const calculatedRange = getLocalRange(parsed.data.range ?? 'default');
      startDate = calculatedRange.startDate;
      endDate = calculatedRange.endDate;
    }

    const summary = await DashboardService.getSummary(startDate, endDate);

    res.json({
      range: parsed.data.range ?? 'month',
      startDate,
      endDate,
      summary,
    });
  } catch (err) {
    console.error('[dashboardController] Error al obtener métricas financieras:', err);
    res.status(500).json({ error: 'Error interno del servidor al calcular el balance del dashboard' });
  }
}

const createExpenseSchema = z.object({
  description: z.string().min(2, 'Descripción muy corta').max(255),
  amount: z.number().positive('El monto debe ser un número positivo'),
  category: z.enum(['supplies', 'rent', 'utilities', 'marketing', 'other']),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)'),
});

/**
 * Registra un nuevo gasto administrativo en el sistema.
 * Responde a peticiones POST /api/dashboard/expenses.
 *
 * @param req Objeto de petición Express.
 * @param res Objeto de respuesta Express.
 * @returns Promesa void de Express.
 */
export async function createExpense(req: Request, res: Response): Promise<void> {
  const parsed = createExpenseSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      error: 'Datos del gasto inválidos',
      details: parsed.error.flatten().fieldErrors,
    });
    return;
  }

  try {
    const { description, amount, category, date } = parsed.data;

    // Inserción directa parametrizada en la base de datos utilizando el pool global.
    // La fecha del gasto se guarda directamente como tipo DATE (YYYY-MM-DD).
    await pool.query(
      'INSERT INTO expenses (description, amount, category, date) VALUES ($1, $2, $3, $4)',
      [description, amount, category, date]
    );

    res.status(201).json({
      message: 'Gasto administrativo registrado exitosamente',
    });
  } catch (err) {
    console.error('[dashboardController] Error al registrar gasto:', err);
    res.status(500).json({ error: 'Error interno del servidor al intentar registrar el gasto' });
  }
}

// ── Esquema Zod para la creación de ingresos manuales ──────────────────
const createManualIncomeSchema = z.object({
  description: z.string().min(2, 'Descripción muy corta').max(255),
  amount: z.number().positive('El monto debe ser un número positivo'),
  category: z.enum(['product_sale', 'walk_in_service', 'other']),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)'),
});

/**
 * Registra un nuevo ingreso manual no asociado a una cita del sistema.
 * Responde a peticiones POST /api/dashboard/income.
 *
 * @param req Objeto de petición Express.
 * @param res Objeto de respuesta Express.
 * @returns Promesa void de Express.
 */
export async function createManualIncome(req: Request, res: Response): Promise<void> {
  const parsed = createManualIncomeSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      error: 'Datos del ingreso inválidos',
      details: parsed.error.flatten().fieldErrors,
    });
    return;
  }

  try {
    const { description, amount, category, date } = parsed.data;

    // Inserción directa parametrizada en la base de datos utilizando el pool global.
    // La fecha del ingreso se guarda directamente como tipo DATE (YYYY-MM-DD).
    await pool.query(
      'INSERT INTO manual_income (description, amount, category, date) VALUES ($1, $2, $3, $4)',
      [description, amount, category, date]
    );

    res.status(201).json({
      message: 'Ingreso manual registrado exitosamente',
    });
  } catch (err) {
    console.error('[dashboardController] Error al registrar ingreso manual:', err);
    res.status(500).json({ error: 'Error interno del servidor al intentar registrar el ingreso' });
  }
}
