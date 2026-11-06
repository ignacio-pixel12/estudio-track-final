# Backlog y estado — Estudio Track

Convención: `T-XX`. Estado: ✅ hecho · 🟡 en curso · ⬜ pendiente.

## Épica 1 · Descubrimiento

| ID | Tarea | Criterio de terminado | Estado |
| --- | --- | --- | --- |
| T-01 | Relevar el problema y usuarios | Contexto y usuarios en `docs/spec.md` | ✅ |
| T-02 | Definir alcance positivo y negativo | Sección "Alcance" completa | ✅ |
| T-03 | Escribir historias con criterios | 8 HU con Given/When/Then | ✅ |
| T-04 | Numerar reglas de negocio | RN1–RN10 sin ambigüedad | ✅ |

## Épica 2 · Arquitectura

| ID | Tarea | Criterio de terminado | Estado |
| --- | --- | --- | --- |
| T-05 | Definir capas y límites | `docs/architecture.md` con tabla de capas | ✅ |
| T-06 | Diseñar modelo de datos | Tablas, tipos, checks y relaciones | ✅ |
| T-07 | Definir contrato HTTP | 12 endpoints en `docs/api.md` | ✅ |
| T-08 | Registrar ADRs | 8 decisiones con contexto y consecuencias | ✅ |

## Épica 3 · Núcleo backend

| ID | Tarea | Criterio de terminado | Estado |
| --- | --- | --- | --- |
| T-09 | Configuración centralizada | `src/config.js` único punto de `process.env` | ✅ |
| T-10 | Errores de dominio | `DomainError`, `NotFoundError`, `ConflictError` | ✅ |
| T-11 | Reglas puras | `domain/taskRules.js` sin I/O | ✅ |
| T-12 | Validación con Zod | Esquemas para tarea, materia, sesión y filtros | ✅ |
| T-13 | Repositorio en memoria | Implementa el contrato completo | ✅ |
| T-14 | Repositorio PostgreSQL | SQL parametrizado + joins + agregados | ✅ |
| T-15 | Servicio de tareas | Orquesta reglas + repositorio | ✅ |
| T-16 | Rutas y app Express | 12 endpoints + health | ✅ |
| T-17 | Manejo de errores HTTP | Formato único `{ error: { code, message } }` | ✅ |

## Épica 4 · Base de datos

| ID | Tarea | Criterio de terminado | Estado |
| --- | --- | --- | --- |
| T-18 | Schema idempotente | `schema.sql` corre dos veces sin error | ✅ |
| T-19 | Índices | subject, status, created, session task/type | ✅ |
| T-20 | Trigger `updated_at` | Se actualiza sin intervención del backend | ✅ |
| T-21 | Migración y seed | `npm run migrate` / `npm run seed` | ✅ |

## Épica 5 · Tests

| ID | Tarea | Criterio de terminado | Estado |
| --- | --- | --- | --- |
| T-22 | Tests de reglas | 5 tests de dominio | ✅ |
| T-23 | Tests de API | Flujo completo + errores | ✅ |
| T-24 | Helper de app efímera | `buildTestContext()` con puerto 0 | ✅ |
| T-25 | Suite en verde | 19/19 sin DB | ✅ |

## Épica 6 · Frontend

| ID | Tarea | Criterio de terminado | Estado |
| --- | --- | --- | --- |
| T-26 | Cliente API | `src/api.js` con manejo de errores | ✅ |
| T-27 | Layout y tema | Dark/light persistido, responsive | ✅ |
| T-28 | Formulario de materias | Crea y lista con color | ✅ |
| T-29 | Formulario de tareas | Título, materia, estimación, notas | ✅ |
| T-30 | Lista y acciones | Enfocar, completar, reabrir, eliminar, ajustar | ✅ |
| T-31 | Timer Pomodoro | 25/5, pausa, reinicio, registro automático | ✅ |
| T-32 | Filtros y métricas | Por materia/estado + tarjetas de resumen | ✅ |

## Épica 7 · Entrega

| ID | Tarea | Criterio de terminado | Estado |
| --- | --- | --- | --- |
| T-33 | Equipo de agentes | 5 roles + flujo en `docs/agents.md` | ✅ |
| T-34 | Reglas del repo | `AGENTS.md` completo | ✅ |
| T-35 | Deploy configurado | `render.yaml`, `netlify.toml`, `.env.example` | ✅ |
| T-36 | CI | GitHub Actions con tests y build | ✅ |
| T-37 | Documento de entrega | `ENTREGA_FINAL.md` consolidado | ✅ |

## Resumen

| Épica | Tareas | Hechas |
| --- | --- | --- |
| 1. Descubrimiento | 4 | 4 |
| 2. Arquitectura | 4 | 4 |
| 3. Backend | 9 | 9 |
| 4. Base de datos | 4 | 4 |
| 5. Tests | 4 | 4 |
| 6. Frontend | 7 | 7 |
| 7. Entrega | 5 | 5 |
| **Total** | **37** | **37** |
