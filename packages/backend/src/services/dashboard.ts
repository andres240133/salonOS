import {
  getFinancialSummary,
  getOperationalMetrics,
  getTopServices,
  getClientRetention,
  type FinancialSummary,
  type OperationalMetrics,
  type TopService,
  type ClientRetention,
} from '../models/dashboard.js';

export interface DashboardSummaryResult {
  financials: FinancialSummary;
  operations: OperationalMetrics;
  topServices: TopService[];
  clientRetention: ClientRetention;
}

export class DashboardService {
  /**
   * Orquesta la ejecución de las consultas analíticas del dashboard financiero y operativo.
   * Realiza lecturas en paralelo utilizando Promise.all() directamente sobre el pool global
   * de conexiones de PostgreSQL para maximizar el rendimiento y evitar colisiones de protocolo pg.
   *
   * @param startDate Fecha inicial del rango analizado en formato ISO.
   * @param endDate Fecha final del rango analizado en formato ISO.
   * @returns Promesa que resuelve al objeto unificado de métricas de negocio.
   */
  static async getSummary(
    startDate: string,
    endDate: string,
  ): Promise<DashboardSummaryResult> {
    const [financials, operations, topServices, clientRetention] = await Promise.all([
      getFinancialSummary(startDate, endDate),
      getOperationalMetrics(startDate, endDate),
      getTopServices(startDate, endDate),
      getClientRetention(startDate, endDate),
    ]);

    return {
      financials,
      operations,
      topServices,
      clientRetention,
    };
  }
}
export default DashboardService;
