# Especificación Técnica: Aplicación de Control Horario

## 1. VISIÓN GENERAL DEL PROYECTO

### 1.1 Descripción

Aplicación web moderna para control y gestión de horarios laborales que permite a los usuarios registrar entradas/salidas, gestionar pausas y generar reportes de tiempo trabajado.

### 1.2 Objetivos

* Facilitar el registro de jornadas laborales de forma intuitiva  
* Calcular automáticamente horas trabajadas y descansos  
* Generar reportes visuales del tiempo trabajado  
* Proporcionar una interfaz moderna y responsive

### 1.3 Alcance

**Incluido en MVP:**

* Sistema de autenticación (registro y login)  
* Gestión de usuarios con datos privados  
* Registro de entrada/salida (check-in/check-out)  
* Gestión de pausas/descansos  
* Cálculo automático de horas trabajadas  
* Vista de historial diario/semanal/mensual  
* Dashboard con estadísticas básicas  
* Exportación de reportes  
* Persistencia en Supabase

**Fuera del alcance inicial:**

* Gestión multi-usuario/empresa (roles y equipos)  
* Sistema de aprobaciones de supervisor  
* Integración con nóminas  
* Geolocalización  
* OAuth/Social login (Google, GitHub, etc.)

---

## 2. REQUERIMIENTOS FUNCIONALES

### 2.1 Autenticación y Gestión de Usuarios

**RF-001: Registro de Usuario**

* Formulario con campos: email, contraseña, nombre completo  
* Validación de email válido  
* Validación de contraseña (mínimo 8 caracteres)  
* Confirmación de contraseña  
* Email de verificación (opcional)  
* Creación automática de perfil de usuario en Supabase  
* Redirección automática al dashboard tras registro exitoso

**RF-002: Login de Usuario**

* Formulario con email y contraseña  
* Validación de credenciales contra Supabase Auth  
* Mantener sesión activa (remember me)  
* Manejo de errores (credenciales incorrectas)  
* Redirección al dashboard tras login exitoso

**RF-003: Logout**

* Botón de cerrar sesión visible en toda la app  
* Limpiar sesión de Supabase  
* Redirección a página de login  
* Confirmación antes de cerrar sesión si hay jornada activa

**RF-004: Recuperación de Contraseña**

* Link "¿Olvidaste tu contraseña?"  
* Envío de email de recuperación vía Supabase  
* Página de reset con token de seguridad  
* Actualización de contraseña

**RF-005: Perfil de Usuario**

* Vista de información personal  
* Edición de nombre y datos de perfil  
* Cambio de contraseña  
* Opción de eliminar cuenta (con confirmación)

**RF-006: Protección de Rutas**

* Todas las rutas excepto login/registro requieren autenticación  
* Redirección automática a login si no está autenticado  
* Prevención de acceso a login/registro si ya está autenticado

### **2.2 Gestión de Jornada Laboral**

**RF-007: Iniciar Jornada**

* El usuario puede registrar el inicio de su jornada con un botón "Entrar"  
* Se captura fecha y hora automáticamente  
* Se asocia con el user\_id del usuario autenticado  
* Se muestra confirmación visual del registro  
* El estado cambia a "En trabajo"  
* Se guarda en Supabase

**RF-008: Finalizar Jornada**

* El usuario puede registrar el fin de su jornada con un botón "Salir"  
* Se captura fecha y hora automáticamente  
* Se calcula y muestra el total de horas trabajadas  
* Se actualiza el registro en Supabase  
* Se actualiza el historial

**RF-009: Gestión de Pausas**

* El usuario puede iniciar una pausa durante la jornada  
* El usuario puede finalizar la pausa y volver al trabajo  
* Se contabiliza el tiempo de pausa por separado  
* Tipos de pausa: Comida, Descanso, Otra  
* Se actualizan en tiempo real en Supabase

**RF-010: Validaciones**

* No permitir "Salir" sin haber hecho "Entrar"  
* No permitir múltiples "Entrar" activos simultáneamente  
* No permitir iniciar pausa si no hay jornada activa  
* Validar que solo el propietario pueda modificar sus registros

