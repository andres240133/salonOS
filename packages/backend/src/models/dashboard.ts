import { pool } from '../config/database.js';

export interface WeeklyFinancialBreakdown {
  week_start: string;
  revenue: number;
  expenses: number;
  net_profit: number;
}

export interface FinancialSummary {
  grossRevenue: number;
  totalExpenses: number;
  netProfit: number;
  weeklyBreakdown: WeeklyFinancialBreakdown[];
}

export interface PeakHour {
  hour: number;
  bookingsCount: number;
}

export interface OperationalMetrics {
  noShowRate: number;
  totalBookings: number;
  peakHours: PeakHour[];
}

export interface TopService {
  serviceId: number;
  serviceName: string;
  bookingsCount: number;
  totalRevenue: number;
}

export interface ClientRetention {
  newClients: number;
  recurringClients: number;
  totalClients: number;
}

/**
 * Calcula el resumen financiero (ingresos, egresos, rentabilidad neta y desglose semanal)
 * para un rango de fechas determinado en la zona horaria de Costa Rica.
 *
 * @param startDate Fecha inicial del rango en formato ISO.
 * @param endDate Fecha final del rango en formato ISO.
 * @returns Promesa con el resumen financiero.
 */
export async function getFinancialSummary(
  startDate: string,
  endDate: string,
): Promise<FinancialSummary> {
  // LÓGICA MATEMÁTICA Y DE NEGOCIO:
  // 1. Ingresos Brutos se calculan sumando AMBAS fuentes de ingreso:
  //    a) payments.amount — pagos procesados de citas completadas en el período.
  //    b) manual_income.amount — ingresos manuales (ventas de producto, servicios sin reserva, etc.)
  //       filtrados por la columna DATE, convertida al huso horario local de la misma forma
  //       que expenses para mantener consistencia en el manejo de off-by-one.
  // 2. Gastos Totales se calculan sumando expenses.amount filtrados por la columna date.
  //    Para evitar desalineaciones por huso horario (off-by-one), convertimos explícitamente los timestamps
  //    de entrada (TIMESTAMPTZ) a la zona horaria del salón ('America/Costa_Rica') antes de hacer el cast a DATE.
  // 3. Rentabilidad Neta es la resta simple de Ingresos - Gastos.
  const summaryQuery = `
    WITH revenue_agg AS (
      SELECT
        COALESCE((SELECT SUM(amount) FROM payments
          WHERE processed_at >= $1::timestamptz AND processed_at <= $2::timestamptz), 0)
        +
        COALESCE((SELECT SUM(amount) FROM manual_income
          WHERE date BETWEEN ($1 AT TIME ZONE 'America/Costa_Rica')::date
                        AND ($2 AT TIME ZONE 'America/Costa_Rica')::date), 0)
        AS gross_revenue
    ),
    expenses_agg AS (
      SELECT COALESCE(SUM(amount), 0)::numeric AS total_expenses
      FROM expenses
      WHERE date BETWEEN ($1 AT TIME ZONE 'America/Costa_Rica')::date AND ($2 AT TIME ZONE 'America/Costa_Rica')::date
    )
    SELECT
      r.gross_revenue,
      e.total_expenses,
      (r.gross_revenue - e.total_expenses) AS net_profit
    FROM revenue_agg r, expenses_agg e;
  `;

  // DESGLOSE SEMANAL:
  // Se agrupan los ingresos de AMBAS fuentes (payments + manual_income) usando un UNION ALL
  // y luego se agrupan por semana para consolidar el total de ingresos semanal.
  // Los egresos se agrupan por la semana de la fecha de gasto.
  // Ambos se combinan usando un FULL OUTER JOIN para asegurar que las semanas que solo tuvieron ingresos o solo egresos
  // aparezcan reflejadas correctamente en el resultado analítico.
  const breakdownQuery = `
    WITH all_revenue AS (
      -- Ingresos de citas completadas (payments)
      SELECT
        date_trunc('week', processed_at AT TIME ZONE 'America/Costa_Rica')::date AS week_start,
        amount
      FROM payments
      WHERE processed_at >= $1::timestamptz AND processed_at <= $2::timestamptz
      UNION ALL
      -- Ingresos manuales (ventas de producto, servicios sin reserva, etc.)
      SELECT
        date_trunc('week', date)::date AS week_start,
        amount
      FROM manual_income
      WHERE date BETWEEN ($1 AT TIME ZONE 'America/Costa_Rica')::date
                      AND ($2 AT TIME ZONE 'America/Costa_Rica')::date
    ),
    weekly_revenue AS (
      SELECT
        week_start,
        SUM(amount) AS revenue
      FROM all_revenue
      GROUP BY week_start
    ),
    weekly_expenses AS (
      SELECT
        date_trunc('week', date)::date AS week_start,
        SUM(amount) AS expenses
      FROM expenses
      WHERE date BETWEEN ($1 AT TIME ZONE 'America/Costa_Rica')::date AND ($2 AT TIME ZONE 'America/Costa_Rica')::date
      GROUP BY date_trunc('week', date)
    )
    SELECT
      COALESCE(r.week_start, e.week_start)::text AS week_start,
      COALESCE(r.revenue, 0)::numeric AS revenue,
      COALESCE(e.expenses, 0)::numeric AS expenses,
      (COALESCE(r.revenue, 0) - COALESCE(e.expenses, 0))::numeric AS net_profit
    FROM weekly_revenue r
    FULL OUTER JOIN weekly_expenses e ON r.week_start = e.week_start
    ORDER BY week_start ASC;
  `;

  const [summaryRes, breakdownRes] = await Promise.all([
    pool.query(summaryQuery, [startDate, endDate]),
    pool.query(breakdownResQueryHelper(breakdownQuery), [startDate, endDate]),
  ]);

  const summaryRow = summaryRes.rows[0];
  const weeklyBreakdown = breakdownRes.rows.map((row) => ({
    week_start: row.week_start,
    revenue: parseFloat(row.revenue),
    expenses: parseFloat(row.expenses),
    net_profit: parseFloat(row.net_profit),
  }));

  return {
    grossRevenue: parseFloat(summaryRow?.gross_revenue ?? '0'),
    totalExpenses: parseFloat(summaryRow?.total_expenses ?? '0'),
    netProfit: parseFloat(summaryRow?.net_profit ?? '0'),
    weeklyBreakdown,
  };
}

