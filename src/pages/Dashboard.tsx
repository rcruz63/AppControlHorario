// ============================================================
// Dashboard — Página principal
// ============================================================

import { useMemo } from 'react';
import Layout from '@/components/layout/Layout';
import StatsCard from '@/components/dashboard/StatsCard';
import WeeklyChart from '@/components/dashboard/WeeklyChart';
import TimeClockControls from '@/components/time-tracking/TimeClockControls';
import { useTimeTracking } from '@/contexts/TimeTrackingContext';
import {
  formatDuration,
  formatHoursToDisplay,
  calculateTotalPauseMinutes,
} from '@/lib/calculations';
import { Timer, Coffee, CalendarCheck, TrendingUp } from 'lucide-react';

export default function Dashboard() {
  const { todayEntries, elapsedSeconds, status } = useTimeTracking();

  const todayStats = useMemo(() => {
    const completedHours = todayEntries
      .filter((e) => e.status === 'completed')
      .reduce((sum, e) => sum + (e.total_hours ?? 0), 0);

    const totalPauseMinutes = todayEntries.reduce((sum, e) => {
      return sum + calculateTotalPauseMinutes(e.pauses ?? []);
    }, 0);

    return {
      workedHours: completedHours,
      pauseMinutes: totalPauseMinutes,
      entries: todayEntries.length,
    };
  }, [todayEntries]);

  // Si está trabajando, añadir el tiempo transcurrido actual
  const displayWorkedHours =
    status !== 'idle'
      ? formatDuration(elapsedSeconds)
      : formatHoursToDisplay(todayStats.workedHours);

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Título */}
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-text-primary">
            Panel de Control
          </h1>
          <p className="text-text-secondary mt-1">
            Gestiona tu jornada laboral de forma eficiente
          </p>
        </div>

        {/* Grid de stats + controles */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {/* Card: Horas trabajadas hoy */}
          <StatsCard
            icon={Timer}
            title="Horas Hoy"
            value={displayWorkedHours}
            subtitle="horas"
            badge={
              status !== 'idle'
                ? {
                    label: status === 'working' ? 'En vivo' : 'Pausado',
                    variant: status === 'working' ? 'success' : 'warning',
                  }
                : undefined
            }
          >
            {/* Mini progress bar visual */}
            <div className="w-full h-2 bg-bg-input rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-1000"
                style={{
                  width: `${Math.min(
                    100,
                    ((todayStats.workedHours + elapsedSeconds / 3600) / 8) * 100
                  )}%`,
                }}
              />
            </div>
            <p className="text-xs text-text-tertiary mt-1">
              Objetivo: 8h diarias
            </p>
          </StatsCard>

          {/* Card: Tiempo en pausa */}
          <StatsCard
            icon={Coffee}
            title="En Pausa"
            value={formatDuration(todayStats.pauseMinutes * 60)}
            subtitle="hoy"
          />

          {/* Card: Registros del día */}
          <StatsCard
            icon={CalendarCheck}
            title="Registros Hoy"
            value={String(todayStats.entries)}
            subtitle={todayStats.entries === 1 ? 'jornada' : 'jornadas'}
            badge={
              todayStats.entries > 0
                ? { label: `${todayStats.entries}`, variant: 'info' }
                : undefined
            }
          />
        </div>

        {/* Fila: Controles + Gráfico */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          {/* Controles de fichaje */}
          <div className="xl:col-span-1">
            <TimeClockControls />
          </div>

          {/* Gráfico semanal */}
          <div className="xl:col-span-2">
            <WeeklyChart />
          </div>
        </div>

        {/* Resumen rápido de jornadas recientes */}
        {todayEntries.length > 0 && (
          <div className="bg-bg-surface rounded-2xl p-6 shadow-md">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={18} className="text-text-secondary" />
              <h3 className="text-sm font-medium text-text-secondary">
                Jornadas de hoy
              </h3>
            </div>
            <div className="space-y-3">
              {todayEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-bg-input"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        entry.status === 'completed'
                          ? 'bg-success'
                          : entry.status === 'active'
                            ? 'bg-primary status-pulse'
                            : 'bg-warning status-pulse'
                      }`}
                    />
                    <div>
                      <span className="text-sm font-medium text-text-primary">
                        {new Date(entry.clock_in).toLocaleTimeString('es-ES', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                        {entry.clock_out && (
                          <>
                            {' → '}
                            {new Date(entry.clock_out).toLocaleTimeString('es-ES', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-text-primary">
                    {entry.total_hours
                      ? formatHoursToDisplay(entry.total_hours)
                      : 'En curso'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
