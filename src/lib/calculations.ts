// ============================================================
// Cálculos de Tiempo — Lógica de Negocio pura (sin side-effects)
// ============================================================
// Todas las funciones son puras: reciben datos, devuelven resultados.
// No conocen ni la UI ni la capa de persistencia.

import {
  differenceInMinutes,
  differenceInSeconds,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  parseISO,
  isWithinInterval,
} from 'date-fns';
import { es } from 'date-fns/locale';
import type { TimeEntry, Pause, DailyStats, WeeklyStats } from '@/types';

/**
 * Calcula la duración total de pausas finalizadas en minutos.
 */
export function calculateTotalPauseMinutes(pauses: Pause[]): number {
  return pauses
    .filter((p) => p.end_time !== null)
    .reduce((sum, p) => {
      const duration = differenceInMinutes(
        parseISO(p.end_time!),
        parseISO(p.start_time)
      );
      return sum + Math.max(0, duration);
    }, 0);
}

/**
 * Calcula las horas netas trabajadas (descontando pausas) para un TimeEntry.
 * Retorna horas decimales (ej: 7.5 = 7h 30m).
 */
export function calculateWorkedHours(
  entry: TimeEntry,
  pauses: Pause[] = []
): number {
  if (!entry.clock_out) return 0;

  const totalMinutes = differenceInMinutes(
    parseISO(entry.clock_out),
    parseISO(entry.clock_in)
  );
  const pauseMinutes = calculateTotalPauseMinutes(pauses);

  return Math.max(0, (totalMinutes - pauseMinutes) / 60);
}

/**
 * Calcula los segundos transcurridos desde clock_in hasta ahora,
 * descontando pausas finalizadas (para timer en vivo).
 */
export function calculateElapsedSeconds(
  entry: TimeEntry,
  pauses: Pause[] = []
): number {
  const now = new Date();
  const clockIn = parseISO(entry.clock_in);
  const totalSeconds = differenceInSeconds(now, clockIn);
  const pauseSeconds = calculateTotalPauseMinutes(pauses) * 60;

  return Math.max(0, totalSeconds - pauseSeconds);
}

/**
 * Calcula los segundos de la pausa activa actual.
 */
export function calculateActivePauseSeconds(pause: Pause | null): number {
  if (!pause || pause.end_time) return 0;

  return Math.max(
    0,
    differenceInSeconds(new Date(), parseISO(pause.start_time))
  );
}

/**
 * Formatea una duración en segundos a "Xh Ym" o "Xh Ym Zs".
 */
export function formatDuration(totalSeconds: number, includeSeconds = false): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (includeSeconds) {
    return `${hours}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;
  }

  return `${hours}h ${String(minutes).padStart(2, '0')}m`;
}

/**
 * Formatea horas decimales a "Xh Ym".
 */
export function formatHoursToDisplay(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h}h ${String(m).padStart(2, '0')}m`;
}

/**
 * Calcula estadísticas diarias para un conjunto de entradas de un solo día.
 */
export function calculateDailyStats(
  date: string,
  entries: TimeEntry[]
): DailyStats {
  const dayEntries = entries.filter((e) => e.date === date);

  const totalWorked = dayEntries.reduce(
    (sum, e) => sum + (e.total_hours ?? 0),
    0
  );

  const totalPaused = dayEntries.reduce((sum, e) => {
    const pauseMinutes = calculateTotalPauseMinutes(e.pauses ?? []);
    return sum + pauseMinutes / 60;
  }, 0);

  return {
    date,
    totalWorked,
    totalPaused,
    entries: dayEntries.length,
  };
}

/**
 * Calcula estadísticas semanales a partir de un array de TimeEntries.
 */
export function calculateWeeklyStats(
  entries: TimeEntry[],
  referenceDate: Date = new Date()
): WeeklyStats {
  const weekStartDate = startOfWeek(referenceDate, { weekStartsOn: 1 }); // lunes
  const weekEndDate = endOfWeek(referenceDate, { weekStartsOn: 1 });

  const weekEntries = entries.filter((e) => {
    const entryDate = parseISO(e.date);
    return isWithinInterval(entryDate, { start: weekStartDate, end: weekEndDate });
  });

  const totalHours = weekEntries.reduce(
    (sum, e) => sum + (e.total_hours ?? 0),
    0
  );

  const daysWorked = new Set(weekEntries.map((e) => e.date)).size;
  const averageDaily = daysWorked > 0 ? totalHours / daysWorked : 0;

  const days = eachDayOfInterval({ start: weekStartDate, end: weekEndDate });
  const dailyBreakdown: DailyStats[] = days.map((day) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    return calculateDailyStats(dateStr, weekEntries);
  });

  return {
    totalHours,
    averageDaily,
    daysWorked,
    dailyBreakdown,
  };
}

/**
 * Obtiene el nombre del día de la semana en español (abreviado).
 */
export function getDayName(dateStr: string): string {
  return format(parseISO(dateStr), 'EEE', { locale: es });
}

/**
 * Obtiene el nombre del día de la semana en español (completo).
 */
export function getDayNameFull(dateStr: string): string {
  return format(parseISO(dateStr), 'EEEE', { locale: es });
}

/**
 * Formatea una fecha ISO a formato legible "15 jun 2026".
 */
export function formatDateShort(dateStr: string): string {
  return format(parseISO(dateStr), 'd MMM yyyy', { locale: es });
}

/**
 * Formatea hora ISO a "HH:mm".
 */
export function formatTime(isoStr: string): string {
  return format(parseISO(isoStr), 'HH:mm');
}

/**
 * Obtiene la fecha actual en formato YYYY-MM-DD.
 */
export function getTodayDate(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

/**
 * Obtiene el rango de fechas para la semana actual.
 */
export function getCurrentWeekRange(): { start: Date; end: Date } {
  const now = new Date();
  return {
    start: startOfWeek(now, { weekStartsOn: 1 }),
    end: endOfWeek(now, { weekStartsOn: 1 }),
  };
}

/**
 * Obtiene el rango de fechas para el mes actual.
 */
export function getCurrentMonthRange(): { start: Date; end: Date } {
  const now = new Date();
  return {
    start: startOfMonth(now),
    end: endOfMonth(now),
  };
}
