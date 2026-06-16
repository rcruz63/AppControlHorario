// ============================================================
// WeeklyChart — Gráfico de barras semanal (estilo Sleep Analysis)
// ============================================================

import { useMemo, useCallback, useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import {
  calculateWeeklyStats,
  getDayName,
  getTodayDate,
  formatHoursToDisplay,
} from '@/lib/calculations';
import type { TimeEntry, WeeklyStats } from '@/types';
import { CalendarDays } from 'lucide-react';

export default function WeeklyChart() {
  const { user } = useAuth();
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats | null>(null);
  const [loading, setLoading] = useState(true);

  const loadWeeklyData = useCallback(async () => {
    if (!user) return;

    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1));
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const { data } = await supabase
      .from('time_entries')
      .select('*, pauses(*)')
      .eq('user_id', user.id)
      .gte('date', startOfWeek.toISOString().split('T')[0])
      .lte('date', endOfWeek.toISOString().split('T')[0])
      .order('date');

    const stats = calculateWeeklyStats(
      (data as TimeEntry[]) ?? [],
      now
    );
    setWeeklyStats(stats);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadWeeklyData();
  }, [loadWeeklyData]);

  const chartData = useMemo(() => {
    if (!weeklyStats) return [];

    const today = getTodayDate();

    return weeklyStats.dailyBreakdown.map((day) => ({
      name: getDayName(day.date).charAt(0).toUpperCase() + getDayName(day.date).slice(1),
      hours: Math.round(day.totalWorked * 100) / 100,
      isToday: day.date === today,
    }));
  }, [weeklyStats]);

  if (loading) {
    return (
      <div className="dark-card rounded-2xl p-6 h-[320px] animate-pulse">
        <div className="h-4 bg-white/10 rounded w-40 mb-8" />
        <div className="h-[200px] bg-white/5 rounded" />
      </div>
    );
  }

  return (
    <div className="dark-card rounded-2xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <CalendarDays size={18} className="text-text-sidebar" />
          <span className="text-sm font-medium text-text-sidebar">
            Análisis Semanal
          </span>
        </div>
        <span className="px-3 py-1 rounded-full bg-white/10 text-xs font-medium text-text-sidebar">
          Semanal
        </span>
      </div>

      {/* Stats summary */}
      <div className="flex gap-8 mb-6">
        <div>
          <span className="text-3xl font-bold text-primary timer-display">
            {formatHoursToDisplay(weeklyStats?.totalHours ?? 0)}
          </span>
          <p className="text-xs text-text-sidebar mt-1">Total semanal</p>
        </div>
        <div>
          <span className="text-3xl font-bold text-secondary timer-display">
            {formatHoursToDisplay(weeklyStats?.averageDaily ?? 0)}
          </span>
          <p className="text-xs text-text-sidebar mt-1">Promedio diario</p>
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={chartData} barCategoryGap="25%">
          <XAxis
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#a0a0b8', fontSize: 12 }}
          />
          <YAxis hide />
          <Tooltip
            cursor={false}
            contentStyle={{
              background: '#1a1a2e',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              fontSize: '13px',
              color: '#fff',
            }}
            formatter={(value: number) => [`${formatHoursToDisplay(value)}`, 'Trabajado']}
          />
          <Bar dataKey="hours" radius={[6, 6, 0, 0]} maxBarSize={40}>
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.isToday ? '#c8e64a' : '#7c6cf0'}
                opacity={entry.hours > 0 ? 1 : 0.2}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
