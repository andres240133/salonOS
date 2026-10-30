import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  fetchAdminAvailability,
  saveWeekAvailability,
  fetchAvailabilityTemplates,
  updateAvailabilityTemplates,
  SessionExpiredError,
  type AvailabilityDay,
  type AvailabilityTemplate,
  type AvailabilityConflict,
} from '../../services/adminApi';

const TIMEZONE = 'America/Costa_Rica';

interface DayFormRow {
  dayOfWeek: number;
  label: string;
  shortLabel: string;
  date: string;
  isActive: boolean;
  startTime: string;
  lastStartTime: string;
  endTime: string;
  isPast: boolean;
}

const WEEK_DAYS_META: ReadonlyArray<{ dayOfWeek: number; label: string; shortLabel: string }> = [
  { dayOfWeek: 1, label: 'Lunes', shortLabel: 'Lun' },
  { dayOfWeek: 2, label: 'Martes', shortLabel: 'Mar' },
  { dayOfWeek: 3, label: 'Miércoles', shortLabel: 'Mié' },
  { dayOfWeek: 4, label: 'Jueves', shortLabel: 'Jue' },
  { dayOfWeek: 5, label: 'Viernes', shortLabel: 'Vie' },
  { dayOfWeek: 6, label: 'Sábado', shortLabel: 'Sáb' },
];

const FULL_DAY_NAMES: Readonly<Record<number, string>> = {
  0: 'Domingo',
  1: 'Lunes',
  2: 'Martes',
  3: 'Miércoles',
  4: 'Jueves',
  5: 'Viernes',
  6: 'Sábado',
};

const SHORT_MONTH_NAMES = [
  'ene',
  'feb',
  'mar',
  'abr',
  'may',
  'jun',
  'jul',
  'ago',
  'sep',
  'oct',
  'nov',
  'dic',
];

/** Obtiene la fecha de hoy (YYYY-MM-DD) en America/Costa_Rica. */
function getTodayCR(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: TIMEZONE });
}

