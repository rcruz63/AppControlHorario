// ============================================================
// TimeTracking Context — Estado y operaciones de control de jornada
// ============================================================

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import {
  calculateElapsedSeconds,
  calculateActivePauseSeconds,
  calculateWorkedHours,
  getTodayDate,
} from '@/lib/calculations';
import type {
  TimeEntry,
  Pause,
  PauseType,
  WorkdayState,
  TimeTrackingState,
} from '@/types';

interface TimeTrackingContextType extends TimeTrackingState {
  startWorkday: () => Promise<void>;
  endWorkday: () => Promise<void>;
  startPause: (type: PauseType) => Promise<void>;
  endPause: () => Promise<void>;
  refreshEntries: () => Promise<void>;
}

const TimeTrackingContext = createContext<TimeTrackingContextType | null>(null);

function deriveStatus(entry: TimeEntry | null, activePause: Pause | null): WorkdayState {
  if (!entry || entry.status === 'completed') return 'idle';
  if (activePause) return 'paused';
  return 'working';
}

export function TimeTrackingProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [currentEntry, setCurrentEntry] = useState<TimeEntry | null>(null);
  const [currentPause, setCurrentPause] = useState<Pause | null>(null);
  const [todayEntries, setTodayEntries] = useState<TimeEntry[]>([]);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [pauseSeconds, setPauseSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const status = deriveStatus(currentEntry, currentPause);

  /** Carga la jornada activa del día (si existe) */
  const loadActiveEntry = useCallback(async () => {
    if (!user) return;

    const { data: entries } = await supabase
      .from('time_entries')
      .select('*, pauses(*)')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('clock_in', { ascending: false })
      .limit(1);

    // También verificar jornadas en pausa
    const { data: pausedEntries } = await supabase
      .from('time_entries')
      .select('*, pauses(*)')
      .eq('user_id', user.id)
      .eq('status', 'paused')
      .order('clock_in', { ascending: false })
      .limit(1);

    const activeEntry = entries?.[0] ?? pausedEntries?.[0] ?? null;
    setCurrentEntry(activeEntry);

    if (activeEntry?.pauses) {
      const activePause = activeEntry.pauses.find((p: Pause) => !p.end_time) ?? null;
      setCurrentPause(activePause);
    } else {
      setCurrentPause(null);
    }
  }, [user]);

  /** Carga todas las entradas del día */
  const loadTodayEntries = useCallback(async () => {
    if (!user) return;

    const today = getTodayDate();
    const { data } = await supabase
      .from('time_entries')
      .select('*, pauses(*)')
      .eq('user_id', user.id)
      .eq('date', today)
      .order('clock_in', { ascending: false });

    setTodayEntries(data ?? []);
  }, [user]);

  const refreshEntries = useCallback(async () => {
    await Promise.all([loadActiveEntry(), loadTodayEntries()]);
  }, [loadActiveEntry, loadTodayEntries]);

  // Timer en vivo
  useEffect(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (status === 'idle' || !currentEntry) {
      setElapsedSeconds(0);
      setPauseSeconds(0);
      return;
    }

    const tick = () => {
      const pauses = currentEntry.pauses ?? [];
      setElapsedSeconds(calculateElapsedSeconds(currentEntry, pauses));
      setPauseSeconds(calculateActivePauseSeconds(currentPause));
    };

    tick(); // Ejecutar inmediatamente
    timerRef.current = setInterval(tick, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [status, currentEntry, currentPause]);

  // Cargar datos al iniciar o cambiar de usuario
  useEffect(() => {
    if (user) {
      refreshEntries();
    } else {
      setCurrentEntry(null);
      setCurrentPause(null);
      setTodayEntries([]);
    }
  }, [user, refreshEntries]);

  // Alerta antes de salir si hay jornada activa (RF-003 / E-007)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (status !== 'idle') {
        e.preventDefault();
        e.returnValue = 'Tienes una jornada de trabajo activa. ¿Seguro que deseas salir?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [status]);

  const startWorkday = useCallback(async () => {
    if (!user) throw new Error('No hay usuario autenticado');
    if (currentEntry && currentEntry.status !== 'completed') {
      throw new Error('Ya hay una jornada activa');
    }

    const now = new Date().toISOString();
    const today = getTodayDate();

    const { data, error } = await supabase
      .from('time_entries')
      .insert({
        user_id: user.id,
        date: today,
        clock_in: now,
        clock_out: null,
        total_hours: null,
        status: 'active' as const,
        edited_manually: false,
        notes: null,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    setCurrentEntry({ ...data, pauses: [] });
    await loadTodayEntries();
  }, [user, currentEntry, loadTodayEntries]);

  const endWorkday = useCallback(async () => {
    if (!user || !currentEntry) throw new Error('No hay jornada activa');

    // Si hay pausa activa, finalizarla primero
    if (currentPause) {
      const now = new Date().toISOString();
      const pauseDuration = Math.round(
        calculateActivePauseSeconds(currentPause) / 60
      );

      await supabase
        .from('pauses')
        .update({ end_time: now, duration: pauseDuration })
        .eq('id', currentPause.id);
    }

    const now = new Date().toISOString();
    const pauses = currentEntry.pauses ?? [];
    const totalHours = calculateWorkedHours(
      { ...currentEntry, clock_out: now },
      pauses
    );

    const { error } = await supabase
      .from('time_entries')
      .update({
        clock_out: now,
        total_hours: Math.round(totalHours * 100) / 100,
        status: 'completed' as const,
      })
      .eq('id', currentEntry.id);

    if (error) throw new Error(error.message);

    setCurrentEntry(null);
    setCurrentPause(null);
    await loadTodayEntries();
  }, [user, currentEntry, currentPause, loadTodayEntries]);

  const startPause = useCallback(
    async (type: PauseType) => {
      if (!user || !currentEntry) throw new Error('No hay jornada activa');
      if (currentPause) throw new Error('Ya hay una pausa activa');

      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from('pauses')
        .insert({
          time_entry_id: currentEntry.id,
          start_time: now,
          end_time: null,
          type,
          duration: null,
        })
        .select()
        .single();

      if (error) throw new Error(error.message);

      // Actualizar status de la jornada
      await supabase
        .from('time_entries')
        .update({ status: 'paused' as const })
        .eq('id', currentEntry.id);

      setCurrentPause(data);
      setCurrentEntry((prev) =>
        prev
          ? {
              ...prev,
              status: 'paused',
              pauses: [...(prev.pauses ?? []), data],
            }
          : null
      );
    },
    [user, currentEntry, currentPause]
  );

  const endPause = useCallback(async () => {
    if (!currentPause || !currentEntry) throw new Error('No hay pausa activa');

    const now = new Date().toISOString();
    const durationMinutes = Math.round(
      calculateActivePauseSeconds(currentPause) / 60
    );

    const { error } = await supabase
      .from('pauses')
      .update({ end_time: now, duration: durationMinutes })
      .eq('id', currentPause.id);

    if (error) throw new Error(error.message);

    // Actualizar status de la jornada a activa
    await supabase
      .from('time_entries')
      .update({ status: 'active' as const })
      .eq('id', currentEntry.id);

    setCurrentPause(null);
    setCurrentEntry((prev) => {
      if (!prev) return null;
      const updatedPauses = (prev.pauses ?? []).map((p) =>
        p.id === currentPause.id
          ? { ...p, end_time: now, duration: durationMinutes }
          : p
      );
      return { ...prev, status: 'active', pauses: updatedPauses };
    });
  }, [currentPause, currentEntry]);

  const value: TimeTrackingContextType = {
    status,
    currentEntry,
    currentPause,
    todayEntries,
    elapsedSeconds,
    pauseSeconds,
    startWorkday,
    endWorkday,
    startPause,
    endPause,
    refreshEntries,
  };

  return (
    <TimeTrackingContext.Provider value={value}>
      {children}
    </TimeTrackingContext.Provider>
  );
}

/**
 * Hook para acceder al contexto de control de tiempo.
 * Debe usarse dentro de un <TimeTrackingProvider>.
 */
export function useTimeTracking(): TimeTrackingContextType {
  const context = useContext(TimeTrackingContext);
  if (!context) {
    throw new Error(
      'useTimeTracking debe usarse dentro de un <TimeTrackingProvider>'
    );
  }
  return context;
}
