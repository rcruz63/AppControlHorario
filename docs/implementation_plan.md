# Plan de Implementación: AppControlHorario

Aplicación web de control horario laboral que permite registrar entradas/salidas, gestionar pausas y generar reportes. Se construirá con React 18 + TypeScript + Vite, persistiendo datos en Supabase.

## User Review Required

> [!IMPORTANT]
> **Credenciales de Supabase**: Para que la app funcione con persistencia real, necesito la URL y la clave anónima de tu proyecto Supabase. Si aún no tienes proyecto, puedo configurar la app para funcionar primero con datos locales (mock/localStorage) y luego conectar Supabase cuando esté disponible.

> [!IMPORTANT]
> **TailwindCSS**: El documento de requisitos especifica Tailwind CSS, pero tus reglas de usuario indican usar Vanilla CSS salvo que se solicite explícitamente Tailwind. Como el doc de requisitos lo solicita expresamente, **procederé con Tailwind CSS v4 + shadcn/ui** según la especificación. ¿Estás de acuerdo?

> [!WARNING]
> **shadcn/ui**: Implica instalar múltiples dependencias (Radix UI, class-variance-authority, etc.). Esto agrega complejidad pero acelera el desarrollo de componentes accesibles. Confirma si deseas usarlo o prefieres componentes custom.

## Open Questions

1. **¿Tienes ya un proyecto Supabase creado?** Si no, ¿quieres que comience con localStorage como mock y luego migre a Supabase?
2. **¿Prefieres modo oscuro por defecto, modo claro, o selector automático?** El diseño de referencia muestra un tema claro con acentos oscuros.
3. **¿Deseas PWA instalable desde el inicio, o lo dejamos para una fase posterior?**

---

## Análisis del Diseño de Referencia

