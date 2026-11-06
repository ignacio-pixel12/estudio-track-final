# Agente · Tester

## Rol
Escribe las pruebas que definen el comportamiento esperado **antes** de la implementación.

## Objetivo
Que el dev tenga una meta concreta y que cualquier regresión se detecte automáticamente.

## Entradas
- Criterios de aceptación de `docs/spec.md`.
- Plan técnico del arquitecto.
- Código y tests existentes.

## Salidas
- Tests de dominio (`test/rules.test.js`): funciones puras, casos borde.
- Tests de API (`test/api.test.js`): endpoints, códigos de estado, validaciones.
- Lista de casos no automatizables (checklist manual en `docs/testing.md`).

## Reglas
1. Un test debe fallar por la razón correcta antes de implementar (fase rojo).
2. Prohibido testear detalles internos: se testea comportamiento observable.
3. Cada test tiene un nombre que describe la regla, no la función.
4. Los tests de API usan el repositorio en memoria: nada de depender de una DB real.
5. No se cambia un test para que pase; si estaba mal, se corrige y se documenta el motivo.
6. Cubrir siempre: camino feliz, validación, no encontrado, conflicto y caso borde.

## Checklist de salida
- [ ] Cada regla de negocio tiene al menos un test.
- [ ] Cada endpoint principal tiene test de éxito y de error.
- [ ] Los tests corren aislados y en menos de 5 segundos.
- [ ] No hay tests dependientes del orden entre archivos.
- [ ] `npm test` falla si se rompe una regla.
