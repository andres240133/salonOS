import type { AdminClient } from '../../services/adminApi';

interface ClientRowCardProps {
  client: AdminClient;
  onViewHistory: (client: AdminClient) => void;
}

/**
 * Ergonomic client row card optimized for smartphone touch targets.
 * Shows client name, phone, last visit date (or "Nueva clienta" badge),
 * and a prominent button to open the technical history drawer.
 */
function ClientRowCard({ client, onViewHistory }: ClientRowCardProps) {
  const lastVisitFormatted = client.lastVisit
    ? new Date(client.lastVisit).toLocaleDateString('es-CR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        timeZone: 'America/Costa_Rica',
      })
    : null;

  return (
    <div className="p-4 bg-bg-card border border-gold/15 rounded-xl flex items-center justify-between gap-3 min-h-[72px]">
      {/* Client info */}
      <div className="flex-1 min-w-0">
        <p className="text-text-primary font-semibold text-base truncate">{client.name}</p>
        <p className="text-text-secondary text-sm mt-0.5">{client.phone}</p>
        <div className="mt-1">
          {lastVisitFormatted ? (
            <span className="text-text-muted text-xs">
              Última visita: {lastVisitFormatted}
            </span>
          ) : (
            <span className="inline-block bg-gold/10 text-gold text-xs font-semibold rounded-full px-2.5 py-0.5 border border-gold/30">
              Nueva clienta
            </span>
          )}
        </div>
      </div>

      {/* Action button */}
      <button
        onClick={() => onViewHistory(client)}
        className="h-11 px-4 border border-gold/30 text-gold text-sm font-semibold rounded-xl hover:bg-gold/5 transition-all duration-200 active:scale-[0.97] cursor-pointer flex-shrink-0 min-w-[48px]"
        aria-label={`Ver ficha técnica de ${client.name}`}
      >
        Ver Ficha
      </button>
    </div>
  );
}

export default ClientRowCard;