El diseño UX de referencia ([diseno_ux.png](file:///home/rcruz63/desarrollo/AppControlHorario/docs/diseno_ux.png)) muestra un dashboard estilo **"Flux"** con las siguientes características clave que adaptaré al dominio de control horario:

| Elemento del diseño | Adaptación a Control Horario |
|---|---|
| Sidebar con navegación e iconos | Sidebar con: Dashboard, Historial, Reportes, Perfil |
| Header con avatar + nombre + buscador | Header con avatar + saludo personalizado + fecha actual |
| Cards con métricas grandes (Energy, Heart Rate) | Cards de: Estado actual, Horas hoy, Tiempo en pausa, Semana |
| Gráficos circulares y de barras | Gráfico semanal de horas + distribución de pausas |
| Panel "Sleep Analysis" con gráfico mensual | Panel "Análisis Semanal/Mensual" con gráfico de barras |
| Card "Upgrade to Pro" | Card de "Resumen del día" o acción rápida |
| Fondo claro lima/verde con cards blancas | Paleta moderna con fondo `#f0f4e8` + cards blancas + acentos `#c8e64a` y `#7c6cf0` |
| Bordes redondeados grandes (20px+) | Mismo estilo de bordes redondeados xl |
| Tipografía bold para métricas | Números grandes y prominentes para horas/minutos |

### Paleta de Colores (Inspirada en el diseño)

```
--color-background:     #f0f4e8   /* Fondo general lima claro */
--color-surface:        #ffffff   /* Cards y superficies */
--color-sidebar:        #1a1a2e   /* Sidebar oscuro */
--color-primary:        #c8e64a   /* Verde lima vibrante (acento principal) */
--color-secondary:      #7c6cf0   /* Púrpura (gráficos, estados) */
--color-text-primary:   #1a1a2e   /* Texto principal oscuro */
--color-text-secondary: #6b7280   /* Texto secundario */
--color-success:        #10b981   /* Estado "trabajando" */
--color-warning:        #f59e0b   /* Estado "en pausa" */
--color-danger:         #ef4444   /* Errores, eliminar */
--color-dark-card:      #2d2d3f   /* Cards oscuras (como Sleep Analysis) */
```

---

## Proposed Changes

### Fase 1: Fundación del Proyecto (Setup + Infraestructura)

#### [NEW] Inicialización del proyecto Vite + React + TypeScript

```bash
npx -y create-vite@latest ./ --template react-ts
```

Instalación de dependencias:
```bash
npm install @supabase/supabase-js react-router-dom@6 date-fns recharts zod react-hook-form @hookform/resolvers lucide-react @tanstack/react-query
npm install -D tailwindcss @tailwindcss/vite
```

---

#### [NEW] [.env.example](file:///home/rcruz63/desarrollo/AppControlHorario/.env.example)

Variables de entorno para Supabase:
```
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu_clave_publica_anon
```

---

#### [NEW] Estructura de directorios

```
src/
├── components/
│   ├── auth/           # LoginForm, RegisterForm, ProtectedRoute, etc.
│   ├── layout/         # Header, Sidebar, Layout, UserMenu
│   ├── time-tracking/  # TimeClockControls, CurrentStatus, PauseControls
│   ├── history/        # TimeEntryList, TimeEntryCard, Calendar
│   ├── dashboard/      # StatsCard, WeeklyChart, MonthlyChart
│   ├── reports/        # ExportButton, ReportFilters
│   ├── profile/        # ProfileForm, ChangePasswordForm
│   └── ui/             # Componentes shadcn/ui reutilizables
├── hooks/
│   ├── useAuth.ts
│   ├── useTimeTracking.ts
│   ├── useTimeEntries.ts
│   ├── useStats.ts
│   └── useSupabase.ts
├── lib/
│   ├── supabase.ts     # Cliente Supabase
│   ├── utils.ts        # Utilidades generales
│   └── calculations.ts # Lógica de cálculo de horas
├── types/
│   └── index.ts        # Tipos TypeScript (TimeEntry, Pause, Profile, etc.)
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
├── App.tsx
├── main.tsx
└── index.css           # Design tokens + estilos globales con Tailwind
```

---

#### [NEW] [src/types/index.ts](file:///home/rcruz63/desarrollo/AppControlHorario/src/types/index.ts)

Definición de todos los tipos TypeScript según el modelo de datos de la especificación:
- `Profile`, `TimeEntry`, `Pause`, `DailyStats`, `WeeklyStats`
- Enums: `TimeEntryStatus`, `PauseType`
- Tipos de formulario con Zod schemas

---

#### [NEW] [src/lib/supabase.ts](file:///home/rcruz63/desarrollo/AppControlHorario/src/lib/supabase.ts)

Cliente Supabase con wrapper de abstracción (siguiendo la regla de Agnosticismo de Dependencias):
- `createSupabaseClient()` envuelto en una interfaz
- Tipado con `Database` generado desde Supabase

---

#### [NEW] [src/lib/calculations.ts](file:///home/rcruz63/desarrollo/AppControlHorario/src/lib/calculations.ts)

Funciones puras de cálculo de tiempo (Lógica de Negocio aislada):
- `calculateWorkedHours(entry, pauses)` → horas decimales
- `calculatePauseDuration(pauses)` → minutos totales
- `calculateDailyStats(entries)` → DailyStats
- `calculateWeeklyStats(entries)` → WeeklyStats
- `formatDuration(minutes)` → string "Xh Ym"

---

### Fase 2: Autenticación y Layout

#### [NEW] [src/contexts/AuthContext.tsx](file:///home/rcruz63/desarrollo/AppControlHorario/src/contexts/AuthContext.tsx)

Contexto de autenticación con Supabase Auth:
- `signUp`, `signIn`, `signOut`, `resetPassword`, `updatePassword`
- Listener `onAuthStateChange` para gestionar sesión
- Carga automática de perfil desde tabla `profiles`

---

#### [NEW] [src/hooks/useAuth.ts](file:///home/rcruz63/desarrollo/AppControlHorario/src/hooks/useAuth.ts)

Hook que consume `AuthContext` con validaciones y tipado.

---

#### [NEW] [src/components/auth/ProtectedRoute.tsx](file:///home/rcruz63/desarrollo/AppControlHorario/src/components/auth/ProtectedRoute.tsx)

Guard de rutas protegidas: redirige a `/login` si no hay sesión.

---

#### [NEW] [src/components/auth/LoginForm.tsx](file:///home/rcruz63/desarrollo/AppControlHorario/src/components/auth/LoginForm.tsx)

Formulario de login con:
- Validación con Zod + React Hook Form
- Campos: email, contraseña
- Links: "¿Olvidaste tu contraseña?", "Crear cuenta"
- Estados: Loading, Error, Success
- Diseño centrado, estilo glassmorphism

---

#### [NEW] [src/components/auth/RegisterForm.tsx](file:///home/rcruz63/desarrollo/AppControlHorario/src/components/auth/RegisterForm.tsx)

Formulario de registro con: nombre, email, contraseña, confirmar contraseña.

---

#### [NEW] [src/components/layout/Layout.tsx](file:///home/rcruz63/desarrollo/AppControlHorario/src/components/layout/Layout.tsx)

Layout principal con:
- **Sidebar** izquierdo oscuro (estilo Flux del diseño): iconos + texto, navegación activa resaltada con color primario
- **Header** superior: avatar + nombre del usuario + fecha actual + selector de período
- **Área de contenido** central con fondo lima claro
- Responsive: sidebar colapsable en móvil (hamburger menu)

---

#### [NEW] [src/components/layout/Sidebar.tsx](file:///home/rcruz63/desarrollo/AppControlHorario/src/components/layout/Sidebar.tsx)

Sidebar con navegación:
- Logo "ControlHorario" con icono
- Items: Dashboard (con badge), Historial, Reportes, Perfil
- Indicador de ruta activa
- Botón de logout en la parte inferior
- Card de resumen/CTA en la parte inferior (como "Upgrade to Pro" del diseño, adaptado a resumen del día)

---

### Fase 3: Core — Control de Jornada + Dashboard

#### [NEW] [src/contexts/TimeTrackingContext.tsx](file:///home/rcruz63/desarrollo/AppControlHorario/src/contexts/TimeTrackingContext.tsx)

Contexto de control de tiempo:
- Estado actual: `idle | working | paused`
- Jornada activa actual (`TimeEntry`)
- Pausas de la jornada actual
- Operaciones CRUD contra Supabase
- Timer en vivo para mostrar tiempo trabajado

---

#### [NEW] [src/hooks/useTimeTracking.ts](file:///home/rcruz63/desarrollo/AppControlHorario/src/hooks/useTimeTracking.ts)

Hook para operaciones de jornada:
- `startWorkday()` — crea TimeEntry con status 'active'
- `endWorkday()` — finaliza, calcula total_hours
- `startPause(type)` — crea Pause
- `endPause()` — finaliza pausa, calcula duración
- Validaciones de negocio (RF-010)

---

#### [NEW] [src/pages/Dashboard.tsx](file:///home/rcruz63/desarrollo/AppControlHorario/src/pages/Dashboard.tsx)

Página principal del dashboard adaptando el diseño de referencia:

```
┌─────────────────────────────────────────────────────────┐
│  Header: "Hola, {nombre}" + fecha + selector Today ▼   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────┐  ┌────────────┐  ┌────────────────┐   │
│  │ ESTADO      │  │ HORAS HOY  │  │ SEMANA         │   │
│  │ 🟢 Trabajando│  │   7:45     │  │   38:20        │   │
│  │             │  │   horas    │  │   horas        │   │
│  │ [Gráfico    │  ├────────────┤  │ [Dot matrix    │   │
│  │  circular   │  │ EN PAUSA   │  │  chart]        │   │
│  │  con tiempo │  │   0:45     │  │                │   │
│  │  trabajado] │  │   horas    │  │                │   │
│  │             │  │            │  │                │   │
│  └─────────────┘  └────────────┘  └────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────────┐│
│  │ Análisis Semanal                    Semanal ▼      ││
│  │                                                     ││
│  │  [Gráfico de barras: Lun-Dom con horas por día]    ││
│  │                                                     ││
│  └─────────────────────────────────────────────────────┘│
│                                                         │
│  ╔═══════════════════════════════════╗                  │
│  ║  BOTONES DE ACCIÓN PRINCIPALES   ║                  │
│  ║  [🟢 ENTRAR] [⏸ PAUSA] [🔴 SALIR]║                  │
│  ╚═══════════════════════════════════╝                  │
└─────────────────────────────────────────────────────────┘
```

Componentes del Dashboard:
- **StatsCard**: Card genérica para métricas grandes (adapta "Energy Used", "Heart Rate", etc.)
- **TimeClockControls**: Botones grandes ENTRAR / PAUSA / SALIR con estados
- **CurrentStatus**: Indicador visual del estado actual con timer en vivo
- **WeeklyChart**: Gráfico de barras con Recharts (estilo "Sleep Analysis")
- **DotMatrix**: Indicador visual semanal (inspirado en "Wellness Index")

---

#### [NEW] [src/components/dashboard/StatsCard.tsx](file:///home/rcruz63/desarrollo/AppControlHorario/src/components/dashboard/StatsCard.tsx)

Card de estadísticas reutilizable:
- Icono + título
- Valor grande (número principal)
- Subtítulo / unidad
- Badge de cambio porcentual opcional
- Menú de opciones (3 puntos)
- Bordes redondeados xl, sombra sutil

---

#### [NEW] [src/components/time-tracking/TimeClockControls.tsx](file:///home/rcruz63/desarrollo/AppControlHorario/src/components/time-tracking/TimeClockControls.tsx)

Controles principales de fichaje:
- Botón ENTRAR (verde): visible solo si estado = `idle`
- Botón PAUSA (ámbar): visible si estado = `working`, dropdown para tipo
- Botón REANUDAR (azul): visible si estado = `paused`
- Botón SALIR (rojo): visible si estado ≠ `idle`
- Animaciones de transición entre estados
- Timer en vivo mostrando duración actual

---

### Fase 4: Historial, Reportes y Perfil

#### [NEW] [src/pages/History.tsx](file:///home/rcruz63/desarrollo/AppControlHorario/src/pages/History.tsx)

Vista de historial:
- Mini-calendario mensual con indicadores de días trabajados
- Lista de registros por día (TimeEntryCard)
- Filtros: Día / Semana / Mes
- Acciones: Editar / Eliminar por registro
- Indicador de "editado manualmente"

---

#### [NEW] [src/pages/Reports.tsx](file:///home/rcruz63/desarrollo/AppControlHorario/src/pages/Reports.tsx)

Vista de reportes:
- Filtros de rango de fechas
- Gráfico de barras (horas por día)
- Gráfico de línea (tendencia semanal)
- Tabla resumen con totales
- Botón de exportación CSV

---

#### [NEW] [src/components/reports/ExportButton.tsx](file:///home/rcruz63/desarrollo/AppControlHorario/src/components/reports/ExportButton.tsx)

Exportación a CSV:
- Formato: Fecha, Hora Entrada, Hora Salida, Pausas, Total Horas
- Selector de rango de fechas
- Descarga directa del archivo

---

#### [NEW] [src/pages/Profile.tsx](file:///home/rcruz63/desarrollo/AppControlHorario/src/pages/Profile.tsx)

Página de perfil:
- Formulario de edición: nombre, avatar
- Cambio de contraseña
- Botón "Eliminar cuenta" con confirmación
- Información de la cuenta (email, fecha de registro)

---

#### [NEW] [src/App.tsx](file:///home/rcruz63/desarrollo/AppControlHorario/src/App.tsx)

Configuración de rutas con React Router:
```
/login          → LoginForm
/register       → RegisterForm
/forgot-password → ForgotPasswordForm
/dashboard      → Dashboard (protegida)
/history        → History (protegida)
/reports        → Reports (protegida)
/profile        → Profile (protegida)
/               → Redirect a /dashboard
```

---

### Fase 5: Base de datos Supabase

#### [NEW] [supabase/schema.sql](file:///home/rcruz63/desarrollo/AppControlHorario/supabase/schema.sql)

Script SQL completo según la especificación §4.4:
- Tabla `profiles` (enlazada con `auth.users`)
- Tabla `time_entries` (registros de jornada)
- Tabla `pauses` (pausas)
- Índices de rendimiento
- Políticas RLS para aislamiento de datos por usuario
- Triggers para `updated_at` automático
- Función `handle_new_user()` para crear perfil al registrarse

---

## Resumen de Archivos por Fase

| Fase | Archivos | Descripción |
|------|----------|-------------|
| 1 — Fundación | ~10 archivos | Config, tipos, utilidades, design tokens |
| 2 — Auth + Layout | ~8 archivos | Login, Register, Layout, Sidebar, Header |
| 3 — Core | ~8 archivos | Dashboard, TimeClockControls, Charts, Contexts |
| 4 — Features | ~8 archivos | History, Reports, Profile, Export |
| 5 — Database | 1 archivo | Schema SQL de Supabase |
| **Total** | **~35 archivos** | |

---

## Verification Plan

### Automated Tests
```bash
# Build sin errores de TypeScript
npm run build

# Verificar que el dev server arranca
npm run dev
```

### Manual Verification
1. **Auth flow**: Registro → Login → Dashboard → Logout
2. **Jornada completa**: Entrar → Pausa → Reanudar → Salir → Verificar historial
3. **Responsive**: Probar en viewport mobile (375px), tablet (768px) y desktop (1280px)
4. **Persistencia**: Recargar página y verificar que datos persisten
5. **Validaciones**: Intentar doble entrada, pausa sin jornada, salir sin entrar
6. **Exportación**: Generar CSV y verificar contenido
7. **Perfil**: Editar nombre, cambiar contraseña
