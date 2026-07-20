import { useState, useEffect, useCallback } from 'react';
import {
  fetchClientHistory,
  updateTechnicalFormula,
} from '../../services/adminApi';
import type { AdminClient, ClientHistoryItem } from '../../services/adminApi';

interface ClientHistoryDrawerProps {
  client: AdminClient;
  onClose: () => void;
}

/**
 * Bottom-sheet (mobile) / centered panel (desktop) showing a client's
 * full service history with technical color formula management.
 *
 * The formula registration flow is critical for the stylist's cognitive
 * inventory: when a returning client asks "use the same color as last time",
 * the exact tint/mix recipe must be instantly retrievable without relying
 * on memory. Saving a formula triggers an immediate local state update
 * so the UI reflects the persisted data without a full page reload.
 */
function ClientHistoryDrawer({ client, onClose }: ClientHistoryDrawerProps) {
  const [history, setHistory] = useState<ClientHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Track which booking is currently being edited for formula input
  const [editingFormulaId, setEditingFormulaId] = useState<string | null>(null);
  const [formulaText, setFormulaText] = useState('');
  const [isSavingFormula, setIsSavingFormula] = useState(false);

  const loadHistory = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchClientHistory(client.id);
      setHistory(data);
    } catch {
      setError('No se pudo cargar el historial.');
    } finally {
      setIsLoading(false);
    }
  }, [client.id]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleSaveFormula = async (bookingId: string) => {
    if (!formulaText.trim()) return;

    setIsSavingFormula(true);
    try {
      await updateTechnicalFormula(client.id, bookingId, formulaText.trim());

      // Reactive local cache invalidation: update the specific item in-place
      // so the formula appears immediately without re-fetching the full history.
      setHistory((prev) =>
        prev.map((item) =>
          item.id === bookingId
            ? { ...item, technicalFormula: formulaText.trim() }
            : item,
        ),
      );

      setEditingFormulaId(null);
      setFormulaText('');
    } catch {
      setError('No se pudo guardar la fórmula.');
    } finally {
      setIsSavingFormula(false);
    }
  };

  const formatDate = (iso: string): string =>
    new Date(iso).toLocaleDateString('es-CR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: 'America/Costa_Rica',
    });

  // Sort chronologically descending (most recent first)
  const sortedHistory = [...history].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label={`Ficha técnica de ${client.name}`}
    >
      <div className="w-full max-w-lg bg-bg-card rounded-t-2xl sm:rounded-2xl border border-gold/20 p-6 max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-serif text-xl text-gold-light">{client.name}</h2>
            <p className="text-text-muted text-sm mt-0.5">{client.phone}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-text-muted hover:text-text-primary transition-colors rounded-lg cursor-pointer"
            aria-label="Cerrar ficha"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 bg-danger/10 border border-danger/30 text-danger text-sm rounded-xl">
            {error}
          </div>
        )}

        {/* Loading */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-bg-elevated/50 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : sortedHistory.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-12">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={0.5} stroke="currentColor" className="w-16 h-16 text-gold/20">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
            </svg>
            <p className="text-text-muted text-sm mt-3">Sin historial de visitas</p>
          </div>
        ) : (
          /* History list */
          <div className="space-y-4">
            {sortedHistory.map((item) => (
              <div
                key={item.id}
                className="p-4 bg-bg-elevated/40 border border-gold/10 rounded-xl space-y-2"
              >
                {/* Visit header */}
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-text-primary font-semibold text-sm">
                      {item.serviceName}
                    </p>
                    <p className="text-text-muted text-xs mt-0.5">
                      {formatDate(item.date)}
                    </p>
                  </div>
                </div>

                {/* Notes */}
                {item.notes && (
                  <p className="text-text-secondary text-sm">
                    📝 {item.notes}
                  </p>
                )}

                {/* Technical Formula Block */}
                <div className="p-3 bg-bg-elevated rounded-lg">
                  {item.technicalFormula ? (
                    /* Saved formula display */
                    <div>
                      <p className="text-text-muted text-xs font-semibold uppercase tracking-wider mb-1">
                        Fórmula de Color
                      </p>
                      <p className="text-gold-light text-sm italic">
                        🎨 {item.technicalFormula}
                      </p>
                    </div>
                  ) : editingFormulaId === item.id ? (
                    /* Formula edit mode */
                    <div className="space-y-2">
                      <label
                        htmlFor={`formula-${item.id}`}
                        className="text-text-muted text-xs font-semibold uppercase tracking-wider"
                      >
                        Fórmula de Color
                      </label>
                      <textarea
                        id={`formula-${item.id}`}
                        rows={2}
                        value={formulaText}
                        onChange={(e) => setFormulaText(e.target.value)}
                        placeholder="Ej: Tinte 6.1 + 20 vol + matizador azul"
                        className="w-full px-3 py-2 text-sm bg-bg-card border border-gold/20 rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/50 resize-none transition-colors"
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSaveFormula(item.id)}
                          disabled={isSavingFormula || !formulaText.trim()}
                          className="h-9 px-4 bg-gold hover:bg-gold-hover text-bg-base text-xs font-bold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1.5"
                        >
                          {isSavingFormula ? (
                            <>
                              <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                              </svg>
                              Guardando...
                            </>
                          ) : (
                            'Guardar Mezcla'
                          )}
                        </button>
                        <button
                          onClick={() => {
                            setEditingFormulaId(null);
                            setFormulaText('');
                          }}
                          className="h-9 px-3 text-text-muted text-xs hover:text-text-secondary transition-colors cursor-pointer"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Add formula button */
                    <button
                      onClick={() => {
                        setEditingFormulaId(item.id);
                        setFormulaText('');
                      }}
                      className="text-gold text-xs font-semibold hover:text-gold-light transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                      </svg>
                      Agregar Fórmula de Color
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ClientHistoryDrawer;
