import { useAuthStore } from '../store/authStore';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AdminBookingService {
  id: number;
  name: string;
  price: number;
}

export interface AdminBookingClient {
  id: number;
  name: string;
  phone: string;
}

export interface AdminBooking {
  id: string;
  scheduledAt: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  origin: 'self_service' | 'manual_admin';
  notes: string | null;
  service: AdminBookingService;
  client: AdminBookingClient;
}

export interface Service {
  id: number;
  name: string;
  price: number;
  duration_minutes: number;
  category: string;
}

export interface CreateAdminBookingPayload {
  serviceId: number;
  scheduledAt: string;
  clientName: string;
  clientPhone: string;
  notes?: string;
}

/** Thrown when the session has expired and refresh failed. UI should redirect to login. */
export class SessionExpiredError extends Error {
  constructor() {
    super('Session expired. Please log in again.');
    this.name = 'SessionExpiredError';
  }
}

// ── Core Auth Fetch ───────────────────────────────────────────────────────────

/**
 * Shared refresh promise used to coalesce concurrent token refreshes.
 *
 * Why a promise instead of a boolean flag:
 * A boolean `isRefreshing` forces every concurrent 401 that arrives while a
 * refresh is in-flight to fail immediately (logout + SessionExpiredError),
 * even though the ongoing refresh may succeed moments later. By storing the
 * actual promise, concurrent callers can `await` the same in-flight refresh
 * and reuse the resulting token — a single round-trip to the server, zero
 * spurious logouts.
 */
let refreshPromise: Promise<string> | null = null;

/**
 * Authenticated fetch wrapper with automatic token refresh.
 *
 * Behaviour:
 * 1. Injects `Authorization: Bearer <token>` from authStore.
 * 2. On 401, initiates or joins an in-flight token refresh:
 *    - First caller creates refreshPromise (POST /api/auth/refresh).
 *    - Concurrent callers await the same refreshPromise.
 *    - If refresh succeeds: stores new token, all callers retry once.
 *    - If refresh fails: calls logout() and throws SessionExpiredError.
 * 3. Never retries more than once per caller. No recursion.
 */
export async function authFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const { accessToken } = useAuthStore.getState();

  const headers = new Headers(init?.headers);
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  const response = await fetch(input, { ...init, headers, credentials: 'include' });

  if (response.status !== 401) {
    return response;
  }

  if (!refreshPromise) {
    refreshPromise = (async () => {
      const { setAccessToken, logout } = useAuthStore.getState();

      try {
        const refreshRes = await fetch('/api/auth/refresh', {
          method: 'POST',
          credentials: 'include',
        });

        if (!refreshRes.ok) {
          logout();
          throw new SessionExpiredError();
        }

        const { accessToken: newToken } = (await refreshRes.json()) as { accessToken: string };
        setAccessToken(newToken);
        return newToken;
      } catch (err) {
        if (!(err instanceof SessionExpiredError)) {
          useAuthStore.getState().logout();
        }
        throw err instanceof SessionExpiredError ? err : new SessionExpiredError();
      } finally {
        refreshPromise = null;
      }
    })();
  }

  const newToken = await refreshPromise;

  // Retry the original request with the fresh token — exactly once
  const retryHeaders = new Headers(init?.headers);
  retryHeaders.set('Authorization', `Bearer ${newToken}`);
  return fetch(input, { ...init, headers: retryHeaders, credentials: 'include' });
}

// ── Typed Admin API Functions ─────────────────────────────────────────────────

/** Helper to extract a human-readable error message from a non-OK backend JSON response. */
async function extractApiError(res: Response, fallbackPrefix: string): Promise<Error> {
  const body = await res.json().catch(() => ({}));
  const detailsMsg =
    body.details && typeof body.details === 'object'
      ? Object.values(body.details as Record<string, string[]>).flat().join(', ')
      : '';
  return new Error(detailsMsg || body.error || `${fallbackPrefix} (${res.status})`);
}