// Función auxiliar para evitar redefiniciones
function breakdownResQueryHelper(q: string): string {
  return q;
}

/**
 * Calcula las métricas operativas del salón (Tasa de No-Show y horas pico de reservas)
 * para un rango de fechas determinado.
 *
 * @param startDate Fecha inicial del rango en formato ISO.
 * @param endDate Fecha final del rango en formato ISO.
 * @returns Promesa con las métricas operativas.
 */
export async function getOperationalMetrics(
  startDate: string,
  endDate: string,
): Promise<OperationalMetrics> {
  // LÓGICA MATEMÁTICA Y DE NEGOCIO:
  // 1. Tasa de No-Show: dividimos la cantidad de citas con estado 'cancelled' entre el total de citas del período.
  //    Para evitar divisiones entre cero, usamos NULLIF. Si el total es 0, COALESCE forzará el retorno a 0.
  const rateQuery = `
    SELECT
      COALESCE(COUNT(CASE WHEN status = 'cancelled' THEN 1 END)::double precision / NULLIF(COUNT(*), 0), 0) AS no_show_rate,
      COUNT(*)::integer AS total_bookings
    FROM bookings
    WHERE scheduled_at >= $1::timestamptz AND scheduled_at <= $2::timestamptz;
  `;

  // 2. Horas Pico: extraemos la hora local de Costa Rica de scheduled_at y contamos cuántas citas iniciaron en cada hora.
  //    Ordenamos por cantidad de citas de forma descendente para identificar fácilmente las horas de mayor demanda.
  const peakHoursQuery = `
    SELECT
      EXTRACT(HOUR FROM scheduled_at AT TIME ZONE 'America/Costa_Rica')::integer AS hour,
      COUNT(*)::integer AS bookings_count
    FROM bookings
    WHERE scheduled_at >= $1::timestamptz AND scheduled_at <= $2::timestamptz
    GROUP BY EXTRACT(HOUR FROM scheduled_at AT TIME ZONE 'America/Costa_Rica')
    ORDER BY bookings_count DESC, hour ASC;
  `;

  const [rateRes, peakRes] = await Promise.all([
    pool.query(rateQuery, [startDate, endDate]),
    pool.query(peakHoursQuery, [startDate, endDate]),
  ]);

  return {
    noShowRate: rateRes.rows[0]?.no_show_rate ?? 0,
    totalBookings: rateRes.rows[0]?.total_bookings ?? 0,
    peakHours: peakRes.rows.map((row) => ({
      hour: row.hour,
      bookingsCount: row.bookings_count,
    })),
  };
}

