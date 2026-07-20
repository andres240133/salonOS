import { useState, useEffect, useCallback } from 'react';
import { fetchTodayBookings, SessionExpiredError } from '../../services/adminApi';
import type { AdminBooking } from '../../services/adminApi';
import BookingCard from '../../components/admin/BookingCard';
import CompleteBookingModal from '../../components/admin/CompleteBookingModal';
import CancelBookingModal from '../../components/admin/CancelBookingModal';
import CreateBookingModal from '../../components/admin/CreateBookingModal';
import { useNavigate } from 'react-router-dom';

/** Polling interval for auto-refreshing bookings (ms). */
const POLL_INTERVAL_MS = 60_000;

function AgendaPage() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [completingBooking, setCompletingBooking] = useState<AdminBooking | null>(null);
  const [cancellingBooking, setCancellingBooking] = useState<AdminBooking | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const loadBookings = useCallback(async () => {
    try {
      const data = await fetchTodayBookings();
      setBookings(data);
      setError(null);
    } catch (err) {
      if (err instanceof SessionExpiredError) {
        navigate('/admin/login', { replace: true });
        return;
      }
      setError('No se pudieron cargar las citas.');
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadBookings();

    const interval = setInterval(loadBookings, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [loadBookings]);

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
    loadBookings();
  };

  const todayFormatted = new Date().toLocaleDateString('es-CR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'America/Costa_Rica',
  });
  const todayDisplay = todayFormatted.charAt(0).toUpperCase() + todayFormatted.slice(1);

  const totalCount = bookings.length;
  const subtitle =
    totalCount === 0
      ? 'Sin citas agendadas para hoy.'
      : totalCount === 1
        ? '1 cita agendada'
        : `${totalCount} citas agendadas`;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Section Header */}
      <div className="mb-6">
        <h2 className="font-serif text-2xl text-gold-light">{todayDisplay}</h2>
        <p className="text-text-muted text-sm mt-1">{subtitle}</p>
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
          <p className="text-text-muted text-lg mt-4">Sin citas para hoy</p>
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
