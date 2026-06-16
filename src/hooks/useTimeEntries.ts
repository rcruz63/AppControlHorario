// ============================================================
// useTimeEntries — Hook para gestión de datos de jornadas y pausas
// ============================================================

import { useCallback, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { calculateWorkedHours } from '@/lib/calculations';
import type { TimeEntry, Pause, TimeEntryStatus, Database } from '@/types';
import { differenceInMinutes, parseISO } from 'date-fns';

export interface TimeEntryEditData {
  clock_in: string;
  clock_out: string | null;
  notes: string | null;
}

export function useTimeEntries() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);

  /**
   * Carga los registros de jornada de un usuario dentro de un rango de fechas.
   */
  const getTimeEntries = useCallback(async (dateFrom: string, dateTo: string): Promise<TimeEntry[]> => {
    if (!user) return [];
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('time_entries')
        .select('*, pauses(*)')
        .eq('user_id', user.id)
        .gte('date', dateFrom)
        .lte('date', dateTo)
        .order('date', { ascending: false })
        .order('clock_in', { ascending: false });

      if (error) throw new Error(error.message);
      return (data as TimeEntry[]) ?? [];
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Error al cargar jornadas';
      showToast('error', msg);
      return [];
    } finally {
      setLoading(false);
    }
  }, [user, showToast]);

  /**
   * Elimina un registro de jornada (y sus pausas asociadas por CASCADE en DB).
   */
  const deleteTimeEntry = useCallback(async (entryId: string, status: TimeEntryStatus): Promise<boolean> => {
    if (status !== 'completed') {
      showToast('warning', 'No se puede eliminar una jornada activa');
      return false;
    }

    try {
      const { error } = await supabase
        .from('time_entries')
        .delete()
        .eq('id', entryId);

      if (error) throw new Error(error.message);
      showToast('success', 'Registro eliminado');
      return true;
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Error al eliminar el registro';
      showToast('error', msg);
      return false;
    }
  }, [showToast]);

  /**
   * Actualiza un registro de jornada y sus pausas asociadas de forma coordinada.
   */
  const updateTimeEntryAndPauses = useCallback(async (
    entryId: string,
    entryData: TimeEntryEditData,
    editedPauses: Omit<Pause, 'time_entry_id' | 'created_at' | 'updated_at'>[]
  ): Promise<boolean> => {
    if (!user) return false;
    setLoading(true);

    try {
      // 1. Obtener pausas existentes para saber cuáles borrar/actualizar
      const { data: existingData, error: fetchError } = await supabase
        .from('pauses')
        .select('*')
        .eq('time_entry_id', entryId);

      if (fetchError) throw new Error(fetchError.message);
      const existingPauses = (existingData as Pause[]) ?? [];

      // 2. Identificar pausas eliminadas (están en BD pero no en la lista editada)
      const editedIds = editedPauses.map(p => p.id).filter(Boolean);
      const pausesToDelete = existingPauses.filter(p => !editedIds.includes(p.id));

      if (pausesToDelete.length > 0) {
        const { error: delError } = await supabase
          .from('pauses')
          .delete()
          .in('id', pausesToDelete.map(p => p.id));
        if (delError) throw new Error(delError.message);
      }

      // 3. Procesar pausas añadidas o modificadas
      const pausesToInsert: Database['public']['Tables']['pauses']['Insert'][] = [];
      const pausesToUpdate: (Database['public']['Tables']['pauses']['Update'] & { id: string })[] = [];

      editedPauses.forEach(p => {
        // Calcular duración
        let duration: number | null = null;
        if (p.end_time) {
          duration = Math.max(0, differenceInMinutes(parseISO(p.end_time), parseISO(p.start_time)));
        }

        const pausePayload = {
          start_time: p.start_time,
          end_time: p.end_time,
          type: p.type,
          duration,
        };

        if (p.id) {
          pausesToUpdate.push({ id: p.id, ...pausePayload });
        } else {
          pausesToInsert.push({ time_entry_id: entryId, ...pausePayload });
        }
      });

      // Insertar nuevas
      if (pausesToInsert.length > 0) {
        const { error: insError } = await supabase
          .from('pauses')
          .insert(pausesToInsert);
        if (insError) throw new Error(insError.message);
      }

      // Actualizar existentes
      for (const p of pausesToUpdate) {
        const { id, ...payload } = p;
        const { error: updError } = await supabase
          .from('pauses')
          .update(payload)
          .eq('id', id);
        if (updError) throw new Error(updError.message);
      }

      // 4. Recalcular las horas de jornada total
      // Construimos un objeto simulado de Pause[] completo para calculations.ts
      const completePausesForCalculation = editedPauses.map(p => {
        let duration: number | null = null;
        if (p.end_time) {
          duration = Math.max(0, differenceInMinutes(parseISO(p.end_time), parseISO(p.start_time)));
        }
        return {
          id: p.id || '',
          time_entry_id: entryId,
          start_time: p.start_time,
          end_time: p.end_time,
          type: p.type,
          duration,
          created_at: '',
          updated_at: '',
        } as Pause;
      });

      const entryForHoursCalculation = {
        clock_in: entryData.clock_in,
        clock_out: entryData.clock_out,
      } as TimeEntry;

      const totalHours = calculateWorkedHours(entryForHoursCalculation, completePausesForCalculation);

      // 5. Actualizar la cabecera time_entries
      const { error: entryUpdError } = await supabase
        .from('time_entries')
        .update({
          clock_in: entryData.clock_in,
          clock_out: entryData.clock_out,
          notes: entryData.notes || null,
          total_hours: Math.round(totalHours * 100) / 100,
          edited_manually: true,
        })
        .eq('id', entryId);

      if (entryUpdError) throw new Error(entryUpdError.message);

      showToast('success', 'Registro y pausas actualizados');
      return true;
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Error al guardar los cambios';
      showToast('error', msg);
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, showToast]);

  return {
    loading,
    getTimeEntries,
    deleteTimeEntry,
    updateTimeEntryAndPauses,
  };
}