/** Suma días a una fecha YYYY-MM-DD usando aritmética UTC pura al mediodía. */
function addDaysUTC(dateStr: string, daysToAdd: number): string {
  const d = new Date(`${dateStr}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + daysToAdd);
  return d.toISOString().slice(0, 10);
}

/** Obtiene el día de la semana (0=Dom..6=Sáb) en UTC puro. */
function getDayOfWeekUTC(dateStr: string): number {
  return new Date(`${dateStr}T12:00:00Z`).getUTCDay();
}

/** Calcula el lunes de la semana actual en America/Costa_Rica. */
function getCurrentMondayCR(todayCR: string): string {
  const dow = getDayOfWeekUTC(todayCR);
  const diffToMonday = dow === 0 ? -6 : 1 - dow;
  return addDaysUTC(todayCR, diffToMonday);
}

/** Formatea YYYY-MM-DD a formato legible corto, ej: "Lunes 2 nov". */
function formatDisplayDate(dateStr: string): string {
  const [, monthStr, dayStr] = dateStr.split('-');
  const dow = getDayOfWeekUTC(dateStr);
  const dayName = FULL_DAY_NAMES[dow] ?? '';
  const monthLabel = SHORT_MONTH_NAMES[parseInt(monthStr, 10) - 1] ?? '';
  return `${dayName} ${parseInt(dayStr, 10)} ${monthLabel}`;
}

/** Convierte una hora 'HH:MM' (24 h) a formato 12 h, ej: '06:00' → '6:00 a.m.', '18:00' → '6:00 p.m.' */
function formatTime12h(time24: string): string {
  const [hStr, mStr] = time24.split(':');
  const h = parseInt(hStr, 10);
  const period = h >= 12 ? 'p.m.' : 'a.m.';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${mStr} ${period}`;
}

/** Construye las 6 filas (Lun–Sáb) combinando slots existentes con el fallback de templates y defaults. */
function buildWeekRows(
  weekStart: string,
  todayCR: string,
  slotsByDate: Map<string, AvailabilityDay>,
  templatesByDow: Map<number, AvailabilityTemplate>,
): DayFormRow[] {
  return WEEK_DAYS_META.map((meta) => {
    const date = addDaysUTC(weekStart, meta.dayOfWeek - 1);
    const existingSlot = slotsByDate.get(date);
    const template = templatesByDow.get(meta.dayOfWeek);

    const isActive = existingSlot
      ? existingSlot.isActive
      : (template?.isActive ?? false);
    const startTime = existingSlot?.startTime ?? template?.startTime ?? '06:00';
    const lastStartTime = existingSlot?.lastStartTime ?? template?.lastStartTime ?? '18:00';
    const endTime = existingSlot?.endTime ?? template?.endTime ?? '21:00';

    return {
      dayOfWeek: meta.dayOfWeek,
      label: meta.label,
      shortLabel: meta.shortLabel,
      date,
      isActive,
      startTime,
      lastStartTime,
      endTime,
      isPast: date < todayCR,
    };
  });
}

/**
 * Página de configuración de disponibilidad semanal ("Mi semana") y vista de los próximos 14 días.
 */
function ConfigPage() {
  const navigate = useNavigate();

  const todayCR = useMemo(() => getTodayCR(), []);
  const thisWeekMonday = useMemo(() => getCurrentMondayCR(todayCR), [todayCR]);
  const nextWeekMonday = useMemo(() => addDaysUTC(thisWeekMonday, 7), [thisWeekMonday]);

  const [selectedWeek, setSelectedWeek] = useState<'this' | 'next'>('next');
  const activeWeekStart = selectedWeek === 'this' ? thisWeekMonday : nextWeekMonday;

  const [templates, setTemplates] = useState<AvailabilityTemplate[]>([]);
  const [availabilityDays, setAvailabilityDays] = useState<AvailabilityDay[]>([]);
  const [weekRows, setWeekRows] = useState<DayFormRow[]>([]);
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [conflicts, setConflicts] = useState<AvailabilityConflict[]>([]);

  // Rango total a consultar: desde el lunes de esta semana hasta cubrir tanto
  // la próxima semana completa como los próximos 14 días desde hoy.
  const queryRange = useMemo(() => {
    const endFourteenDays = addDaysUTC(todayCR, 13);
    const endNextWeek = addDaysUTC(nextWeekMonday, 6);
    const maxTo = endFourteenDays > endNextWeek ? endFourteenDays : endNextWeek;
    return { from: thisWeekMonday, to: maxTo };
  }, [todayCR, thisWeekMonday, nextWeekMonday]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [tpls, days] = await Promise.all([
        fetchAvailabilityTemplates(),
        fetchAdminAvailability(queryRange.from, queryRange.to),
      ]);
      setTemplates(tpls);
      setAvailabilityDays(days);
    } catch (err) {
      if (err instanceof SessionExpiredError) {
        navigate('/admin/login', { replace: true });
        return;
      }
      setError('No se pudo cargar la configuración de disponibilidad.');
    } finally {
      setIsLoading(false);
    }
  }, [navigate, queryRange.from, queryRange.to]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const slotsByDate = useMemo(
    () => new Map(availabilityDays.map((d) => [d.date, d])),
    [availabilityDays],
  );

  const templatesByDow = useMemo(
    () => new Map(templates.map((t) => [t.dayOfWeek, t])),
    [templates],
  );

  // Recalcular las 6 filas del editor cuando cambia la semana seleccionada o los datos cargados
  useEffect(() => {
    setWeekRows(buildWeekRows(activeWeekStart, todayCR, slotsByDate, templatesByDow));
  }, [activeWeekStart, todayCR, slotsByDate, templatesByDow]);

  const handleSelectWeek = (week: 'this' | 'next') => {
    setSelectedWeek(week);
    setError(null);
    setSuccessMsg(null);
    setConflicts([]);
  };

  const handleToggleDay = (dayOfWeek: number) => {
    setWeekRows((prev) =>
      prev.map((row) =>
        row.dayOfWeek === dayOfWeek && !row.isPast
          ? { ...row, isActive: !row.isActive }
          : row,
      ),
    );
    setSuccessMsg(null);
  };

  const handleTimeChange = (
    dayOfWeek: number,
    field: 'startTime' | 'lastStartTime' | 'endTime',
    value: string,
  ) => {
    setWeekRows((prev) =>
      prev.map((row) =>
        row.dayOfWeek === dayOfWeek && !row.isPast
          ? { ...row, [field]: value }
          : row,
      ),
    );
    setSuccessMsg(null);
  };

  const handleSaveWeek = async () => {
    setError(null);
    setSuccessMsg(null);
    setConflicts([]);

    // Validación en pantalla antes de enviar: primera <= última < cierre
    for (const row of weekRows) {
      if (!row.isActive && !saveAsTemplate) continue;
      if (row.isPast && !saveAsTemplate) continue;

      if (row.startTime > row.lastStartTime) {
        setError(
          `En ${row.label}, la "Primera cita" (${row.startTime}) no puede ser posterior a la "Última cita" (${row.lastStartTime}).`,
        );
        return;
      }
      if (row.lastStartTime >= row.endTime) {
        setError(
          `En ${row.label}, el "Cierre" (${row.endTime}) debe ser posterior a la "Última cita" (${row.lastStartTime}).`,
        );
        return;
      }
    }

    setIsSaving(true);
    try {
      const activeDaysPayload = weekRows
        .filter((row) => row.isActive)
        .map((row) => ({
          dayOfWeek: row.dayOfWeek,
          startTime: row.startTime,
          lastStartTime: row.lastStartTime,
          endTime: row.endTime,
        }));

      const result = await saveWeekAvailability({
        weekStart: activeWeekStart,
        days: activeDaysPayload,
      });

      if (saveAsTemplate) {
        const updatedTemplates = await updateAvailabilityTemplates(
          weekRows.map((row) => ({
            dayOfWeek: row.dayOfWeek,
            startTime: row.startTime,
            lastStartTime: row.lastStartTime,
            endTime: row.endTime,
            isActive: row.isActive,
          })),
        );
        setTemplates(updatedTemplates);
      }

      const refreshedDays = await fetchAdminAvailability(queryRange.from, queryRange.to);
      setAvailabilityDays(refreshedDays);
      setConflicts(result.conflicts);

      if (result.conflicts.length === 0) {
        setSuccessMsg(
          saveAsTemplate
            ? 'Semana y plantilla típica guardadas correctamente.'
            : 'Semana guardada correctamente.',
        );
      } else {
        setSuccessMsg('Semana guardada con avisos en días con citas activas.');
      }
    } catch (err) {
      if (err instanceof SessionExpiredError) {
        navigate('/admin/login', { replace: true });
        return;
      }
      setError(err instanceof Error ? err.message : 'Error al guardar la semana.');
    } finally {
      setIsSaving(false);
    }
  };

  // Lista de los próximos 14 días desde hoy (America/Costa_Rica)
  const upcoming14Days = useMemo(() => {
    const items: Array<{
      date: string;
      displayDate: string;
      isSunday: boolean;
      isOpen: boolean;
      startTime?: string;
      lastStartTime?: string;
      endTime?: string;
    }> = [];

    for (let i = 0; i < 14; i++) {
      const dateStr = addDaysUTC(todayCR, i);
      const dow = getDayOfWeekUTC(dateStr);
      const isSunday = dow === 0;
      const slot = slotsByDate.get(dateStr);
      const isOpen = !isSunday && Boolean(slot?.isActive);

      items.push({
        date: dateStr,
        displayDate: formatDisplayDate(dateStr),
        isSunday,
        isOpen,
        startTime: slot?.startTime,
        lastStartTime: slot?.lastStartTime,
        endTime: slot?.endTime,
      });
    }

    return items;
  }, [todayCR, slotsByDate]);

  const weekEndDisplay = addDaysUTC(activeWeekStart, 5);

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Sección 1: Mi semana */}
      <section className="p-5 bg-bg-card border border-gold/15 rounded-xl shadow-gold-sm space-y-5">
        <div className="space-y-1">
          <h2 className="text-2xl font-serif font-semibold text-gold">Mi semana</h2>
          <p className="text-text-secondary text-sm">
            Definí los días y horarios de atención de lunes a sábado ({formatDisplayDate(activeWeekStart)} al {formatDisplayDate(weekEndDisplay)}).
          </p>
        </div>

        {/* Selector Esta semana / Próxima semana */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => handleSelectWeek('this')}
            className={`min-h-[48px] h-12 px-4 rounded-xl font-semibold text-lg transition-all duration-200 cursor-pointer ${
              selectedWeek === 'this'
                ? 'bg-gold text-bg-base shadow-gold-sm'
                : 'bg-bg-base border border-gold/20 text-text-secondary hover:border-gold/40 hover:text-text-primary'
            }`}
          >
            Esta semana
          </button>
          <button
            type="button"
            onClick={() => handleSelectWeek('next')}
            className={`min-h-[48px] h-12 px-4 rounded-xl font-semibold text-lg transition-all duration-200 cursor-pointer ${
              selectedWeek === 'next'
                ? 'bg-gold text-bg-base shadow-gold-sm'
                : 'bg-bg-base border border-gold/20 text-text-secondary hover:border-gold/40 hover:text-text-primary'
            }`}
          >
            Próxima semana
          </button>
        </div>

        {/* Mensajes de error, éxito y conflictos */}
        {error && (
          <div className="p-4 bg-danger/10 border border-danger/30 text-danger text-sm rounded-xl">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="p-4 bg-success/10 border border-success/30 text-success text-sm rounded-xl">
            {successMsg}
          </div>
        )}

        {conflicts.length > 0 && (
          <div className="p-4 bg-gold/10 border border-gold/40 rounded-xl space-y-2">
            <p className="text-gold-light font-semibold text-sm">
              Avisos de conflictos con citas agendadas:
            </p>
            <ul className="space-y-1.5 text-sm text-text-primary">
              {conflicts.map((c) => (
                <li key={`${c.date}-${c.reason}`} className="flex items-start gap-2">
                  <span className="text-gold font-bold">•</span>
                  <span>
                    <strong className="text-gold-light">{formatDisplayDate(c.date)}</strong>:{' '}
                    {c.reason === 'has_bookings'
                      ? `No se desactivó porque tiene ${c.bookingsCount} cita(s) pendiente(s) o confirmada(s).`
                      : `No se modificó el horario porque ${c.bookingsCount} cita(s) quedaría(n) fuera del nuevo rango (primera cita, última cita o cierre).`}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 6 Filas: Lunes a Sábado */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-24 bg-bg-base border border-gold/10 rounded-xl animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {weekRows.map((row) => {
              const dayNumber = parseInt(row.date.slice(8, 10), 10);
              return (
                <div
                  key={row.dayOfWeek}
                  className={`p-4 rounded-xl border transition-colors space-y-3 ${
                    row.isPast
                      ? 'bg-bg-base/50 border-light/10 opacity-60'
                      : row.isActive
                        ? 'bg-bg-base border-gold/30'
                        : 'bg-bg-base/80 border-light/10'
                  }`}
                >
                  {/* Toggle del día (min 48px touch target) */}
                  <button
                    type="button"
                    disabled={row.isPast}
                    onClick={() => handleToggleDay(row.dayOfWeek)}
                    aria-pressed={row.isActive}
                    className="w-full min-h-[48px] flex items-center justify-between gap-3 text-left cursor-pointer disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-12 h-7 flex items-center rounded-full p-1 transition-colors duration-200 ${
                          row.isActive ? 'bg-gold justify-end' : 'bg-bg-elevated justify-start'
                        }`}
                      >
                        <span
                          className={`w-5 h-5 rounded-full transition-transform ${
                            row.isActive ? 'bg-bg-base' : 'bg-text-muted'
                          }`}
                        />
                      </span>
                      <div>
                        <span className="text-text-primary text-lg font-medium">
                          {row.label}{' '}
                          <span className="text-text-secondary text-sm font-normal">
                            ({dayNumber})
                          </span>
                        </span>
                        <span className="block text-xs text-text-muted">
                          {row.isPast
                            ? 'Día pasado (sin cambios)'
                            : row.isActive
                              ? 'Abierto'
                              : 'Cerrado'}
                        </span>
                      </div>
                    </div>
                  </button>

                  {/* 3 Inputs de hora: Primera cita, Última cita, Cierre */}
                  {row.isActive && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                      <div className="flex flex-col gap-1">
                        <label
                          htmlFor={`start-${row.dayOfWeek}`}
                          className="text-text-secondary text-xs font-medium"
                        >
                          Primera cita
                        </label>
                        <input
                          id={`start-${row.dayOfWeek}`}
                          type="time"
                          value={row.startTime}
                          disabled={row.isPast}
                          onChange={(e) =>
                            handleTimeChange(row.dayOfWeek, 'startTime', e.target.value)
                          }
                          className="w-full h-12 px-3 bg-bg-card border border-gold/20 text-text-primary text-lg rounded-xl focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold disabled:opacity-50"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label
                          htmlFor={`last-start-${row.dayOfWeek}`}
                          className="text-text-secondary text-xs font-medium"
                        >
                          Última cita
                        </label>
                        <input
                          id={`last-start-${row.dayOfWeek}`}
                          type="time"
                          value={row.lastStartTime}
                          disabled={row.isPast}
                          onChange={(e) =>
                            handleTimeChange(row.dayOfWeek, 'lastStartTime', e.target.value)
                          }
                          className="w-full h-12 px-3 bg-bg-card border border-gold/20 text-text-primary text-lg rounded-xl focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold disabled:opacity-50"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label
                          htmlFor={`end-${row.dayOfWeek}`}
                          className="text-text-secondary text-xs font-medium"
                        >
                          Cierre
                        </label>
                        <input
                          id={`end-${row.dayOfWeek}`}
                          type="time"
                          value={row.endTime}
                          disabled={row.isPast}
                          onChange={(e) =>
                            handleTimeChange(row.dayOfWeek, 'endTime', e.target.value)
                          }
                          className="w-full h-12 px-3 bg-bg-card border border-gold/20 text-text-primary text-lg rounded-xl focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold disabled:opacity-50"
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Checkbox Guardar como semana típica */}
        <label className="min-h-[48px] flex items-center gap-3 px-3 py-2 rounded-xl bg-bg-base border border-gold/15 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={saveAsTemplate}
            onChange={(e) => setSaveAsTemplate(e.target.checked)}
            className="w-5 h-5 accent-gold rounded cursor-pointer"
          />
          <span className="text-text-primary text-base">
            Guardar como semana típica
          </span>
        </label>

        {/* Botón Guardar semana */}
        <button
          type="button"
          disabled={isLoading || isSaving}
          onClick={handleSaveWeek}
          className="w-full min-h-[48px] h-12 px-6 bg-gold text-bg-base font-semibold text-lg rounded-xl transition-all duration-200 hover:bg-gold-hover active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-gold-light disabled:bg-text-muted disabled:text-bg-card disabled:cursor-not-allowed shadow-gold-sm hover:shadow-gold-md cursor-pointer"
        >
          {isSaving ? 'Guardando...' : 'Guardar semana'}
        </button>
      </section>

      {/* Sección 2: Próximos 14 días */}
      <section className="p-5 bg-bg-card border border-gold/15 rounded-xl shadow-gold-sm space-y-4">
        <div className="space-y-1">
          <h2 className="text-xl font-serif font-semibold text-gold">Próximos 14 días</h2>
          <p className="text-text-secondary text-sm">
            Estado actual del calendario público a partir de hoy.
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-12 bg-bg-base border border-gold/10 rounded-xl animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="divide-y divide-light/10">
            {upcoming14Days.map((day) => (
              <div
                key={day.date}
                className="min-h-[48px] py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5"
              >
                <div className="flex items-center gap-2">
                  <span className="text-text-primary text-base font-medium">
                    {day.displayDate}
                  </span>
                  {day.date === todayCR && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gold/10 text-gold border border-gold/30">
                      Hoy
                    </span>
                  )}
                </div>

                {day.isOpen && day.startTime && day.lastStartTime && day.endTime ? (
                  <span className="inline-flex items-center self-start sm:self-auto px-3 py-1 rounded-full text-xs font-semibold bg-success/10 text-success border border-success/30">
                    {`Abierto · citas ${formatTime12h(day.startTime)}–${formatTime12h(day.lastStartTime)} · cierre ${formatTime12h(day.endTime)}`}
                  </span>
                ) : (
                  <span className="inline-flex items-center self-start sm:self-auto px-3 py-1 rounded-full text-xs font-semibold bg-bg-elevated text-text-muted border border-light/10">
                    Cerrado
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default ConfigPage;
