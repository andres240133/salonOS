import { useState, useRef, useEffect } from 'react';
import { cancelBooking } from '../../services/adminApi';

interface CancelBookingModalProps {
  bookingId: string;
  clientName: string;
  onSuccess: () => void;
  onClose: () => void;
}

function CancelBookingModal({ bookingId, clientName, onSuccess, onClose }: CancelBookingModalProps) {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reasonRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    reasonRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await cancelBooking(bookingId, reason || undefined);
      onSuccess();
    } catch (err) {
      setError(
        err instanceof Error && err.message
          ? err.message
          : 'No se pudo cancelar la cita. Intentá de nuevo.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label="Cancelar cita"
    >
      <div className="w-full max-w-md bg-bg-card rounded-t-2xl sm:rounded-2xl border border-gold/20 p-6">
        {/* Warning icon */}
        <div className="flex justify-center mb-3">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-gold">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
          </svg>
        </div>

        <h2 className="font-serif text-xl text-gold text-center">¿Cancelar esta cita?</h2>
        <p className="text-text-secondary text-sm text-center mt-2">
          Se cancelará la cita de <strong className="text-text-primary">{clientName}</strong>. Esta acción no se puede deshacer.
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="cancel-reason" className="text-text-secondary text-sm font-medium">
              Motivo (opcional)
            </label>
            <textarea
              ref={reasonRef}
              id="cancel-reason"
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ej: clienta no se presentó"
              className="px-4 py-3 text-sm bg-bg-elevated border border-gold/20 rounded-xl text-text-primary placeholder:text-text-muted focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/50 transition-colors resize-none"
            />
          </div>

          {error && (
            <div className="bg-danger/10 border border-danger/30 text-danger text-sm rounded-xl p-3">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-12 bg-danger hover:bg-red-700 text-white font-bold text-base rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Cancelando...
              </>
            ) : (
              'Sí, cancelar cita'
            )}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full h-12 border border-gold/30 text-gold font-semibold rounded-xl hover:bg-gold/5 transition-all duration-200 cursor-pointer"
          >
            Volver
          </button>
        </form>
      </div>
    </div>
  );
}

export default CancelBookingModal;