/** Fetches bookings for a given date (YYYY-MM-DD, defaults to today in CR) for the admin agenda view. */
export async function fetchTodayBookings(date?: string): Promise<AdminBooking[]> {
  const query = date ? `?date=${encodeURIComponent(date)}` : '';
  const res = await authFetch(`/api/admin/bookings/today${query}`);
  if (!res.ok) throw await extractApiError(res, 'No se pudieron cargar las citas');
  const data: { bookings: AdminBooking[] } = await res.json();
  return data.bookings;
}

/** Marks a booking as completed with payment details. */
export async function completeBooking(
  id: string,
  amount: number,
  paymentMethod: 'cash' | 'transfer' | 'card',
): Promise<void> {
  const res = await authFetch(`/api/admin/bookings/${id}/complete`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount, paymentMethod }),
  });
  if (!res.ok) throw await extractApiError(res, 'No se pudo completar la cita');
}

/** Cancels a booking with an optional reason. */
export async function cancelBooking(id: string, reason?: string): Promise<void> {
  const res = await authFetch(`/api/admin/bookings/${id}/cancel`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason }),
  });
  if (!res.ok) throw await extractApiError(res, 'No se pudo cancelar la cita');
}

/** Creates a manual admin booking. */
export async function createAdminBooking(payload: CreateAdminBookingPayload): Promise<void> {
  const res = await authFetch('/api/admin/bookings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw await extractApiError(res, 'No se pudo crear la cita');
}

/** Fetches the service catalog (public endpoint, no auth needed). */
export async function fetchServices(): Promise<Service[]> {
  const res = await fetch('/api/services');
  if (!res.ok) throw new Error(`Failed to fetch services: ${res.status}`);
  const data: { services: Service[] } = await res.json();
  return data.services;
}

// ── Finance Module Types ──────────────────────────────────────────────────────

export interface FinanceSummary {
  totalRevenue: number;
  totalExpenses: number;
  netProfitability: number;
}

export interface WeeklyBreakdownItem {
  weekLabel: string;
  revenue: number;
  expenses: number;
}

export interface FinanceData {
  summary: FinanceSummary;
  weeklyBreakdown: WeeklyBreakdownItem[];
}

// ── Finance Module API Functions ──────────────────────────────────────────────

/** Fetches aggregated financial metrics for the admin dashboard. */
export async function fetchFinanceMetrics(range?: string): Promise<FinanceData> {
  const params = range ? `?range=${encodeURIComponent(range)}` : '';
  const res = await authFetch(`/api/dashboard/finance${params}`);
  if (!res.ok) throw new Error(`Failed to fetch finance metrics: ${res.status}`);
  const data: FinanceData = await res.json();
  return data;
}

/** Registers a new operational expense entry. */
export async function createExpense(
  amount: number,
  description: string,
  date: string,
  category: 'supplies' | 'rent' | 'utilities' | 'marketing' | 'other',
): Promise<void> {
  const res = await authFetch('/api/dashboard/expenses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount, description, date, category }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const detailsMsg =
      body.details && typeof body.details === 'object'
        ? Object.values(body.details as Record<string, string[]>).flat().join(', ')
        : '';
    throw new Error(detailsMsg || body.error || `Error ${res.status}`);
  }
}

/** Registers a new manual income entry (product sales, walk-in services, etc.). */
export async function createManualIncome(
  amount: number,
  description: string,
  date: string,
  category: 'product_sale' | 'walk_in_service' | 'other',
): Promise<void> {
  const res = await authFetch('/api/dashboard/income', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount, description, date, category }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const detailsMsg =
      body.details && typeof body.details === 'object'
        ? Object.values(body.details as Record<string, string[]>).flat().join(', ')
        : '';
    throw new Error(detailsMsg || body.error || `Error ${res.status}`);
  }
}

// ── Client Module Types ───────────────────────────────────────────────────────

export interface AdminClient {
  id: number;
  name: string;
  phone: string;
  lastVisit: string | null;
}

export interface ClientHistoryItem {
  id: string;
  date: string;
  status?: 'pending' | 'confirmed' | 'completed';
  serviceName: string;
  notes: string | null;
  technicalFormula: string | null;
}

