import { useEffect, useState } from 'react';
import { type Service, useBookingStore } from '../../store/bookingStore';
import { fetchServices } from '../../services/bookingApi';

/* ─────────────────────── Category Icons ─────────────────────── */

function getCategoryIcon(category: string): JSX.Element {
  const common = {
    xmlns: 'http://www.w3.org/2000/svg',
    viewBox: '0 0 24 24',
    stroke: 'currentColor',
    strokeWidth: 1.5,
    fill: 'none',
    className: 'w-7 h-7 text-gold/70',
    'aria-hidden': true as const,
  };

  switch (category) {
    case 'Corte':
      return (
        <svg {...common}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M7.848 8.25l1.536.887M7.848 8.25a3 3 0 11-5.196-3 3 3 0 015.196 3zm1.536.887a2.165 2.165 0 011.083 1.839c.005.351.054.695.14 1.024M9.384 9.137l2.077 1.199M7.848 15.75l1.536-.887m-1.536.887a3 3 0 01-5.196 3 3 3 0 015.196-3zm1.536-.887a2.165 2.165 0 001.083-1.838c.005-.352.054-.695.14-1.025m-1.223 2.863l2.077-1.199m0-3.328a4.323 4.323 0 012.068-1.379l5.325-1.628a4.5 4.5 0 012.48-.044l.803.215-7.794 4.5m-2.882-1.664A4.33 4.33 0 0010.607 12m3.736 0l7.794 4.5-.802.215a4.5 4.5 0 01-2.48-.043l-5.326-1.629a4.324 4.324 0 01-2.068-1.379M14.343 12l-2.882 1.664"
          />
        </svg>
      );

    case 'Color':
      return (
        <svg {...common}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
          />
        </svg>
      );

    case 'Decoloración':
      return (
        <svg {...common}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5"
          />
        </svg>
      );

    case 'Peinado':
      return (
        <svg {...common}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.562.562 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
          />
        </svg>
      );

    case 'Tratamientos':
      return (
        <svg {...common}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
          />
        </svg>
      );

    // 'Otros' and any unknown category
    default:
      return (
        <svg {...common}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      );
  }
}

/* ─────────────────────── Price formatter ─────────────────────── */

const formatPrice = (price: number): string =>
  new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'CRC' }).format(
    price,
  );

/* ─────────────────────── Component ─────────────────────── */

function ServicePicker() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('');

  const selectedService = useBookingStore((s) => s.selectedService);
  const setService = useBookingStore((s) => s.setService);
  const setStep = useBookingStore((s) => s.setStep);

  const loadServices = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchServices();
      setServices(data);

      // Default to first category
      const categories = [...new Set(data.map((s) => s.category))];
      if (categories.length > 0) {
        setActiveCategory(categories[0]);
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Error al cargar los servicios.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadServices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Derived data ── */
  const categories = [...new Set(services.map((s) => s.category))];
  const filteredServices = services.filter(
    (s) => s.category === activeCategory,
  );
  const showTabs = categories.length > 1;

  /* ── Skeleton loading state ── */
  if (loading) {
    return (
      <section className="px-4 py-6" aria-busy="true" aria-label="Cargando servicios">
        <div className="h-7 w-3/4 bg-bg-card rounded animate-pulse mb-2" />
        <div className="h-4 w-full bg-bg-card rounded animate-pulse mb-6" />
        <div className="flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="animate-pulse bg-bg-card rounded-xl h-20"
            />
          ))}
        </div>
      </section>
    );
  }

  /* ── Error state ── */
  if (error) {
    return (
      <section className="px-4 py-6 flex flex-col items-center justify-center gap-4 text-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
          fill="none"
          className="w-12 h-12 text-red-400"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
          />
        </svg>
        <p className="text-text-secondary text-sm">{error}</p>
        <button
          type="button"
          onClick={() => void loadServices()}
          className="px-6 py-2 rounded-xl bg-gold text-bg-base font-semibold text-sm transition-all duration-200 hover:bg-gold-hover active:scale-[0.98]"
        >
          Reintentar
        </button>
      </section>
    );
  }

  /* ── Data state ── */
  return (
    <section className="flex flex-col h-full">
      <div className="px-4 pt-6 pb-2">
        {/* Title */}
        <h1 className="font-serif text-2xl text-gold-light mb-1">
          ¿Qué servicio necesitas?
        </h1>
        <p className="text-text-muted text-sm mb-4">
          Selecciona el servicio para ver los horarios disponibles.
        </p>

        {/* Category tabs */}
        {showTabs && (
          <div
            className="flex gap-2 overflow-x-auto pb-2 snap-x"
            style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
          >
            {categories.map((cat) => {
              const isActive = cat === activeCategory;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-2 rounded-full text-sm flex-shrink-0 snap-center cursor-pointer transition-colors duration-200 whitespace-nowrap ${
                    isActive
                      ? 'bg-gold text-bg-base font-semibold'
                      : 'border border-gold/20 text-text-secondary hover:border-gold/40'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        )}

        {/* Service cards */}
        <div className="flex flex-col gap-3 mt-4">
          {filteredServices.map((service) => {
            const isSelected = selectedService?.id === service.id;
            return (
              <button
                key={service.id}
                type="button"
                onClick={() => setService(service)}
                className={`p-4 bg-bg-card border rounded-xl cursor-pointer transition-all duration-200 hover:border-gold/40 active:scale-[0.98] text-left ${
                  isSelected
                    ? 'border-gold bg-gold/5'
                    : 'border-gold/15'
                }`}
                style={
                  isSelected
                    ? { boxShadow: '0 0 12px rgba(212,175,55,0.25)' }
                    : undefined
                }
              >
                <div className="flex items-center gap-4">
                  {/* LEFT — category icon */}
                  <div className="w-16 h-16 rounded-xl flex-shrink-0 overflow-hidden bg-gradient-to-br from-gold/20 to-gold/5 border border-gold/20 flex items-center justify-center">
                    {getCategoryIcon(service.category)}
                  </div>

                  {/* RIGHT — info */}
                  <div className="min-w-0 flex-1">
                    <span className="text-text-primary font-semibold text-base leading-tight block">
                      {service.name}
                    </span>

                    {service.description ? (
                      <span className="text-text-secondary text-sm line-clamp-2 mt-0.5 block">
                        {service.description}
                      </span>
                    ) : null}

                    <span className="mt-2 block">
                      {service.price > 0 ? (
                        <span className="text-gold font-bold text-base">
                          {formatPrice(service.price)}
                        </span>
                      ) : (
                        <span className="text-text-muted text-sm">
                          Consultar precio
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Sticky footer */}
      <div className="sticky bottom-0 bg-bg-base/95 backdrop-blur-sm border-t border-light/10 p-4">
        {selectedService && (
          <p className="text-sm text-text-secondary text-center mb-2">
            {selectedService.name}
          </p>
        )}
        <button
          type="button"
          disabled={!selectedService}
          onClick={() => setStep(2)}
          className="w-full h-12 rounded-xl bg-gold text-bg-base font-semibold text-lg transition-all duration-200 hover:bg-gold-hover active:scale-[0.98] disabled:bg-text-muted disabled:text-bg-card disabled:cursor-not-allowed shadow-gold-sm hover:shadow-gold-md"
        >
          Siguiente →
        </button>
      </div>
    </section>
  );
}

export default ServicePicker;
