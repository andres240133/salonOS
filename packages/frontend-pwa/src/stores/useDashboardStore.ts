import { create } from 'zustand';
import { useAuthStore } from '../store/authStore';

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

export interface DashboardSummaryResult {
  financials: FinancialSummary;
  operations: OperationalMetrics;
  topServices: TopService[];
  clientRetention: ClientRetention;
}

export interface DashboardState {
  data: DashboardSummaryResult | null;
  isLoading: boolean;
  error: string | null;
  /**
   * Consulta los datos analíticos del panel financiero y operativo llamando al API protegida del backend.
   * Inyecta automáticamente las credenciales JWT guardadas en el almacenamiento del navegador.
   *
   * @param range Rango rápido opcional ('week', 'month', 'year').
   * @param startDate Fecha inicial personalizada en formato ISO.
   * @param endDate Fecha final personalizada en formato ISO.
   */
  fetchFinanceMetrics: (
    range?: 'week' | 'month' | 'year',
    startDate?: string,
    endDate?: string
  ) => Promise<void>;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  data: null,
  isLoading: false,
  error: null,

  fetchFinanceMetrics: async (range, startDate, endDate) => {
    set({ isLoading: true, error: null });
    try {
      const params = new URLSearchParams();
      if (range) {
        params.append('range', range);
      }
      if (startDate && endDate) {
        params.append('startDate', startDate);
        params.append('endDate', endDate);
      }

      // Obtiene el token JWT desde el estado en memoria del authStore de Zustand.
      // Se usa useAuthStore.getState() (acceso fuera de React) en vez de localStorage
      // directo para no depender de la forma de serialización del middleware persist
      // (que guarda todo bajo la key 'salonos-auth' como JSON anidado).
      // Este patrón es consistente con authFetch() en adminApi.ts.
      const token = useAuthStore.getState().accessToken ?? '';
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`/api/dashboard/finance?${params.toString()}`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Error al obtener las métricas del servidor');
      }

      const responseData = await response.json();
      set({ data: responseData.summary, isLoading: false });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error inesperado de red';
      set({ error: errorMessage, isLoading: false });
    }
  },
}));
