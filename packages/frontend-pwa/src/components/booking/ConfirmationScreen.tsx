import React from 'react';
import { useBookingStore } from '../../store/bookingStore';

function ConfirmationScreen() {
  const {
    clientName,
    confirmedBooking,
    selectedService,
    resetFlow,
  } = useBookingStore();

  if (!confirmedBooking) return null;

  const dt = new Date(confirmedBooking.scheduledAt);

  const formattedDate = dt.toLocaleDateString('es-CR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  const formattedTime = dt.toLocaleTimeString('es-CR', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  const formattedPrice =
    selectedService?.price != null && selectedService.price > 0
      ? new Intl.NumberFormat('es-CR', {
          style: 'currency',
          currency: 'CRC',
        }).format(selectedService.price)
      : null;

  const detailRows: {
    label: string;
    value: React.ReactNode;
  }[] = [
    {
      label: 'Servicio',
      value: (
        <span className="font-semibold text-text-primary">
          {confirmedBooking.serviceName}
        </span>
      ),
    },
    {
      label: 'Fecha',
      value: (
        <span className="text-text-primary">{formattedDate}</span>
      ),
    },
    {
      label: 'Hora',
      value: (
        <span className="text-text-primary">{formattedTime}</span>
      ),
    },
    {
      label: 'Precio',
      value: formattedPrice ? (
        <span className="text-gold font-bold">{formattedPrice}</span>
      ) : (
        <span className="text-text-muted">A confirmar</span>
      ),
    },
    {
      label: 'Estado',
      value: (
        <span className="bg-gold/10 text-gold border border-gold/30 rounded-full px-3 py-0.5 text-xs font-semibold">
          Pendiente de confirmar
        </span>
      ),
    },
  ];

  return (
    <div className="flex flex-col items-center px-6 py-12 space-y-6 text-center min-h-screen bg-bg-base justify-center">
      {/* Keyframe animation */}
      <style>{`
        @keyframes scaleIn {
          from { transform: scale(0.5); opacity: 0; }
          to   { transform: scale(1);   opacity: 1; }
        }
      `}</style>

      {/* 1 — Animated check icon */}
      <div
        className="w-20 h-20 rounded-full bg-success/15 border border-success/40 flex items-center justify-center mx-auto"
        style={{ animation: 'scaleIn 0.4s ease-out forwards' }}
      >
        <svg
          className="w-10 h-10 text-success"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            d="M5 13l4 4L19 7"
            stroke="currentColor"
            strokeWidth={2.5}
            fill="none"
          />
        </svg>
      </div>

      {/* 2 — Main text */}
      <div>
        <h1 className="font-serif text-3xl font-bold text-gold-light">
          ¡Turno Agendado!
        </h1>
        <p className="text-text-secondary text-base mt-1">
          Hola {clientName}, tu cita fue reservada correctamente en Rosi Salon.
        </p>
      </div>

      {/* 3 — Appointment card */}
      <div className="w-full p-5 bg-bg-card border border-gold/20 rounded-xl space-y-3 text-left">
        {detailRows.map((row, index) => (
          <div
            key={row.label}
            className={`flex justify-between${
              index < detailRows.length - 1
                ? ' border-b border-light/5 pb-2'
                : ''
            }`}
          >
            <span className="text-text-secondary">{row.label}</span>
            {row.value}
          </div>
        ))}
      </div>

      {/* 4 — WhatsApp notice */}
      <div className="w-full p-4 bg-gold/5 border border-gold/10 rounded-xl text-left">
        <p className="text-sm text-text-secondary leading-relaxed">
          📱 Te enviaremos un mensaje de WhatsApp con tu confirmación. Recuerda
          confirmar tu cita 24 horas antes para asegurar tu horario.
        </p>
      </div>

      {/* 5 — WhatsApp button */}
      <a
        href="https://wa.me/50671808793"
        target="_blank"
        rel="noopener noreferrer"
        className="w-full h-14 bg-success hover:bg-green-700 transition-colors text-text-primary font-semibold text-lg rounded-xl flex items-center justify-center gap-3 shadow-lg"
      >
        <svg
          className="w-6 h-6"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.654-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
        Escribir a Rosi Salon
      </a>

      {/* 6 — Phone call link */}
      <a
        href="tel:+50671808793"
        className="w-full h-12 mt-1 flex items-center justify-center gap-2 text-text-muted text-sm hover:text-text-secondary transition-colors cursor-pointer"
      >
        <svg
          className="w-4 h-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"
          />
        </svg>
        o llamar directamente: +506 7180-8793
      </a>

      {/* 7 — Reset link */}
      <button
        type="button"
        onClick={resetFlow}
        className="text-sm text-text-muted underline cursor-pointer mt-2"
      >
        Reservar otro turno
      </button>

      {/* 8 — Footer text */}
      <p className="text-xs text-text-muted text-center mt-4">
        ¿Necesitas cancelar? Responde al mensaje de WhatsApp que te enviamos.
      </p>
    </div>
  );
}

export default ConfirmationScreen;
