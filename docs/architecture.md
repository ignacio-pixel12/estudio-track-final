# Arquitectura — Estudio Track

## 1. Vista general

```
Navegador
   │  React 18 + Vite
   │  fetch(JSON)
   ▼
Express 4  ──►  routes  ──►  services  ──►  repositories  ──►  PostgreSQL
                               │
                               ▼
                          domain (reglas puras)
```

Cada capa solo conoce a la siguiente. El dominio no conoce a nadie.

## 2. Estructura de carpetas

```
backend/
├── src/
│   ├── config.js                 # único acceso a process.env
│   ├── app.js                    # composición de Express
│   ├── server.js                 # arranque + graceful shutdown
│   ├── domain/
│   │   ├── errors.js             # DomainError, NotFoundError, ConflictError
│   │   └── taskRules.js          # reglas puras (RN3, RN4, RN5, RN6)
│   ├── lib/
│   │   └── validate.js           # esquemas Zod + parse()
│   ├── middleware/
│   │   └── errorHandler.js       # traducción a HTTP + 404
│   ├── repositories/
│   │   ├── index.js              # factory memoria | PostgreSQL
│   │   ├── memoryTaskRepository.js
│   │   └── pgTaskRepository.js
│   ├── routes/
│   │   ├── tasks.routes.js
│   │   ├── subjects.routes.js
│   │   └── stats.routes.js
│   ├── services/
│   │   └── taskService.js
│   ├── db/
│   │   ├── schema.sql
│   │   ├── migrate.js
│   │   └── seed.js
│   └── ...
└── test/
    ├── helpers.js                # app real en puerto efímero
    ├── rules.test.js
    └── api.test.js

frontend/
├── src/
│   ├── main.jsx
│   ├── App.jsx                   # estado, carga y handlers
│   ├── api.js                    # cliente HTTP
│   ├── styles.css                # design system con variables CSS
│   └── components/
│       ├── Stats.jsx
│       ├── SubjectForm.jsx
│       ├── TaskForm.jsx
│       ├── TaskList.jsx
│       └── PomodoroTimer.jsx
└── ...
```

## 3. Flujo de un request

Ejemplo: `POST /api/tasks/:id/sessions` (registrar un pomodoro).

```
1. Express recibe JSON
2. tasks.routes.js → service.registerSession(id, body)
3. taskService:
   a. requireTask(id)        → 404 si no existe
   b. assertCanRegisterSession(task) → 409 si está completada (RN3)
   c. parse(sessionSchema)   → 422 si la forma es inválida
   d. assertValidSession(...) → 400 si la duración no corresponde (RN4)
   e. repository.createSession(...)
4. Respuesta 201 { data: sesión }
```

Si cualquier paso lanza un `DomainError`, el `errorHandler` lo traduce:

```json
{ "error": { "code": "CONFLICT", "message": "No se pueden registrar pomodoros sobre una tarea completada." } }
```

## 4. Inyección de dependencias

`createTaskService({ repository, pomodoro })`:

- `repository` cumple un contrato fijo (métodos async).
- `pomodoro` aporta 25/5 desde configuración.

`repositories/index.js` decide:

```js
if (usesDatabase) return createPgRepository(config.databaseUrl);
return createMemoryRepository({ seedDefaults: true });
```

Ventajas:

- Tests de API sin DB (milisegundos, deterministas).
- El servicio no sabe si persiste en memoria o en PostgreSQL.
- Cambiar de motor implica una sola implementación nueva.

## 5. Manejo de errores

| Origen | Tipo | HTTP |
| --- | --- | --- |
| Zod | `DomainError` con `code: UNPROCESSABLE_ENTITY` | 422 |
| Regla de negocio | `DomainError` | 400 |
| Recurso inexistente | `NotFoundError` | 404 |
| Conflicto de estado | `ConflictError` | 409 |
| JSON inválido | error de `express.json` | 400 |
| Bug no previsto | `Error` | 500 (con log) |

Formato único:

```json
{
  "error": {
    "code": "UNPROCESSABLE_ENTITY",
    "message": "Datos inválidos.",
    "details": [{ "path": "title", "message": "El título debe tener al menos 3 caracteres." }]
  }
}
```

## 6. Validación en dos niveles

| Nivel | Dónde | Ejemplo |
| --- | --- | --- |
| Forma | `lib/validate.js` (Zod) | UUID válido, string de 3–120, enum de estado |
| Negocio | `domain/taskRules.js` | No registrar pomodoro en tarea completada |

Separarlos permite testear las reglas sin construir un request y reutilizarlas desde cualquier transporte (HTTP, CLI, job).

## 7. Frontend

- **Estado local** en `App.jsx` (`subjects`, `tasks`, `stats`, `filters`, `focusTaskId`, `theme`).
- **Sin estado global**: el tamaño no lo justifica.
- **Carga**: `Promise.all([subjects, tasks, stats])`; los filtros disparan recarga de tareas.
- **Errores**: capturados en `App` y mostrados en un banner descartable.
- **Timer**: `setInterval` de 1 s; al llegar a 0 registra la sesión y refresca métricas.
- **Tema**: `data-theme` en `<html>`, persistido en `localStorage`.
- **Accesibilidad**: labels asociados, `aria-live` en el tiempo, botones con `aria-label` donde el texto no alcanza.

## 8. Decisiones de seguridad

- SQL siempre parametrizado: no hay interpolación de input.
- `express.json({ limit: "100kb" })` para evitar payloads abusivos.
- CORS restringido por `CORS_ORIGIN` en producción.
- Sin secretos en el repo: `.env` ignorado, `.env.example` documenta variables.
- Errores 500 no exponen stack al cliente.
- `netlify.toml` agrega `X-Frame-Options`, `nosniff` y `Referrer-Policy`.

## 9. Observabilidad mínima

- `GET /api/health` para health checks de Render.
- Log de errores 500 en el servidor.
- Métricas de producto en `GET /api/stats`.
