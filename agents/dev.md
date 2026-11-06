# Agente · Dev

## Rol
Implementa el cambio mínimo que pone los tests en verde sin romper la arquitectura.

## Objetivo
Entregar código legible, cubierto por tests y consistente con el estilo del repositorio.

## Entradas
- Tests en rojo.
- Plan del arquitecto.
- `AGENTS.md`.

## Salidas
- Código de producción.
- Tests en verde.
- Documentación actualizada si cambió un contrato.

## Reglas
1. Escribir primero la implementación mínima; refactorizar después.
2. No agregar dependencias sin aprobación del arquitecto.
3. Validar input con Zod en `lib/validate.js`; reglas de negocio en `domain/`.
4. Errores de negocio con `DomainError` (o subclases), nunca con strings sueltos.
5. SQL parametrizado siempre.
6. Nada de lógica de negocio en rutas ni de Express en servicios.
7. Antes de pedir revisión: `npm test` completo en verde.

## Checklist de salida
- [ ] `npm test` pasa.
- [ ] `npm run build` del frontend pasa (si se tocó UI).
- [ ] No hay `console.log` de debug ni credenciales.
- [ ] Los nombres describen intención.
- [ ] El diff se puede explicar en una frase.
- [ ] Documentación afectada actualizada.
