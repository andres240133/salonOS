import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchTodayBookings, SessionExpiredError } from '../../services/adminApi';
import type { AdminBooking } from '../../services/adminApi';
import BookingCard from '../../components/admin/BookingCard';
import CompleteBookingModal from '../../components/admin/CompleteBookingModal';
import CancelBookingModal from '../../components/admin/CancelBookingModal';
import CreateBookingModal from '../../components/admin/CreateBookingModal';
import { useNavigate } from 'react-router-dom';

/** Polling interval for auto-refreshing bookings (ms). */
const POLL_INTERVAL_MS = 60_000;
const TIMEZONE = 'America/Costa_Rica';

const FULL_DAY_NAMES: Readonly<Record<number, string>> = {
  0: 'Domingo',
  1: 'Lunes',
  2: 'Martes',
  3: 'Miércoles',
  4: 'Jueves',
  5: 'Viernes',
  6: 'Sábado',
};

const FULL_MONTH_NAMES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

/** Obtiene la fecha de hoy (YYYY-MM-DD) en America/Costa_Rica. */
function getTodayCR(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: TIMEZONE });
}

/** Suma días a una fecha YYYY-MM-DD usando aritmética UTC pura al mediodía. */
function addDaysUTC(dateStr: string, daysToAdd: number): string {
  const d = new Date(`${dateStr}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + daysToAdd);
  return d.toISOString().slice(0, 10);
}

/** Obtiene el día de la semana (0=Dom..6=Sáb) en UTC puro. */
function getDayOfWeekUTC(dateStr: string): number {
  return new Date(`${dateStr}T12:00:00Z`).getUTCDay();
}

/** Formatea YYYY-MM-DD en español largo, ej: "Martes 3 de noviembre". */
function formatSpanishLongDate(dateStr: string): string {
  const [, monthStr, dayStr] = dateStr.split('-');
  const dow = getDayOfWeekUTC(dateStr);
  const dayName = FULL_DAY_NAMES[dow] ?? '';
  const monthName = FULL_MONTH_NAMES[parseInt(monthStr, 10) - 1] ?? '';
  return `${dayName} ${parseInt(dayStr, 10)} de ${monthName}`;
}

function AgendaPage() {
  const navigate = useNavigate();
  const todayCR = getTodayCR();

  const [selectedDate, setSelectedDate] = useState<string>(todayCR);
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [completingBooking, setCompletingBooking] = useState<AdminBooking | null>(null);
  const [cancellingBooking, setCancellingBooking] = useState<AdminBooking | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const dateInputRef = useRef<HTMLInputElement>(null);
  const latestRequestIdRef = useRef(0);

  const loadBookings = useCallback(
    async (dateToLoad: string, showSpinner = false) => {
      const requestId = ++latestRequestIdRef.current;
      if (showSpinner) {
        setIsLoading(true);
      }

      try {
        const data = await fetchTodayBookings(dateToLoad);
        if (requestId !== latestRequestIdRef.current) return;
        setBookings(data);
        setError(null);
      } catch (err) {
        if (requestId !== latestRequestIdRef.current) return;
        if (err instanceof SessionExpiredError) {
          navigate('/admin/login', { replace: true });
          return;
        }
        setError(err instanceof Error ? err.message : 'No se pudieron cargar las citas.');
      } finally {
        if (requestId === latestRequestIdRef.current) {
          setIsLoading(false);
        }
      }
    },
    [navigate],
  );

  useEffect(() => {
    loadBookings(selectedDate, true);

    const interval = setInterval(() => {
      loadBookings(selectedDate, false);
    }, POLL_INTERVAL_MS);

    return () => {
      clearInterval(interval);
      // Invalida cualquier request en vuelo de la fecha anterior
      latestRequestIdRef.current++;
    };
  }, [selectedDate, loadBookings]);

  const activeStatuses = new Set<string>(['pending', 'confirmed']);
  const activeBookings = bookings
    .filter((b) => activeStatuses.has(b.status))
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
  const inactiveBookings = bookings
    .filter((b) => !activeStatuses.has(b.status))
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());

  const handleComplete = (id: string) => {
    const booking = bookings.find((b) => b.id === id);
    if (booking) setCompletingBooking(booking);
  };

  const handleCancel = (id: string) => {
    const booking = bookings.find((b) => b.id === id);
    if (booking) setCancellingBooking(booking);
  };

  const handleModalSuccess = () => {
    setCompletingBooking(null);
    setCancellingBooking(null);
    setShowCreateModal(false);
    loadBookings(selectedDate, false);
  };

  const handlePrevDay = () => {
    setSelectedDate((prev) => addDaysUTC(prev, -1));
  };

  const handleNextDay = () => {
    setSelectedDate((prev) => addDaysUTC(prev, 1));
  };

  const handleGoToday = () => {
    setSelectedDate(getTodayCR());
  };

  const handleOpenDatePicker = () => {
    const input = dateInputRef.current;
    if (!input) return;
    if (typeof input.showPicker === 'function') {
      try {
        input.showPicker();
        return;
      } catch {
        // Fallback focus/click
      }
    }
    input.focus();
    input.click();
  };

  const isToday = selectedDate === todayCR;
  const dateDisplay = formatSpanishLongDate(selectedDate);

  const totalCount = bookings.length;
  const subtitle =
    totalCount === 0
      ? isToday
        ? 'Sin citas agendadas para hoy.'
        : 'Sin citas agendadas para este día.'
      : totalCount === 1
        ? '1 cita agendada'
        : `${totalCount} citas agendadas`;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Date Navigation Bar */}
      <div className="mb-6 p-3 bg-bg-card border border-gold/15 rounded-xl space-y-2">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={handlePrevDay}
            aria-label="Día anterior"
            className="min-w-[48px] min-h-[48px] px-3 flex items-center justify-center rounded-xl border border-gold/20 text-gold hover:bg-gold/10 active:scale-95 transition-all cursor-pointer"
          >
            ←
          </button>

          <div className="relative flex-1 flex flex-col items-center justify-center">
            <button
              type="button"
              onClick={handleOpenDatePicker}
              className="w-full min-h-[48px] px-3 py-1.5 rounded-xl hover:bg-bg-elevated/60 transition-colors flex flex-col items-center justify-center cursor-pointer"
            >
              <div className="flex items-center gap-2 flex-wrap justify-center">
                <h2 className="font-serif text-xl sm:text-2xl text-gold-light text-center">
                  {dateDisplay}
                </h2>
                {isToday && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gold/10 text-gold border border-gold/30">
                    Hoy
                  </span>
                )}
              </div>
              <p className="text-text-muted text-xs mt-0.5">{subtitle}</p>
            </button>

            <input
              ref={dateInputRef}
              type="date"
              value={selectedDate}
              onChange={(e) => {
                if (e.target.value) setSelectedDate(e.target.value);
              }}
              aria-label="Seleccionar fecha"
              className="sr-only"
              tabIndex={-1}
            />
          </div>

          <button
            type="button"
            onClick={handleNextDay}
            aria-label="Día siguiente"
            className="min-w-[48px] min-h-[48px] px-3 flex items-center justify-center rounded-xl border border-gold/20 text-gold hover:bg-gold/10 active:scale-95 transition-all cursor-pointer"
          >
            →
          </button>
        </div>

        {!isToday && (
          <div className="flex justify-center pt-1">
            <button
              type="button"
              onClick={handleGoToday}
              className="min-h-[48px] px-4 rounded-xl border border-gold/30 text-gold text-sm font-semibold hover:bg-gold/10 transition-colors cursor-pointer"
            >
              Volver a Hoy
            </button>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 bg-danger/10 border border-danger/30 text-danger text-sm rounded-xl">
          {error}
        </div>
      )}

      {/* Loading Skeletons */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-bg-card border border-gold/10 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : totalCount === 0 ? (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-20">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={0.5} stroke="currentColor" className="w-24 h-24 text-gold/20">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
          </svg>
          <p className="text-text-muted text-lg mt-4">
            {isToday ? 'Sin citas para hoy' : 'Sin citas para esta fecha'}
          </p>
          <p className="text-text-muted text-sm mt-1">Tocá el botón + para crear una cita manual</p>
        </div>
      ) : (
        /* Bookings List */
        <div className="space-y-3">
          {activeBookings.map((b) => (
            <BookingCard
              key={b.id}
              booking={b}
              onComplete={handleComplete}
              onCancel={handleCancel}
            />
          ))}

          {activeBookings.length > 0 && inactiveBookings.length > 0 && (
            <div className="flex items-center gap-3 py-2">
              <div className="flex-1 h-px bg-gold/10" />
              <span className="text-text-muted text-xs">Finalizadas</span>
              <div className="flex-1 h-px bg-gold/10" />
            </div>
          )}

          {inactiveBookings.map((b) => (
            <BookingCard
              key={b.id}
              booking={b}
              onComplete={handleComplete}
              onCancel={handleCancel}
            />
          ))}
        </div>
      )}

      {/* FAB - Create Booking */}
      <button
        onClick={() => setShowCreateModal(true)}
        className="fixed bottom-20 right-4 md:bottom-4 w-14 h-14 bg-gold rounded-full shadow-gold-md flex items-center justify-center text-bg-base text-2xl font-bold hover:bg-gold-hover transition-all duration-200 active:scale-95 cursor-pointer z-30"
        aria-label="Crear cita manual"
      >
        +
      </button>

      {/* Modals */}
      {completingBooking && (
        <CompleteBookingModal
          bookingId={completingBooking.id}
          serviceName={completingBooking.service.name}
          suggestedPrice={completingBooking.service.price}
          onSuccess={handleModalSuccess}
          onClose={() => setCompletingBooking(null)}
        />
      )}

      {cancellingBooking && (
        <CancelBookingModal
          bookingId={cancellingBooking.id}
          clientName={cancellingBooking.client.name}
          onSuccess={handleModalSuccess}
          onClose={() => setCancellingBooking(null)}
        />
      )}

      {showCreateModal && (
        <CreateBookingModal
          onSuccess={handleModalSuccess}
          onClose={() => setShowCreateModal(false)}
        />
      )}
    </div>
  );
}

export default AgendaPage;
