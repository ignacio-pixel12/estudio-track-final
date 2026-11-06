# Especificación — Estudio Track

**Versión:** 2.0 · **Autor:** Ignacio García Belvedere · **Estado:** implementada y verificada

---

## 1. Contexto

Estudio Track nace en el TP del Módulo 2 como una SPA que guardaba todo en `localStorage`. Al llegar al trabajo final se convierte en una aplicación full-stack: la información deja de vivir en un navegador y pasa a una base de datos, con una API que puede consumir cualquier cliente.

El problema que resuelve es concreto: **organizar el estudio de varias materias sin saltar entre cuatro herramientas**. La unidad de planificación es el **pomodoro** (bloque de 25 minutos de foco + 5 de descanso), y la unidad de trabajo es la **tarea**.

## 2. Usuarios

| Usuario | Necesidad |
| --- | --- |
| Estudiante secundario/universitario | Ver qué tiene que estudiar, cuánto le falta y cuánto estudió |
| Autodidacta | Organizar temas por área y medir su constancia |
| Docente (uso ligero) | Preparar materiales por materia con estimaciones de tiempo |

Una sola persona por instancia: no hay autenticación ni multiusuario en esta versión.

## 3. Objetivo

Permitir que un estudiante registre materias y tareas, estime el esfuerzo en pomodoros, ejecute sesiones de foco y consulte métricas básicas de avance, todo desde una interfaz web responsive.

## 4. Alcance

### Dentro del alcance

- CRUD de materias (crear y listar) con color identificatorio.
- CRUD de tareas (crear, listar, ver, editar, eliminar) con estado y estimación.
- Filtros por materia y estado.
- Timer Pomodoro 25/5 con registro de sesiones sobre la tarea activa.
- Métricas: tareas por estado, sesiones de foco y minutos acumulados.
- Persistencia en PostgreSQL.
- Tests automatizados de reglas y API.
- Deploy en Neon + Render + Netlify.

### Fuera del alcance (explícito)

- Autenticación, cuentas y multiusuario.
- Notificaciones push o por email.
- Aplicación móvil nativa.
- Sincronización offline o con calendarios externos.
- Subtareas, etiquetas y adjuntos.
- Internacionalización (la UI queda en español).
- Borrado o edición de materias (solo creación y listado en esta versión).

## 5. Historias de usuario

### HU-01 · Crear materia
Como estudiante, quiero crear una materia con un color para agrupar mis tareas por área.

**Criterios de aceptación**
- Dado un nombre de 2 a 60 caracteres, cuando creo la materia, entonces recibo `201` con `id`, `name`, `color` y `createdAt`.
- Dado un nombre ya existente (sin distinguir mayúsculas), cuando intento crearla, entonces recibo `409 CONFLICT` y el `id` de la materia existente.
- Dado un nombre de menos de 2 caracteres, cuando intento crearla, entonces recibo `422 UNPROCESSABLE_ENTITY`.
- Dado un color con formato inválido (no `#RRGGBB`), cuando intento crearla, entonces recibo `422`.
- Dado que no envío color, entonces se usa `#6366f1` por defecto.

### HU-02 · Crear tarea
Como estudiante, quiero crear una tarea asociada a una materia y estimar cuántos pomodoros me llevará.

**Criterios de aceptación**
- Dado un título de 3 a 120 caracteres y una materia existente, cuando creo la tarea, entonces recibo `201` con estado `pendiente` y `completedPomodoros = 0`.
- Dado que no envío `estimatedPomodoros`, entonces vale `1`.
- Dado un `estimatedPomodoros` fuera de 1–50 o no entero, entonces recibo `422`.
- Dado un `subjectId` inexistente, entonces recibo `404 NOT_FOUND`.
- Dado un título de menos de 3 caracteres, entonces recibo `422` con el detalle del campo.

### HU-03 · Ver y filtrar tareas
Como estudiante, quiero ver mis tareas y filtrarlas por materia o estado.

**Criterios de aceptación**
- Dado que existen tareas, cuando consulto `GET /api/tasks`, entonces recibo todas ordenadas por creación descendente, con su materia y pomodoros completados.
- Dado `?status=pendiente`, entonces solo recibo pendientes.
- Dado `?subjectId=<uuid>`, entonces solo recibo tareas de esa materia.
- Dado un estado inválido, entonces recibo `422`.
- Dado que no hay tareas, entonces recibo `200` con arreglo vacío.

### HU-04 · Editar tarea
Como estudiante, quiero ajustar el estado o la estimación de una tarea.

**Criterios de aceptación**
- Dado un `PATCH` con `status = en_progreso`, entonces la tarea cambia de estado y actualiza `updatedAt`.
- Dado un `PATCH` sin campos, entonces recibo `422`.
- Dado un `PATCH` con `subjectId` inexistente, entonces recibo `404`.
- Dado un `PATCH` con `estimatedPomodoros` inválido, entonces recibo `422`.

