# Auditoría Completa: Mismatches Frontend ↔ Backend — SalonOS

> **Fecha:** 2026-06-25  
> **Alcance:** `packages/backend`, `packages/frontend-pwa`, `packages/frontend-public`  
> **Tipo:** Análisis sin modificaciones de código

---

## 1. Rutas del Backend (lo que existe realmente)

### Prefijos registrados en [`app.ts`](file:///c:/Users/Andres/OneDrive/Desktop/SalonOS/packages/backend/src/app.ts)

| Prefijo | Router |
|---|---|
| `/api/auth` | `auth.routes.ts` |
| `/api/bookings` | `booking.routes.ts` |
| `/api/dashboard` | `dashboard.routes.ts` |
| `/api/services` | `services.routes.ts` |
| `/api/whatsapp` | `whatsapp.routes.ts` |

### Endpoints exactos del backend

| Método | Path completo | Auth | Archivo |
|---|---|---|---|
| POST | `/api/auth/login` | Público (rate-limited) | [auth.routes.ts](file:///c:/Users/Andres/OneDrive/Desktop/SalonOS/packages/backend/src/routes/auth.routes.ts) |
| POST | `/api/auth/refresh` | Público (cookie) | auth.routes.ts |
| POST | `/api/auth/logout` | `requireAuth` | auth.routes.ts |
| POST | `/api/bookings` | Público (rate-limited) | [booking.routes.ts](file:///c:/Users/Andres/OneDrive/Desktop/SalonOS/packages/backend/src/routes/booking.routes.ts) |
| GET | `/api/bookings/availability` | Público (rate-limited) | booking.routes.ts |
| GET | `/api/bookings` | `requireAuth` | booking.routes.ts |
| PATCH | `/api/bookings/:id/status` | `requireAuth` | booking.routes.ts |
| GET | `/api/dashboard/finance` | `requireAuth` | [dashboard.routes.ts](file:///c:/Users/Andres/OneDrive/Desktop/SalonOS/packages/backend/src/routes/dashboard.routes.ts) |
| POST | `/api/dashboard/expenses` | `requireAuth` | dashboard.routes.ts |
| GET | `/api/services` | Público (rate-limited) | [services.routes.ts](file:///c:/Users/Andres/OneDrive/Desktop/SalonOS/packages/backend/src/routes/services.routes.ts) |
| GET | `/api/whatsapp/webhook` | Público | [whatsapp.routes.ts](file:///c:/Users/Andres/OneDrive/Desktop/SalonOS/packages/backend/src/routes/whatsapp.routes.ts) |
| POST | `/api/whatsapp/webhook` | Público | whatsapp.routes.ts |

> [!IMPORTANT]
> **No existe ningún prefijo `/api/admin/*` en el backend.** Todas las rutas admin usan los prefijos `/api/bookings`, `/api/dashboard`, etc.

---

## 2. Llamadas del Frontend al Backend

### 2.1 `frontend-pwa` — [`adminApi.ts`](file:///c:/Users/Andres/OneDrive/Desktop/SalonOS/packages/frontend-pwa/src/services/adminApi.ts)

| # | Método | Path pedido por el frontend | Función | Consumido por |
|---|---|---|---|---|
| F1 | POST | `/api/auth/refresh` | `authFetch` (auto-refresh) | Wrapper global |
| F2 | GET | `/api/admin/bookings/today` | `fetchTodayBookings()` | [AgendaPage.tsx](file:///c:/Users/Andres/OneDrive/Desktop/SalonOS/packages/frontend-pwa/src/pages/admin/AgendaPage.tsx) |
| F3 | PATCH | `/api/admin/bookings/:id/complete` | `completeBooking()` | [CompleteBookingModal.tsx](file:///c:/Users/Andres/OneDrive/Desktop/SalonOS/packages/frontend-pwa/src/components/admin/CompleteBookingModal.tsx) |
| F4 | PATCH | `/api/admin/bookings/:id/cancel` | `cancelBooking()` | [CancelBookingModal.tsx](file:///c:/Users/Andres/OneDrive/Desktop/SalonOS/packages/frontend-pwa/src/components/admin/CancelBookingModal.tsx) |
| F5 | POST | `/api/admin/bookings` | `createAdminBooking()` | [CreateBookingModal.tsx](file:///c:/Users/Andres/OneDrive/Desktop/SalonOS/packages/frontend-pwa/src/components/admin/CreateBookingModal.tsx) |
| F6 | GET | `/api/services` | `fetchServices()` | CreateBookingModal.tsx |
| F7 | GET | `/api/dashboard/finance` | `fetchFinanceMetrics()` | [FinanzasPage.tsx](file:///c:/Users/Andres/OneDrive/Desktop/SalonOS/packages/frontend-pwa/src/pages/admin/FinanzasPage.tsx) |
| F8 | POST | `/api/admin/expenses` | `createExpense()` | [CreateExpenseModal.tsx](file:///c:/Users/Andres/OneDrive/Desktop/SalonOS/packages/frontend-pwa/src/components/admin/CreateExpenseModal.tsx) |
| F9 | GET | `/api/admin/clients` | `fetchAdminClients()` | [ClientasPage.tsx](file:///c:/Users/Andres/OneDrive/Desktop/SalonOS/packages/frontend-pwa/src/pages/admin/ClientasPage.tsx) |
| F10 | GET | `/api/admin/clients/:id/history` | `fetchClientHistory()` | [ClientHistoryDrawer.tsx](file:///c:/Users/Andres/OneDrive/Desktop/SalonOS/packages/frontend-pwa/src/components/admin/ClientHistoryDrawer.tsx) |
| F11 | POST | `/api/admin/clients/:id/formulas` | `updateTechnicalFormula()` | ClientHistoryDrawer.tsx |

### 2.2 `frontend-pwa` — [`useDashboardStore.ts`](file:///c:/Users/Andres/OneDrive/Desktop/SalonOS/packages/frontend-pwa/src/stores/useDashboardStore.ts)

| # | Método | Path pedido | Consumido por |
|---|---|---|---|
| F12 | GET | `/api/dashboard/finance` | [FinanceDashboard.tsx](file:///c:/Users/Andres/OneDrive/Desktop/SalonOS/packages/frontend-pwa/src/pages/admin/FinanceDashboard.tsx) |

### 2.3 `frontend-pwa` — [`AdminLayout.tsx`](file:///c:/Users/Andres/OneDrive/Desktop/SalonOS/packages/frontend-pwa/src/pages/admin/AdminLayout.tsx)

| # | Método | Path pedido | Consumido por |
|---|---|---|---|
| F13 | POST | `/api/auth/logout` | AdminLayout.tsx (handleLogout) |

### 2.4 `frontend-pwa` — [`LoginPage.tsx`](file:///c:/Users/Andres/OneDrive/Desktop/SalonOS/packages/frontend-pwa/src/pages/admin/LoginPage.tsx)

| # | Método | Path pedido | Consumido por |
|---|---|---|---|
| F14 | POST | `/api/auth/login` | LoginPage.tsx |

### 2.5 `frontend-pwa` — [`bookingApi.ts`](file:///c:/Users/Andres/OneDrive/Desktop/SalonOS/packages/frontend-pwa/src/services/bookingApi.ts)

| # | Método | Path pedido | Consumido por |
|---|---|---|---|
| F15 | GET | `/api/services` | Flujo de reserva público |
| F16 | GET | `/api/availability` | Flujo de reserva público |
| F17 | POST | `/api/bookings` | Flujo de reserva público |

### 2.6 `frontend-public`

> El frontend público (`packages/frontend-public`) no realiza ninguna llamada API por el momento. Su `main.tsx` solo renderiza un placeholder "en construcción".

---

## 3. Tabla de Cruce: Frontend vs Backend

| # | Ruta esperada por frontend | Método | ¿Existe en backend? | Categoría | Detalle |
|---|---|---|---|---|---|
| F1 | `/api/auth/refresh` | POST | ✅ Sí | ✅ **OK** | |
| F2 | `/api/admin/bookings/today` | GET | ❌ No | 🔴 **MISMATCH_PATH** | Backend tiene `GET /api/bookings` que acepta `?date=YYYY-MM-DD` y `?status=...`. No existe ruta bajo `/api/admin/`. |
| F3 | `/api/admin/bookings/:id/complete` | PATCH | ❌ No | 🔴 **FALTA_BACKEND** | Backend tiene `PATCH /api/bookings/:id/status` que cambia status a `completed`, pero **no registra pago** (amount + paymentMethod). El frontend envía `{ amount, paymentMethod }`, el backend espera `{ status }`. Son lógicas diferentes. |
| F4 | `/api/admin/bookings/:id/cancel` | PATCH | ❌ No | 🔴 **MISMATCH_PATH** | Backend tiene `PATCH /api/bookings/:id/status` con `{ status: 'cancelled' }`. El frontend envía `{ reason }` que el backend no maneja. |
| F5 | `/api/admin/bookings` | POST | ❌ No | 🔴 **MISMATCH_PATH** | Backend tiene `POST /api/bookings` (público), pero espera `{ serviceId, date, startTime, clientName, clientPhone }` (campos `date` + `startTime` separados). El frontend envía `{ serviceId, scheduledAt, clientName, clientPhone, notes }` con un ISO timestamp combinado. **Schema mismatch además de path mismatch.** |
| F6 | `/api/services` | GET | ✅ Sí | ✅ **OK** | |
| F7 | `/api/dashboard/finance` | GET | ✅ Sí | 🟡 **MISMATCH_SHAPE** | Ver sección 4 abajo para análisis detallado. |
| F8 | `/api/admin/expenses` | POST | ❌ No | 🔴 **MISMATCH_PATH** | Backend tiene `POST /api/dashboard/expenses`. El frontend llama a `/api/admin/expenses`. Además, `CreateExpenseModal.tsx` llama `createExpense(amount, description, date)` con **3 argumentos**, pero la firma en `adminApi.ts` requiere 4 (incluye `category`). El modal no envía categoría → el backend la requiere obligatoriamente (validación zod). |
| F9 | `/api/admin/clients` | GET | ❌ No | 🔴 **FALTA_BACKEND** | No existe ningún endpoint de clientes en el backend. No hay controller, model, ni ruta para gestión de clientas. |
| F10 | `/api/admin/clients/:id/history` | GET | ❌ No | 🔴 **FALTA_BACKEND** | No existe endpoint de historial de clientes. |
| F11 | `/api/admin/clients/:id/formulas` | POST | ❌ No | 🔴 **FALTA_BACKEND** | No existe endpoint de fórmulas técnicas. |
| F12 | `/api/dashboard/finance` | GET | ✅ Sí | 🟡 **MISMATCH_SHAPE** | `useDashboardStore` hace `set({ data: responseData.summary })` pero el backend responde `{ range, startDate, endDate, summary }` donde `summary` tiene la forma `DashboardSummaryResult` (con `financials`, `operations`, `topServices`, `clientRetention`). FinanceDashboard.tsx accede a `data.financials.weeklyBreakdown`, `data.topServices`, etc. — esto funciona si se asigna `responseData.summary` correctamente. **Sin embargo**, el store NO usa `authFetch` sino `fetch` directo con token de localStorage, creando una inconsistencia en el manejo de auth con el resto de la app. |
| F13 | `/api/auth/logout` | POST | ✅ Sí | ✅ **OK** | |
| F14 | `/api/auth/login` | POST | ✅ Sí | ✅ **OK** | |
| F15 | `/api/services` | GET | ✅ Sí | ✅ **OK** | |
| F16 | `/api/availability` | GET | ❌ No | 🔴 **MISMATCH_PATH** | Backend tiene `GET /api/bookings/availability` (bajo el prefijo `/api/bookings`). El frontend-pwa `bookingApi.ts` llama a `GET /api/availability` sin el prefijo `bookings`. Además, el frontend envía `{ serviceId, from, to }` pero el backend espera `{ serviceId, date }` (una sola fecha, no un rango). |
| F17 | `/api/bookings` | POST | ✅ Sí | 🟡 **MISMATCH_SHAPE** | Path coincide pero el frontend (`bookingApi.ts`) envía `{ serviceId, scheduledAt, clientName, clientPhone, notes }` y el backend espera `{ serviceId, date, startTime, clientName, clientPhone }` (campos `date` y `startTime` separados, sin `notes`). Además el frontend espera status 201 y un `BookingResult` directo, pero el backend responde con `result` que tiene estructura `{ booking: { id, ... }, ... }`. |

---

## 4. Análisis Detallado: `GET /api/dashboard/finance` — MISMATCH_SHAPE

### 4.1 Lo que devuelve el backend

```
dashboard.controller.ts L125-130:
res.json({
  range,         // string: 'week' | 'month' | 'year'
  startDate,     // string ISO
  endDate,       // string ISO
  summary,       // DashboardSummaryResult (del DashboardService)
});
```

Donde `summary` (de [`DashboardService.getSummary()`](file:///c:/Users/Andres/OneDrive/Desktop/SalonOS/packages/backend/src/services/dashboard.ts#L29-L46)) es:

```typescript
{
  financials: {
    grossRevenue: number,
    totalExpenses: number,
    netProfit: number,
    weeklyBreakdown: Array<{
      week_start: string,    // ej: "2026-06-16"
      revenue: number,
      expenses: number,
      net_profit: number,
    }>
  },
  operations: {
    noShowRate: number,
    totalBookings: number,
    peakHours: Array<{ hour: number, bookingsCount: number }>
  },
  topServices: Array<{
    serviceId: number,
    serviceName: string,
    bookingsCount: number,
    totalRevenue: number
  }>,
  clientRetention: {
    newClients: number,
    recurringClients: number,
    totalClients: number
  }
}
```

### 4.2 Lo que espera `FinanzasPage.tsx` (vía `adminApi.ts`)

```typescript
// adminApi.ts → fetchFinanceMetrics() espera:
interface FinanceData {
  summary: {
    totalRevenue: number,      // ← backend devuelve grossRevenue
    totalExpenses: number,     // ✅ coincide... PERO está en summary.financials.totalExpenses
    netProfitability: number,  // ← backend devuelve netProfit
  },
  weeklyBreakdown: Array<{
    weekLabel: string,         // ← backend devuelve week_start
    revenue: number,           // ✅
    expenses: number,          // ✅
  }>                           // ← backend incluye net_profit, frontend no lo usa
}
```

#### Mismatches concretos en `FinanzasPage.tsx`:

| Frontend espera | Backend devuelve | Ubicación del problema |
|---|---|---|
| `data.summary` (directo en root) | `data.summary.financials` (anidado un nivel más) | [FinanzasPage L127](file:///c:/Users/Andres/OneDrive/Desktop/SalonOS/packages/frontend-pwa/src/pages/admin/FinanzasPage.tsx#L127) |
| `summary.totalRevenue` | `financials.grossRevenue` | [FinanceSummaryCards L38](file:///c:/Users/Andres/OneDrive/Desktop/SalonOS/packages/frontend-pwa/src/components/admin/FinanceSummaryCards.tsx#L38) |
| `summary.netProfitability` | `financials.netProfit` | [FinanceSummaryCards L23, L68](file:///c:/Users/Andres/OneDrive/Desktop/SalonOS/packages/frontend-pwa/src/components/admin/FinanceSummaryCards.tsx#L23) |
| `data.weeklyBreakdown` (root level) | `data.summary.financials.weeklyBreakdown` | [FinanzasPage L130](file:///c:/Users/Andres/OneDrive/Desktop/SalonOS/packages/frontend-pwa/src/pages/admin/FinanzasPage.tsx#L130) |
| `item.weekLabel` | `item.week_start` | [WeeklyChart L60](file:///c:/Users/Andres/OneDrive/Desktop/SalonOS/packages/frontend-pwa/src/components/admin/WeeklyChart.tsx#L60) |

### 4.3 Crash de `WeeklyChart.tsx` línea 32

```typescript
// WeeklyChart.tsx L32:
const maxValue = breakdown.reduce((max, item) => {
  return Math.max(max, item.revenue, item.expenses);
}, 0);
```

**Causa raíz del crash:**  
`FinanzasPage.tsx` pasa `data.weeklyBreakdown` a `WeeklyChart`, pero `data` tiene la forma `FinanceData` esperada por `adminApi.ts`. Dado que la respuesta del backend no incluye `weeklyBreakdown` en el nivel root (está en `summary.financials.weeklyBreakdown`), `data.weeklyBreakdown` es **`undefined`**. Calling `.reduce()` sobre `undefined` produce:

```
TypeError: Cannot read properties of undefined (reading 'reduce')
```

### 4.4 Mismatches en `FinanceDashboard.tsx` (vía `useDashboardStore`)

[`FinanceDashboard.tsx`](file:///c:/Users/Andres/OneDrive/Desktop/SalonOS/packages/frontend-pwa/src/pages/admin/FinanceDashboard.tsx) usa `useDashboardStore` que hace `set({ data: responseData.summary })`. Si el backend responde `{ range, startDate, endDate, summary: DashboardSummaryResult }`, entonces `data` tendría la forma `DashboardSummaryResult` con `financials`, `operations`, `topServices`, `clientRetention`.

FinanceDashboard accede a `data.financials.grossRevenue`, `data.financials.weeklyBreakdown`, `data.topServices`, `data.operations`, `data.clientRetention` — **esto SÍ coincide con la respuesta real del backend**. Sin embargo:

| Frontend accede a | Valor real | Status |
|---|---|---|
| `data.financials.grossRevenue` | ✅ `financials.grossRevenue` | OK |
| `data.financials.totalExpenses` | ✅ `financials.totalExpenses` | OK |
| `data.financials.netProfit` | ✅ `financials.netProfit` | OK |
| `data.financials.weeklyBreakdown` | ✅ array de `WeeklyFinancialBreakdown` | OK |
| `item.week_start` | ✅ `week_start` (snake_case) | OK |
| `item.net_profit` | ✅ `net_profit` | OK |
| `data.topServices[].serviceId` | ✅ | OK |
| `data.operations.noShowRate` | ✅ | OK |
| `data.operations.peakHours` | ✅ | OK |
| `data.clientRetention` | ✅ | OK |

> [!WARNING]
> **`FinanceDashboard.tsx` y `FinanzasPage.tsx` son DOS páginas de finanzas con implementaciones diferentes.** FinanceDashboard usa `useDashboardStore` (alineado al backend), FinanzasPage usa `adminApi.ts` con `fetchFinanceMetrics()` (desalineado). Probablemente una reemplaza a la otra pero ambas existen en el código.

### 4.5 Problema de auth en `useDashboardStore`

[`useDashboardStore.ts`](file:///c:/Users/Andres/OneDrive/Desktop/SalonOS/packages/frontend-pwa/src/stores/useDashboardStore.ts#L86-L97) lee el token de `localStorage` directamente:

```typescript
const token = localStorage.getItem('token') || localStorage.getItem('accessToken') || '';
```

Pero el `authStore` de zustand-persist usa la key `salonos-auth` (no `token` ni `accessToken` en root). Esto significa que `useDashboardStore` probablemente **nunca encuentra el token** y hace requests sin auth → el backend responde 401 → error silencioso.

---

## 5. Resumen: CreateExpenseModal — Bug de argumentos

[`CreateExpenseModal.tsx` L36](file:///c:/Users/Andres/OneDrive/Desktop/SalonOS/packages/frontend-pwa/src/components/admin/CreateExpenseModal.tsx#L36):

```typescript
await createExpense(numAmount, description.trim(), date);
```

Pero la firma en [`adminApi.ts` L219-224](file:///c:/Users/Andres/OneDrive/Desktop/SalonOS/packages/frontend-pwa/src/services/adminApi.ts#L219-L224):

```typescript
export async function createExpense(
  amount: number,
  description: string,
  date: string,
  category: 'supplies' | 'rent' | 'utilities' | 'marketing' | 'other',
): Promise<void>
```

**El `category` es el 4° argumento requerido** que el modal no envía → TypeScript lo detectaría pero si no hay verificación estricta, se envía `undefined` al backend → la validación zod del backend rechaza con 400 (category es `z.enum()` requerido).

---

## 6. Fixes Priorizados

### 🔴 CRÍTICO — Rompe la UI (crashes, pantallas en blanco)

#### C1: WeeklyChart.tsx crash por `undefined.reduce()`
- **Archivos:** `adminApi.ts`, `FinanzasPage.tsx`, `WeeklyChart.tsx`, `FinanceSummaryCards.tsx`
- **Problema:** `fetchFinanceMetrics()` espera `{ summary, weeklyBreakdown }` en root, pero el backend devuelve `{ range, startDate, endDate, summary: { financials: { weeklyBreakdown, ... }, ... } }`. El frontend recibe `undefined` para `weeklyBreakdown` y `.reduce()` crashea.
- **Solución propuesta:** Hay dos opciones: (A) Modificar `fetchFinanceMetrics()` en `adminApi.ts` para que transforme la respuesta del backend (`responseData.summary.financials`) a la forma `FinanceData` que el frontend espera, mapeando `grossRevenue → totalRevenue`, `netProfit → netProfitability`, `week_start → weekLabel`. (B) Alternativamente, unificar FinanzasPage con FinanceDashboard que ya usa la estructura correcta, y eliminar la duplicación.

#### C2: AgendaPage no carga citas — `GET /api/admin/bookings/today` → 404
- **Archivos:** `adminApi.ts` (función `fetchTodayBookings`)
- **Problema:** El backend no tiene prefijo `/api/admin/`. La ruta correcta es `GET /api/bookings?date=YYYY-MM-DD`.
- **Solución propuesta:** Cambiar la URL en `fetchTodayBookings()` de `/api/admin/bookings/today` a `/api/bookings?date=${todayISO}`. Además, adaptar el parsing de la respuesta: el backend devuelve `{ bookings }` con `client_name` y `client_phone` (snake_case), pero el frontend espera `client: { id, name, phone }` y `service: { id, name, price }` (objetos anidados). Probablemente requiere crear un endpoint admin dedicado o transformar la respuesta.

#### C3: ClientasPage no carga — `GET /api/admin/clients` → 404
- **Archivos:** Requiere nuevo `clients.controller.ts`, `clients.routes.ts` en backend
- **Problema:** No existe ningún endpoint para gestión de clientes en el backend.
- **Solución propuesta:** Crear un CRUD de clientes: `GET /api/clients` (lista con PII desencriptado, auth), `GET /api/clients/:id/history` (historial), `POST /api/clients/:id/formulas` (fórmulas). Registrar en `app.ts`. Adaptar los paths en `adminApi.ts`.

---

### 🟠 ALTO — Feature no funciona (404 / error visible)

#### A1: CompleteBookingModal — `PATCH /api/admin/bookings/:id/complete` → 404
- **Archivos:** `adminApi.ts` (función `completeBooking`)
- **Problema:** El path no existe. El backend tiene `PATCH /api/bookings/:id/status` que cambia status, pero NO registra pago. El frontend envía `{ amount, paymentMethod }` que el backend no entiende.
- **Solución propuesta:** Crear un nuevo endpoint `POST /api/bookings/:id/complete` que: (1) inserte el pago en la tabla `payments`, (2) cambie el status a `completed` en una transacción. Alternativamente, separar en dos calls: `POST /api/payments` + `PATCH /api/bookings/:id/status`.

#### A2: CancelBookingModal — `PATCH /api/admin/bookings/:id/cancel` → 404
- **Archivos:** `adminApi.ts` (función `cancelBooking`)
- **Problema:** Path no existe. El backend tiene `PATCH /api/bookings/:id/status` con `{ status: 'cancelled' }`. El frontend envía `{ reason }` que no se procesa.
- **Solución propuesta:** Cambiar el path en `cancelBooking()` a `/api/bookings/${id}/status` y enviar `{ status: 'cancelled' }`. Opcionalmente agregar soporte de `reason` al backend (nueva columna `cancellation_reason` en tabla `bookings` + campo en el schema zod).

#### A3: CreateBookingModal — `POST /api/admin/bookings` → 404
- **Archivos:** `adminApi.ts` (función `createAdminBooking`)
- **Problema:** Path no existe. El backend tiene `POST /api/bookings` (público) con schema diferente: espera `{ date, startTime }` separados, no `{ scheduledAt }` ISO combinado.
- **Solución propuesta:** Cambiar el path a `/api/bookings`. Convertir `scheduledAt` (ISO) a `date` (YYYY-MM-DD) + `startTime` (HH:MM) antes de enviar. Agregar `notes` al schema del backend si se quiere soportar notas. Considerar si las citas manuales admin deben pasar por el mismo endpoint público o por uno dedicado con auth.

#### A4: CreateExpenseModal — `POST /api/admin/expenses` → 404 (doble bug)
- **Archivos:** `adminApi.ts`, `CreateExpenseModal.tsx`
- **Problema 1:** Path incorrecto. Backend usa `/api/dashboard/expenses`.
- **Problema 2:** `CreateExpenseModal` no envía `category` (3 argumentos en vez de 4).
- **Solución propuesta:** (1) Cambiar path en `createExpense()` de `/api/admin/expenses` a `/api/dashboard/expenses`. (2) Agregar selector de categoría al `CreateExpenseModal.tsx` y pasar el 4° argumento.

#### A5: ClientHistoryDrawer — `GET /api/admin/clients/:id/history` → 404
- **Archivo:** `adminApi.ts` (función `fetchClientHistory`)
- **Problema:** No existe endpoint de historial de clientes.
- **Solución propuesta:** Crear `GET /api/clients/:id/history` en backend que consulte bookings + services para un client_id dado, con data desencriptada.

#### A6: Fórmulas técnicas — `POST /api/admin/clients/:id/formulas` → 404
- **Archivo:** `adminApi.ts` (función `updateTechnicalFormula`)
- **Problema:** No existe endpoint de fórmulas.
- **Solución propuesta:** Crear `POST /api/clients/:id/formulas` que acepte `{ bookingId, formula }` y lo persista (requiere una columna `technical_formula` en la tabla `bookings` o una tabla separada `formulas`).

#### A7: `bookingApi.ts` — `GET /api/availability` → 404
- **Archivo:** [`bookingApi.ts` L85](file:///c:/Users/Andres/OneDrive/Desktop/SalonOS/packages/frontend-pwa/src/services/bookingApi.ts#L85)
- **Problema:** El frontend llama a `GET /api/availability?serviceId=...&from=...&to=...` pero el backend tiene `GET /api/bookings/availability?serviceId=...&date=...`. Path distinto Y parámetros distintos (from/to vs date).
- **Solución propuesta:** Cambiar el path a `/api/bookings/availability`. Adaptar los parámetros: enviar `date` en vez de `from`/`to`, o crear soporte de rango en el backend.

---

### 🟡 MEDIO — Dato incorrecto / incompleto / inconsistencia

#### M1: `bookingApi.ts` — `POST /api/bookings` schema mismatch
- **Archivo:** [`bookingApi.ts` L96-101](file:///c:/Users/Andres/OneDrive/Desktop/SalonOS/packages/frontend-pwa/src/services/bookingApi.ts#L96-L101)
- **Problema:** El frontend envía `{ serviceId, scheduledAt, clientName, clientPhone, notes }` pero el backend espera `{ serviceId, date, startTime, clientName, clientPhone }`. Los campos de fecha son incompatibles.
- **Solución propuesta:** Alinear el payload. O el frontend separa `scheduledAt` en `date` + `startTime`, o el backend acepta ambos formatos.

#### M2: `useDashboardStore` — Auth inconsistente con `authFetch`
- **Archivo:** [`useDashboardStore.ts` L86](file:///c:/Users/Andres/OneDrive/Desktop/SalonOS/packages/frontend-pwa/src/stores/useDashboardStore.ts#L86)
- **Problema:** Lee token de `localStorage.getItem('token')` directamente, pero `authStore` lo guarda bajo la key `salonos-auth` (JSON serializado por zustand-persist). Nunca encuentra el token → requests sin auth → 401.
- **Solución propuesta:** Refactorizar `useDashboardStore` para usar `authFetch` de `adminApi.ts` en vez de `fetch` directo, o leer el token desde `useAuthStore.getState().accessToken`.

#### M3: Dos páginas de Finanzas coexisten — posible duplicación
- **Archivos:** `FinanzasPage.tsx` + `FinanceDashboard.tsx`
- **Problema:** Existen dos implementaciones del dashboard financiero con diferentes data layers (`adminApi.ts` vs `useDashboardStore`). `FinanceDashboard.tsx` está más alineada al backend pero parece ser una versión anterior con su propio header/layout. `FinanzasPage.tsx` es la versión refactorizada con componentes separados pero con el shape mismatch.
- **Solución propuesta:** Decidir cuál mantener. Si se queda `FinanzasPage.tsx` (más modular), alinear su data layer con la respuesta real del backend. Eliminar `FinanceDashboard.tsx` o moverlo a un archivo de referencia.

#### M4: `AdminBooking` type mismatch con respuesta real de `GET /api/bookings`
- **Archivo:** `adminApi.ts` interfaces vs `booking.controller.ts`
- **Problema:** El frontend espera `{ service: { id, name, price }, client: { id, name, phone } }` (objetos anidados), pero el backend devuelve filas planas con `service_id`, `client_name`, `client_phone` (campos desencriptados pero planos).
- **Solución propuesta:** Enriquecer la respuesta del backend con JOINs a la tabla `services` para incluir los datos del servicio como objeto anidado, y estructurar los datos del cliente como sub-objeto.

---

## 7. Mapa Visual de Dependencias

```
AgendaPage ──→ fetchTodayBookings() ──→ GET /api/admin/bookings/today  ❌ 404
           ├─→ completeBooking()    ──→ PATCH /api/admin/bookings/:id/complete  ❌ 404
           ├─→ cancelBooking()      ──→ PATCH /api/admin/bookings/:id/cancel    ❌ 404
           └─→ createAdminBooking() ──→ POST  /api/admin/bookings              ❌ 404

FinanzasPage ──→ fetchFinanceMetrics() ──→ GET /api/dashboard/finance  ✅ path OK, ❌ shape mismatch
             └─→ createExpense()       ──→ POST /api/admin/expenses    ❌ 404 (real: /api/dashboard/expenses)

ClientasPage ──→ fetchAdminClients()   ──→ GET /api/admin/clients      ❌ 404 (no existe)
             └─→ fetchClientHistory()  ──→ GET /api/admin/clients/:id/history   ❌ 404
             └─→ updateTechnicalFormula() → POST /api/admin/clients/:id/formulas ❌ 404

BookingFlow ──→ fetchServices()   ──→ GET /api/services  ✅ OK
            ├─→ fetchAvailability() → GET /api/availability  ❌ 404 (real: /api/bookings/availability)
            └─→ createBooking()   ──→ POST /api/bookings  ✅ path OK, ❌ schema mismatch
```

---

## 8. Estadísticas Finales

| Categoría | Count |
|---|---|
| ✅ OK (funciona correctamente) | 5 |
| 🔴 MISMATCH_PATH | 6 |
| 🔴 FALTA_BACKEND | 3 |
| 🟡 MISMATCH_SHAPE | 3 |
| **Total llamadas auditadas** | **17** |
| **Llamadas rotas** | **12 (71%)** |

> [!CAUTION]
> **12 de 17 llamadas API están rotas.** Solo 5 endpoints (auth login/logout/refresh, GET services, ruta del dashboard con shape issues) funcionan correctamente. Las tres páginas principales del panel admin (Agenda, Finanzas, Clientas) no son funcionales en su estado actual.
