import { useState, useRef, useEffect } from 'react';
import { completeBooking } from '../../services/adminApi';

interface CompleteBookingModalProps {
  bookingId: string;
  serviceName: string;
  suggestedPrice: number;
  onSuccess: () => void;
  onClose: () => void;
}

type PaymentMethod = 'cash' | 'transfer' | 'card';

const PAYMENT_OPTIONS: { value: PaymentMethod; label: string }[] = [
  { value: 'cash', label: 'Efectivo' },
  { value: 'transfer', label: 'Transferencia' },
  { value: 'card', label: 'Tarjeta' },
];

function CompleteBookingModal({
  bookingId,
  serviceName,
  suggestedPrice,
  onSuccess,
  onClose,
}: CompleteBookingModalProps) {
  const [amount, setAmount] = useState(suggestedPrice > 0 ? String(suggestedPrice) : '');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const amountRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    amountRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount) || 0;
    if (numAmount < 0) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await completeBooking(bookingId, numAmount, paymentMethod);
      onSuccess();
    } catch {
      setError('No se pudo completar la cita. Intentá de nuevo.');
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
      aria-label="Completar cita"
    >
      <div className="w-full max-w-md bg-bg-card rounded-t-2xl sm:rounded-2xl border border-gold/20 p-6">
        <h2 className="font-serif text-xl text-gold-light">Completar cita</h2>
        <p className="text-text-muted text-sm mt-1">{serviceName}</p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Amount */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="complete-amount" className="text-text-secondary text-sm font-medium">
              Monto cobrado (₡)
            </label>
            <input
              ref={amountRef}
              id="complete-amount"
              type="number"
              inputMode="numeric"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className="h-12 px-4 text-lg bg-bg-elevated border border-gold/20 rounded-xl text-text-primary placeholder:text-text-muted focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/50 transition-colors"
            />
          </div>

          {/* Payment Method */}
          <div className="flex flex-col gap-1.5">
            <label className="text-text-secondary text-sm font-medium">Método de pago</label>
            <div className="flex gap-2">
              {PAYMENT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setPaymentMethod(opt.value)}
                  className={`flex-1 h-10 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer ${
                    paymentMethod === opt.value
                      ? 'bg-gold text-bg-base'
                      : 'border border-gold/20 text-text-secondary hover:border-gold/40'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="bg-danger/10 border border-danger/30 text-danger text-sm rounded-xl p-3">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-12 bg-gold hover:bg-gold-hover text-bg-base font-bold text-base rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-gold-sm cursor-pointer flex items-center justify-center gap-2 mt-4"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Registrando...
              </>
            ) : (
              'Registrar Pago'
            )}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full text-sm text-text-muted text-center py-2 hover:text-text-secondary transition-colors cursor-pointer"
          >
            Cancelar
          </button>
        </form>
      </div>
    </div>
  );
}

export default CompleteBookingModal;
