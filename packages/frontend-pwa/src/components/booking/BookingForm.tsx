import React, { useState } from 'react';
import { useBookingStore } from '../../store/bookingStore';
import { createBooking, SlotTakenError, ValidationError } from '../../services/bookingApi';

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Strips non-digit characters and returns the digit count. */
function countDigits(value: string): number {
  return value.replace(/[\s\-()+ ]/g, '').replace(/\D/g, '').length;
}

/** Formats a price in Costa Rican colones. Returns null for zero/negative. */
function formatPrice(price: number): string | null {
  if (price <= 0) return null;
  return new Intl.NumberFormat('es-CR', {
    style: 'currency',
    currency: 'CRC',
  }).format(price);
}

/**
 * Formats a date string (YYYY-MM-DD) to Spanish long format.
 * Example: "lunes 2 de junio"
 */
function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('es-CR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

/**
 * Formats HH:mm → h:mm AM/PM.
 * Example: "09:00" → "9:00 AM", "14:30" → "2:30 PM"
 */
function formatTime(time: string): string {
  const [hourStr, minuteStr] = time.split(':');
  const hour = parseInt(hourStr, 10);
  const minute = minuteStr;
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour}:${minute} ${period}`;
}

// ── Inline Error Component ────────────────────────────────────────────────────

function InlineError({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-1 text-danger text-sm mt-1" role="alert">
      <svg
        className="w-4 h-4 flex-shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
        />
      </svg>
      <span>{message}</span>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

function BookingForm() {
  const selectedService = useBookingStore((s) => s.selectedService);
  const selectedSlot = useBookingStore((s) => s.selectedSlot);
  const setStep = useBookingStore((s) => s.setStep);
  const setConfirmed = useBookingStore((s) => s.setConfirmed);
  const setSlotTaken = useBookingStore((s) => s.setSlotTaken);
  const setClientData = useBookingStore((s) => s.setClientData);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');

  const [nameError, setNameError] = useState('');
  const [phoneWarning, setPhoneWarning] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastVisible, setToastVisible] = useState(false);

  // ── Field-level validation ────────────────────────────────────────────────

  function validateName(value: string): boolean {
    if (value.trim().length < 2) {
      setNameError('El nombre debe tener al menos 2 caracteres.');
      return false;
    }
    setNameError('');
    return true;
  }

  function validatePhone(value: string): void {
    // TODO: prefix +506 is Costa Rica. Adjust if salon changes country.
    const digits = countDigits(value);
    if (value.trim().length > 0 && digits < 8) {
      setPhoneWarning('El número parece muy corto. Verificá que esté completo.');
    } else {
      setPhoneWarning('');
    }
  }

  // ── Toast helper ──────────────────────────────────────────────────────────

  function showToast(message: string): void {
    setToastMessage(message);
    setToastVisible(true);
    setTimeout(() => {
      setToastVisible(false);
    }, 5000);
  }

  // ── Submit handler ────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();

    if (!selectedService || !selectedSlot) return;

    const isNameValid = validateName(name);
    validatePhone(phone);

    if (!isNameValid) return;

    setSubmitting(true);

    // Costa Rica has no DST, always UTC-6
    const scheduledAt = new Date(
      `${selectedSlot.date}T${selectedSlot.time}:00-06:00`,
    ).toISOString();

    try {
      // Persist contact info for the ConfirmationScreen
      setClientData(name.trim(), phone.trim(), notes.trim());

      const result = await createBooking({
        serviceId: selectedService.id,
        scheduledAt,
        clientName: name.trim(),
        clientPhone: phone.trim(),
        notes: notes.trim() || undefined,
      });

      setConfirmed({
        bookingId: result.bookingId,
        scheduledAt: result.scheduledAt,
        serviceName: result.serviceName,
      });
      setStep(4);
    } catch (error: unknown) {
      if (error instanceof SlotTakenError) {
        setSlotTaken(error.availableSlots);
        setStep(4);
        return;
      }

      // 422 — field-level validation from API
      if (error instanceof ValidationError) {
        if (error.field === 'clientName') setNameError(error.message);
        else if (error.field === 'clientPhone') setPhoneWarning(error.message);
        else setNameError(error.message);
        return;
      }

      // 5xx or unknown
      showToast('Ocurrió un error inesperado. Por favor, intentá de nuevo.');
    } finally {
      setSubmitting(false);
    }
  }

  // ── Input styles ──────────────────────────────────────────────────────────

  const baseInputClasses =
    'w-full h-12 px-4 bg-bg-card border border-gold/20 text-text-primary text-lg rounded-xl placeholder:text-text-muted transition-all duration-200 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold';

  const errorInputClasses =
    'w-full h-12 px-4 bg-bg-card border border-danger text-text-primary text-lg rounded-xl placeholder:text-text-muted transition-all duration-200 focus:outline-none focus:border-danger focus:ring-1 focus:ring-danger';

  const isSubmitDisabled = submitting || name.trim().length === 0 || phone.trim().length === 0;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col min-h-0">
      <form id="booking-contact-form" onSubmit={handleSubmit} className="flex-1 px-4 pt-6 pb-40 space-y-6">
        {/* Header */}
        <div>
          <h2 className="font-serif text-2xl text-gold-light">
            Tus datos de contacto
          </h2>
          <p className="text-text-muted text-sm mt-2">
            No necesitas crear una cuenta. Solo necesitamos tu nombre y WhatsApp
            para confirmar tu cita.
          </p>
        </div>

        {/* Name field */}
        <div className="space-y-4">
          <div>
            <label
              htmlFor="booking-name"
              className="text-text-secondary text-sm font-medium block mb-1.5"
            >
              Nombre completo
            </label>
            <input
              type="text"
              id="booking-name"
              autoComplete="name"
              placeholder="Ej: María González"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (nameError) validateName(e.target.value);
              }}
              onBlur={() => {
                if (name.trim().length > 0) validateName(name);
              }}
              className={nameError ? errorInputClasses : baseInputClasses}
              aria-invalid={nameError ? 'true' : undefined}
              aria-describedby={nameError ? 'booking-name-error' : undefined}
            />
            {nameError && (
              <div id="booking-name-error">
                <InlineError message={nameError} />
              </div>
            )}
          </div>

          {/* Phone field */}
          <div>
            <label
              htmlFor="booking-phone"
              className="text-text-secondary text-sm font-medium block mb-1.5"
            >
              WhatsApp
            </label>
            <input
              type="tel"
              id="booking-phone"
              autoComplete="tel"
              placeholder="Ej: +506 8888-8888"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                if (phoneWarning) validatePhone(e.target.value);
              }}
              onBlur={() => validatePhone(phone)}
              className={phoneWarning ? errorInputClasses : baseInputClasses}
              aria-describedby={phoneWarning ? 'booking-phone-warning' : undefined}
            />
            {/* TODO: prefix +506 is Costa Rica. Adjust if salon changes country. */}
            {phoneWarning && (
              <div id="booking-phone-warning">
                <InlineError message={phoneWarning} />
              </div>
            )}
          </div>

          {/* Notes field */}
          <div>
            <label
              htmlFor="booking-notes"
              className="text-text-secondary text-sm font-medium block mb-1.5"
            >
              Notas especiales (opcional)
            </label>
            <textarea
              id="booking-notes"
              rows={3}
              placeholder="Ej: cabello teñido, alergia a amoniaco..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-3 bg-bg-card border border-gold/20 text-text-primary text-base rounded-xl placeholder:text-text-muted transition-all duration-200 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold resize-none"
            />
          </div>
        </div>

        {/* Appointment summary card */}
        {selectedService && selectedSlot && (
          <div className="p-4 bg-bg-card border border-gold/10 rounded-xl space-y-2">
            <p className="text-xs text-text-muted uppercase tracking-wider font-semibold">
              Resumen de tu cita
            </p>

            {/* Service row */}
            <div className="flex items-center justify-between">
              <span className="text-text-primary font-semibold">
                {selectedService.name}
              </span>
              {selectedService.price > 0 ? (
                <span className="text-gold">
                  {formatPrice(selectedService.price)}
                </span>
              ) : (
                <span className="text-text-muted">Consultar precio</span>
              )}
            </div>

            {/* Date/time row */}
            <div className="flex items-center gap-2 text-text-secondary text-sm">
              <svg
                className="w-4 h-4 text-gold-light flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
                />
              </svg>
              <span>
                {formatDate(selectedSlot.date)} · {formatTime(selectedSlot.time)}
              </span>
            </div>
          </div>
        )}
      </form>

      {/* Sticky footer */}
      <div className="sticky bottom-0 bg-bg-base/95 backdrop-blur-sm border-t border-light/10 p-4">
        <button
          type="button"
          onClick={() => setStep(2)}
          className="text-sm text-text-secondary cursor-pointer hover:text-text-primary transition-colors text-center w-full"
          aria-label="Volver al paso anterior"
        >
          ← Volver
        </button>
        <button
          type="submit"
          form="booking-contact-form"
          disabled={isSubmitDisabled}
          className="w-full h-12 mt-2 bg-gold text-bg-base font-semibold text-lg rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:bg-gold-hover active:scale-[0.98] flex items-center justify-center gap-2"
        >
          {submitting ? (
            <>
              <svg
                className="w-5 h-5 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Agendando...
            </>
          ) : (
            'Agendar Turno →'
          )}
        </button>
      </div>

      {/* Error toast */}
      {toastVisible && (
        <div
          className="fixed bottom-4 left-4 right-4 max-w-md mx-auto z-50 bg-danger/10 border border-danger/30 text-danger rounded-xl p-4 text-sm"
          role="alert"
        >
          {toastMessage}
        </div>
      )}
    </div>
  );
}

export default BookingForm;
