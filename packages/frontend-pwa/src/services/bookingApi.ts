import type { Service, Slot } from '../store/bookingStore';

// ── Configuration ─────────────────────────────────────────────────────────────

const BASE_URL: string =
  (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3000';

// ── Custom Errors ─────────────────────────────────────────────────────────────

/** Thrown when the requested slot was already booked (HTTP 409). */
export class SlotTakenError extends Error {
  public readonly availableSlots: Slot[];

  constructor(availableSlots: Slot[]) {
    super('The selected time slot is no longer available.');
    this.name = 'SlotTakenError';
    this.availableSlots = availableSlots;
  }
}

/** Thrown on non-recoverable server errors (HTTP 5xx). */
export class ApiError extends Error {
  public readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/** Thrown when the server rejects input with a field-level validation error (HTTP 422). */
export class ValidationError extends Error {
  public readonly field: string;

  constructor(field: string, message: string) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
  }
}

// ── Payload / Result Types ────────────────────────────────────────────────────

export interface CreateBookingPayload {
  serviceId: number;
  scheduledAt: string;
  clientName: string;
  clientPhone: string;
  notes?: string;
}

export interface BookingResult {
  bookingId: string;
  scheduledAt: string;
  serviceName: string;
}

// ── API Functions ─────────────────────────────────────────────────────────────

/** Fetches active services from the catalog. */
export async function fetchServices(): Promise<Service[]> {
  const response = await fetch(`${BASE_URL}/api/services`);

  if (!response.ok) {
    throw new ApiError(response.status, 'Failed to fetch services.');
  }

  const data: { services: Service[] } = await response.json();
  return data.services;
}

/** Fetches available time slots for a service in a date range. */
export async function fetchAvailability(
  serviceId: number,
  from: string,
  to: string,
): Promise<Slot[]> {
  const params = new URLSearchParams({
    serviceId: String(serviceId),
    from,
    to,
  });

  const response = await fetch(`${BASE_URL}/api/availability?${params.toString()}`);

  if (!response.ok) {
    throw new ApiError(response.status, 'Failed to fetch availability.');
  }

  const data: { slots: Slot[] } = await response.json();
  return data.slots;
}

/** Creates a new booking. Throws {@link SlotTakenError} on 409, {@link ApiError} on 5xx. */
export async function createBooking(payload: CreateBookingPayload): Promise<BookingResult> {
  const response = await fetch(`${BASE_URL}/api/bookings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (response.status === 201) {
    const data: BookingResult = await response.json();
    return data;
  }

  if (response.status === 409) {
    const body: { availableSlots: Slot[] } = await response.json();
    throw new SlotTakenError(body.availableSlots);
  }

  if (response.status === 422) {
    const body: { error: string; field: string; message: string } = await response.json();
    throw new ValidationError(body.field, body.message);
  }

  // 5xx and any other unexpected status
  throw new ApiError(
    response.status,
    `Booking request failed with status ${response.status}.`,
  );
}
