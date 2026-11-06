# AGENTS.md — Reglas del proyecto Estudio Track

Este archivo es el contrato de trabajo para cualquier agente de IA (o persona) que toque el repositorio. Se lee **antes** de escribir código y se respeta en cada tarea.

## 1. Contexto

- Producto: gestor de estudio con materias, tareas y Pomodoro.
- Arquitectura: SPA React + API REST Express + PostgreSQL.
- Objetivo del trabajo final: demostrar el proceso completo (spec → plan → tareas → tests → implementación → deploy) con calidad verificable.

## 2. Reglas de oro

1. **Nada se implementa sin spec.** Si una funcionalidad no está en `docs/spec.md`, primero se actualiza la spec y se aprueba.
2. **Los tests son el contrato.** No se modifica un test para que pase: se arregla el código. Si el test estaba mal, se justifica en el mensaje del commit.
3. **Rojo → verde → refactor.** Primero el test que falla, después la implementación mínima, después la mejora.
4. **Commits chicos y con intención.** Un commit = un cambio lógico. Formato: `tipo(área): descripción` (`feat`, `fix`, `test`, `docs`, `refactor`, `chore`).
5. **Sin secretos en el repo.** Credenciales, tokens y connection strings van en `.env` (ignorado por git).
6. **No romper el contrato de la API** sin actualizar `docs/api.md` y el frontend.
7. **Todo error se comunica con el formato estándar** (`{ error: { code, message, details? } }`).

## 3. Límites de arquitectura

```
routes → services → repositories → base de datos
             ↓
          domain (reglas puras)
```

- `routes/` **no** contiene lógica de negocio ni SQL.
- `services/` **no** conoce Express ni `pg`.
- `repositories/` **no** conoce Express ni reglas de negocio más allá de persistir.
- `domain/` es JavaScript puro, sin dependencias externas.
- `lib/validate.js` es el único lugar donde se definen esquemas Zod.

Si una tarea no encaja en esta estructura, se discute antes de code­ar.

## 4. Convenciones de código

- **ESM** (`import`/`export`), `"type": "module"`, Node 22.
- Nombres de archivos: `camelCase.js` para módulos, `PascalCase.jsx` para componentes.
- Funciones y variables en inglés; textos de usuario y documentación en español.
- Sin `var`. `const` por defecto, `let` solo si se reasigna.
- Errores de negocio con `DomainError` / `NotFoundError` / `ConflictError`; nunca `res.status()` dentro de un servicio.
- SQL siempre parametrizado (`$1`, `$2`). Prohibido concatenar input del usuario.
- Comentarios solo cuando explican el **por qué**, no el qué.

## 5. Validación

- Todo body/query que entra a la API pasa por Zod en `lib/validate.js`.
- Las reglas que no son de forma (por ejemplo, "no se registra pomodoro en tarea completada") viven en `domain/taskRules.js` y se testean aparte.

## 6. Tests

- Framework: `node:test` + `node:assert/strict`.
- Los tests de API usan la app real con repositorio en memoria (`test/helpers.js`).
- Cobertura mínima esperada: cada regla de negocio y cada endpoint principal.
- Comando obligatorio antes de cada commit: `npm --prefix backend test`.

## 7. Definición de terminado (DoD)

Una tarea está terminada cuando:

- [ ] Tiene criterio de aceptación en la spec.
- [ ] Tiene al menos un test que la cubre.
- [ ] `npm test` pasa completo.
- [ ] La documentación afectada está actualizada.
- [ ] El cambio se puede explicar en una frase.
- [ ] No se agregaron secretos ni archivos generados (`node_modules`, `dist`).

## 8. Flujo de agentes

1. **Analista** → escribe/actualiza la spec y los criterios de aceptación.
2. **Arquitecto** → decide dónde va el cambio y qué interfaces toca.
3. **Tester** → escribe los tests que fallan.
4. **Dev** → implementa hasta ponerlos en verde.
5. **Revisor** → audita reglas, tests, seguridad y documentación; aprueba o devuelve.

Ningún agente se autoaprueba. El detalle está en `docs/agents.md` y en `agents/`.

## 9. Prohibiciones

- ❌ Agregar dependencias sin justificar el costo (tamaño, mantenimiento, seguridad).
- ❌ `console.log` como mecanismo de error en producción.
- ❌ Hardcodear URLs, puertos o credenciales.
- ❌ Deshabilitar CORS por completo en producción.
- ❌ Mergear con tests en rojo.
- ❌ Reescribir el historial de git de una rama compartida.

## 10. Comandos

```bash
# Backend
cd backend
npm install
npm run dev        # API en :3000
npm test           # 19 tests
npm run migrate    # aplica schema.sql
npm run seed       # datos de demo

# Frontend
cd frontend
npm install
npm run dev        # SPA en :5173
npm run build      # build de producción

# Base de datos local
docker compose up -d
```