### 2.2 Visualización y Reportes

**RF-011: Dashboard Principal**

* Mostrar estado actual (trabajando, en pausa, fuera de jornada)  
* Mostrar tiempo trabajado hoy  
* Mostrar tiempo en pausa hoy  
* Botones principales de acción según el estado  
* Solo mostrar datos del usuario autenticado

**RF-012: Historial de Registros**

* Vista de calendario con registros diarios del usuario  
* Lista detallada por día con entradas, salidas y pausas  
* Filtros por fecha (día, semana, mes)  
* Visualización de horas totales por período  
* Datos privados, solo visibles para el usuario propietario

**RF-013: Estadísticas**

* Total horas trabajadas en la semana  
* Total horas trabajadas en el mes  
* Promedio de horas diarias  
* Gráfico de distribución de horas por día  
* Basadas únicamente en los datos del usuario actual

**RF-014: Exportación**

* Exportar datos propios a CSV  
* Exportar rango de fechas seleccionado  
* Formato: Fecha, Hora Entrada, Hora Salida, Pausas, Total Horas

### 2.3 Edición y Gestión

**RF-015: Editar Registros**

* Permitir editar solo registros propios  
* Modificar horas de entrada/salida  
* Agregar/eliminar pausas  
* Mostrar indicador de "editado manualmente"  
* Actualizar en Supabase

**RF-016: Eliminar Registros**

* Permitir eliminar solo registros propios  
* Solicitar confirmación antes de eliminar  
* No permitir eliminar jornada activa  
* Eliminación permanente en Supabase

---

## 3. REQUERIMIENTOS NO FUNCIONALES

### 3.1 Usabilidad

* **RNF-001:** Interfaz intuitiva, accesible sin capacitación  
* **RNF-002:** Responsive design (móvil, tablet, desktop)  
* **RNF-003:** Feedback visual inmediato en todas las acciones  
* **RNF-004:** Diseño moderno con estética "vibe coding"

### **3.2 Rendimiento**

* **RNF-005:** Carga inicial \< 2 segundos  
* **RNF-006:** Respuesta a acciones \< 200ms  
* **RNF-007:** Funcionar sin conexión (offline-first con sincronización)

### **3.3 Confiabilidad**

* **RNF-008:** Los datos deben persistir en Supabase de forma segura  
* **RNF-009:** Prevención de pérdida de datos con transacciones  
* **RNF-010:** Validación robusta de datos en cliente y servidor

### **3.4 Seguridad**

* **RNF-011:** Contraseñas hasheadas (manejado por Supabase Auth)  
* **RNF-012:** Sesiones seguras con tokens JWT  
* **RNF-013:** Row Level Security (RLS) en todas las tablas de Supabase  
* **RNF-014:** Validación de permisos en cada operación  
* **RNF-015:** Protección contra SQL injection (ORM de Supabase)  
* **RNF-016:** HTTPS obligatorio en producción

### **3.5 Compatibilidad**

* **RNF-017:** Navegadores modernos (Chrome, Firefox, Safari, Edge)  
* **RNF-018:** Progressive Web App (PWA) instalable

---

## 4. ARQUITECTURA TÉCNICA

### 4.1 Stack Tecnológico Recomendado

**Frontend:**

* React 18+ con TypeScript  
* Vite como build tool  
* Tailwind CSS para estilos  
* shadcn/ui para componentes base  
* Recharts para gráficos  
* date-fns para manejo de fechas  
* React Router DOM para navegación

**Backend y Base de Datos:**

* **Supabase** como Backend-as-a-Service (BaaS)  
  * Supabase Auth para autenticación  
  * Supabase Database (PostgreSQL) para datos  
  * Supabase Client para JavaScript  
  * Row Level Security (RLS) activado

**Estado y Persistencia:**

* React Context \+ Hooks para estado global  
* Supabase como fuente de verdad  
* React Query (TanStack Query) para caché y sincronización  
* LocalStorage solo para preferencias UI

**Utilidades:**

