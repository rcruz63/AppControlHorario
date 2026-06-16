// ============================================================
// Supabase Client — Wrapper con abstracción de dependencia
// ============================================================
// Siguiendo el principio de Agnosticismo de Dependencias:
// Si cambiamos Supabase por otro backend, solo editamos este archivo.

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'Faltan variables de entorno VITE_SUPABASE_URL y/o VITE_SUPABASE_ANON_KEY. ' +
    'Copia .env.example a .env y configúralas.'
  );
}

export const supabase: SupabaseClient<Database> = createClient<Database>(
  supabaseUrl ?? '',
  supabaseAnonKey ?? '',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  }
);
