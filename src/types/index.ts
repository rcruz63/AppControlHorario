// ============================================================
// Domain Types — AppControlHorario
// ============================================================

/** Posibles estados de una jornada laboral */
export type TimeEntryStatus = 'active' | 'paused' | 'completed';

/** Tipos de pausa permitidos */
export type PauseType = 'meal' | 'break' | 'other';

/** Labels legibles para los tipos de pausa */
export const PAUSE_TYPE_LABELS: Record<PauseType, string> = {
  meal: 'Comida',
  break: 'Descanso',
  other: 'Otra',
};

/** Labels legibles para los estados de jornada */
export const STATUS_LABELS: Record<TimeEntryStatus, string> = {
  active: 'Trabajando',
  paused: 'En pausa',
  completed: 'Finalizada',
};

// ---- Entidades de base de datos ----

export interface Profile {
  id: string;
  full_name: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface TimeEntry {
  id: string;
  user_id: string;
  date: string;            // formato YYYY-MM-DD
  clock_in: string;        // ISO 8601
  clock_out: string | null;
  total_hours: number | null;
  status: TimeEntryStatus;
  edited_manually: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
  pauses?: Pause[];        // incluido opcionalmente en queries con join
}

export interface Pause {
  id: string;
  time_entry_id: string;
  start_time: string;      // ISO 8601
  end_time: string | null;
  type: PauseType;
  duration: number | null;  // en minutos
  created_at: string;
  updated_at: string;
}

// ---- Estadísticas calculadas ----

export interface DailyStats {
  date: string;
  totalWorked: number;   // en horas decimales
  totalPaused: number;   // en horas decimales
  entries: number;
}

export interface WeeklyStats {
  totalHours: number;
  averageDaily: number;
  daysWorked: number;
  dailyBreakdown: DailyStats[];
}

export interface MonthlyStats {
  totalHours: number;
  averageDaily: number;
  daysWorked: number;
  weeklyBreakdown: WeeklyStats[];
}

// ---- Estado de la aplicación ----

/** Estado de la máquina de estados del control de jornada */
export type WorkdayState = 'idle' | 'working' | 'paused';

export interface TimeTrackingState {
  status: WorkdayState;
  currentEntry: TimeEntry | null;
  currentPause: Pause | null;
  todayEntries: TimeEntry[];
  elapsedSeconds: number;    // timer en vivo
  pauseSeconds: number;      // timer de pausa en vivo
}

// ---- DTOs para formularios ----

export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  full_name: string;
  email: string;
  password: string;
  confirm_password: string;
}

export interface ProfileFormData {
  full_name: string;
  avatar_url?: string;
}

export interface TimeEntryEditData {
  clock_in: string;
  clock_out: string | null;
  notes: string | null;
}

// ---- Tipos de la base de datos para Supabase ----

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      time_entries: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          clock_in: string;
          clock_out: string | null;
          total_hours: number | null;
          status: TimeEntryStatus;
          edited_manually: boolean;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          date: string;
          clock_in: string;
          clock_out?: string | null;
          total_hours?: number | null;
          status?: TimeEntryStatus;
          edited_manually?: boolean;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          date?: string;
          clock_in?: string;
          clock_out?: string | null;
          total_hours?: number | null;
          status?: TimeEntryStatus;
          edited_manually?: boolean;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      pauses: {
        Row: {
          id: string;
          time_entry_id: string;
          start_time: string;
          end_time: string | null;
          type: PauseType;
          duration: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          time_entry_id: string;
          start_time: string;
          end_time?: string | null;
          type: PauseType;
          duration?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          time_entry_id?: string;
          start_time?: string;
          end_time?: string | null;
          type?: PauseType;
          duration?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "pauses_time_entry_id_fkey";
            columns: ["time_entry_id"];
            isOneToOne: false;
            referencedRelation: "time_entries";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
