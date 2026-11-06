# Equipo de agentes — Estudio Track

## 1. Por qué agentes

El Módulo 1 trabaja el uso responsable de IA y el Módulo 4 propone un flujo con agentes especializados. La idea central: **la IA no reemplaza el criterio, lo ordena**. Cada rol tiene entradas, salidas y una definición de terminado. Ningún agente se autoaprueba.

## 2. Roles

| Agente | Archivo | Responsabilidad | Artefacto |
| --- | --- | --- | --- |
| Analista | [`agents/analista.md`](../agents/analista.md) | Convertir el pedido en spec verificable | `docs/spec.md` |
| Arquitecto | [`agents/arquitecto.md`](../agents/arquitecto.md) | Decidir dónde vive el cambio y qué contratos toca | `docs/plan.md`, `docs/architecture.md` |
| Tester | [`agents/tester.md`](../agents/tester.md) | Escribir tests que fallen por la razón correcta | `backend/test/*` |
| Dev | [`agents/dev.md`](../agents/dev.md) | Implementar hasta poner los tests en verde | `backend/src`, `frontend/src` |
| Revisor | [`agents/revisor.md`](../agents/revisor.md) | Auditar y aprobar o devolver | Veredicto con hallazgos |

## 3. Flujo

```
Pedido
  │
  ▼
[Analista] ── spec con criterios ──► [Arquitecto]
                                       │ plan + contratos
                                       ▼
                                   [Tester] ── tests en rojo ──► [Dev]
                                                                  │ código
                                                                  ▼
                                                              [Revisor]
                                                              │
                                              ┌───────────────┴───────────────┐
                                         aprobado                      cambios requeridos
                                              │                               │
                                            merge                       vuelve a Tester/Dev
```

### Handoffs (qué se entrega en cada paso)

| De → A | Artefacto | Criterio de aceptación del handoff |
| --- | --- | --- |
| Analista → Arquitecto | HU + RN | Cada HU tiene criterios observables |
| Arquitecto → Tester | Plan + contratos | Archivos y endpoints identificados |
| Tester → Dev | Tests en rojo | Fallan por la razón correcta, no por sintaxis |
| Dev → Revisor | Diff + tests verdes | `npm test` pasa completo |
| Revisor → equipo | Veredicto | Hallazgos con archivo y línea |

## 4. Ejemplo aplicado: soporte de descansos

**Analista** detecta que el timer tiene modo descanso pero la API no lo registra bien:

> HU-06, criterio: "Dado `{ type: "break" }` sin duración, entonces la sesión dura 5 minutos".

**Arquitecto** ubica el cambio en `taskService.registerSession` (default según tipo) sin tocar rutas ni repositorios.

**Tester** agrega a `api.test.js`:

```js
await t.test("registra un descanso de 5 minutos", async () => {
  const { status, body } = await ctx.request(`/tasks/${taskId}/sessions`, {
    method: "POST",
    body: { type: "break" },
  });
  assert.equal(status, 201);
  assert.equal(body.data.durationMinutes, 5);
});
```

**Dev** corrige el default:

```js
const durationMinutes =
  data.durationMinutes ??
  (data.type === "focus" ? pomodoro.focusMinutes : pomodoro.breakMinutes);
```

**Revisor** verifica que el test falla sin el cambio, que la regla RN4 sigue cubierta y que `docs/api.md` ya documentaba el comportamiento. Aprueba.

## 5. Prompt de sistema sugerido

```
Sos el agente <rol> del proyecto Estudio Track.
Leé AGENTS.md y docs/<documento>.md antes de responder.
Tu salida debe ser <artefacto>.
No avances de etapa sin cumplir el checklist de tu rol.
Si falta información, hacé preguntas concretas en lugar de inventar.
Nunca modifiques tests para que pasen sin justificar el error del test.
```

## 6. Guardrails

- **Human in the loop:** el usuario valida spec y deploy; el agente no publica nada solo.
- **Sin secretos:** los agentes no reciben credenciales reales; usan `.env.example`.
- **Trazabilidad:** cada cambio relevante queda en `docs/tasks.md`.
- **Límite de alcance:** si una idea no está en la spec, primero se discute; no se implementa "de paso".
- **Verificación independiente:** el revisor no es el autor. En este proyecto, la revisión final la hizo una instancia distinta de la que implementó, con el checklist de `agents/revisor.md`.

## 7. Qué se aprendió

1. **La spec ahorra retrabajo.** Dos ambigüedades (duración del descanso y reapertura de tareas) se resolvieron escribiendo el criterio antes del código.
2. **El test es la documentación ejecutable.** Los 19 tests describen el sistema mejor que cualquier comentario.
3. **La revisión encuentra lo que el autor no ve.** El caso del `break` lo detectó el revisor, no el dev.
4. **Los agentes rinden cuando el contrato es claro.** Roles difusos producen código difuso.