* Zod para validación de esquemas  
* React Hook Form para formularios  
* Lucide React para iconos  
* @supabase/supabase-js (cliente oficial)

### **4.2 Arquitectura de Componentes**

src/  
├── components/  
│   ├── auth/  
│   │   ├── LoginForm.tsx  
│   │   ├── RegisterForm.tsx  
│   │   ├── ForgotPasswordForm.tsx  
│   │   ├── ResetPasswordForm.tsx  
│   │   └── ProtectedRoute.tsx  
│   ├── layout/  
│   │   ├── Header.tsx  
│   │   ├── Sidebar.tsx  
│   │   ├── Layout.tsx  
│   │   └── UserMenu.tsx  
│   ├── time-tracking/  
│   │   ├── TimeClockControls.tsx  
│   │   ├── CurrentStatus.tsx  
│   │   └── PauseControls.tsx  
│   ├── history/  
│   │   ├── TimeEntryList.tsx  
│   │   ├── TimeEntryCard.tsx  
│   │   └── Calendar.tsx  
│   ├── dashboard/  
│   │   ├── StatsCard.tsx  
│   │   ├── WeeklyChart.tsx  
│   │   └── MonthlyChart.tsx  
│   ├── reports/  
│   │   ├── ExportButton.tsx  
│   │   └── ReportFilters.tsx  
│   ├── profile/  
│   │   ├── ProfileForm.tsx  
│   │   └── ChangePasswordForm.tsx  
│   └── ui/  
│       └── \[componentes shadcn\]  
├── hooks/  
│   ├── useAuth.ts  
│   ├── useTimeTracking.ts  
│   ├── useTimeEntries.ts  
│   ├── useStats.ts  
│   └── useSupabase.ts  
├── lib/  
│   ├── supabase.ts (cliente Supabase)  
│   ├── utils.ts  
│   └── calculations.ts  
├── types/  
│   └── index.ts  
├── contexts/  
│   ├── AuthContext.tsx  
│   └── TimeTrackingContext.tsx  
├── pages/  
│   ├── Login.tsx  
│   ├── Register.tsx  
│   ├── ForgotPassword.tsx  
│   ├── Dashboard.tsx  
│   ├── History.tsx  
│   ├── Reports.tsx  
│   └── Profile.tsx  
└── App.tsx

### 4.3 Modelo de Datos

**Users (Tabla de Supabase Auth - auth.users)**

// Manejada automáticamente por Supabase Auth  
interface AuthUser {  
  id: string; // UUID  
  email: string;  
  created\_at: Date;  
  // Otros campos de Supabase Auth  
}

**Profiles (Tabla personalizada - public.profiles)**

interface Profile {  
  id: string; // FK a auth.users.id  
  full_name: string;  
  avatar_url?: string;  
  created_at: Date;  
  updated_at: Date;  
}

**TimeEntry (Registros de Tiempo - public.time_entries)**

interface TimeEntry {  
  id: string; // UUID  
  user_id: string; // FK a auth.users.id  
  date: Date;  
  clock_in: Date;  
  clock_out: Date | null;  
  total_hours: number | null;  
  status: 'active' | 'paused' | 'completed';  
  edited_manually: boolean;  
  notes?: string;  
  created_at: Date;  
  updated_at: Date;  
}

**Pause (Pausas - public.pauses)**

interface Pause {  
  id: string; // UUID  
  time_entry_id: string; // FK a time_entries.id  
  start_time: Date;  
  end_time: Date | null;  
  type: 'meal' | 'break' | 'other';  
  duration: number | null; // en minutos  
  created_at: Date;  
  updated_at: Date;  
}

**DailyStats (Vista o cálculo en tiempo real)**

interface DailyStats {  
  date: Date;  
  totalWorked: number; // en horas  
  totalPaused: number; // en horas  
  entries: number; // cantidad de registros  
}

### **4.4 Esquema de Base de Datos Supabase**

**SQL para crear las tablas:**

-- Habilitar UUID  
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabla de Perfiles (enlazada con auth.users)  
CREATE TABLE profiles (  
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,  
  full_name TEXT NOT NULL,  
  avatar_url TEXT,  
  created_at TIMESTAMPTZ DEFAULT NOW(),  
  updated_at TIMESTAMPTZ DEFAULT NOW()  
);

