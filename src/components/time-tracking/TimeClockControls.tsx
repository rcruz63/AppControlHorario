// ============================================================
// TimeClockControls — Botones principales de fichaje
// ============================================================

import { useState } from 'react';
import { useTimeTracking } from '@/contexts/TimeTrackingContext';
import { useToast } from '@/components/ui/Toast';
import {
  Play,
  Square,
  Pause,
  RotateCcw,
  Coffee,
  UtensilsCrossed,
  MoreHorizontal,
  Loader2,
} from 'lucide-react';
import { formatDuration } from '@/lib/calculations';
import { PAUSE_TYPE_LABELS } from '@/types';
import type { PauseType } from '@/types';

export default function TimeClockControls() {
  const { status, elapsedSeconds, pauseSeconds, startWorkday, endWorkday, startPause, endPause } =
    useTimeTracking();
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPauseMenu, setShowPauseMenu] = useState(false);

  const handleAction = async (action: () => Promise<void>, successMessage: string) => {
    setIsLoading(true);
    try {
      await action();
      showToast('success', successMessage);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error inesperado';
      showToast('error', message);
    } finally {
      setIsLoading(false);
      setShowPauseMenu(false);
    }
  };

  const handleStartPause = async (type: PauseType) => {
    await handleAction(
      () => startPause(type),
      `Pausa de ${PAUSE_TYPE_LABELS[type].toLowerCase()} iniciada`
    );
  };

  const PAUSE_OPTIONS: { type: PauseType; icon: typeof Coffee; label: string }[] = [
    { type: 'meal', icon: UtensilsCrossed, label: 'Comida' },
    { type: 'break', icon: Coffee, label: 'Descanso' },
    { type: 'other', icon: MoreHorizontal, label: 'Otra' },
  ];

  return (
    <div className="bg-bg-surface rounded-2xl p-6 shadow-md">
      {/* Estado actual con timer */}
      <div className="text-center mb-6">
        <div className="flex items-center justify-center gap-2 mb-2">
          <span
            className={`w-3 h-3 rounded-full status-pulse ${
              status === 'idle'
                ? 'bg-text-tertiary'
                : status === 'working'
                  ? 'bg-success'
                  : 'bg-warning'
            }`}
          />
          <span className="text-sm font-medium text-text-secondary">
            {status === 'idle'
              ? 'Sin jornada activa'
              : status === 'working'
                ? 'Trabajando'
                : 'En pausa'}
          </span>
        </div>

        {status !== 'idle' && (
          <div className="space-y-1">
            <p className="text-4xl font-bold text-text-primary timer-display">
              {formatDuration(elapsedSeconds, true)}
            </p>
            {status === 'paused' && pauseSeconds > 0 && (
              <p className="text-lg text-warning font-semibold timer-display">
                Pausa: {formatDuration(pauseSeconds, true)}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Botones de acción */}
      <div className="flex flex-col gap-3">
        {/* ENTRAR */}
        {status === 'idle' && (
          <button
            onClick={() => handleAction(startWorkday, 'Jornada iniciada correctamente')}
            disabled={isLoading}
            className="flex items-center justify-center gap-3 py-4 px-6 rounded-xl bg-success hover:bg-success/90 text-white font-semibold text-lg transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed shadow-md hover:shadow-lg active:scale-[0.98] cursor-pointer"
          >
            {isLoading ? <Loader2 size={24} className="animate-spin" /> : <Play size={24} />}
            Entrar
          </button>
        )}

        {/* PAUSA (cuando está trabajando) */}
        {status === 'working' && (
          <div className="relative">
            <button
              onClick={() => setShowPauseMenu(!showPauseMenu)}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 py-4 px-6 rounded-xl bg-warning hover:bg-warning/90 text-white font-semibold text-lg transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed shadow-md hover:shadow-lg active:scale-[0.98] cursor-pointer"
            >
              {isLoading ? <Loader2 size={24} className="animate-spin" /> : <Pause size={24} />}
              Pausar
            </button>

            {/* Menú de tipos de pausa */}
            {showPauseMenu && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-bg-surface rounded-xl shadow-xl border border-border p-2 z-10 animate-scale-in">
                {PAUSE_OPTIONS.map(({ type, icon: PauseIcon, label }) => (
                  <button
                    key={type}
                    onClick={() => handleStartPause(type)}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-bg-input text-sm font-medium text-text-primary transition-colors cursor-pointer"
                  >
                    <PauseIcon size={18} className="text-text-secondary" />
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* REANUDAR (cuando está en pausa) */}
        {status === 'paused' && (
          <button
            onClick={() => handleAction(endPause, 'Pausa finalizada, ¡a trabajar!')}
            disabled={isLoading}
            className="flex items-center justify-center gap-3 py-4 px-6 rounded-xl bg-secondary hover:bg-secondary-hover text-white font-semibold text-lg transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed shadow-md hover:shadow-lg active:scale-[0.98] cursor-pointer"
          >
            {isLoading ? <Loader2 size={24} className="animate-spin" /> : <RotateCcw size={24} />}
            Reanudar
          </button>
        )}

        {/* SALIR (cuando hay jornada activa) */}
        {status !== 'idle' && (
          <button
            onClick={() => handleAction(endWorkday, 'Jornada finalizada. ¡Buen trabajo!')}
            disabled={isLoading}
            className="flex items-center justify-center gap-3 py-4 px-6 rounded-xl bg-danger hover:bg-danger/90 text-white font-semibold text-lg transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed shadow-md hover:shadow-lg active:scale-[0.98] cursor-pointer"
          >
            {isLoading ? <Loader2 size={24} className="animate-spin" /> : <Square size={24} />}
            Salir
          </button>
        )}
      </div>

      {/* Click outside to close pause menu */}
      {showPauseMenu && (
        <div className="fixed inset-0 z-[9]" onClick={() => setShowPauseMenu(false)} />
      )}
    </div>
  );
}
