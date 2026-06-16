// ============================================================
// History — Página de historial de registros
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import Layout from '@/components/layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { supabase } from '@/lib/supabase';
import {
  formatTime,
  formatHoursToDisplay,
  formatDateShort,
  calculateTotalPauseMinutes,
} from '@/lib/calculations';
import { PAUSE_TYPE_LABELS } from '@/types';
import type { TimeEntry } from '@/types';
import {
  Calendar,
  ChevronDown,
  ChevronUp,
  Clock,
  Coffee,
  Edit3,
  Trash2,
  Loader2,
  AlertCircle,
  Save,
  X,
} from 'lucide-react';

type FilterPeriod = 'week' | 'month' | 'custom';

export default function History() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<FilterPeriod>('month');
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null);
  const [editingEntry, setEditingEntry] = useState<string | null>(null);
  const [editData, setEditData] = useState({ clock_in: '', clock_out: '', notes: '' });

  const loadEntries = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const now = new Date();
    let startDate: Date;

    if (period === 'week') {
      startDate = subDays(now, 7);
    } else {
      startDate = startOfMonth(now);
    }

    const { data, error } = await supabase
      .from('time_entries')
      .select('*, pauses(*)')
      .eq('user_id', user.id)
      .gte('date', format(startDate, 'yyyy-MM-dd'))
      .lte('date', format(endOfMonth(now), 'yyyy-MM-dd'))
      .order('date', { ascending: false })
      .order('clock_in', { ascending: false });

    if (error) {
      showToast('error', 'Error al cargar historial');
    } else {
      setEntries((data as TimeEntry[]) ?? []);
    }

    setLoading(false);
  }, [user, period, showToast]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const handleDelete = async (entryId: string, entryStatus: string) => {
    if (entryStatus !== 'completed') {
      showToast('warning', 'No se puede eliminar una jornada activa');
      return;
    }

    const confirmed = window.confirm('¿Seguro que deseas eliminar este registro? Esta acción no se puede deshacer.');
    if (!confirmed) return;

    const { error } = await supabase.from('time_entries').delete().eq('id', entryId);

    if (error) {
      showToast('error', 'Error al eliminar registro');
    } else {
      showToast('success', 'Registro eliminado');
      setEntries((prev) => prev.filter((e) => e.id !== entryId));
    }
  };

  const handleEdit = (entry: TimeEntry) => {
    setEditingEntry(entry.id);
    setEditData({
      clock_in: entry.clock_in.slice(0, 16), // Format for datetime-local input
      clock_out: entry.clock_out?.slice(0, 16) ?? '',
      notes: entry.notes ?? '',
    });
  };

  const handleSaveEdit = async (entryId: string) => {
    const { error } = await supabase
      .from('time_entries')
      .update({
        clock_in: new Date(editData.clock_in).toISOString(),
        clock_out: editData.clock_out ? new Date(editData.clock_out).toISOString() : null,
        notes: editData.notes || null,
        edited_manually: true,
      })
      .eq('id', entryId);

    if (error) {
      showToast('error', 'Error al guardar cambios');
    } else {
      showToast('success', 'Registro actualizado');
      setEditingEntry(null);
      loadEntries();
    }
  };

  // Agrupar entradas por fecha
  const groupedEntries = entries.reduce<Record<string, TimeEntry[]>>((acc, entry) => {
    const date = entry.date;
    if (!acc[date]) acc[date] = [];
    acc[date].push(entry);
    return acc;
  }, {});

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-text-primary">Historial</h1>
            <p className="text-text-secondary mt-1">Revisa tus registros de jornada</p>
          </div>

          {/* Filtros de período */}
          <div className="flex gap-1 p-1 rounded-xl bg-bg-surface shadow-sm">
            {(['week', 'month'] as FilterPeriod[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                  period === p
                    ? 'bg-primary text-text-primary shadow-sm'
                    : 'text-text-secondary hover:bg-bg-input'
                }`}
              >
                {p === 'week' ? 'Semana' : 'Mes'}
              </button>
            ))}
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-12">
            <Loader2 size={32} className="animate-spin text-secondary" />
          </div>
        )}

        {/* Empty state */}
        {!loading && entries.length === 0 && (
          <div className="text-center py-16 bg-bg-surface rounded-2xl shadow-md">
            <AlertCircle size={48} className="mx-auto text-text-tertiary mb-4" />
            <h3 className="text-lg font-semibold text-text-primary">Sin registros</h3>
            <p className="text-text-secondary mt-1">
              No hay registros para el período seleccionado
            </p>
          </div>
        )}

        {/* Entries grouped by date */}
        {!loading &&
          Object.entries(groupedEntries).map(([date, dayEntries]) => (
            <div key={date} className="bg-bg-surface rounded-2xl shadow-md overflow-hidden">
              {/* Date header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <Calendar size={18} className="text-secondary" />
                  <span className="font-semibold text-text-primary capitalize">
                    {formatDateShort(date)}
                  </span>
                </div>
                <span className="text-sm text-text-secondary">
                  {dayEntries.length} {dayEntries.length === 1 ? 'registro' : 'registros'}
                </span>
              </div>

              {/* Entries */}
              <div className="divide-y divide-border">
                {dayEntries.map((entry) => (
                  <div key={entry.id} className="px-6 py-4">
                    {/* Entry header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${
                            entry.status === 'completed'
                              ? 'bg-success'
                              : entry.status === 'active'
                                ? 'bg-primary status-pulse'
                                : 'bg-warning status-pulse'
                          }`}
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <Clock size={14} className="text-text-tertiary" />
                            <span className="text-sm font-medium text-text-primary">
                              {formatTime(entry.clock_in)}
                              {entry.clock_out && ` → ${formatTime(entry.clock_out)}`}
                            </span>
                            {entry.edited_manually && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-warning-light text-warning">
                                Editado
                              </span>
                            )}
                          </div>
                          {entry.total_hours !== null && (
                            <span className="text-xs text-text-secondary">
                              {formatHoursToDisplay(entry.total_hours)} trabajadas
                              {entry.pauses && entry.pauses.length > 0 && (
                                <> · {calculateTotalPauseMinutes(entry.pauses)}min pausa</>
                              )}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Expand/collapse */}
                        <button
                          onClick={() =>
                            setExpandedEntry(expandedEntry === entry.id ? null : entry.id)
                          }
                          className="p-2 rounded-lg hover:bg-bg-input transition-colors cursor-pointer"
                          aria-label="Ver detalles"
                        >
                          {expandedEntry === entry.id ? (
                            <ChevronUp size={16} className="text-text-secondary" />
                          ) : (
                            <ChevronDown size={16} className="text-text-secondary" />
                          )}
                        </button>

                        {/* Edit */}
                        {entry.status === 'completed' && (
                          <button
                            onClick={() => handleEdit(entry)}
                            className="p-2 rounded-lg hover:bg-bg-input transition-colors cursor-pointer"
                            aria-label="Editar"
                          >
                            <Edit3 size={16} className="text-text-secondary" />
                          </button>
                        )}

                        {/* Delete */}
                        <button
                          onClick={() => handleDelete(entry.id, entry.status)}
                          className="p-2 rounded-lg hover:bg-danger-light transition-colors cursor-pointer"
                          aria-label="Eliminar"
                        >
                          <Trash2 size={16} className="text-danger" />
                        </button>
                      </div>
                    </div>

                    {/* Expanded details */}
                    {expandedEntry === entry.id && entry.pauses && entry.pauses.length > 0 && (
                      <div className="mt-4 ml-6 space-y-2 animate-fade-in-up">
                        <p className="text-xs font-medium text-text-secondary uppercase tracking-wider">
                          Pausas
                        </p>
                        {entry.pauses.map((pause) => (
                          <div
                            key={pause.id}
                            className="flex items-center gap-3 p-2.5 rounded-lg bg-bg-input"
                          >
                            <Coffee size={14} className="text-warning" />
                            <span className="text-xs text-text-primary">
                              {PAUSE_TYPE_LABELS[pause.type]} · {formatTime(pause.start_time)}
                              {pause.end_time && ` → ${formatTime(pause.end_time)}`}
                              {pause.duration !== null && (
                                <span className="text-text-secondary"> ({pause.duration} min)</span>
                              )}
                            </span>
                          </div>
                        ))}
                        {entry.notes && (
                          <p className="text-xs text-text-secondary italic mt-2">
                            📝 {entry.notes}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Edit form (inline) */}
                    {editingEntry === entry.id && (
                      <div className="mt-4 ml-6 p-4 rounded-xl bg-bg-input space-y-3 animate-fade-in-up">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-text-secondary mb-1">
                              Entrada
                            </label>
                            <input
                              type="datetime-local"
                              value={editData.clock_in}
                              onChange={(e) => setEditData((prev) => ({ ...prev, clock_in: e.target.value }))}
                              className="w-full px-3 py-2 rounded-lg bg-bg-surface border border-border text-sm text-text-primary focus:outline-none focus:border-border-focus"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-text-secondary mb-1">
                              Salida
                            </label>
                            <input
                              type="datetime-local"
                              value={editData.clock_out}
                              onChange={(e) => setEditData((prev) => ({ ...prev, clock_out: e.target.value }))}
                              className="w-full px-3 py-2 rounded-lg bg-bg-surface border border-border text-sm text-text-primary focus:outline-none focus:border-border-focus"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-text-secondary mb-1">
                            Notas
                          </label>
                          <input
                            type="text"
                            value={editData.notes}
                            onChange={(e) => setEditData((prev) => ({ ...prev, notes: e.target.value }))}
                            placeholder="Nota opcional..."
                            className="w-full px-3 py-2 rounded-lg bg-bg-surface border border-border text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-border-focus"
                          />
                        </div>
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => setEditingEntry(null)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm text-text-secondary hover:bg-bg-surface transition-colors cursor-pointer"
                          >
                            <X size={14} />
                            Cancelar
                          </button>
                          <button
                            onClick={() => handleSaveEdit(entry.id)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-sm font-medium text-text-primary hover:bg-primary-hover transition-colors cursor-pointer"
                          >
                            <Save size={14} />
                            Guardar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
      </div>
    </Layout>
  );
}