-- Tabla de Registros de Tiempo  
CREATE TABLE time_entries (  
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

-- Tabla de Pausas  
CREATE TABLE pauses (  
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,  
  time_entry_id UUID REFERENCES time_entries(id) ON DELETE CASCADE NOT NULL,  
  start_time TIMESTAMPTZ NOT NULL,  
  end_time TIMESTAMPTZ,  
  type TEXT CHECK (type IN ('meal', 'break', 'other')) NOT NULL,  
  duration INTEGER, -- en minutos  
  created_at TIMESTAMPTZ DEFAULT NOW(),  
  updated_at TIMESTAMPTZ DEFAULT NOW()  
);

-- Índices para mejor rendimiento  
CREATE INDEX idx_time_entries_user_id ON time_entries(user_id);  
CREATE INDEX idx_time_entries_date ON time_entries(date);  
CREATE INDEX idx_time_entries_status ON time_entries(status);  
CREATE INDEX idx_pauses_time_entry_id ON pauses(time_entry_id);

-- Row Level Security (RLS)  
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;  
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;  
ALTER TABLE pauses ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para Profiles  
CREATE POLICY "Users can view own profile"   
  ON profiles FOR SELECT   
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"   
  ON profiles FOR UPDATE   
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"   
  ON profiles FOR INSERT   
  WITH CHECK (auth.uid() = id);

-- Políticas RLS para Time Entries  
CREATE POLICY "Users can view own time entries"   
  ON time_entries FOR SELECT   
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own time entries"   
  ON time_entries FOR INSERT   
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own time entries"   
  ON time_entries FOR UPDATE   
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own time entries"   
  ON time_entries FOR DELETE   
  USING (auth.uid() = user_id);

-- Políticas RLS para Pauses  
CREATE POLICY "Users can view own pauses"   
  ON pauses FOR SELECT   
  USING (  
    EXISTS (  
      SELECT 1 FROM time_entries   
      WHERE time_entries.id = pauses.time_entry_id   
      AND time_entries.user_id = auth.uid()  
    )  
  );

CREATE POLICY "Users can insert own pauses"   
  ON pauses FOR INSERT   
  WITH CHECK (  
    EXISTS (  
      SELECT 1 FROM time_entries   
      WHERE time_entries.id = pauses.time_entry_id   
      AND time_entries.user_id = auth.uid()  
    )  
  );

CREATE POLICY "Users can update own pauses"   
  ON pauses FOR UPDATE   
  USING (  
    EXISTS (  
      SELECT 1 FROM time_entries   
      WHERE time_entries.id = pauses.time_entry_id   
      AND time_entries.user_id = auth.uid()  
    )  
  );

CREATE POLICY "Users can delete own pauses"   
  ON pauses FOR DELETE   
  USING (  
    EXISTS (  
      SELECT 1 FROM time_entries   
      WHERE time_entries.id = pauses.time_entry_id   
      AND time_entries.user_id = auth.uid()  
    )  
  );

-- Función para crear perfil automáticamente al registrarse  
CREATE OR REPLACE FUNCTION handle_new_user()   
RETURNS TRIGGER AS $  
BEGIN  
  INSERT INTO profiles (id, full_name)  
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuario'));  
  RETURN NEW;  
END;  
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para ejecutar la función  
CREATE TRIGGER on_auth_user_created  
  AFTER INSERT ON auth.users  
  FOR EACH ROW  
  EXECUTE FUNCTION handle_new_user();

-- Función para actualizar updated_at automáticamente  
CREATE OR REPLACE FUNCTION update_updated_at_column()  
RETURNS TRIGGER AS $  
BEGIN  
  NEW.updated_at = NOW();  
  RETURN NEW;  
END;  
$ LANGUAGE plpgsql;

-- Triggers para updated_at  
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles  
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_time_entries_updated_at BEFORE UPDATE ON time_entries  
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pauses_updated_at BEFORE UPDATE ON pauses  
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

### **4.5 Configuración de Supabase**

**Variables de Entorno (.env):**

VITE_SUPABASE_URL=https://tu-proyecto.supabase.co  
VITE_SUPABASE_ANON_KEY=tu_clave_publica_anon

**Cliente de Supabase (lib/supabase.ts):**

import { createClient } from '@supabase/supabase-js'  
import type { Database } from '@/types/database'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL  
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {  
  auth: {  
    persistSession: true,  
    autoRefreshToken: true,  
  }  
})

