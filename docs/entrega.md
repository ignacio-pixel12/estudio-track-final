# Checklist de entrega — Estudio Track

## 1. Qué se entrega

| Artefacto | Ubicación | Estado |
| --- | --- | --- |
| Código backend | `backend/` | ✅ |
| Código frontend | `frontend/` | ✅ |
| Esquema y seed de base | `backend/src/db/` | ✅ |
| Tests automatizados (19) | `backend/test/` | ✅ |
| Documento consolidado | `ENTREGA_FINAL.md` | ✅ |
| Documentación técnica | `docs/` | ✅ |
| Reglas para agentes | `AGENTS.md` + `agents/` | ✅ |
| Configuración de deploy | `render.yaml`, `netlify.toml` | ✅ |
| CI | `.github/workflows/ci.yml` | ✅ |
| Datos del alumno | `ENTREGA_FINAL.md` | ✅ |

## 2. Verificación técnica

| # | Comando / acción | Resultado esperado | Estado |
| --- | --- | --- | --- |
| 1 | `cd backend && npm ci` | Sin errores | ✅ |
| 2 | `npm test` | 19/19 en verde | ✅ |
| 3 | `cd frontend && npm ci` | Sin errores | ✅ |
| 4 | `npm run build` | `dist/` generado, sin warnings | ✅ |
| 5 | `docker compose up -d` | PostgreSQL healthy | ✅ |
| 6 | `npm run migrate` | "Esquema aplicado correctamente" | ✅ |
| 7 | `npm run seed` | Materias y tareas creadas | ✅ |
| 8 | Flujo completo en local | Sin errores en consola | ✅ |
| 9 | `GET /api/health` en producción | `200 ok` | ⬜ (depende del deploy) |

## 3. Verificación de la consigna

| Requisito del curso | Dónde se cumple |
| --- | --- |
| Proyecto real, no de ejemplo | Estudio Track nace del TP del M2 |
| Spec escrita antes del código | `docs/spec.md` |
| Plan y tareas | `docs/plan.md`, `docs/tasks.md` |
| Tests (rojo-verde-refactor) | `docs/testing.md`, `backend/test/` |
| Base de datos relacional | `docs/database.md`, `backend/src/db/schema.sql` |
| API REST | `docs/api.md` |
| Frontend que consume la API | `frontend/src/` |
| Agentes y `AGENTS.md` | `AGENTS.md`, `agents/`, `docs/agents.md` |
| Deploy en la nube | `docs/deploy.md`, `render.yaml`, `netlify.toml` |
| Link al repositorio | Completar en `ENTREGA_FINAL.md` después de publicar |

## 4. Publicar el repositorio (paso del alumno)

El proyecto ya está inicializado como repo Git con un commit inicial. Para publicarlo:

```bash
cd C:\Users\Nitro\eclipse-workspace\estudio-track-final

# Crear el repo vacío en GitHub (sin README, sin .gitignore)
git remote add origin https://github.com/<usuario>/estudio-track-final.git
git branch -M main
git push -u origin main
```

Después del push:

1. Copiar el enlace del repo.
2. Reemplazar `https://github.com/<usuario>/estudio-track-final` en `ENTREGA_FINAL.md` (sección "Enlaces").
3. Seguir `docs/deploy.md` para Neon, Render y Netlify.
4. Pegar el link del repo en la entrega del campus.
5. Opcional: agregar la URL de la demo en la descripción del repo.

## 5. Estructura del ZIP

```
EstudioTrack-Entrega-Final.zip
└── estudio-track-final/
    ├── README.md
    ├── ENTREGA_FINAL.md
    ├── AGENTS.md
    ├── package.json
    ├── docker-compose.yml
    ├── render.yaml
    ├── netlify.toml
    ├── backend/
    ├── frontend/
    ├── docs/
    ├── agents/
    └── .github/workflows/ci.yml
```

> `node_modules/` y `dist/` no se incluyen: se regeneran con `npm install` y `npm run build`.

## 6. Defensa del proyecto (preguntas probables)

| Pregunta | Respuesta corta |
| --- | --- |
| ¿Por qué PostgreSQL y no MongoDB? | Relaciones materia→tarea→sesión, integridad referencial y agregados con SQL. |
| ¿Por qué dos repositorios? | Testear sin DB y demostrar inversión de dependencias. |
| ¿Dónde están las reglas de negocio? | `domain/taskRules.js` + `services/taskService.js`; nunca en rutas. |
| ¿Cómo evitás SQL injection? | Todas las consultas usan placeholders `$n`. |
| ¿Qué pasa si se cae la DB? | La API falla con `500` controlado; `/health` sigue respondiendo. |
| ¿Por qué no hay login? | Fuera de alcance declarado; una instancia por usuario. |
| ¿Cómo escalaría a multiusuario? | Tabla `users`, `owner_id` en `subjects` y middleware de auth. |
| ¿Qué testearías después? | Contrato de `pgTaskRepository` contra una DB efímera y tests de componentes. |
| ¿Qué aprendiste del proceso? | La spec y los tests evitan retrabajo; el revisor encuentra lo que el autor no ve. |
