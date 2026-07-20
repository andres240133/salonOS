import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchAdminClients, SessionExpiredError } from '../../services/adminApi';
import type { AdminClient } from '../../services/adminApi';
import ClientRowCard from '../../components/admin/ClientRowCard';
import ClientHistoryDrawer from '../../components/admin/ClientHistoryDrawer';

/**
 * Strips diacritics (accents/tildes) and lowercases a string for search matching.
 *
 * Uses Unicode NFD decomposition to separate base characters from combining marks
 * (e.g. "é" → "e" + combining acute), then removes the marks via regex.
 * This prevents search misses when the mobile keyboard auto-corrects or the user
 * types "María" vs "maria" vs "Maria" — all match identically.
 */
function normalizeForSearch(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

/**
 * Client management page with real-time search filtering.
 * Renders the full client roster and a prominent search bar that filters
 * by name or phone, ignoring case and diacritics.
 */
function ClientasPage() {
  const navigate = useNavigate();
  const [clients, setClients] = useState<AdminClient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClient, setSelectedClient] = useState<AdminClient | null>(null);

  const loadClients = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchAdminClients();
      setClients(data);
    } catch (err) {
      if (err instanceof SessionExpiredError) {
        navigate('/admin/login', { replace: true });
        return;
      }
      setError('No se pudieron cargar las clientas.');
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  // Real-time filtering: normalize both the query and each client's name/phone
  // to strip diacritics and ignore case, ensuring resilient mobile search UX.
  const filteredClients = useMemo(() => {
    if (!searchQuery.trim()) return clients;

    const normalizedQuery = normalizeForSearch(searchQuery);
    return clients.filter((c) => {
      const normalizedName = normalizeForSearch(c.name);
      const normalizedPhone = normalizeForSearch(c.phone);
      return normalizedName.includes(normalizedQuery) || normalizedPhone.includes(normalizedQuery);
    });
  }, [clients, searchQuery]);

  const totalCount = clients.length;
  const matchCount = filteredClients.length;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Search Bar */}
      <div className="mb-5">
        <div className="relative">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted pointer-events-none"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nombre o teléfono..."
            className="w-full h-14 pl-12 pr-4 text-xl bg-bg-card border border-gold/20 rounded-xl text-text-primary placeholder:text-text-muted focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/50 transition-colors"
            aria-label="Buscar clientas"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center text-text-muted hover:text-text-primary transition-colors cursor-pointer"
              aria-label="Limpiar búsqueda"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Result count */}
        {!isLoading && (
          <p className="text-text-muted text-xs mt-2">
            {searchQuery
              ? `${matchCount} de ${totalCount} clientas`
              : `${totalCount} clientas registradas`}
          </p>
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
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-20 bg-bg-card border border-gold/10 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filteredClients.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-16">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={0.5} stroke="currentColor" className="w-20 h-20 text-gold/20">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
          </svg>
          <p className="text-text-muted text-base mt-4">
            {searchQuery
              ? 'No se encontraron clientas con ese nombre.'
              : 'Sin clientas registradas'}
          </p>
        </div>
      ) : (
        /* Client list */
        <div className="space-y-3">
          {filteredClients.map((client) => (
            <ClientRowCard
              key={client.id}
              client={client}
              onViewHistory={setSelectedClient}
            />
          ))}
        </div>
      )}

      {/* History Drawer */}
      {selectedClient && (
        <ClientHistoryDrawer
          client={selectedClient}
          onClose={() => setSelectedClient(null)}
        />
      )}
    </div>
  );
}

export default ClientasPage;
