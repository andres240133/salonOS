import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useBookingStore } from '../../store/bookingStore';
import { fetchAvailability } from '../../services/bookingApi';
import type { Slot } from '../../store/bookingStore';

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Format a Date as 'YYYY-MM-DD'. */
function toDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Convert 24-h 'HH:mm' → 12-h 'h:mm AM/PM'. */
function formatTime12h(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${m.toString().padStart(2, '0')} ${period}`;
}

/** Build a 14-day range starting from tomorrow. */
function buildDateRange(): Date[] {
  const dates: Date[] = [];
  const now = new Date();
  for (let i = 1; i <= 14; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    d.setHours(0, 0, 0, 0);
    dates.push(d);
  }
  return dates;
}

/** CRC currency formatter. */
const crcFormatter = new Intl.NumberFormat('es-CR', {
  style: 'currency',
  currency: 'CRC',
});

// ── Component ────────────────────────────────────────────────────────────────

function CalendarView() {
  const selectedService = useBookingStore((s) => s.selectedService);
  const selectedSlot = useBookingStore((s) => s.selectedSlot);
  const setSlot = useBookingStore((s) => s.setSlot);
  const setStep = useBookingStore((s) => s.setStep);

  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const firstAvailableRef = useRef<HTMLButtonElement>(null);

  // 14-day range starting from tomorrow (stable across re-renders)
  const dateRange = useMemo(() => buildDateRange(), []);

  // ── Fetch availability on mount ─────────────────────────────────────────

  useEffect(() => {
    if (!selectedService) return;

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const from = toDateString(dateRange[0]);
        const to = toDateString(dateRange[dateRange.length - 1]);
        const result = await fetchAvailability(selectedService.id, from, to);
        if (!cancelled) setSlots(result);
      } catch {
        // Silently fail – user sees "no slots" state
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [selectedService, dateRange]);

  // ── Auto-scroll to first available date ─────────────────────────────────

  useEffect(() => {
    if (!loading && firstAvailableRef.current) {
      firstAvailableRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  }, [loading]);

  // ── Derived data ────────────────────────────────────────────────────────

  /** Map of date-string → available slots (spotsLeft > 0). */
  const slotsByDate = useMemo(() => {
    const map = new Map<string, Slot[]>();
    for (const slot of slots) {
      if (slot.spotsLeft <= 0) continue;
      const existing = map.get(slot.date) ?? [];
      existing.push(slot);
      map.set(slot.date, existing);
    }
    return map;
  }, [slots]);

  /** Slots for the currently selected date. */
  const currentSlots = useMemo(() => {
    if (!selectedDate) return [];
    return slotsByDate.get(selectedDate) ?? [];
  }, [selectedDate, slotsByDate]);

  // ── Track which chip is the first available (for ref assignment) ────────

  let firstAvailableAssigned = false;

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col flex-1">
      {/* ── SECTION 1 — Date Chips ─────────────────────────────────── */}
      <div
        ref={scrollRef}
        className="overflow-x-auto flex gap-2 px-4 py-3 snap-x [&::-webkit-scrollbar]:hidden"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {loading
          ? Array.from({ length: 7 }).map((_, i) => (
              <div
                key={i}
                className="flex-shrink-0 w-14 h-[76px] rounded-xl bg-bg-card animate-pulse"
              />
            ))
          : dateRange.map((date) => {
              const dateStr = toDateString(date);
              const isSunday = date.getDay() === 0;
              const hasSlots = slotsByDate.has(dateStr);
              const isSelected = selectedDate === dateStr;
              const isDisabled = isSunday || !hasSlots;

              // Determine if we should show the month label
              const isFirstChip = date === dateRange[0];
              const isFirstOfMonth = date.getDate() === 1;
              const showMonth = isFirstChip || isFirstOfMonth;

              // Assign ref to first available chip
              let refProp: React.Ref<HTMLButtonElement> | undefined;
              if (!isDisabled && !firstAvailableAssigned) {
                refProp = firstAvailableRef;
                firstAvailableAssigned = true;
              }

              // Day-of-week in Spanish (abbreviated)
              const weekday = date.toLocaleDateString('es-CR', {
                weekday: 'short',
              });
              const monthLabel = date.toLocaleDateString('es-CR', {
                month: 'short',
              });

              return (
                <button
                  key={dateStr}
                  ref={refProp}
                  type="button"
                  disabled={isDisabled}
                  aria-label={`${weekday} ${date.getDate()}`}
                  onClick={() => {
                    setSelectedDate(dateStr);
                  }}
                  className={[
                    'flex-shrink-0 snap-center flex flex-col items-center w-14 py-3 rounded-xl transition-all duration-200',
                    isSelected
                      ? 'border-2 border-gold bg-gold/10'
                      : isDisabled
                        ? 'bg-bg-base border border-light/5 cursor-not-allowed opacity-40 pointer-events-none'
                        : 'bg-bg-card border border-gold/20 cursor-pointer hover:border-gold/40',
                  ].join(' ')}
                >
                  <span className="text-xs text-text-secondary uppercase tracking-wide">
                    {weekday}
                  </span>
                  <span className="text-lg font-semibold text-text-primary">
                    {date.getDate()}
                  </span>
                  {showMonth && (
                    <span className="text-[10px] text-text-muted">
                      {monthLabel}
                    </span>
                  )}
                  {!isDisabled && !isSelected && (
                    <span className="w-1.5 h-1.5 rounded-full bg-gold mt-1" />
                  )}
                </button>
              );
            })}
      </div>

      {/* ── SECTION 2 — Time Slots ─────────────────────────────────── */}
      <div className="flex-1 px-4 pb-2">
        {selectedDate === null ? (
          /* No date selected */
          <div className="flex flex-col items-center justify-center py-10">
            <svg
              className="w-12 h-12 text-gold/20"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5m-9-6h.008v.008H12v-.008ZM12 15h.008v.008H12V15Zm0 2.25h.008v.008H12v-.008ZM9.75 15h.008v.008H9.75V15Zm0 2.25h.008v.008H9.75v-.008ZM7.5 15h.008v.008H7.5V15Zm0 2.25h.008v.008H7.5v-.008Zm6.75-4.5h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V15Zm0 2.25h.008v.008h-.008v-.008Zm2.25-4.5h.008v.008H16.5v-.008Zm0 2.25h.008v.008H16.5V15Z"
              />
            </svg>
            <p className="text-text-muted text-center mt-3">
              Selecciona un día para ver los horarios disponibles
            </p>
          </div>
        ) : currentSlots.length === 0 ? (
          /* Date selected but no slots */
          <p className="text-text-muted text-center py-8">
            Sin horarios disponibles para este día.
          </p>
        ) : (
          /* Slots available */
          <>
            <h3 className="text-base font-semibold text-text-secondary mb-3">
              Horarios disponibles
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {currentSlots.map((slot) => {
                if (slot.spotsLeft === 0) return null;

                const isSlotSelected =
                  selectedSlot?.date === selectedDate &&
                  selectedSlot?.time === slot.time;
                const isLastSpot = slot.spotsLeft === 1;

                return (
                  <button
                    key={slot.time}
                    type="button"
                    onClick={() =>
                      setSlot({ date: selectedDate, time: slot.time })
                    }
                    className={[
                      'h-12 rounded-xl text-sm font-medium relative transition-all duration-150',
                      isSlotSelected
                        ? 'border-2 border-gold bg-gold/10 text-gold-light shadow-glow'
                        : isLastSpot
                          ? 'border border-gold/40 bg-gold/5 text-gold'
                          : 'border border-gold/20 bg-bg-card text-text-primary hover:border-gold hover:bg-gold/5',
                    ].join(' ')}
                  >
                    {formatTime12h(slot.time)}
                    {isLastSpot && !isSlotSelected && (
                      <span className="absolute top-0 right-0 translate-x-1/4 -translate-y-1/4 text-[10px] bg-gold text-bg-base font-bold rounded-full px-1.5 py-0.5 leading-none">
                        ¡Último!
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* ── Mini-summary ───────────────────────────────────────────── */}
      {selectedService && (
        <div className="p-3 bg-bg-card rounded-xl border border-gold/10 mx-4 mb-2">
          <p className="text-sm font-medium text-text-primary">
            {selectedService.name}
          </p>
          <p className="text-xs text-text-muted mt-0.5">
            {selectedService.price > 0
              ? crcFormatter.format(selectedService.price)
              : 'Consultar precio'}
          </p>
        </div>
      )}

      {/* ── Footer ─────────────────────────────────────────────────── */}
      <footer className="sticky bottom-0 bg-bg-base/95 backdrop-blur-sm border-t border-light/10 p-4">
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setStep(1)}
            className="w-1/3 h-12 bg-transparent border-2 border-gold/40 text-gold font-semibold rounded-xl transition-colors hover:border-gold"
          >
            ← Volver
          </button>
          <button
            type="button"
            disabled={!selectedSlot}
            onClick={() => setStep(3)}
            className={[
              'w-2/3 h-12 font-semibold rounded-xl transition-colors',
              selectedSlot
                ? 'bg-gold text-bg-base hover:bg-gold-light'
                : 'bg-gold/30 text-bg-base/60 cursor-not-allowed',
            ].join(' ')}
          >
            Siguiente →
          </button>
        </div>
      </footer>
    </div>
  );
}

export default CalendarView;
