import { useBookingStore } from '../../store/bookingStore';

function formatTime(time: string): string {
  const [hoursStr, minutesStr] = time.split(':');
  const hours = parseInt(hoursStr, 10);
  const minutes = minutesStr ?? '00';
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes} ${period}`;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00');
  return date.toLocaleDateString('es-CR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

function SlotTakenScreen() {
  const slotTakenAlternatives = useBookingStore((s) => s.slotTakenAlternatives);
  const setSlot = useBookingStore((s) => s.setSlot);
  const setStep = useBookingStore((s) => s.setStep);
  const resetFlow = useBookingStore((s) => s.resetFlow);

  const alternatives = (slotTakenAlternatives ?? []).slice(0, 4);

  return (
    <div className="flex flex-col items-center px-6 py-12 space-y-5 text-center min-h-screen bg-bg-base justify-center">
      {/* Clock icon */}
      <div className="w-20 h-20 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center mx-auto">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-10 h-10 text-gold"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>

      {/* Title and subtitle */}
      <div className="space-y-2">
        <h2 className="font-serif text-2xl font-bold text-gold">
          ¡Ese horario acaba de ser tomado!
        </h2>
        <p className="text-text-secondary text-base">
          Alguien más lo reservó justo antes que vos. Estos horarios siguen
          disponibles:
        </p>
      </div>

      {/* Alternative slots list */}
      {alternatives.length > 0 && (
        <div className="flex flex-col gap-2 w-full">
          {alternatives.map((slot) => (
            <button
              key={`${slot.date}-${slot.time}`}
              type="button"
              className="w-full h-12 bg-bg-card border border-gold/20 rounded-xl flex items-center justify-between px-4 text-sm font-medium hover:border-gold transition-colors cursor-pointer active:scale-[0.98]"
              onClick={() => {
                setSlot({ date: slot.date, time: slot.time });
                setStep(3);
              }}
            >
              <span className="text-text-primary">
                {formatDate(slot.date)} · {formatTime(slot.time)}
              </span>
              {slot.spotsLeft === 1 && (
                <span className="text-[10px] bg-gold text-bg-base font-bold rounded-full px-1.5 py-0.5">
                  ¡Último!
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* View all slots button */}
      <button
        type="button"
        className="w-full h-12 bg-transparent border-2 border-gold/40 text-gold font-semibold rounded-xl transition-all duration-200 hover:bg-gold/10 hover:border-gold active:scale-[0.98]"
        onClick={() => setStep(2)}
      >
        Ver todos los horarios
      </button>

      {/* Back to start link */}
      <span
        role="button"
        tabIndex={0}
        className="text-sm text-text-muted underline cursor-pointer"
        onClick={() => resetFlow()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            resetFlow();
          }
        }}
      >
        Volver al inicio
      </span>
    </div>
  );
}

export default SlotTakenScreen;
