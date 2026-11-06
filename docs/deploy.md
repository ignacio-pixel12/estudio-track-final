# Deploy — Estudio Track

Arquitectura de producción:

```
Netlify (SPA)  ──HTTPS──►  Render (API)  ──SSL──►  Neon (PostgreSQL)
 frontend                  backend                 database
```

Todo en planes gratuitos.

---

## 1. Base de datos · Neon

1. Crear cuenta en <https://neon.tech> y un proyecto llamado `estudio-track`.
2. Región recomendada: la más cercana al servicio de Render (`us-east-2` u `oregon`).
3. Copiar la **connection string** del dashboard:

```
postgresql://usuario:password@ep-xxxx.us-east-2.aws.neon.tech/estudio_track?sslmode=require
```

4. Guardarla: se usa como `DATABASE_URL` en Render y en local si se quiere probar contra la nube.

> Neon free incluye 0,5 GB y suspensión por inactividad. Para el volumen del TP es más que suficiente.

### Aplicar el esquema

```bash
cd backend
# .env con DATABASE_URL=<connection string de Neon>
npm run migrate
npm run seed      # opcional: datos de demostración
```

---

## 2. API · Render

### Opción A — Blueprint (`render.yaml`)

1. Subir el repo a GitHub.
2. En Render: **New → Blueprint** → seleccionar el repo.
3. Render detecta `render.yaml` y crea `estudio-track-api` con root `backend/`.
4. Completar las variables marcadas con `sync: false`:
   - `DATABASE_URL` → connection string de Neon.
   - `CORS_ORIGIN` → URL de Netlify (se completa después del paso 3).
5. Deploy.

### Opción B — Manual

| Campo | Valor |
| --- | --- |
| Type | Web Service |
| Root Directory | `backend` |
| Runtime | Node 22 |
| Build Command | `npm ci` |
| Start Command | `npm start` |
| Health Check Path | `/api/health` |

### Variables de entorno

| Variable | Ejemplo | Obligatoria |
| --- | --- | --- |
| `NODE_ENV` | `production` | sí |
| `DATABASE_URL` | `postgresql://...neon.tech/estudio_track?sslmode=require` | sí |
| `CORS_ORIGIN` | `https://estudio-track.netlify.app` | sí |
| `PORT` | Render lo inyecta | no |

> Si `DATABASE_URL` falta, la API arranca en memoria. Sirve para probar, pero **los datos se pierden en cada reinicio**.

### Verificar

```bash
curl https://<servicio>.onrender.com/api/health
# {"status":"ok","service":"estudio-track-api","timestamp":"..."}
```

> El plan free duerme tras ~15 min sin tráfico. El primer request puede tardar 30–50 s.

---

## 3. Frontend · Netlify

1. En Netlify: **Add new site → Import an existing project** → GitHub → repo.
2. Configuración (o dejar que tome `netlify.toml`):

| Campo | Valor |
| --- | --- |
| Base directory | `frontend` |
| Build command | `npm run build` |
| Publish directory | `frontend/dist` (Netlify lo resuelve relativo a la base) |
| Node version | 22 (`NODE_VERSION`) |

3. Variable de entorno:

```
VITE_API_URL=https://<servicio>.onrender.com/api
```

4. Deploy. Copiar la URL final (`https://algo.netlify.app`).

### Cerrar el círculo de CORS

Volver a Render → `estudio-track-api` → Environment → actualizar:

```
CORS_ORIGIN=https://algo.netlify.app
```

Guardar (Render redeploya solo). Sin este paso el navegador bloquea los requests.

---

## 4. Smoke test de producción

| # | Acción | Resultado esperado |
| --- | --- | --- |
| 1 | `GET /api/health` | `200` con `status: ok` |
| 2 | Abrir la SPA | Carga sin errores en consola |
| 3 | Crear materia | Aparece el chip con color |
| 4 | Crear tarea | Aparece con `0/N` pomodoros |
| 5 | Recargar la página | Los datos persisten (PostgreSQL) |
| 6 | Registro de pomodoro | Métricas suben |
| 7 | Completar y reabrir | Estado cambia |
| 8 | Filtros | Funcionan contra la API real |
| 9 | Responsive (360 px) | Una columna, sin scroll horizontal |
| 10 | `GET /api/stats` | Números coherentes con la UI |

---

## 5. Troubleshooting

| Síntoma | Causa probable | Solución |
| --- | --- | --- |
| `CORS policy` en consola | `CORS_ORIGIN` no coincide | Copiar la URL exacta de Netlify (sin `/` final) |
| `500` en todos los endpoints | `DATABASE_URL` inválida o esquema no aplicado | Revisar logs de Render; correr `npm run migrate` |
| `relation "tasks" does not exist` | Falta migración | `npm run migrate` contra la DB de producción |
| Primer request muy lento | Cold start del plan free | Esperar; opcional: ping periódico |
| `SSL required` | Falta `?sslmode=require` | Agregar el parámetro a la URL |
| La SPA muestra datos viejos | `VITE_API_URL` apunta a localhost | Corregir variable y redeploy (Vite la inyecta en build) |
| `404` al refrescar una ruta | Falta redirect SPA | `netlify.toml` ya incluye `/* → /index.html` |

---

## 6. Rollback

- **Frontend:** Netlify guarda cada deploy; *Deploys → Publish previous*.
- **Backend:** Render permite redeploy de un commit anterior (*Events → Rollback*).
- **Base de datos:** Neon ofrece *Restore* por rama. Para cambios de esquema, escribir una migración inversa antes de aplicar la nueva.

---

## 7. Costos

| Servicio | Plan | Límite relevante |
| --- | --- | --- |
| Neon | Free | 0,5 GB, suspensión por inactividad |
| Render | Free | 750 h/mes, duerme a los ~15 min |
| Netlify | Free | 100 GB/mes, 300 min de build |
| GitHub Actions | Free | 2 000 min/mes en repos públicos |

Costo total del TP: **USD 0**.
