// ============================================================
// Reports — Página de reportes y exportación
// ============================================================

import { useState, useEffect, useCallback, useMemo } from 'react';
import { format, subDays, startOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
} from 'recharts';
import Layout from '@/components/layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { supabase } from '@/lib/supabase';
import {
  formatHoursToDisplay,
  formatTime,
  calculateTotalPauseMinutes,
} from '@/lib/calculations';
import type { TimeEntry } from '@/types';
import {
  BarChart3,
  Download,
  Calendar,
  Loader2,
  TrendingUp,
  Clock,
  Coffee,
} from 'lucide-react';

export default function Reports() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState(
    format(startOfMonth(new Date()), 'yyyy-MM-dd')
  );
  const [dateTo, setDateTo] = useState(format(new Date(), 'yyyy-MM-dd'));

  const loadEntries = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const { data, error } = await supabase
      .from('time_entries')
      .select('*, pauses(*)')
      .eq('user_id', user.id)
      .gte('date', dateFrom)
      .lte('date', dateTo)
      .eq('status', 'completed')
      .order('date', { ascending: true });

    if (error) {
      showToast('error', 'Error al cargar reportes');
    } else {
      setEntries((data as TimeEntry[]) ?? []);
    }

    setLoading(false);
  }, [user, dateFrom, dateTo, showToast]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  // Datos agrupados por día
  const dailyData = useMemo(() => {
    const grouped: Record<string, { hours: number; pauses: number }> = {};

    entries.forEach((entry) => {
      if (!grouped[entry.date]) {
        grouped[entry.date] = { hours: 0, pauses: 0 };
      }
      grouped[entry.date].hours += entry.total_hours ?? 0;
      grouped[entry.date].pauses += calculateTotalPauseMinutes(entry.pauses ?? []) / 60;
    });

    return Object.entries(grouped).map(([date, data]) => ({
      date,
      label: format(new Date(date + 'T00:00:00'), 'dd MMM', { locale: es }),
      hours: Math.round(data.hours * 100) / 100,
      pauses: Math.round(data.pauses * 100) / 100,
    }));
  }, [entries]);

  // Stats totales
  const totalStats = useMemo(() => {
    const totalHours = entries.reduce((sum, e) => sum + (e.total_hours ?? 0), 0);
    const totalPauseMinutes = entries.reduce(
      (sum, e) => sum + calculateTotalPauseMinutes(e.pauses ?? []),
      0
    );
    const daysWorked = new Set(entries.map((e) => e.date)).size;

    return {
      totalHours,
      totalPauseHours: totalPauseMinutes / 60,
      daysWorked,
      averageDaily: daysWorked > 0 ? totalHours / daysWorked : 0,
    };
  }, [entries]);

  // Exportar CSV
  const handleExportCSV = () => {
    if (entries.length === 0) {
      showToast('warning', 'No hay datos para exportar');
      return;
    }

    const headers = ['Fecha', 'Hora Entrada', 'Hora Salida', 'Pausas (min)', 'Total Horas'];
    const rows = entries.map((entry) => [
      entry.date,
      formatTime(entry.clock_in),
      entry.clock_out ? formatTime(entry.clock_out) : '',
      String(calculateTotalPauseMinutes(entry.pauses ?? [])),
      entry.total_hours?.toFixed(2) ?? '',
    ]);

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `control-horario_${dateFrom}_${dateTo}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    showToast('success', 'Datos exportados exitosamente');
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-text-primary">Reportes</h1>
            <p className="text-text-secondary mt-1">Análisis detallado de tu tiempo</p>
          </div>

          {/* Export button */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-text-primary font-medium transition-all shadow-sm hover:shadow-md cursor-pointer"
          >
            <Download size={18} />
            Exportar CSV
          </button>
        </div>

        {/* Date filters */}
        <div className="flex flex-col sm:flex-row gap-3 items-end">
          <div className="flex-1">
            <label className="block text-xs font-medium text-text-secondary mb-1">Desde</label>
            <div className="relative">
              <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-bg-surface border border-border text-sm text-text-primary focus:outline-none focus:border-border-focus shadow-sm"
              />
            </div>
          </div>
          <div className="flex-1">
            <label className="block text-xs font-medium text-text-secondary mb-1">Hasta</label>
            <div className="relative">
              <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-bg-surface border border-border text-sm text-text-primary focus:outline-none focus:border-border-focus shadow-sm"
              />
            </div>
          </div>
          {/* Quick filters */}
          <div className="flex gap-1">
            <button
              onClick={() => {
                setDateFrom(format(subDays(new Date(), 7), 'yyyy-MM-dd'));
                setDateTo(format(new Date(), 'yyyy-MM-dd'));
              }}
              className="px-3 py-2.5 rounded-xl text-xs font-medium bg-bg-surface border border-border text-text-secondary hover:bg-bg-input transition-colors cursor-pointer shadow-sm"
            >
              7 días
            </button>
            <button
              onClick={() => {
                setDateFrom(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
                setDateTo(format(new Date(), 'yyyy-MM-dd'));
              }}
              className="px-3 py-2.5 rounded-xl text-xs font-medium bg-bg-surface border border-border text-text-secondary hover:bg-bg-input transition-colors cursor-pointer shadow-sm"
            >
              30 días
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 size={32} className="animate-spin text-secondary" />
          </div>
        ) : (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-bg-surface rounded-2xl p-5 shadow-md">
                <div className="flex items-center gap-2 mb-2">
                  <Clock size={16} className="text-secondary" />
                  <span className="text-xs font-medium text-text-secondary">Total Horas</span>
                </div>
                <p className="text-2xl font-bold text-text-primary timer-display">
                  {formatHoursToDisplay(totalStats.totalHours)}
                </p>
              </div>
              <div className="bg-bg-surface rounded-2xl p-5 shadow-md">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp size={16} className="text-primary" />
                  <span className="text-xs font-medium text-text-secondary">Promedio Diario</span>
                </div>
                <p className="text-2xl font-bold text-text-primary timer-display">
                  {formatHoursToDisplay(totalStats.averageDaily)}
                </p>
              </div>
              <div className="bg-bg-surface rounded-2xl p-5 shadow-md">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 size={16} className="text-success" />
                  <span className="text-xs font-medium text-text-secondary">Días Trabajados</span>
                </div>
                <p className="text-2xl font-bold text-text-primary">
                  {totalStats.daysWorked}
                </p>
              </div>
              <div className="bg-bg-surface rounded-2xl p-5 shadow-md">
                <div className="flex items-center gap-2 mb-2">
                  <Coffee size={16} className="text-warning" />
                  <span className="text-xs font-medium text-text-secondary">Total Pausas</span>
                </div>
                <p className="text-2xl font-bold text-text-primary timer-display">
                  {formatHoursToDisplay(totalStats.totalPauseHours)}
                </p>
              </div>
            </div>

            {/* Bar Chart */}
            {dailyData.length > 0 && (
              <div className="bg-bg-surface rounded-2xl p-6 shadow-md">
                <h3 className="text-sm font-medium text-text-secondary mb-4">
                  Horas por Día
                </h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={dailyData} barCategoryGap="20%">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="label"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#6b7280', fontSize: 11 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#6b7280', fontSize: 11 }}
                    />
                    <Tooltip
                      contentStyle={{
                        background: '#fff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '12px',
                        fontSize: '13px',
                      }}
                      formatter={(value: number, name: string) => [
                        formatHoursToDisplay(value),
                        name === 'hours' ? 'Trabajado' : 'Pausas',
                      ]}
                    />
                    <Bar dataKey="hours" fill="#7c6cf0" radius={[6, 6, 0, 0]} maxBarSize={32} />
                    <Bar dataKey="pauses" fill="#f59e0b" radius={[6, 6, 0, 0]} maxBarSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Trend Line Chart */}
            {dailyData.length > 1 && (
              <div className="bg-bg-surface rounded-2xl p-6 shadow-md">
                <h3 className="text-sm font-medium text-text-secondary mb-4">
                  Tendencia de Horas
                </h3>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={dailyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="label"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#6b7280', fontSize: 11 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#6b7280', fontSize: 11 }}
                    />
                    <Tooltip
                      contentStyle={{
                        background: '#fff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '12px',
                        fontSize: '13px',
                      }}
                      formatter={(value: number) => [formatHoursToDisplay(value), 'Horas']}
                    />
                    <Line
                      type="monotone"
                      dataKey="hours"
                      stroke="#7c6cf0"
                      strokeWidth={2.5}
                      dot={{ fill: '#7c6cf0', r: 4 }}
                      activeDot={{ r: 6, fill: '#c8e64a' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Data table */}
            {entries.length > 0 && (
              <div className="bg-bg-surface rounded-2xl shadow-md overflow-hidden">
                <div className="px-6 py-4 border-b border-border">
                  <h3 className="text-sm font-medium text-text-secondary">
                    Tabla Resumen
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-bg-input">
                        <th className="text-left px-6 py-3 font-medium text-text-secondary">Fecha</th>
                        <th className="text-left px-6 py-3 font-medium text-text-secondary">Entrada</th>
                        <th className="text-left px-6 py-3 font-medium text-text-secondary">Salida</th>
                        <th className="text-left px-6 py-3 font-medium text-text-secondary">Pausas</th>
                        <th className="text-right px-6 py-3 font-medium text-text-secondary">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {entries.map((entry) => (
                        <tr key={entry.id} className="hover:bg-bg-input/50 transition-colors">
                          <td className="px-6 py-3 text-text-primary">{entry.date}</td>
                          <td className="px-6 py-3 text-text-primary">{formatTime(entry.clock_in)}</td>
                          <td className="px-6 py-3 text-text-primary">
                            {entry.clock_out ? formatTime(entry.clock_out) : '—'}
                          </td>
                          <td className="px-6 py-3 text-text-primary">
                            {calculateTotalPauseMinutes(entry.pauses ?? [])} min
                          </td>
                          <td className="px-6 py-3 text-right font-semibold text-text-primary">
                            {entry.total_hours
                              ? formatHoursToDisplay(entry.total_hours)
                              : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