/**
 * Obtiene el ranking de servicios más populares y su respectiva facturación.
 * Utiliza LEFT JOIN hacia la tabla de servicios para garantizar que no se pierda el historial de recaudación
 * de servicios que han sido desactivados (is_active = false) en el catálogo actual.
 *
 * @param startDate Fecha inicial del rango en formato ISO.
 * @param endDate Fecha final del rango en formato ISO.
 * @returns Promesa con la lista de servicios más vendidos y su facturación.
 */
export async function getTopServices(
  startDate: string,
  endDate: string,
): Promise<TopService[]> {
  // LÓGICA DE NEGOCIO Y AGREGACIÓN:
  // Cruzamos la tabla de citas (bookings) con la tabla de servicios usando LEFT JOIN. Esto preserva citas de servicios
  // que ya no están activos. Asociamos cada cita a su pago mediante otro LEFT JOIN con la tabla payments para sumar
  // el monto realmente cobrado (que puede diferir del precio nominal del servicio por descuentos, recargos o propinas).
  const query = `
    SELECT
      COALESCE(s.id, 0) AS service_id,
      COALESCE(s.name, 'Servicio Inactivo o Eliminado') AS service_name,
      COUNT(b.id)::integer AS bookings_count,
      COALESCE(SUM(p.amount), 0)::numeric AS total_revenue
    FROM bookings b
    LEFT JOIN services s ON b.service_id = s.id
    LEFT JOIN payments p ON b.id = p.booking_id
    WHERE b.scheduled_at >= $1::timestamptz AND b.scheduled_at <= $2::timestamptz
    GROUP BY s.id, s.name
    ORDER BY total_revenue DESC;
  `;

  const { rows } = await pool.query(query, [startDate, endDate]);
  return rows.map((row) => ({
    serviceId: row.service_id,
    serviceName: row.service_name,
    bookingsCount: row.bookings_count,
    totalRevenue: parseFloat(row.total_revenue),
  }));
}

/**
 * Segmenta la clientela del salón durante el período analizado basándose en el hash del teléfono único.
 * Clasifica a las clientas en "Nuevas" (exactamente 1 cita en el período) y "Recurrentes" (2 o más citas en el período).
 *
 * @param startDate Fecha inicial del rango en formato ISO.
 * @param endDate Fecha final del rango en formato ISO.
 * @returns Promesa con los totales de clientela nueva y recurrente.
 */
export async function getClientRetention(
  startDate: string,
  endDate: string,
): Promise<ClientRetention> {
  // LÓGICA MATEMÁTICA Y DE AGREGACIÓN:
  // 1. La subconsulta (CTE) agrupa las citas del periodo por el phone_hash único de la clienta y cuenta sus citas.
  // 2. La consulta principal cuenta cuántas clientas tienen un conteo de citas igual a 1 (Nuevas)
  //    y cuántas tienen 2 o más (Recurrentes).
  const query = `
    WITH client_booking_counts AS (
      SELECT
        c.phone_hash,
        COUNT(b.id) AS bookings_count
      FROM bookings b
      JOIN clients c ON b.client_id = c.id
      WHERE b.scheduled_at >= $1::timestamptz AND b.scheduled_at <= $2::timestamptz
      GROUP BY c.phone_hash
    )
    SELECT
      COALESCE(COUNT(CASE WHEN bookings_count = 1 THEN 1 END), 0)::integer AS new_clients,
      COALESCE(COUNT(CASE WHEN bookings_count >= 2 THEN 1 END), 0)::integer AS recurring_clients,
      COALESCE(COUNT(*), 0)::integer AS total_clients
    FROM client_booking_counts;
  `;

  const { rows } = await pool.query(query, [startDate, endDate]);
  return {
    newClients: rows[0]?.new_clients ?? 0,
    recurringClients: rows[0]?.recurring_clients ?? 0,
    totalClients: rows[0]?.total_clients ?? 0,
  };
}
