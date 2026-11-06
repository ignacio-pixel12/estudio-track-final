# Estudio Track

Aplicación web para organizar el estudio: materias, tareas y sesiones de **Pomodoro** en un solo lugar. Nació como TP del Módulo 2 y llega al trabajo final como una aplicación full-stack con API REST, base de datos PostgreSQL, tests automatizados y deploy en la nube.

> **Trabajo final — Generación T**
> Ignacio García Belvedere · DNI 49.257.438 · `Ignaciogbelvedere@gmail.com`

---

## ¿Qué resuelve?

Quien estudia suele repartir su organización entre una app de notas, un calendario, un temporizador y una planilla. Estudio Track une esas piezas:

- **Materias** con color para identificar cada área.
- **Tareas** con estado (`pendiente`, `en_progreso`, `completada`) y estimación en pomodoros.
- **Timer Pomodoro** de 25/5 que registra cada bloque de foco sobre la tarea elegida.
- **Métricas** de tareas y minutos de estudio.
- **Filtros** por materia y estado.

## Stack

| Capa | Tecnología |
| --- | --- |
| Frontend | React 18 + Vite |
| Backend | Node.js 22 + Express 4 |
| Validación | Zod |
| Base de datos | PostgreSQL 16 (Neon en producción) |
| Tests | `node:test` + `fetch` (sin dependencias extra) |
| Deploy | Netlify (front) · Render (API) · Neon (DB) |
| CI | GitHub Actions |

## Estructura del repositorio

```
estudio-track-final/
├── backend/            API REST (Express, capas, repositorios, SQL, tests)
├── frontend/           SPA React + Vite
├── docs/               Spec, plan, tareas, arquitectura, API, DB, tests, deploy
├── agents/             Definiciones del equipo de agentes
├── AGENTS.md           Reglas del proyecto para agentes de IA
├── ENTREGA_FINAL.md    Documento único con todo el material de la entrega
├── docker-compose.yml  PostgreSQL local
├── render.yaml         Blueprint de deploy del backend
└── netlify.toml        Configuración de deploy del frontend
```

## Correr en local

### 1. Requisitos

- Node.js 22 o superior
- PostgreSQL 16 (opcional: la API arranca con persistencia en memoria si no hay `DATABASE_URL`)

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env      # Windows: copy .env.example .env
npm run dev
```

La API queda en `http://localhost:3000`. Sin `DATABASE_URL` usa un repositorio en memoria con dos materias de ejemplo: ideal para probar el frontend sin instalar nada más.

### 3. Base de datos (opcional, recomendado)

```bash
docker compose up -d
cd backend
npm run migrate
npm run seed
```

### 4. Frontend

```bash
cd frontend
npm install
cp .env.example .env      # Windows: copy .env.example .env
npm run dev
```

Abrí `http://localhost:5173`.

## Tests

```bash
cd backend
npm test
```

Resultado esperado: **19 tests en verde** (5 de reglas de dominio + 14 de API).

## API

| Método | Ruta | Descripción |
| --- | --- | --- |
| GET | `/api/health` | Estado del servicio |
| GET | `/api/subjects` | Lista materias |
| POST | `/api/subjects` | Crea una materia |
| GET | `/api/tasks` | Lista tareas (`?subjectId=&status=`) |
| POST | `/api/tasks` | Crea una tarea |
| GET | `/api/tasks/:id` | Detalle de una tarea |
| PATCH | `/api/tasks/:id` | Actualiza campos o estado |
| DELETE | `/api/tasks/:id` | Elimina la tarea y sus sesiones |
| POST | `/api/tasks/:id/complete` | Completa la tarea (idempotente) |
| GET | `/api/tasks/:id/sessions` | Historial de pomodoros |
| POST | `/api/tasks/:id/sessions` | Registra un pomodoro |
| GET | `/api/stats` | Métricas agregadas |

Detalle completo en [`docs/api.md`](docs/api.md).

## Deploy

1. **Neon** → crear proyecto PostgreSQL y copiar la connection string.
2. **Render** → conectar el repo, usar `render.yaml` o configurar `backend/` como root.
3. **Netlify** → conectar el repo con base `frontend/`.
4. Cargar variables de entorno y correr `npm run migrate` una vez.

Guía paso a paso en [`docs/deploy.md`](docs/deploy.md).

## Documentación

| Documento | Contenido |
| --- | --- |
| [`docs/spec.md`](docs/spec.md) | Especificación funcional y criterios de aceptación |
| [`docs/plan.md`](docs/plan.md) | Plan, decisiones técnicas y riesgos |
| [`docs/tasks.md`](docs/tasks.md) | Backlog y estado de cada tarea |
| [`docs/architecture.md`](docs/architecture.md) | Arquitectura, capas y flujo de un request |
| [`docs/api.md`](docs/api.md) | Contrato de la API con ejemplos |
| [`docs/database.md`](docs/database.md) | Modelo de datos, índices y consultas |
| [`docs/testing.md`](docs/testing.md) | Estrategia y casos de prueba |
| [`docs/agents.md`](docs/agents.md) | Equipo de agentes y flujo de trabajo |
| [`docs/deploy.md`](docs/deploy.md) | Deploy en Neon, Render y Netlify |
| [`ENTREGA_FINAL.md`](ENTREGA_FINAL.md) | Todo el material consolidado para la entrega |

## Licencia

Proyecto académico. Uso educativo.
