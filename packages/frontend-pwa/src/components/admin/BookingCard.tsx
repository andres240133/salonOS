import { useState } from 'react';
import type { AdminBooking } from '../../services/adminApi';

interface BookingCardProps {
  booking: AdminBooking;
  onComplete: (id: string) => void;
  onCancel: (id: string) => void;
}

const STATUS_CONFIG = {
  pending: { label: 'Pendiente', classes: 'bg-gold/10 text-gold border-gold/30' },
  confirmed: { label: 'Confirmada', classes: 'bg-success/10 text-success border-success/30' },
  completed: { label: 'Completada', classes: 'bg-bg-elevated text-text-muted border-light' },
  cancelled: { label: 'Cancelada', classes: 'bg-danger/10 text-danger border-danger/30' },
} as const;

/** Formats an ISO 8601 date to 12-hour time (e.g. "2:30 PM"). */
function formatTime12h(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString('es-CR', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'America/Costa_Rica',
  });
}

function BookingCard({ booking, onComplete, onCancel }: BookingCardProps) {
  const [showContact, setShowContact] = useState(false);
  const statusCfg = STATUS_CONFIG[booking.status];
  const isInactive = booking.status === 'completed' || booking.status === 'cancelled';
  const isActionable = booking.status === 'pending' || booking.status === 'confirmed';

  const cleanPhone = booking.client.phone.replace(/\D/g, '');

  return (
    <div
      className={`p-4 bg-bg-card border border-gold/15 rounded-xl transition-all duration-200 ${
        isInactive ? 'opacity-60' : ''
      }`}
    >
      {/* Top section */}
      <div className="flex justify-between items-start">
        <div>
          <p className="text-gold font-bold text-lg">{formatTime12h(booking.scheduledAt)}</p>
          <p className="text-text-primary font-semibold text-base mt-0.5">{booking.client.name}</p>
          <p className="text-text-secondary text-sm">{booking.service.name}</p>
        </div>

        <div className="flex flex-col items-end gap-1">
          <span
            className={`text-xs font-semibold rounded-full px-2.5 py-1 border ${statusCfg.classes}`}
          >
            {statusCfg.label}
          </span>
          {booking.origin === 'manual_admin' && (
            <span className="bg-bg-elevated text-text-muted text-[10px] rounded-full px-2 py-0.5 border border-light/20">
              Manual
            </span>
          )}
        </div>
      </div>

      {/* Collapsible contact section */}
      <button
        onClick={() => setShowContact(!showContact)}
        className="text-xs text-text-muted underline mt-2 cursor-pointer hover:text-text-secondary transition-colors"
        type="button"
      >
        {showContact ? 'Ocultar contacto' : 'Ver contacto'}
      </button>

      {showContact && (
        <div className="mt-2 p-3 bg-bg-elevated/50 rounded-lg space-y-1.5">
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-text-secondary">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
            </svg>
            <a
              href={`tel:${booking.client.phone}`}
              className="text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              {booking.client.phone}
            </a>
          </div>
          <a
            href={`https://wa.me/${cleanPhone}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-success hover:underline flex items-center gap-1"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.75.75 0 0 0 .918.918l4.458-1.495A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.34 0-4.508-.767-6.258-2.064l-.44-.337-3.222 1.08 1.08-3.222-.337-.44A9.956 9.956 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
            </svg>
            Escribir por WhatsApp
          </a>
          {booking.notes && (
            <p className="text-text-muted text-sm italic mt-1">📝 {booking.notes}</p>
          )}
        </div>
      )}

      {/* Action buttons */}
      {isActionable && (
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => onComplete(booking.id)}
            className="h-10 bg-gold text-bg-base text-sm font-semibold rounded-xl flex-1 hover:bg-gold-hover transition-all duration-200 active:scale-[0.98] cursor-pointer"
          >
            Completar
          </button>
          <button
            onClick={() => onCancel(booking.id)}
            className="h-10 border border-danger/40 text-danger text-sm rounded-xl flex-1 hover:bg-danger/5 transition-all duration-200 active:scale-[0.98] cursor-pointer"
          >
            Cancelar
          </button>
        </div>
      )}
    </div>
  );
}

export default BookingCard;
