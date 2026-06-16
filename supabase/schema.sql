-- ============================================================
-- Schema SQL — AppControlHorario
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- Habilitar UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- Tabla de Perfiles (enlazada con auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Tabla de Registros de Tiempo
-- ============================================================
CREATE TABLE IF NOT EXISTS time_entries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  clock_in TIMESTAMPTZ NOT NULL,
  clock_out TIMESTAMPTZ,
  total_hours DECIMAL(5,2),
  status TEXT CHECK (status IN ('active', 'paused', 'completed')) DEFAULT 'active',
  edited_manually BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Tabla de Pausas
-- ============================================================
CREATE TABLE IF NOT EXISTS pauses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  time_entry_id UUID REFERENCES time_entries(id) ON DELETE CASCADE NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  type TEXT CHECK (type IN ('meal', 'break', 'other')) NOT NULL,
  duration INTEGER, -- en minutos
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Índices para mejor rendimiento
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_time_entries_user_id ON time_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_date ON time_entries(date);
CREATE INDEX IF NOT EXISTS idx_time_entries_status ON time_entries(status);
CREATE INDEX IF NOT EXISTS idx_pauses_time_entry_id ON pauses(time_entry_id);

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE pauses ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para Profiles
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can delete own profile" ON profiles;
CREATE POLICY "Users can delete own profile"
  ON profiles FOR DELETE
  USING (auth.uid() = id);

-- Políticas RLS para Time Entries
DROP POLICY IF EXISTS "Users can view own time entries" ON time_entries;
CREATE POLICY "Users can view own time entries"
  ON time_entries FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own time entries" ON time_entries;
CREATE POLICY "Users can insert own time entries"
  ON time_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own time entries" ON time_entries;
CREATE POLICY "Users can update own time entries"
  ON time_entries FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own time entries" ON time_entries;
CREATE POLICY "Users can delete own time entries"
  ON time_entries FOR DELETE
  USING (auth.uid() = user_id);

-- Políticas RLS para Pauses (validación via time_entry ownership)
DROP POLICY IF EXISTS "Users can view own pauses" ON pauses;
CREATE POLICY "Users can view own pauses"
  ON pauses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM time_entries
      WHERE time_entries.id = pauses.time_entry_id
      AND time_entries.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert own pauses" ON pauses;
CREATE POLICY "Users can insert own pauses"
  ON pauses FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM time_entries
      WHERE time_entries.id = pauses.time_entry_id
      AND time_entries.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update own pauses" ON pauses;
CREATE POLICY "Users can update own pauses"
  ON pauses FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM time_entries
      WHERE time_entries.id = pauses.time_entry_id
      AND time_entries.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete own pauses" ON pauses;
CREATE POLICY "Users can delete own pauses"
  ON pauses FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM time_entries
      WHERE time_entries.id = pauses.time_entry_id
      AND time_entries.user_id = auth.uid()
    )
  );

-- ============================================================
-- Función para crear perfil automáticamente al registrarse
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuario'));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para ejecutar la función
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- Función para actualizar updated_at automáticamente
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_time_entries_updated_at ON time_entries;
CREATE TRIGGER update_time_entries_updated_at BEFORE UPDATE ON time_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_pauses_updated_at ON pauses;
CREATE TRIGGER update_pauses_updated_at BEFORE UPDATE ON pauses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- Restricciones y Triggers de Integridad de Negocio
-- ============================================================

-- Índice único parcial: Un usuario no puede tener más de una jornada activa o pausada a la vez
CREATE UNIQUE INDEX IF NOT EXISTS idx_active_time_entries 
  ON time_entries (user_id) 
  WHERE status IN ('active', 'paused');

-- Función de validación para el rango y solapamiento de pausas
CREATE OR REPLACE FUNCTION validate_pause_range()
RETURNS TRIGGER AS $$
DECLARE
  v_clock_in TIMESTAMPTZ;
  v_clock_out TIMESTAMPTZ;
  v_entry_status TEXT;
BEGIN
  SELECT clock_in, clock_out, status INTO v_clock_in, v_clock_out, v_entry_status
  FROM time_entries WHERE id = NEW.time_entry_id;

  IF v_entry_status = 'completed' AND TG_OP = 'INSERT' THEN
    RAISE EXCEPTION 'No se pueden añadir pausas a una jornada completada';
  END IF;

  IF NEW.start_time < v_clock_in THEN
    RAISE EXCEPTION 'La pausa no puede iniciar antes del inicio de la jornada';
  END IF;

  IF v_clock_out IS NOT NULL AND NEW.end_time IS NOT NULL AND NEW.end_time > v_clock_out THEN
    RAISE EXCEPTION 'La pausa no puede finalizar después del fin de la jornada';
  END IF;

  -- Validar solapamientos de pausas en la misma jornada
  IF EXISTS (
    SELECT 1 FROM pauses
    WHERE time_entry_id = NEW.time_entry_id
      AND id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
      AND (
        (NEW.start_time, COALESCE(NEW.end_time, '9999-12-31 23:59:59+00'::timestamptz)) OVERLAPS
        (start_time, COALESCE(end_time, '9999-12-31 23:59:59+00'::timestamptz))
      )
  ) THEN
    RAISE EXCEPTION 'La pausa se solapa con otra pausa existente';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para validar rango de pausas
DROP TRIGGER IF EXISTS trg_validate_pause_range ON pauses;
CREATE TRIGGER trg_validate_pause_range
  BEFORE INSERT OR UPDATE ON pauses
  FOR EACH ROW EXECUTE FUNCTION validate_pause_range();