// ── Client Module API Functions ───────────────────────────────────────────────

/** Fetches the full client roster with decrypted PII. */
export async function fetchAdminClients(): Promise<AdminClient[]> {
  const res = await authFetch('/api/admin/clients');
  if (!res.ok) throw await extractApiError(res, 'No se pudieron cargar las clientas');
  const data: { clients: AdminClient[] } = await res.json();
  return data.clients;
}

/** Fetches the service history for a specific client, including technical color formulas. */
export async function fetchClientHistory(clientId: number): Promise<ClientHistoryItem[]> {
  const res = await authFetch(`/api/admin/clients/${clientId}/history`);
  if (!res.ok) throw await extractApiError(res, 'No se pudo cargar el historial');
  const data: { history: ClientHistoryItem[] } = await res.json();
  return data.history;
}

/** Persists a technical color formula (tint/mix recipe) for a specific past booking. */
export async function updateTechnicalFormula(
  clientId: number,
  bookingId: string,
  formula: string,
): Promise<void> {
  const res = await authFetch(`/api/admin/clients/${clientId}/formulas`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bookingId, formula }),
  });
  if (!res.ok) throw await extractApiError(res, 'No se pudo guardar la fórmula');
}

// ── Availability Module Types ─────────────────────────────────────────────────

export interface AvailabilityDay {
  date: string;
  startTime: string;
  lastStartTime: string;
  endTime: string;
  isActive: boolean;
}

export interface AvailabilityTemplate {
  dayOfWeek: number;
  startTime: string;
  lastStartTime: string;
  endTime: string;
  isActive: boolean;
}

export interface WeekDayInput {
  dayOfWeek: number;
  startTime: string;
  lastStartTime: string;
  endTime: string;
}

export interface AvailabilityConflict {
  date: string;
  bookingsCount: number;
  reason: 'has_bookings' | 'outside_hours';
}

export interface SaveWeekResponse {
  weekStart: string;
  conflicts: AvailabilityConflict[];
}

// ── Availability Module API Functions ─────────────────────────────────────────

/** Fetches configured availability slots for a date range (YYYY-MM-DD). */
export async function fetchAdminAvailability(
  from: string,
  to: string,
): Promise<AvailabilityDay[]> {
  const params = new URLSearchParams({ from, to });
  const res = await authFetch(`/api/admin/availability?${params.toString()}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Error ${res.status}`);
  }
  const data: { days: AvailabilityDay[] } = await res.json();
  return data.days;
}

/** Saves the weekly availability schedule (Monday–Saturday) and returns any booking conflicts. */
export async function saveWeekAvailability(payload: {
  weekStart: string;
  days: WeekDayInput[];
}): Promise<SaveWeekResponse> {
  const res = await authFetch('/api/admin/availability/week', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const detailsMsg =
      body.details && typeof body.details === 'object'
        ? Object.values(body.details as Record<string, string[]>).flat().join(', ')
        : '';
    throw new Error(detailsMsg || body.error || `Error ${res.status}`);
  }
  return res.json() as Promise<SaveWeekResponse>;
}

/** Fetches the saved "semana típica" templates (Monday–Saturday). */
export async function fetchAvailabilityTemplates(): Promise<AvailabilityTemplate[]> {
  const res = await authFetch('/api/admin/availability/templates');
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Error ${res.status}`);
  }
  const data: { templates: AvailabilityTemplate[] } = await res.json();
  return data.templates;
}

/** Updates the "semana típica" templates (Monday–Saturday). */
export async function updateAvailabilityTemplates(
  templates: AvailabilityTemplate[],
): Promise<AvailabilityTemplate[]> {
  const res = await authFetch('/api/admin/availability/templates', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ templates }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const detailsMsg =
      body.details && typeof body.details === 'object'
        ? Object.values(body.details as Record<string, string[]>).flat().join(', ')
        : '';
    throw new Error(detailsMsg || body.error || `Error ${res.status}`);
  }
  const data: { templates: AvailabilityTemplate[] } = await res.json();
  return data.templates;
}
