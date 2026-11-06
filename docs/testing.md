# Estrategia de testing — Estudio Track

## 1. Enfoque

Pirámide chica y práctica:

```
        ▲  Manual / smoke en producción (5 min)
       ╱ ╲
      ╱   ╲  API (14 tests)  ← app real + repositorio en memoria
     ╱─────╲
    ╱       ╲ Dominio (5 tests) ← funciones puras, sin I/O
```

No hay tests de componentes React: el costo de configuración (jsdom, testing-library) no se justifica para el tamaño de la UI. La lógica con reglas vive en el backend y está cubierta.

## 2. Herramientas

| Necesidad | Herramienta | Motivo |
| --- | --- | --- |
| Runner | `node:test` | Nativo, cero configuración |
| Asserts | `node:assert/strict` | Estándar |
| HTTP | `fetch` global + `app.listen(0)` | Sin `supertest` |
| DB de test | Repositorio en memoria | Tests rápidos y aislados |

## 3. Cómo correr

```bash
cd backend
npm test

# Modo watch durante desarrollo
npm run test:watch
```

Salida esperada:

```
# tests 19
# pass 19
# fail 0
```

## 4. Inventario de tests

### Dominio — `test/rules.test.js` (5)

| Test | Regla |
| --- | --- |
| No se registra pomodoro en tarea completada | RN3 |
| Sí se registra en pendiente/en progreso | RN3 |
| Focus = 25 y break = 5 exactos | RN4 |
| Estimación entera entre 1 y 50, default 1 | RN5 |
| Completar es idempotente | RN6 |

### API — `test/api.test.js` (14)

| Test | Qué verifica |
| --- | --- |
| `GET /health` | Servicio vivo |
| `POST /subjects` | Creación con color |
| `POST /subjects` duplicado | `409` |
| `POST /tasks` mínimo | Default de estimación y estado inicial |
| `POST /tasks` título corto | `422` con detalle |
| `POST /tasks` materia inexistente | `404` |
| `GET /tasks` + filtros | Listado y `?status=` |
| `PATCH /tasks/:id` | Cambio de estado |
| `POST .../sessions` focus | `201`, 25 min, contador sube |
| `POST .../sessions` break | `201`, 5 min |
| `POST .../sessions` duración inválida | `400` |
| `POST .../complete` + sesión | `409` (RN3) e idempotencia |
| `GET /stats` | Agregados correctos |
| `DELETE /tasks/:id` | `204` y `404` posterior |

## 5. Rojo → verde → refactor (ejemplo real)

Caso: evitar pomodoros sobre tareas completadas.

**Rojo** — primero el test:

```js
test("no se puede registrar un pomodoro sobre una tarea completada", () => {
  assert.throws(
    () => assertCanRegisterSession({ id: "t1", status: TASK_STATUS.DONE }),
    (error) => error instanceof ConflictError && error.status === 409,
  );
});
```

**Verde** — la implementación mínima:

```js
export function assertCanRegisterSession(task) {
  if (task.status === TASK_STATUS.DONE) {
    throw new ConflictError("No se pueden registrar pomodoros sobre una tarea completada...");
  }
}
```

**Refactor** — se reutiliza la regla en el servicio y se agrega el test de API que confirma el `409` de punta a punta, sin duplicar la lógica.

## 6. Cobertura conceptual

| Área | Cubierta |
| --- | --- |
| Reglas de negocio | ✅ 10/10 (varias por test) |
| Endpoints | ✅ 12/12 |
| Validación de entrada | ✅ campos críticos |
| Errores HTTP | ✅ 400, 404, 409, 422 |
| Persistencia PostgreSQL | 🟡 manual (seed + smoke) |
| UI React | 🟡 manual |
| Deploy | 🟡 smoke test |

## 7. Checklist manual antes de entregar

1. `npm run migrate` y `npm run seed` sin errores.
2. `GET /api/health` responde `ok`.
3. Crear materia desde la UI y verla en los chips.
4. Crear tarea y verla en la lista con `0/1` pomodoros.
5. Presionar **Enfocar**: la tarea pasa a `en_progreso`.
6. Iniciar el timer y esperar (o reducir el tiempo en consola) hasta 00:00.
7. Verificar que el pomodoro se registró y que las métricas subieron.
8. Completar la tarea: no permite más pomodoros.
9. Reabrir: permite volver a enfocar.
10. Eliminar: desaparece y las métricas bajan.
11. Probar filtros por materia y estado.
12. Cambiar tema y recargar: se mantiene.
13. Abrir en 360 px de ancho: layout en una columna.

## 8. CI

`.github/workflows/ci.yml` ejecuta en cada push/PR:

- **Backend:** `npm ci` + `npm test` (Node 22).
- **Frontend:** `npm ci` + `npm run build`.

Un PR con tests en rojo no debería mergearse (regla en `AGENTS.md`).
