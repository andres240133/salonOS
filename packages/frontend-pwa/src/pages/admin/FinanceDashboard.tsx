import React, { useEffect, useState } from 'react';
import { useDashboardStore } from '../../stores/useDashboardStore';
import { createExpense, createManualIncome } from '../../services/adminApi';

/**
 * Formatea un valor numérico a Colones costarricenses (CRC, ₡)
 * utilizando el formateador estándar de localización oficial.
 *
 * @param val Monto numérico a formatear.
 * @returns Cadena de texto formateada.
 */
function formatCRC(val: number): string {
  return new Intl.NumberFormat('es-CR', {
    style: 'currency',
    currency: 'CRC',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(val);
}

/**
 * Componente principal de la consola de administración del salón para el control
 * de finanzas, KPIs operativos, retención de clientes y desglose semanal de flujos.
 * Diseñado bajo estética de lujo oscuro/dorado y optimizado con áreas táctiles accesibles.
 *
 * @returns Componente React.
 */
export function FinanceDashboard(): React.JSX.Element {
  const { data, isLoading, error, fetchFinanceMetrics } = useDashboardStore();
  const [selectedRange, setSelectedRange] = useState<'week' | 'month' | 'year'>('month');
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);

  // Formulario para registro de gastos administrativos
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<'supplies' | 'rent' | 'utilities' | 'marketing' | 'other'>('supplies');
  const [date, setDate] = useState(new Date().toLocaleDateString('en-CA', { timeZone: 'America/Costa_Rica' }));
  const [isSavingExpense, setIsSavingExpense] = useState(false);
  const [expenseFormError, setExpenseFormError] = useState<string | null>(null);
  const [expenseFormSuccess, setExpenseFormSuccess] = useState(false);

  // Modal y formulario para registro de ingresos manuales
  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
  const [incomeDescription, setIncomeDescription] = useState('');
  const [incomeAmount, setIncomeAmount] = useState('');
  const [incomeCategory, setIncomeCategory] = useState<'product_sale' | 'walk_in_service' | 'other'>('product_sale');
  const [incomeDate, setIncomeDate] = useState(new Date().toLocaleDateString('en-CA', { timeZone: 'America/Costa_Rica' }));
  const [isSavingIncome, setIsSavingIncome] = useState(false);
  const [incomeFormError, setIncomeFormError] = useState<string | null>(null);
  const [incomeFormSuccess, setIncomeFormSuccess] = useState(false);

  // Carga inicial y actualización al cambiar el selector de rango
  useEffect(() => {
    fetchFinanceMetrics(selectedRange);
  }, [selectedRange, fetchFinanceMetrics]);

  /** Handles change of period range */
  const handleRangeChange = (range: 'week' | 'month' | 'year') => {
    setSelectedRange(range);
  };

  /** Registra un nuevo gasto y actualiza el dashboard reactivamente */
  const handleRegisterExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingExpense(true);
    setExpenseFormError(null);
    setExpenseFormSuccess(false);

    try {
      await createExpense(parseFloat(amount), description, date, category);

      setExpenseFormSuccess(true);
      setDescription('');
      setAmount('');
      setCategory('supplies');
      setDate(new Date().toLocaleDateString('en-CA', { timeZone: 'America/Costa_Rica' }));

      // INVALIDACIÓN DE CACHÉ INTERACTIVA:
      // Invocamos inmediatamente fetchFinanceMetrics después del éxito de la mutación
      // para forzar la actualización en tiempo real de los datos del dashboard.
      await fetchFinanceMetrics(selectedRange);

      // Cerrar modal automáticamente después de un breve delay
      setTimeout(() => {
        setIsExpenseModalOpen(false);
        setExpenseFormSuccess(false);
      }, 1000);
    } catch (err) {
      setExpenseFormError(err instanceof Error ? err.message : 'Error al registrar el egreso');
    } finally {
      setIsSavingExpense(false);
    }
  };

  /** Registra un nuevo ingreso manual y actualiza el dashboard reactivamente */
  const handleRegisterIncome = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingIncome(true);
    setIncomeFormError(null);
    setIncomeFormSuccess(false);

    try {
      await createManualIncome(parseFloat(incomeAmount), incomeDescription, incomeDate, incomeCategory);

      setIncomeFormSuccess(true);
      setIncomeDescription('');
      setIncomeAmount('');
      setIncomeCategory('product_sale');
      setIncomeDate(new Date().toLocaleDateString('en-CA', { timeZone: 'America/Costa_Rica' }));

      // INVALIDACIÓN DE CACHÉ INTERACTIVA:
      // Invocamos inmediatamente fetchFinanceMetrics después del éxito de la mutación
      // para forzar la actualización en tiempo real de los datos del dashboard.
      await fetchFinanceMetrics(selectedRange);

      // Cerrar modal automáticamente después de un breve delay
      setTimeout(() => {
        setIsIncomeModalOpen(false);
        setIncomeFormSuccess(false);
      }, 1000);
    } catch (err) {
      setIncomeFormError(err instanceof Error ? err.message : 'Error al registrar el ingreso');
    } finally {
      setIsSavingIncome(false);
    }
  };

  // Cálculo del valor máximo para escalar la gráfica de barras horizontales de manera proporcional
  const maxWeeklyValue = data?.financials.weeklyBreakdown.reduce((acc, curr) => {
    return Math.max(acc, curr.revenue, curr.expenses);
  }, 0) ?? 0;

  return (
    <div className="min-h-screen bg-bg-base text-text-primary flex flex-col font-sans antialiased">
      {/* Header Fijo */}
      <header className="h-16 px-6 border-b border-light bg-bg-card flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-gold animate-pulse"></span>
          <h1 className="font-serif font-bold text-xl text-gold tracking-wider">Módulo Financiero</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsIncomeModalOpen(true)}
            className="h-12 px-4 bg-success hover:bg-success/80 text-bg-base font-bold text-sm rounded-xl flex items-center gap-2 transition-all duration-200 shadow-sm hover:shadow-md active:scale-95 cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
            </svg>
            Ingreso
          </button>
          <button
            onClick={() => setIsExpenseModalOpen(true)}
            className="h-12 px-4 bg-gold hover:bg-gold-hover text-bg-base font-bold text-sm rounded-xl flex items-center gap-2 transition-all duration-200 shadow-gold-sm hover:shadow-gold-md active:scale-95 cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
            </svg>
            Gasto
          </button>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="flex-1 p-6 max-w-4xl mx-auto w-full space-y-6 pb-24">
        {/* Selector de Rango y Filtros */}
        <section className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-serif text-gold-light">Balance del Salón</h2>
            <div className="flex bg-bg-card border border-light p-1 rounded-xl">
              {(['week', 'month', 'year'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => handleRangeChange(r)}
                  className={`h-12 px-5 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer ${
                    selectedRange === r
                      ? 'bg-gold text-bg-base shadow-gold-sm'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                  style={{ minWidth: '80px' }} // Asegura área de toque mínima
                >
                  {r === 'week' ? 'Semana' : r === 'month' ? 'Mes' : 'Año'}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="p-4 bg-danger/10 border border-danger/30 text-danger rounded-xl text-sm flex gap-2">
              <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </div>
          )}
        </section>

        {/* Tarjetas de Resumen Financiero */}
        {isLoading && !data ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-bg-card border border-light rounded-xl" />
            ))}
          </div>
        ) : (
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Tarjeta de Ingresos */}
            <div className="p-5 bg-bg-card border border-light rounded-xl relative overflow-hidden">
              <div className="absolute top-4 right-4 text-success">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <p className="text-text-secondary text-xs font-semibold uppercase tracking-wider">Ingresos Brutos</p>
              <p className="text-3xl font-serif font-bold text-text-primary mt-2">
                {formatCRC(data?.financials.grossRevenue ?? 0)}
              </p>
            </div>

            {/* Tarjeta de Egresos */}
            <div className="p-5 bg-bg-card border border-light rounded-xl relative overflow-hidden">
              <div className="absolute top-4 right-4 text-danger">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6" />
                </svg>
              </div>
              <p className="text-text-secondary text-xs font-semibold uppercase tracking-wider">Gastos Totales</p>
              <p className="text-3xl font-serif font-bold text-text-primary mt-2">
                {formatCRC(data?.financials.totalExpenses ?? 0)}
              </p>
            </div>

            {/* Tarjeta de Rentabilidad Neta (Resaltada obligatoriamente) */}
            <div className="p-5 bg-bg-card border-2 border-gold rounded-xl relative overflow-hidden shadow-glow">
              <div className="absolute top-4 right-4 text-gold">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-gold-light text-xs font-bold uppercase tracking-wider">Rentabilidad Neta</p>
              <p className="text-3xl font-serif font-bold text-gold-light mt-2">
                {formatCRC(data?.financials.netProfit ?? 0)}
              </p>
            </div>
          </section>
        )}

        {/* Gráfica de Barras Horizontales Nativas (Desglose Semanal) */}
        <section className="p-6 bg-bg-card border border-light rounded-xl space-y-4">
          <h3 className="text-lg font-serif text-gold-light">Desglose del Flujo Semanal</h3>
          {isLoading && !data ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-16 bg-bg-base/40 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : !data?.financials.weeklyBreakdown.length ? (
            <p className="text-text-secondary text-sm text-center py-6">No hay datos disponibles en el rango seleccionado.</p>
          ) : (
            <div className="space-y-4">
              {data.financials.weeklyBreakdown.map((item) => (
                <div
                  key={item.week_start}
                  className="bg-bg-base/40 p-4 rounded-xl border border-gold/10 space-y-3"
                >
                  <div className="flex justify-between items-center text-xs font-semibold">
                    <span className="text-text-primary">Semana del: {item.week_start}</span>
                    <span className={item.net_profit >= 0 ? 'text-success' : 'text-danger'}>
                      Balance: {formatCRC(item.net_profit)}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {/* Barra de Ingresos */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-text-secondary">
                        <span>Ingresos</span>
                        <span className="text-success font-semibold">{formatCRC(item.revenue)}</span>
                      </div>
                      <div className="w-full bg-bg-base h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-success h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${maxWeeklyValue > 0 ? (item.revenue / maxWeeklyValue) * 100 : 0}%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Barra de Gastos */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-text-secondary">
                        <span>Gastos</span>
                        <span className="text-danger font-semibold">{formatCRC(item.expenses)}</span>
                      </div>
                      <div className="w-full bg-bg-base h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-danger h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${maxWeeklyValue > 0 ? (item.expenses / maxWeeklyValue) * 100 : 0}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Panel Secundario (KPIs de Operaciones, Servicios y Retención) */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Top Servicios */}
          <div className="p-6 bg-bg-card border border-light rounded-xl space-y-4">
            <h3 className="text-lg font-serif text-gold-light">Servicios con Mayor Recaudación</h3>
            {isLoading && !data ? (
              <div className="h-48 bg-bg-base/30 rounded-xl animate-pulse" />
            ) : !data?.topServices.length ? (
              <p className="text-text-secondary text-sm">Sin registros históricos en este periodo.</p>
            ) : (
              <div className="space-y-3">
                {data.topServices.map((service, index) => (
                  <div
                    key={service.serviceId || index}
                    className="flex justify-between items-center p-3 bg-bg-base/20 rounded-xl border border-light/5"
                  >
                    <div>
                      <p className="text-sm font-semibold text-text-primary">{service.serviceName}</p>
                      <p className="text-xs text-text-secondary">{service.bookingsCount} citas agendadas</p>
                    </div>
                    <span className="text-sm font-bold text-gold-light">
                      {formatCRC(service.totalRevenue)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Retención de Clientes & Métricas Operativas */}
          <div className="space-y-6">
            {/* Clientes Nuevos vs Recurrentes */}
            <div className="p-6 bg-bg-card border border-light rounded-xl space-y-4">
              <h3 className="text-lg font-serif text-gold-light">Retención de Clientela</h3>
              {isLoading && !data ? (
                <div className="h-28 bg-bg-base/30 rounded-xl animate-pulse" />
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="p-3 bg-bg-base/30 rounded-xl">
                      <p className="text-text-secondary text-xs uppercase tracking-wider font-semibold">Nuevas (1 cita)</p>
                      <p className="text-2xl font-bold text-text-primary mt-1">
                        {data?.clientRetention.newClients ?? 0}
                      </p>
                    </div>
                    <div className="p-3 bg-bg-base/30 rounded-xl">
                      <p className="text-gold-light text-xs uppercase tracking-wider font-semibold">Recurrentes (≥2)</p>
                      <p className="text-2xl font-bold text-gold mt-1">
                        {data?.clientRetention.recurringClients ?? 0}
                      </p>
                    </div>
                  </div>

                  {data?.clientRetention.totalClients ? (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-text-secondary">
                        <span>Tasa de Recurrencia</span>
                        <span className="font-semibold text-gold">
                          {(
                            ((data.clientRetention.recurringClients) /
                              data.clientRetention.totalClients) *
                            100
                          ).toFixed(1)}
                          %
                        </span>
                      </div>
                      <div className="w-full bg-bg-base h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-gold h-full rounded-full transition-all"
                          style={{
                            width: `${
                              (data.clientRetention.recurringClients /
                                data.clientRetention.totalClients) *
                              100
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
            </div>

            {/* Tasa de Cancelación / Horas Pico */}
            <div className="p-6 bg-bg-card border border-light rounded-xl space-y-4">
              <h3 className="text-lg font-serif text-gold-light">Métricas de Turnos</h3>
              {isLoading && !data ? (
                <div className="h-32 bg-bg-base/30 rounded-xl animate-pulse" />
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-text-secondary">Tasa de Cancelación / No-Show:</span>
                    <span className="text-base font-bold text-danger">
                      {((data?.operations.noShowRate ?? 0) * 100).toFixed(1)}%
                    </span>
                  </div>

                  {data?.operations.peakHours && data.operations.peakHours.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs text-text-secondary uppercase tracking-wider font-semibold">Horas Pico de Reserva</p>
                      <div className="flex gap-2 flex-wrap">
                        {data.operations.peakHours.slice(0, 3).map((item, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-gold/10 text-gold-light border border-gold/30"
                          >
                            {item.hour}:00 hrs ({item.bookingsCount} reservas)
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* Modal de Registro de Gasto */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-bg-elevated border border-gold/30 rounded-t-2xl sm:rounded-2xl p-6 shadow-gold-md animate-in fade-in slide-in-from-bottom duration-300">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-text-primary text-xl font-semibold">Registrar Gasto Administrativo</h3>
              <button
                onClick={() => setIsExpenseModalOpen(false)}
                className="text-text-secondary hover:text-gold transition-colors p-2"
                aria-label="Cerrar modal"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleRegisterExpense} className="space-y-4">
              {expenseFormError && (
                <div className="p-3 bg-danger/10 border border-danger/30 text-danger rounded-xl text-xs">
                  {expenseFormError}
                </div>
              )}

              {expenseFormSuccess && (
                <div className="p-3 bg-success/10 border border-success/30 text-success rounded-xl text-xs">
                  Gasto guardado. Actualizando balance...
                </div>
              )}

              <div className="flex flex-col gap-2">
                <label className="text-text-secondary text-sm font-medium">Descripción</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Insumos de tintes o alquiler"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full h-12 px-4 bg-bg-card border border-gold/20 text-text-primary text-base rounded-xl placeholder:text-text-muted focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-text-secondary text-sm font-medium">Monto (CRC - Colones)</label>
                <input
                  type="number"
                  required
                  min="1"
                  max="99999999"
                  placeholder="Ej: 15000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full h-12 px-4 bg-bg-card border border-gold/20 text-text-primary text-base rounded-xl placeholder:text-text-muted focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-text-secondary text-sm font-medium">Categoría</label>
                <div className="relative">
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full h-12 pl-4 pr-10 bg-bg-card border border-gold/20 text-text-primary text-base rounded-xl appearance-none focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold"
                  >
                    <option value="supplies">Insumos (supplies)</option>
                    <option value="rent">Alquiler (rent)</option>
                    <option value="utilities">Servicios Básicos (utilities)</option>
                    <option value="marketing">Marketing (marketing)</option>
                    <option value="other">Otros (other)</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gold">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-text-secondary text-sm font-medium">Fecha del Gasto</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full h-12 px-4 bg-bg-card border border-gold/20 text-text-primary text-base rounded-xl focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsExpenseModalOpen(false)}
                  className="w-1/3 h-12 border border-gold/40 text-gold font-semibold rounded-xl hover:bg-gold/5 transition-all duration-200 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingExpense || expenseFormSuccess}
                  className="w-2/3 h-12 bg-gold hover:bg-gold-hover text-bg-base font-bold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-gold-sm cursor-pointer"
                >
                  {isSavingExpense ? 'Guardando...' : 'Registrar Gasto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Registro de Ingreso Manual */}
      {isIncomeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-bg-elevated border border-success/30 rounded-t-2xl sm:rounded-2xl p-6 shadow-gold-md animate-in fade-in slide-in-from-bottom duration-300">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-text-primary text-xl font-semibold">Registrar Ingreso Manual</h3>
              <button
                onClick={() => setIsIncomeModalOpen(false)}
                className="text-text-secondary hover:text-success transition-colors p-2"
                aria-label="Cerrar modal"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleRegisterIncome} className="space-y-4">
              {incomeFormError && (
                <div className="p-3 bg-danger/10 border border-danger/30 text-danger rounded-xl text-xs">
                  {incomeFormError}
                </div>
              )}

              {incomeFormSuccess && (
                <div className="p-3 bg-success/10 border border-success/30 text-success rounded-xl text-xs">
                  Ingreso guardado. Actualizando balance...
                </div>
              )}

              <div className="flex flex-col gap-2">
                <label className="text-text-secondary text-sm font-medium">Descripción</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Venta de shampoo o servicio walk-in"
                  value={incomeDescription}
                  onChange={(e) => setIncomeDescription(e.target.value)}
                  className="w-full h-12 px-4 bg-bg-card border border-success/20 text-text-primary text-base rounded-xl placeholder:text-text-muted focus:outline-none focus:border-success focus:ring-1 focus:ring-success"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-text-secondary text-sm font-medium">Monto (CRC - Colones)</label>
                <input
                  type="number"
                  required
                  min="1"
                  max="99999999"
                  placeholder="Ej: 8000"
                  value={incomeAmount}
                  onChange={(e) => setIncomeAmount(e.target.value)}
                  className="w-full h-12 px-4 bg-bg-card border border-success/20 text-text-primary text-base rounded-xl placeholder:text-text-muted focus:outline-none focus:border-success focus:ring-1 focus:ring-success"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-text-secondary text-sm font-medium">Categoría</label>
                <div className="relative">
                  <select
                    value={incomeCategory}
                    onChange={(e) => setIncomeCategory(e.target.value as 'product_sale' | 'walk_in_service' | 'other')}
                    className="w-full h-12 pl-4 pr-10 bg-bg-card border border-success/20 text-text-primary text-base rounded-xl appearance-none focus:outline-none focus:border-success focus:ring-1 focus:ring-success"
                  >
                    <option value="product_sale">Venta de producto (product_sale)</option>
                    <option value="walk_in_service">Servicio sin reserva (walk_in_service)</option>
                    <option value="other">Otros (other)</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-success">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-text-secondary text-sm font-medium">Fecha del Ingreso</label>
                <input
                  type="date"
                  required
                  value={incomeDate}
                  onChange={(e) => setIncomeDate(e.target.value)}
                  className="w-full h-12 px-4 bg-bg-card border border-success/20 text-text-primary text-base rounded-xl focus:outline-none focus:border-success focus:ring-1 focus:ring-success"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsIncomeModalOpen(false)}
                  className="w-1/3 h-12 border border-success/40 text-success font-semibold rounded-xl hover:bg-success/5 transition-all duration-200 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingIncome || incomeFormSuccess}
                  className="w-2/3 h-12 bg-success hover:bg-success/80 text-bg-base font-bold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm cursor-pointer"
                >
                  {isSavingIncome ? 'Guardando...' : 'Registrar Ingreso'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
