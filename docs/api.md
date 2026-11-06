# API REST — Estudio Track

**Base local:** `http://localhost:3000/api`
**Base producción:** `https://<servicio>.onrender.com/api`

## 1. Convenciones

### Respuesta exitosa

```json
{ "data": { } }
```

Los listados devuelven `{ "data": [ ... ] }`. Los `DELETE` devuelven `204` sin cuerpo.

### Respuesta de error

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Descripción legible",
    "details": [{ "path": "title", "message": "..." }]
  }
}
```

### Códigos

| Código | Cuándo |
| --- | --- |
| `200` | Consulta o actualización exitosa |
| `201` | Recurso creado |
| `204` | Eliminación exitosa |
| `400` | Regla de negocio violada (ej. duración inválida) |
| `404` | Recurso inexistente |
| `409` | Conflicto (materia duplicada, tarea completada) |
| `422` | Error de validación de forma |
| `500` | Error inesperado |

---

## 2. Health

### `GET /api/health`

```json
{
  "status": "ok",
  "service": "estudio-track-api",
  "timestamp": "2026-11-06T12:00:00.000Z"
}
```

---

## 3. Materias

### `GET /api/subjects`

```json
{
  "data": [
    { "id": "8b1c...", "name": "Matemática", "color": "#6366f1", "createdAt": "2026-11-06T12:00:00.000Z" }
  ]
}
```

Ordenadas alfabéticamente.

### `POST /api/subjects`

| Campo | Tipo | Requerido | Regla |
| --- | --- | --- | --- |
| `name` | string | sí | 2–60 caracteres, único sin distinguir mayúsculas |
| `color` | string | no | `#RRGGBB`, default `#6366f1` |

```bash
curl -X POST http://localhost:3000/api/subjects \
  -H "Content-Type: application/json" \
  -d '{"name":"Física","color":"#22c55e"}'
```

`201`:

```json
{
  "data": {
    "id": "c2f1...",
    "name": "Física",
    "color": "#22c55e",
    "createdAt": "2026-11-06T12:00:00.000Z"
  }
}
```

Errores: `409` nombre duplicado · `422` nombre/color inválido.

---

## 4. Tareas

### Modelo de tarea

```json
{
  "id": "6a3d...",
  "title": "Resolver guía de integrales",
  "subjectId": "8b1c...",
  "status": "pendiente",
  "estimatedPomodoros": 3,
  "completedPomodoros": 1,
  "totalFocusMinutes": 25,
  "notes": null,
  "createdAt": "2026-11-06T12:00:00.000Z",
  "updatedAt": "2026-11-06T12:10:00.000Z",
  "completedAt": null,
  "subject": { "id": "8b1c...", "name": "Matemática", "color": "#6366f1" }
}
```

`completedPomodoros` y `totalFocusMinutes` se calculan a partir de las sesiones (no se editan a mano).

### `GET /api/tasks`

Query params opcionales:

| Parámetro | Valores | Ejemplo |
| --- | --- | --- |
| `subjectId` | UUID | `?subjectId=8b1c...` |
| `status` | `pendiente` \| `en_progreso` \| `completada` | `?status=pendiente` |

Orden: creación descendente.

### `POST /api/tasks`

| Campo | Tipo | Requerido | Regla |
| --- | --- | --- | --- |
| `title` | string | sí | 3–120 caracteres |
| `subjectId` | UUID | sí | debe existir |
| `estimatedPomodoros` | int | no | 1–50, default 1 |
| `notes` | string \| null | no | máx. 500 |

```bash
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"Resolver guía de integrales","subjectId":"8b1c...","estimatedPomodoros":3}'
```

`201` con el modelo completo. Errores: `404` materia inexistente · `422` validación.

### `GET /api/tasks/:id`

`200` con la tarea · `404` si no existe.

### `PATCH /api/tasks/:id`

Acepta cualquier subconjunto de: `title`, `subjectId`, `status`, `estimatedPomodoros`, `notes`.

```bash
curl -X PATCH http://localhost:3000/api/tasks/6a3d... \
  -H "Content-Type: application/json" \
  -d '{"status":"en_progreso"}'
```

Reglas:

- Sin campos → `422`.
- `status` fuera del enum → `422`.
- Reabrir (`status` distinto de `completada`) limpia `completedAt`.
- `subjectId` inexistente → `404`.

### `POST /api/tasks/:id/complete`

Marca la tarea como `completada`. Idempotente: si ya lo estaba, devuelve `200` sin tocar `completedAt`.

### `DELETE /api/tasks/:id`

`204`. Elimina en cascada sus `pomodoro_sessions`. `404` si no existe.

---

## 5. Sesiones de Pomodoro

### `GET /api/tasks/:id/sessions`

```json
{
  "data": [
    {
      "id": "f90a...",
      "taskId": "6a3d...",
      "type": "focus",
      "durationMinutes": 25,
      "startedAt": "2026-11-06T12:20:00.000Z",
      "endedAt": "2026-11-06T12:45:00.000Z"
    }
  ]
}
```

Orden: más recientes primero.

### `POST /api/tasks/:id/sessions`

| Campo | Tipo | Requerido | Regla |
| --- | --- | --- | --- |
| `type` | `focus` \| `break` | no | default `focus` |
| `durationMinutes` | int | no | `focus` → 25 · `break` → 5 |

```bash
curl -X POST http://localhost:3000/api/tasks/6a3d.../sessions \
  -H "Content-Type: application/json" \
  -d '{"type":"focus"}'
```

`201` con la sesión creada.

Errores:

- `404` tarea inexistente.
- `409` tarea completada (RN3).
- `400` duración distinta a la del tipo (RN4).
- `422` tipo inválido.

---

## 6. Métricas

### `GET /api/stats`

```json
{
  "data": {
    "subjects": 3,
    "tasksTotal": 5,
    "tasksByStatus": { "pendiente": 2, "en_progreso": 1, "completada": 2 },
    "focusSessions": 7,
    "focusMinutes": 175
  }
}
```

Sin datos, todos los valores son `0`.

---

## 7. Ejemplo de flujo completo

```bash
BASE=http://localhost:3000/api

# 1. Materia
SUBJECT=$(curl -s -X POST $BASE/subjects -H "Content-Type: application/json" \
  -d '{"name":"Programación","color":"#22c55e"}' | jq -r .data.id)

# 2. Tarea
TASK=$(curl -s -X POST $BASE/tasks -H "Content-Type: application/json" \
  -d "{\"title\":\"Terminar el TP final\",\"subjectId\":\"$SUBJECT\",\"estimatedPomodoros\":4}" | jq -r .data.id)

# 3. Pomodoro
curl -s -X POST $BASE/tasks/$TASK/sessions -H "Content-Type: application/json" -d '{"type":"focus"}'

# 4. Completar
curl -s -X POST $BASE/tasks/$TASK/complete

# 5. Métricas
curl -s $BASE/stats | jq
```
