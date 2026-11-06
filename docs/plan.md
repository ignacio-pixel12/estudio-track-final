# Plan de proyecto — Estudio Track

## 1. Enfoque

Entrega incremental en cinco iteraciones, cada una con algo verificable. El orden sigue el proceso trabajado en el Módulo 4: **spec → plan → tareas → tests → implementación → deploy**, con revisión entre etapas.

| Iteración | Resultado verificable | Estado |
| --- | --- | --- |
| 1. Descubrimiento | Spec con alcance, historias y reglas | ✅ |
| 2. Arquitectura | Capas, modelo de datos, contrato de API | ✅ |
| 3. Núcleo | Dominio + servicios + repositorios + tests | ✅ |
| 4. Interfaz | API HTTP completa + SPA React | ✅ |
| 5. Entrega | Tests en verde, build, deploy, documentación | ✅ |

## 2. Arquitectura

```
┌─────────────────────────────┐
│  Frontend (React + Vite)    │
│  App.jsx + componentes      │
└──────────────┬──────────────┘
               │ fetch JSON
┌──────────────▼──────────────┐
│  API Express                │
│  routes → services → repos  │
│         ↘ domain (reglas)   │
└──────────────┬──────────────┘
               │ SQL parametrizado
┌──────────────▼──────────────┐
│  PostgreSQL (Neon / Docker) │
└─────────────────────────────┘
```

### Capas del backend

| Capa | Responsabilidad | No puede |
| --- | --- | --- |
| `routes/` | Traducir HTTP ↔ servicio | Tener reglas ni SQL |
| `services/` | Orquestar reglas y persistencia | Conocer Express o `pg` |
| `domain/` | Reglas puras e invariantes | Tener I/O |
| `repositories/` | Persistencia | Decidir reglas de negocio |
| `lib/validate.js` | Validación de forma (Zod) | Acceder a la base |
| `middleware/` | Errores y 404 | Contener lógica de negocio |

### Inyección de dependencias

`createTaskService({ repository, pomodoro })` recibe el repositorio. Eso permite:

- `memoryTaskRepository` para tests y demo sin DB.
- `pgTaskRepository` para producción.
- Tests de API contra la app real, sin mocks de Express y sin base de datos.

## 3. Decisiones técnicas (ADR)

### ADR-01 · Node.js + Express
**Contexto:** el curso trabaja Node en el Módulo 4 y el TP anterior ya era JavaScript.
**Decisión:** Express 4 con ESM.
**Alternativas:** Fastify (más rápido, menos material del curso), NestJS (excesivo para el alcance).
**Consecuencia:** ecosistema conocido, curva baja, suficiente para 12 endpoints.

### ADR-02 · PostgreSQL
**Contexto:** se necesitan relaciones materia → tarea → sesiones e integridad referencial.
**Decisión:** PostgreSQL 16, con Neon en producción.
**Alternativas:** MongoDB (peor encaje para relaciones y agregaciones), SQLite (no apto para el deploy elegido).
**Consecuencia:** SQL explícito, checks y `on delete cascade`; se puede auditar el modelo.

### ADR-03 · Repositorio inyectable
**Contexto:** testear la API no debería exigir levantar una base.
**Decisión:** dos implementaciones del mismo contrato y una factory según `DATABASE_URL`.
**Consecuencia:** tests en milisegundos; riesgo de divergencia entre implementaciones, mitigado con tests de contrato sobre la interfaz.

### ADR-04 · Zod
**Contexto:** validar entrada a mano genera errores repetidos y mensajes inconsistentes.
**Decisión:** esquemas declarativos y un `parse()` que devuelve `422` con detalle por campo.
**Consecuencia:** mensajes uniformes en español; una dependencia chica y sin transitivas pesadas.

### ADR-05 · React + Vite
**Contexto:** la SPA original era HTML/CSS/JS; el Módulo 4 introduce React.
**Decisión:** React 18 con Vite, sin framework de UI ni estado global.
**Consecuencia:** build de ~50 kB gzip, componentes simples, cero dependencias de estilo.

### ADR-06 · Tests con `node:test`
**Contexto:** el curso pide tests, pero sumar Jest/Vitest agrega configuración y peso.
**Decisión:** runner nativo de Node + `fetch` global contra un puerto efímero.
**Consecuencia:** cero dependencias de testing, ejecución en ~0,3 s.

### ADR-07 · Monorepo
**Contexto:** frontend y backend evolucionan juntos y comparten documentación.
**Decisión:** un repo con `backend/`, `frontend/`, `docs/`, `agents/`.
**Consecuencia:** un solo enlace de entrega; CI separa los jobs por carpeta.

### ADR-08 · Deploy gratuito
**Contexto:** la consigna pide URL pública sin presupuesto.
**Decisión:** Netlify (front), Render free (API), Neon free (DB).
**Consecuencia:** la API free duerme tras inactividad (primer request lento); documentado en `docs/deploy.md`.

## 4. Riesgos y mitigaciones

| Riesgo | Prob. | Impacto | Mitigación |
| --- | --- | --- | --- |
| Divergencia memoria/PostgreSQL | Media | Alto | Mismo contrato + revisión de queries + tests de API |
| SQL injection | Baja | Alto | Consultas 100 % parametrizadas |
| API free de Render dormida | Alta | Bajo | Health check y aviso de primer request lento |
| CORS mal configurado | Media | Medio | `CORS_ORIGIN` por entorno documentado |
| Pérdida de datos en Neon | Baja | Alto | Backups del plan free + migración idempotente |
| Scope creep | Media | Medio | Alcance negativo escrito en la spec |
| Timer con `setInterval` impreciso | Media | Bajo | Se recalcula por segundos restantes; se registra al llegar a 0 |

## 5. Estimación

| Etapa | Esfuerzo |
| --- | --- |
| Spec y plan | 3 h |
| Modelo de datos y SQL | 2 h |
| Backend (dominio, servicios, API) | 6 h |
| Tests | 3 h |
| Frontend | 6 h |
| Documentación y agentes | 4 h |
| Deploy y verificación | 2 h |
| **Total** | **26 h** |

## 6. Criterio de cierre

El proyecto se considera terminado cuando:

1. `npm test` devuelve 19/19 en verde.
2. `npm run build` del frontend termina sin warnings.
3. El flujo completo funciona contra PostgreSQL.
4. La URL pública responde `200` en `/api/health`.
5. `ENTREGA_FINAL.md` está actualizado con los enlaces reales.