### HU-05 · Completar y reabrir
Como estudiante, quiero marcar una tarea como completada y poder reabrirla si me equivoqué.

**Criterios de aceptación**
- Dado `POST /api/tasks/:id/complete`, entonces la tarea pasa a `completada` y se registra `completedAt`.
- Dado que ya estaba completada, el endpoint responde `200` sin cambiar `completedAt` (idempotente).
- Dado un `PATCH` con `status = pendiente` sobre una completada, entonces se reabre y `completedAt` vuelve a `null`.

### HU-06 · Ejecutar un pomodoro
Como estudiante, quiero un timer de 25/5 que registre el bloque de foco sobre la tarea que estoy trabajando.

**Criterios de aceptación**
- Dado que selecciono una tarea y presiono Iniciar, entonces la cuenta regresiva comienza en 25:00.
- Al llegar a 00:00 en modo foco, entonces se envía `POST /api/tasks/:id/sessions` con `{ type: "focus" }` y la tarea incrementa `completedPomodoros`.
- Dado que el modo es descanso, al terminar no se registra sesión de foco.
- Dado `{ type: "break" }` sin duración, entonces la sesión dura 5 minutos.
- Dado una duración distinta a la del tipo, entonces recibo `400 VALIDATION_ERROR`.
- Dado una tarea completada, cuando intento registrar una sesión, entonces recibo `409 CONFLICT`.

### HU-07 · Ver métricas
Como estudiante, quiero saber cuántas tareas tengo en cada estado y cuánto estudié.

**Criterios de aceptación**
- `GET /api/stats` devuelve `subjects`, `tasksTotal`, `tasksByStatus`, `focusSessions` y `focusMinutes`.
- `focusSessions` cuenta solo sesiones `focus`.
- `focusMinutes` suma solo minutos de sesiones `focus`.
- Sin datos, todos los valores son `0` (no `null`).

### HU-08 · Eliminar tarea
Como estudiante, quiero eliminar una tarea que ya no necesito.

**Criterios de aceptación**
- Dado `DELETE /api/tasks/:id`, entonces recibo `204` y sus sesiones se eliminan en cascada.
- Dado un `id` inexistente, entonces recibo `404`.
- Dado que consulto la tarea eliminada, entonces recibo `404`.

## 6. Reglas de negocio

| ID | Regla |
| --- | --- |
| RN1 | El título de una tarea tiene entre 3 y 120 caracteres (se recorta el espacio sobrante). |
| RN2 | Toda tarea pertenece a una materia existente. |
| RN3 | No se registran pomodoros sobre tareas completadas. Para seguir estudiando hay que reabrirla. |
| RN4 | Una sesión `focus` dura exactamente 25 minutos; una `break`, exactamente 5. |
| RN5 | La estimación es un entero entre 1 y 50; sin valor, es 1. |
| RN6 | Completar es idempotente; reabrir es una acción explícita que limpia `completedAt`. |
| RN7 | Los nombres de materia son únicos sin distinguir mayúsculas. |
| RN8 | Eliminar una tarea elimina sus sesiones (integridad referencial en cascada). |
| RN9 | Los estados válidos son `pendiente`, `en_progreso` y `completada`; el inicial es `pendiente`. |
| RN10 | Las métricas de foco consideran únicamente sesiones de tipo `focus`. |

## 7. Requisitos no funcionales

| ID | Requisito | Criterio de verificación |
| --- | --- | --- |
| RNF1 | Legibilidad y capas | `routes` no importa `pg`; `services` no importa `express` |
| RNF2 | Seguridad de datos | 100 % de las consultas SQL parametrizadas |
| RNF3 | Validación de entrada | Todo body/query pasa por Zod |
| RNF4 | Rendimiento | Respuestas < 300 ms en local para el dataset de demo |
| RNF5 | Responsive | Usable de 360 px a 1920 px |
| RNF6 | Accesibilidad básica | Labels en inputs, foco visible, contraste AA, `aria-live` en el timer |
| RNF7 | Testabilidad | Reglas de negocio testeables sin DB ni HTTP |
| RNF8 | Portabilidad | Corre con Node 22 en Windows, Linux y macOS |
| RNF9 | Operación | Deploy gratuito en Neon + Render + Netlify |
| RNF10 | Mantenibilidad | Sin dependencias de testing extra (solo `node:test`) |

## 8. Métricas de éxito

- 19/19 tests en verde.
- Flujo completo (`materia → tarea → pomodoro → completar → métricas`) sin errores.
- Build de producción del frontend < 200 kB gzip.
- Deploy accesible públicamente con health check en `ok`.

## 9. Glosario

| Término | Definición |
| --- | --- |
| Materia | Área de estudio con nombre y color. |
| Tarea | Trabajo concreto con estado y estimación en pomodoros. |
| Pomodoro | Bloque de 25 minutos de foco (o 5 de descanso). |
| Sesión | Registro histórico de un pomodoro completado. |
| `completedPomodoros` | Cantidad de sesiones de foco registradas sobre una tarea. |