**Configuración en Supabase Dashboard:**

1. Crear nuevo proyecto en supabase.com  
2. Ejecutar el SQL del esquema en SQL Editor  
3. En Authentication \> Settings:  
   * Habilitar Email provider  
   * Configurar Email templates (opcional)  
   * Configurar Site URL y Redirect URLs  
4. Copiar Project URL y anon/public key

### **4.6 Flujos de Datos Principales**

**1. Registro de Usuario:**

Usuario completa formulario  
  → Llamar supabase.auth.signUp({ email, password, options: { data: { full_name } } })  
  → Supabase crea usuario en auth.users  
  → Trigger automático crea perfil en profiles  
  → Redirección a dashboard  
  → Context actualizado con usuario

**2. Login:**

Usuario envía credenciales  
  → Llamar supabase.auth.signInWithPassword({ email, password })  
  → Supabase valida y retorna sesión + JWT  
  → Guardar sesión en localStorage (automático)  
  → Cargar perfil desde profiles  
  → Actualizar AuthContext  
  → Redirección a dashboard

**3. Iniciar Jornada:**

Usuario click "Entrar"  
  → Obtener user_id de sesión actual  
  → Crear TimeEntry en Supabase  
    supabase.from('time_entries').insert({  
      user_id: user.id,  
      clock_in: new Date(),  
      date: today,  
      status: 'active'  
    })  
  → RLS valida que user_id = auth.uid()  
  → Actualizar estado local  
  → Mostrar UI de "trabajando"

**4. Iniciar Pausa:**

Usuario click "Pausa"  
  → Obtener time_entry_id actual  
  → Insertar Pause en Supabase  
    supabase.from('pauses').insert({  
      time_entry_id: currentEntry.id,  
      start_time: new Date(),  
      type: 'break'  
    })  
  → Actualizar status de time_entry a 'paused'  
  → RLS valida propiedad a través de time_entry  
  → Actualizar UI

**5. Cargar Historial:**

Al montar componente History  
  → Consultar time_entries del usuario  
    supabase  
      .from('time_entries')  
      .select('\*, pauses(\*)')  
      .eq('user_id', user.id)  
      .gte('date', startDate)  
      .lte('date', endDate)  
      .order('date', { ascending: false })  
  → RLS filtra automáticamente por user_id  
  → Renderizar en UI

**6. Calcular Horas:**

Al finalizar jornada o pausa:  
  → Calcular en cliente  
    total = clockOut - clockIn  
    restar suma de duraciones de pausas  
  → Actualizar time_entry en Supabase  
    supabase  
      .from('time_entries')  
      .update({   
        clock_out: new Date(),   
        total_hours: calculatedHours,  
        status: 'completed'   
      })  
      .eq('id', entryId)  
  → RLS valida propiedad  
  → Actualizar UI y estadísticas

---

## 5. INTERFAZ DE USUARIO

### 5.1 Páginas Principales

**Página de Login**

* Formulario centrado y minimalista  
* Campos: email, contraseña  
* Botón "Iniciar Sesión"  
* Link a "¿Olvidaste tu contraseña?"  
* Link a "Crear cuenta"  
* Validación en tiempo real  
* Mensajes de error claros

**Página de Registro**

* Formulario similar a login  
* Campos: nombre completo, email, contraseña, confirmar contraseña  
* Botón "Registrarse"  
* Link a "Ya tengo cuenta"  
* Validación de contraseña fuerte  
* Términos y condiciones checkbox

**Recuperación de Contraseña**

* Campo email único  
* Botón "Enviar email de recuperación"  
* Mensaje de confirmación  
* Link de vuelta a login

