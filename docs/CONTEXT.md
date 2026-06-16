Actúa como un Ingeniero de Software Full-Stack Senior y Experto en Automatización utilizando el enfoque de "Desarrollo Dirigido por Especificaciones". Tu tarea principal es validar, probar y corregir la aplicación web de Control Horario basada en el stack React (Vite, TypeScript, Tailwind, shadcn/ui, Recharts) y Supabase (Auth, PostgreSQL, RLS).

Dispones del documento completo de Especificaciones Técnicas (que detalla los Requerimientos Funcionales RF-001 al RF-016, No Funcionales, Estructura de Componentes, Esquema SQL, Políticas RLS y Flujos de Datos) junto con el Plan de Implementación de 4 Sprints.

Por favor, ejecuta las siguientes tareas en orden secuencial y de forma metódica:

### FASE 1: ANÁLISIS DE CONTEXTO Y CONVENIO DE DISEÑO
1. Lee detenidamente el documento de especificaciones técnicas provisto para comprender la lógica de negocio (por ejemplo, el cálculo exacto de horas restando pausas en 'calculateWorkedHours' y las restricciones de jornadas activas).
2. Inspecciona el árbol de archivos actual del proyecto (`src/`) y asegúrate de que se alinea estrictamente con la "Arquitectura de Componentes" especificada (sección 4.2). Identifica cualquier archivo faltante o mal ubicado.

### FASE 2: AUDITORÍA DE SEGURIDAD Y BASE DE DATOS (SUPABASE + RLS)
1. Revisa las políticas de Row Level Security (RLS) descritas para las tablas `profiles`, `time_entries` y `pauses`. 
2. Verifica que el backend o los mocks implementados aseguren que:
   - Un usuario SOLO pueda consultar, insertar, actualizar o eliminar sus propios registros (`auth.uid() = user_id`).
   - Las pausas estén protegidas validando la propiedad de la jornada base (`EXISTS` en `time_entries`).
3. Comprueba el funcionamiento del trigger `on_auth_user_created` para la creación automática del perfil en la tabla pública tras el registro.

### FASE 3: BUCLE ACTIVO DE TESTING (QA AGÉNTICO)
Levanta el entorno de desarrollo local y ejecuta un ciclo exhaustivo de pruebas automatizadas y/o manuales simuladas para validar los siguientes "Edge Cases" críticos:
- **RF-010 (Validaciones críticas):** Intentar hacer "Salir" (clock-out) sin una jornada activa. Intentar abrir múltiples jornadas simultáneas ("Entrar" duplicado). Intentar iniciar una pausa sin jornada activa.
- **Cálculo del Tiempo (Sección 6.2):** Validar que las pausas solapadas o consecutivas se resten correctamente del tiempo total de la jornada, calculando el valor exacto en formato decimal de horas (`total_hours` con precisión de minutos).
- **RF-003 / E-007:** Intentar cerrar sesión (Logout) o cerrar la ventana del navegador (`beforeunload`) teniendo una jornada activa de trabajo. Verificar que el sistema muestre la advertencia correspondiente.

### FASE 4: CORRECCIÓN Y REFACTORIZACIÓN EN CALIENTE
Por cada error, desviación de las especificaciones o fallo de tipado en TypeScript detectado en las fases anteriores:
1. Genera la corrección aplicando código limpio, modular y fuertemente tipado en los hooks correspondientes (`useAuth`, `useTimeTracking`, `useTimeEntries`).
2. Asegúrate de añadir indicadores visuales ("editado manualmente") y manejo de estados robusto en la UI usando toasts informativos (sección 7.2) tanto para éxitos como para errores (mensajes accionables, no técnicos).
3. Documenta brevemente qué archivos han sido corregidos y qué requerimiento técnico (RF/RNF) se ha subsanado.

Comienza presentándome un breve resumen de tu plan de auditoría sobre el repositorio actual antes de aplicar los parches en el código.
