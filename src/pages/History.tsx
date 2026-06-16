// ============================================================
// History — Página de historial de registros y edición de pausas
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import Layout from '@/components/layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { useTimeEntries } from '@/hooks/useTimeEntries';
import {
  formatTime,
  formatHoursToDisplay,
  formatDateShort,
  calculateTotalPauseMinutes,
} from '@/lib/calculations';
import { PAUSE_TYPE_LABELS } from '@/types';
import type { TimeEntry, Pause, PauseType } from '@/types';
import {
  Calendar as CalendarIcon,
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
  Plus,
} from 'lucide-react';

type FilterPeriod = 'week' | 'month';

export default function History() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { loading: hookLoading, getTimeEntries, deleteTimeEntry, updateTimeEntryAndPauses } = useTimeEntries();
  
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<FilterPeriod>('month');
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null);
  
  // State for Editing
  const [editingEntry, setEditingEntry] = useState<string | null>(null);
  const [editData, setEditData] = useState({ clock_in: '', clock_out: '', notes: '' });
  const [editPauses, setEditPauses] = useState<Omit<Pause, 'time_entry_id' | 'created_at' | 'updated_at'>[]>([]);

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

    const fetched = await getTimeEntries(
      format(startDate, 'yyyy-MM-dd'),
      format(endOfMonth(now), 'yyyy-MM-dd')
    );
    setEntries(fetched);
    setLoading(false);
  }, [user, period, getTimeEntries]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const handleDelete = async (entryId: string, entryStatus: TimeEntry['status']) => {
    const deleted = await deleteTimeEntry(entryId, entryStatus);
    if (deleted) {
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
    
    // Copy existing pauses for editing
    setEditPauses(
      (entry.pauses ?? []).map((p) => ({
        id: p.id,
        start_time: p.start_time.slice(0, 16),
        end_time: p.end_time?.slice(0, 16) ?? null,
        type: p.type,
        duration: p.duration,
      }))
    );
  };

  const handleAddPauseInEdit = () => {
    // Add default pause item relative to the clock_in time
    setEditPauses((prev) => [
      ...prev,
      {
        id: '', // Empty means new pause to insert
        start_time: editData.clock_in,
        end_time: editData.clock_out || editData.clock_in,
        type: 'break' as PauseType,
        duration: null,
      },
    ]);
  };

  const handleRemovePauseInEdit = (index: number) => {
    setEditPauses((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handlePauseChangeInEdit = (
    index: number,
    field: 'start_time' | 'end_time' | 'type',
    value: string
  ) => {
    setEditPauses((prev) =>
      prev.map((p, idx) => (idx === index ? { ...p, [field]: value } : p))
    );
  };

  const handleSaveEdit = async (entryId: string) => {
    if (!editData.clock_in) {
      showToast('warning', 'La hora de entrada es obligatoria');
      return;
    }

    const clockInTime = new Date(editData.clock_in).getTime();
    const clockOutTime = editData.clock_out ? new Date(editData.clock_out).getTime() : null;

    if (clockOutTime && clockOutTime <= clockInTime) {
      showToast('warning', 'La hora de salida debe ser posterior a la de entrada');
      return;
    }

    // Client-side validations for pauses
    for (let i = 0; i < editPauses.length; i++) {
      const p1 = editPauses[i];
      if (!p1.start_time) {
        showToast('warning', 'Todas las pausas deben tener una hora de inicio');
        return;
      }
      if (!p1.end_time) {
        showToast('warning', 'Todas las pausas deben tener una hora de fin');
        return;
      }

      const s1 = new Date(p1.start_time).getTime();
      const e1 = new Date(p1.end_time).getTime();

      if (e1 <= s1) {
        showToast('warning', 'La hora de fin de la pausa debe ser posterior a la de inicio');
        return;
      }

      if (s1 < clockInTime) {
        showToast('warning', 'Las pausas deben iniciar dentro del rango de la jornada');
        return;
      }

      if (clockOutTime && e1 > clockOutTime) {
        showToast('warning', 'Las pausas deben finalizar dentro del rango de la jornada');
        return;
      }

      // Check overlap against other pauses
      for (let j = i + 1; j < editPauses.length; j++) {
        const p2 = editPauses[j];
        if (p2.start_time && p2.end_time) {
          const s2 = new Date(p2.start_time).getTime();
          const e2 = new Date(p2.end_time).getTime();

          if (s1 < e2 && s2 < e1) {
            showToast('warning', 'Las pausas no pueden solaparse entre sí');
            return;
          }
        }
      }
    }

    // Prepare payload for update
    const entryPayload = {
      clock_in: new Date(editData.clock_in).toISOString(),
      clock_out: editData.clock_out ? new Date(editData.clock_out).toISOString() : null,
      notes: editData.notes || null,
    };

    const pausesPayload = editPauses.map((p) => ({
      id: p.id,
      start_time: new Date(p.start_time).toISOString(),
      end_time: p.end_time ? new Date(p.end_time).toISOString() : null,
      type: p.type,
      duration: p.duration,
    }));

    const success = await updateTimeEntryAndPauses(entryId, entryPayload, pausesPayload);
    if (success) {
      setEditingEntry(null);
      loadEntries();
    }
  };

  // Group entries by date
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
            <p className="text-text-secondary mt-1">Revisa y gestiona tus registros de jornada</p>
          </div>

          {/* Period filters */}
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

        {/* Loading spinner */}
        {(loading || hookLoading) && entries.length === 0 && (
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
                  <CalendarIcon size={18} className="text-secondary" />
                  <span className="font-semibold text-text-primary capitalize">
                    {formatDateShort(date)}
                  </span>
                </div>
                <span className="text-sm text-text-secondary">
                  {dayEntries.length} {dayEntries.length === 1 ? 'registro' : 'registros'}
                </span>
              </div>

              {/* Entries list */}
              <div className="divide-y divide-border">
                {dayEntries.map((entry) => (
                  <div key={entry.id} className="px-6 py-4">
                    {/* Entry summary line */}
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
                                Editado manualmente
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
                        {/* Expand/collapse pauses details */}
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

                        {/* Edit button */}
                        {entry.status === 'completed' && (
                          <button
                            onClick={() => handleEdit(entry)}
                            className="p-2 rounded-lg hover:bg-bg-input transition-colors cursor-pointer"
                            aria-label="Editar"
                          >
                            <Edit3 size={16} className="text-text-secondary" />
                          </button>
                        )}

                        {/* Delete button */}
                        <button
                          onClick={() => handleDelete(entry.id, entry.status)}
                          className="p-2 rounded-lg hover:bg-danger-light transition-colors cursor-pointer"
                          aria-label="Eliminar"
                        >
                          <Trash2 size={16} className="text-danger" />
                        </button>
                      </div>
                    </div>

                    {/* Expanded pauses details */}
                    {expandedEntry === entry.id && entry.pauses && entry.pauses.length > 0 && (
                      <div className="mt-4 ml-6 space-y-2 animate-fade-in-up">
                        <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                          Pausas registradas
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

                    {/* Edit Form (Expanded inline) */}
                    {editingEntry === entry.id && (
                      <div className="mt-4 ml-6 p-5 rounded-2xl bg-bg-input border border-border space-y-4 animate-fade-in-up">
                        <h4 className="text-sm font-semibold text-text-primary">Editar Jornada</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-text-secondary mb-1">
                              Hora Entrada
                            </label>
                            <input
                              type="datetime-local"
                              value={editData.clock_in}
                              onChange={(e) => setEditData((prev) => ({ ...prev, clock_in: e.target.value }))}
                              className="w-full px-3 py-2 rounded-xl bg-bg-surface border border-border text-sm text-text-primary focus:outline-none focus:border-border-focus"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-text-secondary mb-1">
                              Hora Salida
                            </label>
                            <input
                              type="datetime-local"
                              value={editData.clock_out}
                              onChange={(e) => setEditData((prev) => ({ ...prev, clock_out: e.target.value }))}
                              className="w-full px-3 py-2 rounded-xl bg-bg-surface border border-border text-sm text-text-primary focus:outline-none focus:border-border-focus"
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
                            placeholder="Nota opcional sobre la jornada..."
                            className="w-full px-3 py-2.5 rounded-xl bg-bg-surface border border-border text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-border-focus"
                          />
                        </div>

                        {/* Pause Management sub-form */}
                        <div className="space-y-3 pt-2 border-t border-border">
                          <div className="flex items-center justify-between">
                            <h5 className="text-xs font-semibold text-text-primary uppercase tracking-wider">
                              Gestionar Pausas
                            </h5>
                            <button
                              type="button"
                              onClick={handleAddPauseInEdit}
                              className="flex items-center gap-1 text-[11px] font-semibold text-secondary hover:text-secondary-hover bg-bg-surface border border-border px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                            >
                              <Plus size={12} />
                              Añadir Pausa
                            </button>
                          </div>

                          {editPauses.length === 0 ? (
                            <p className="text-xs text-text-tertiary italic">No hay pausas en esta jornada.</p>
                          ) : (
                            <div className="space-y-3">
                              {editPauses.map((pause, idx) => (
                                <div
                                  key={idx}
                                  className="grid grid-cols-1 sm:grid-cols-12 gap-2 p-3 bg-bg-surface border border-border rounded-xl items-end"
                                >
                                  {/* Type */}
                                  <div className="sm:col-span-3">
                                    <label className="block text-[10px] font-medium text-text-secondary mb-1">
                                      Tipo
                                    </label>
                                    <select
                                      value={pause.type}
                                      onChange={(e) => handlePauseChangeInEdit(idx, 'type', e.target.value)}
                                      className="w-full px-2 py-1.5 bg-bg-input border border-border rounded-lg text-xs text-text-primary focus:outline-none"
                                    >
                                      <option value="meal">Comida</option>
                                      <option value="break">Descanso</option>
                                      <option value="other">Otra</option>
                                    </select>
                                  </div>

                                  {/* Start */}
                                  <div className="sm:col-span-4">
                                    <label className="block text-[10px] font-medium text-text-secondary mb-1">
                                      Inicio pausa
                                    </label>
                                    <input
                                      type="datetime-local"
                                      value={pause.start_time}
                                      onChange={(e) => handlePauseChangeInEdit(idx, 'start_time', e.target.value)}
                                      className="w-full px-2 py-1.5 bg-bg-input border border-border rounded-lg text-xs text-text-primary focus:outline-none"
                                    />
                                  </div>

                                  {/* End */}
                                  <div className="sm:col-span-4">
                                    <label className="block text-[10px] font-medium text-text-secondary mb-1">
                                      Fin pausa
                                    </label>
                                    <input
                                      type="datetime-local"
                                      value={pause.end_time || ''}
                                      onChange={(e) => handlePauseChangeInEdit(idx, 'end_time', e.target.value)}
                                      className="w-full px-2 py-1.5 bg-bg-input border border-border rounded-lg text-xs text-text-primary focus:outline-none"
                                    />
                                  </div>

                                  {/* Delete pause */}
                                  <div className="sm:col-span-1 flex justify-end">
                                    <button
                                      type="button"
                                      onClick={() => handleRemovePauseInEdit(idx)}
                                      className="p-1.5 text-danger hover:bg-danger-light rounded-lg transition-colors cursor-pointer"
                                      aria-label="Eliminar pausa"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Controls */}
                        <div className="flex gap-2 justify-end pt-2 border-t border-border">
                          <button
                            onClick={() => setEditingEntry(null)}
                            className="flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-medium text-text-secondary hover:bg-bg-surface transition-colors cursor-pointer"
                          >
                            <X size={16} />
                            Cancelar
                          </button>
                          <button
                            onClick={() => handleSaveEdit(entry.id)}
                            className="flex items-center gap-1 px-5 py-2 rounded-xl bg-primary text-sm font-semibold text-text-primary hover:bg-primary-hover transition-colors cursor-pointer"
                          >
                            <Save size={16} />
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