**Dashboard (Página Principal)**

* Header con saludo personalizado y foto de perfil  
* Estado actual grande y visible  
* Botones de acción principales (tamaño grande, colores distintivos)  
* Resumen del día actual  
* Estadísticas rápidas de la semana  
* Botón de cerrar sesión en header

**Historial**

* Vista de calendario mensual  
* Lista de registros con scroll  
* Tarjetas por día expandibles  
* Acciones de editar/eliminar  
* Solo muestra datos del usuario actual

**Reportes**

* Filtros de fecha (rango personalizado)  
* Gráficos visuales (barras, líneas)  
* Tabla resumen  
* Botón de exportación

**Perfil**

* Información del usuario  
* Formulario de edición (nombre, email)  
* Cambio de contraseña  
* Avatar (opcional)  
* Botón "Eliminar cuenta"

### **5.2 Diseño Visual (Vibe Coding Style)**

**Paleta de Colores:**

* Primario: Azul vibrante (\#3B82F6)  
* Secundario: Púrpura (\#8B5CF6)  
* Éxito: Verde (\#10B981)  
* Advertencia: Ámbar (\#F59E0B)  
* Error: Rojo (\#EF4444)  
* Fondo: Gris claro/oscuro según tema

**Tipografía:**

* Inter o similar (moderna, legible)  
* Tamaños jerárquicos claros  
* Peso variable para énfasis

**Componentes:**

* Bordes redondeados (rounded-lg)  
* Sombras sutiles  
* Animaciones suaves (transitions)  
* Glassmorphism en cards principales  
* Micro-interacciones en botones

### 5.3 Responsive Breakpoints

* **Mobile:** < 640px (1 columna, botones grandes)  
* **Tablet:** 640px - 1024px (2 columnas)  
* **Desktop:** > 1024px (3 columnas, sidebar)

---

## 6. LÓGICA DE NEGOCIO Y AUTENTICACIÓN

### 6.1 Sistema de Autenticación

**Hook useAuth:**

interface AuthContextType {  
  user: User | null;  
  profile: Profile | null;  
  loading: boolean;  
  signUp: (email: string, password: string, fullName: string) => Promise<void>;  
  signIn: (email: string, password: string) => Promise<void>;  
  signOut: () => Promise<void>;  
  resetPassword: (email: string) => Promise<void>;  
  updatePassword: (newPassword: string) => Promise<void>;  
}

export function useAuth() {  
  // Implementación del contexto de autenticación  
  // Manejo de sesión con Supabase  
  // Listeners de cambios de estado auth.onAuthStateChange()  
}

**Protección de Rutas:**

function ProtectedRoute({ children }: { children: ReactNode }) {  
  const { user, loading } = useAuth();  
    
  if (loading) return <LoadingSpinner />;  
  if (!user) return <Navigate to="/login" />;  
    
  return <>{children}</>;  
}

**Flujo de Sesión:**

1. Al iniciar app: verificar sesión existente con supabase.auth.getSession()  
2. Si hay sesión válida: cargar usuario y perfil  
3. Si no hay sesión: redireccionar a login  
4. Escuchar cambios: supabase.auth.onAuthStateChange()

### 6.2 Cálculos de Tiempo

**Calcular Horas Trabajadas:**

function calculateWorkedHours(entry: TimeEntry): number {  
  if (!entry.clockOut) return 0;  
    
  const totalMinutes = differenceInMinutes(entry.clockOut, entry.clockIn);  
  const pauseMinutes = entry.pauses  
    .filter(p => p.endTime)  
    .reduce((sum, p) => sum + differenceInMinutes(p.endTime!, p.startTime), 0);  
    
  return (totalMinutes - pauseMinutes) / 60;  
}

**Calcular Estadísticas Semanales:**

function getWeeklyStats(entries: TimeEntry\[\]): WeeklyStats {  
  const weekStart = startOfWeek(new Date());  
  const weekEntries = entries.filter(e =>   
    isAfter(e.date, weekStart) &&   
    e.total_hours !== null &&  
    e.user_id === currentUser.id // Solo del usuario actual  
  );  
    
  return {  
    totalHours: sum(weekEntries.map(e => e.total_hours)),  
    averageDaily: average(weekEntries.map(e => e.total_hours)),  
    daysWorked: weekEntries.length  
  };  
}

### 6.3 Validaciones de Seguridad

**Validar Registro:**

* Email válido (formato correcto)  
* Contraseña mínimo 8 caracteres  
* Contraseña coincide con confirmación  
* Nombre completo no vacío  
* Email no registrado previamente (manejado por Supabase)

**Validar Inicio de Jornada:**

* Usuario autenticado (verificar sesión)  
* No debe haber otra jornada activa del mismo usuario  
* Fecha/hora debe ser válida  
* No puede ser fecha futura  
* user_id debe coincidir con usuario autenticado

**Validar Pausa:**

* Usuario autenticado  
* Debe existir jornada activa del usuario  
* No puede haber otra pausa activa  
* Duración mínima: 1 minuto  
* time_entry debe pertenecer al usuario (RLS)

**Validar Edición:**

* Usuario autenticado  
* Usuario debe ser propietario del registro (RLS)  
* Hora de salida debe ser posterior a entrada  
* Pausas deben estar dentro del rango de jornada  
* Total de pausas no puede exceder jornada total  
* Validar en cliente Y en servidor (RLS)

**Validar Eliminación:**

* Usuario autenticado  
* Usuario debe ser propietario (RLS automático)  
* No se puede eliminar jornada activa  
* Confirmación explícita del usuario

---

## 7. MANEJO DE ERRORES Y SEGURIDAD

### 7.1 Escenarios de Error

**E-001: Error de autenticación**

* Credenciales incorrectas: "Email o contraseña incorrectos"  
* Email no verificado: "Por favor verifica tu email"  
* Usuario no encontrado: "No existe una cuenta con este email"  
* Mostrar mensaje específico según error de Supabase

**E-002: Error de registro**

* Email ya registrado: "Este email ya está registrado"  
* Contraseña débil: "La contraseña debe tener al menos 8 caracteres"  
* Error de red: "Error de conexión, intenta nuevamente"

**E-003: Error al guardar datos**

* Mostrar toast de error  
* Intentar guardar localmente como respaldo  
* Opción de reintentar  
* Log del error para debugging

**E-004: Sesión expirada**

* Detectar token JWT expirado  
* Mostrar modal "Tu sesión ha expirado"  
* Redireccionar a login  
* Preservar ruta para volver después del login

**E-005: Datos corruptos**

* Validar esquema al cargar desde Supabase  
* Mostrar diálogo de error amigable  
* Opción de contactar soporte  
* No exponer detalles técnicos al usuario

**E-006: Error de permisos (RLS)**

* "No tienes permisos para realizar esta acción"  
* Verificar sesión activa  
* Refrescar token si es necesario  
* Log del intento para auditoría

**E-007: Jornada activa al cerrar**

* Detectar en beforeunload  
* Advertencia: "Tienes una jornada activa"  
* Opciones: "Finalizar ahora" o "Mantener activa"  
* Persistir estado en Supabase

### 7.2 Mensajes de Usuario y Seguridad

**Mensajes de Éxito:**

* "¡Bienvenido de vuelta\!"  
* "Jornada iniciada correctamente"  
* "Pausa registrada"  
* "Datos exportados exitosamente"  
* Confirmaciones breves con toast/snackbar

**Mensajes de Error:**

* Claros y accionables  
* Evitar jerga técnica  
* Sugerir solución cuando sea posible  
* "Algo salió mal. Por favor intenta nuevamente"

**Advertencias:**

* Prevenir antes de acciones destructivas  
* "¿Estás seguro de eliminar este registro?"  
* "Esta acción no se puede deshacer"  
* Botones claramente diferenciados (Cancelar / Confirmar)

### 7.3 Mejores Prácticas de Seguridad

**Implementadas:**

* ✅ Contraseñas hasheadas por Supabase (bcrypt)  
* ✅ JWT para sesiones con refresh automático  
* ✅ Row Level Security (RLS) en todas las tablas  
* ✅ Validación client-side y server-side  
* ✅ HTTPS obligatorio en producción  
* ✅ Sanitización de inputs  
* ✅ Rate limiting por Supabase  
* ✅ CORS configurado correctamente

**A Considerar:**

* Límite de intentos de login fallidos  
* 2FA (Two-Factor Authentication) - Fase 2  
* Logs de auditoría de acciones críticas  
* Rotación de tokens de sesión  
* Encriptación adicional de datos sensibles

---

## 8. MEJORAS FUTURAS (Post-MVP)

### Fase 2

* Sistema de usuarios múltiples  
* Autenticación (email/password)  
* Proyectos y tareas  
* Tags personalizados  
* Notas por jornada

### Fase 3

* Sincronización en la nube  
* Aplicación móvil nativa  
* Notificaciones push  
* Recordatorios automáticos  
* Integración con calendario

### Fase 4

* Gestión de equipos  
* Aprobaciones de supervisor  
* Integración con nóminas  
* API REST pública  
* Geolocalización opcional

---

## 9. CRITERIOS DE ACEPTACIÓN

### Para considerar el MVP completo:

1. ✅ Usuario puede iniciar y finalizar jornada  
2. ✅ Usuario puede tomar pausas y reanudar trabajo  
3. ✅ Se calculan automáticamente las horas trabajadas  
4. ✅ Se muestra historial de al menos 30 días  
5. ✅ Se pueden editar registros pasados  
6. ✅ Dashboard muestra estadísticas semanales  
7. ✅ Se puede exportar datos a CSV  
8. ✅ Funciona en móvil y desktop  
9. ✅ Datos persisten al cerrar navegador  
10. ✅ Interfaz es intuitiva sin documentación

---

## 10. GUÍA DE IMPLEMENTACIÓN

### Orden Sugerido de Desarrollo:

**Sprint 1: Fundación (Días 1-3)**

1. Setup del proyecto (Vite + React + TypeScript)  
2. Configurar Tailwind y shadcn/ui  
3. Estructura de carpetas y arquitectura base  
4. Modelo de datos e IndexedDB  
5. Context y hooks básicos

**Sprint 2: Core Functionality (Días 4-7)**

1. Componentes de Clock In/Out  
2. Lógica de inicio/fin de jornada  
3. Gestión de pausas  
4. Cálculos de tiempo  
5. Persistencia de datos

**Sprint 3: Visualización (Días 8-11)**

1. Dashboard principal  
2. Componentes de historial  
3. Vista de calendario  
4. Estadísticas básicas  
5. Gráficos con Recharts

**Sprint 4: Polish & Features (Días 12-14)**

1. Edición de registros  
2. Exportación CSV  
3. Responsive design  
4. Animaciones y transiciones  
5. Manejo de errores  
6. Testing manual completo

---

## 11. RECURSOS Y REFERENCIAS

### Librerías Clave:

* **React**: https://react.dev  
* **Tailwind CSS**: https://tailwindcss.com  
* **shadcn/ui**: https://ui.shadcn.com  
* **Dexie.js**: https://dexie.org  
* **date-fns**: https://date-fns.org  
* **Recharts**: https://recharts.org

### Inspiración de Diseño:

* Toggl Track  
* Clockify  
* Harvest

---

## NOTAS FINALES PARA LA IA DE DESARROLLO

Este documento contiene toda la información necesaria para desarrollar la aplicación. Los puntos críticos son:

1. **Prioridad en UX**: La interfaz debe ser extremadamente simple, los botones grandes y claros  
2. **Persistencia robusta**: Usar IndexedDB correctamente, manejar todos los edge cases  
3. **Cálculos precisos**: La lógica de cálculo de horas debe ser exacta al minuto  
4. **Mobile-first**: Diseñar primero para móvil, luego expandir  
5. **Feedback visual**: Cada acción debe tener respuesta visual inmediata

**Principio guía**: Un usuario debe poder usar la app completamente sin ninguna documentación o tutorial.
