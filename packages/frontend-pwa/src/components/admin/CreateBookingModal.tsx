import { useState, useEffect, useRef } from 'react';
import { createAdminBooking, fetchServices } from '../../services/adminApi';
import type { Service } from '../../services/adminApi';

interface CreateBookingModalProps {
  onSuccess: () => void;
  onClose: () => void;
}

function CreateBookingModal({ onSuccess, onClose }: CreateBookingModalProps) {
  const [services, setServices] = useState<Service[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);

  const [serviceId, setServiceId] = useState<number | ''>('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [notes, setNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const serviceRef = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    serviceRef.current?.focus();
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchServices();
        setServices(data);
      } catch {
        setError('No se pudieron cargar los servicios.');
      } finally {
        setLoadingServices(false);
      }
    };
    load();
  }, []);

  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Costa_Rica' });

  const servicesByCategory = services.reduce<Record<string, Service[]>>((acc, svc) => {
    const cat = svc.category || 'General';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(svc);
    return acc;
  }, {});

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!serviceId) errs.serviceId = 'Seleccioná un servicio';
    if (!date) errs.date = 'Seleccioná una fecha';
    if (!time) errs.time = 'Seleccioná una hora';
    if (!clientName.trim()) errs.clientName = 'Ingresá el nombre';
    if (!clientPhone.trim()) errs.clientPhone = 'Ingresá el teléfono';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const scheduledAt = new Date(`${date}T${time}:00-06:00`).toISOString();

      await createAdminBooking({
        serviceId: serviceId as number,
        scheduledAt,
        clientName: clientName.trim(),
        clientPhone: clientPhone.trim(),
        notes: notes.trim() || undefined,
      });

      onSuccess();
    } catch {
      setError('No se pudo crear la cita. Intentá de nuevo.');
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
      aria-label="Crear cita manual"
    >
      <div className="w-full max-w-md bg-bg-card rounded-t-2xl sm:rounded-2xl border border-gold/20 p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="font-serif text-xl text-gold-light">Nueva cita manual</h2>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Service Select */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="create-service" className="text-text-secondary text-sm font-medium">
              Servicio
            </label>
            {loadingServices ? (
              <div className="h-12 bg-bg-elevated rounded-xl animate-pulse" />
            ) : (
              <select
                ref={serviceRef}
                id="create-service"
                value={serviceId}
                onChange={(e) => setServiceId(Number(e.target.value))}
                className="h-12 px-4 text-lg bg-bg-elevated border border-gold/20 rounded-xl text-text-primary focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/50 transition-colors appearance-none cursor-pointer"
              >
                <option value="" disabled>Seleccionar servicio...</option>
                {Object.entries(servicesByCategory).map(([category, svcs]) => (
                  <optgroup key={category} label={category}>
                    {svcs.map((svc) => (
                      <option key={svc.id} value={svc.id}>
                        {svc.name} — ₡{svc.price.toLocaleString('es-CR')}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            )}
            {fieldErrors.serviceId && (
              <span className="text-danger text-xs">{fieldErrors.serviceId}</span>
            )}
          </div>

          {/* Date */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="create-date" className="text-text-secondary text-sm font-medium">
              Fecha
            </label>
            <input
              id="create-date"
              type="date"
              min={today}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-12 px-4 text-lg bg-bg-elevated border border-gold/20 rounded-xl text-text-primary focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/50 transition-colors"
            />
            {fieldErrors.date && (
              <span className="text-danger text-xs">{fieldErrors.date}</span>
            )}
          </div>

          {/* Time */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="create-time" className="text-text-secondary text-sm font-medium">
              Hora
            </label>
            <input
              id="create-time"
              type="time"
              step="1800"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="h-12 px-4 text-lg bg-bg-elevated border border-gold/20 rounded-xl text-text-primary focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/50 transition-colors"
            />
            {fieldErrors.time && (
              <span className="text-danger text-xs">{fieldErrors.time}</span>
            )}
          </div>

          {/* Client Name */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="create-name" className="text-text-secondary text-sm font-medium">
              Nombre de la clienta
            </label>
            <input
              id="create-name"
              type="text"
              autoComplete="off"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Nombre completo"
              className="h-12 px-4 text-lg bg-bg-elevated border border-gold/20 rounded-xl text-text-primary placeholder:text-text-muted focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/50 transition-colors"
            />
            {fieldErrors.clientName && (
              <span className="text-danger text-xs">{fieldErrors.clientName}</span>
            )}
          </div>

          {/* Client Phone */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="create-phone" className="text-text-secondary text-sm font-medium">
              Teléfono WhatsApp
            </label>
            <input
              id="create-phone"
              type="tel"
              value={clientPhone}
              onChange={(e) => setClientPhone(e.target.value)}
              placeholder="+506 8888-8888"
              className="h-12 px-4 text-lg bg-bg-elevated border border-gold/20 rounded-xl text-text-primary placeholder:text-text-muted focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/50 transition-colors"
            />
            {fieldErrors.clientPhone && (
              <span className="text-danger text-xs">{fieldErrors.clientPhone}</span>
            )}
          </div>

          {/* Notes */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="create-notes" className="text-text-secondary text-sm font-medium">
              Notas (opcional)
            </label>
            <textarea
              id="create-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
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
            className="w-full h-12 bg-gold hover:bg-gold-hover text-bg-base font-bold text-base rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-gold-sm cursor-pointer flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Creando...
              </>
            ) : (
              'Crear cita'
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

export default CreateBookingModal;
