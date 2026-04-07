# Safehaul TMS — Deployment Guide

> **Last deployed**: April 7, 2026 — All services confirmed working.

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                     Google Cloud Platform                            │
│                  Project: tms-service-491512                         │
│                                                                      │
│  ┌───────────────────┐          ┌───────────────────┐               │
│  │ kinetic-frontend   │  ──▶    │   kinetic-api      │               │
│  │ (Cloud Run)        │  HTTP   │   (Cloud Run)      │               │
│  │ Next.js 16         │         │   FastAPI/Python    │               │
│  │ Port 3000          │         │   Port 8000         │               │
│  └───────────────────┘          └────────┬──────────┘               │
│                                          │ Unix Socket              │
│                                          ▼                           │
│                                 ┌───────────────────┐               │
│                                 │   Cloud SQL        │               │
│                                 │   PostgreSQL 18    │               │
│                                 │   Instance:        │               │
│                                 │   safehaultms      │               │
│                                 │   DB: safehaul_tms │               │
│                                 └───────────────────┘               │
└──────────────────────────────────────────────────────────────────────┘
```

| Resource | URL / Identifier |
|----------|------------------|
| **Frontend (production)** | https://kinetic-frontend-1065403267999.us-central1.run.app |
| **Backend API (production)** | https://kinetic-api-1065403267999.us-central1.run.app |
| **Cloud SQL Instance** | `tms-service-491512:us-central1:safehaultms` |
| **Database Name** | `safehaul_tms` |
| **Database User** | `safehaul_tms` |
| **GCP Project** | `tms-service-491512` |

---

## ⚠️ CRITICAL — Read Before Deploying

These are hard-won lessons. Violating any of these will cause deployment failures:

### 1. Frontend: `NEXT_PUBLIC_API_URL` is baked at BUILD TIME

Next.js inlines `NEXT_PUBLIC_*` variables into the JavaScript bundle during `npm run build`. Setting them as Cloud Run environment variables at deploy time **does nothing** — the value must be correct in the Dockerfile `ARG` or passed as a `--build-arg` during `gcloud builds submit`.

- **Dockerfile line**: `ARG NEXT_PUBLIC_API_URL=https://kinetic-api-1065403267999.us-central1.run.app`
- If you change the backend URL, you **must rebuild** the frontend container.

### 2. Backend: Cloud SQL requires `--set-cloudsql-instances`

The backend connects to Cloud SQL via a Unix socket (`/cloudsql/...`), NOT a TCP IP address. Cloud Run only mounts this socket if you pass:
```
--set-cloudsql-instances tms-service-491512:us-central1:safehaultms
```
Without this flag, the backend will fail to connect to the database.

### 3. Backend: The `.env` file must NOT exist in the Docker image

The `backend/.dockerignore` excludes `.env`, but if a `.env` file somehow gets baked into the image, **it overrides Cloud Run environment variables** because pydantic-settings reads `.env` files. Always verify `.env` is NOT present before building.

### 4. Backend: The seed script runs on every container startup

The Dockerfile CMD runs `python -m app.seed` before starting gunicorn. The seed is **idempotent** (skips existing records), so this is safe. This ensures the database always has tables and test data.

### 5. CORS is set to wildcard (`*`)

`main.py` has `allow_origins=["*"]` to allow both localhost and production frontends. The `CORS_ORIGINS` env var is set to `["*"]` in `deploy_env.yaml`.

### 6. Traffic routing: Always verify the latest revision is active

Cloud Run sometimes creates new revisions without routing traffic to them. After deploying, verify the output says:
```
Routing traffic.....done
```
If it doesn't, manually route traffic:
```powershell
gcloud run services update-traffic kinetic-api --to-latest --region us-central1
```

---

## Prerequisites

1. **Google Cloud SDK** — The `.cmd` wrapper must be used due to PowerShell execution policy:
   ```
   C:\Users\tom\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd
   ```

2. **Authenticated** to GCP:
   ```powershell
   & "C:\Users\tom\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd" auth login
   ```

3. **Project set**:
   ```powershell
   & "C:\Users\tom\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd" config set project tms-service-491512
   ```

4. **Node.js** (v24, installed as zip):
   ```
   C:\Users\tom\node\node-v24.14.0-win-x64
   ```
   Add to PATH: `$env:Path = "C:\Users\tom\node\node-v24.14.0-win-x64;$env:Path"`

---

## Option A: Local Development (localhost)

Local dev runs the Next.js frontend at `http://localhost:3000` and points it to the **production backend API** on Cloud Run.

### Setup

1. The frontend reads `NEXT_PUBLIC_API_URL` from `frontend/.env.local`:
   ```
   NEXT_PUBLIC_API_URL=https://kinetic-api-1065403267999.us-central1.run.app
   ```

2. Start the dev server:
   ```powershell
   $env:Path = "C:\Users\tom\node\node-v24.14.0-win-x64;$env:Path"
   Set-Location c:\Users\tom\Documents\GitHub\The-TMS-platform\frontend
   node C:\Users\tom\node\node-v24.14.0-win-x64\node_modules\npm\bin\npm-cli.js run dev
   ```

3. Open http://localhost:3000 and login.

### How it works

```
Browser (localhost:3000)
    │
    ▼  JavaScript calls NEXT_PUBLIC_API_URL
    │
    ▼  https://kinetic-api-1065403267999.us-central1.run.app/api/v1/auth/login
    │
    ▼  Backend responds with JWT (CORS allows "*")
    │
    ▼  Frontend stores JWT in localStorage, redirects to /dashboard
```

### Test credentials

| Role | Email | Password |
|------|-------|----------|
| Company Admin | `admin@wenzetrucking.com` | `WenzeAdmin1!` |
| Dispatcher | `dispatcher@wenzetrucking.com` | `Dispatch1!` |
| Accountant | `accounting@wenzetrucking.com` | `Account1!` |
| Super Admin | `superadmin@Safehaul.test` | `SuperAdmin1!` |

---

## Option B: Production Deployment (Cloud Run)

### Deploy Backend (2 commands)

**Step 1 — Build & push container image:**
```powershell
& "C:\Users\tom\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd" builds submit ./backend --tag gcr.io/tms-service-491512/kinetic-api:latest --timeout=600
```

**Step 2 — Deploy to Cloud Run:**
```powershell
& "C:\Users\tom\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd" run deploy kinetic-api --image gcr.io/tms-service-491512/kinetic-api:latest --platform managed --region us-central1 --allow-unauthenticated --env-vars-file deploy_env.yaml --set-cloudsql-instances tms-service-491512:us-central1:safehaultms
```

> **IMPORTANT**: The `--set-cloudsql-instances` flag is REQUIRED. Without it, the backend cannot connect to the database.

**What happens on startup:**
1. Container starts
2. `python -m app.seed` runs — creates all database tables and seeds test data (idempotent)
3. Gunicorn starts with Uvicorn workers on port 8000
4. Cloud Run routes traffic to the new revision

---

### Deploy Frontend (2 commands)

**Step 1 — Build & push container image:**
```powershell
& "C:\Users\tom\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd" builds submit ./frontend --tag gcr.io/tms-service-491512/kinetic-frontend:latest --timeout=600
```

> The `NEXT_PUBLIC_API_URL` is set as a Dockerfile `ARG` default (line 14). If you need to override it:
> ```powershell
> # Only needed if the API URL changes:
> & "C:\Users\tom\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd" builds submit ./frontend --tag gcr.io/tms-service-491512/kinetic-frontend:latest --timeout=600 --build-arg NEXT_PUBLIC_API_URL=https://kinetic-api-1065403267999.us-central1.run.app
> ```

**Step 2 — Deploy to Cloud Run:**
```powershell
& "C:\Users\tom\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd" run deploy kinetic-frontend --image gcr.io/tms-service-491512/kinetic-frontend:latest --platform managed --region us-central1 --allow-unauthenticated --set-env-vars "NEXT_PUBLIC_API_URL=https://kinetic-api-1065403267999.us-central1.run.app"
```

---

## Verify Deployment

```powershell
# 1. Backend health check (should return {"status": "healthy", "database": "connected"})
Invoke-WebRequest -Uri "https://kinetic-api-1065403267999.us-central1.run.app/api/v1/health" -UseBasicParsing | Select-Object -ExpandProperty Content

# 2. Test login API directly (should return 200 with JWT)
$body = '{"email":"admin@wenzetrucking.com","password":"WenzeAdmin1!"}'
Invoke-WebRequest -Uri "https://kinetic-api-1065403267999.us-central1.run.app/api/v1/auth/login" -Method POST -Body $body -ContentType "application/json" -UseBasicParsing | Select-Object StatusCode

# 3. Check CORS preflight (should return 200 with Access-Control-Allow-Origin: *)
Invoke-WebRequest -Uri "https://kinetic-api-1065403267999.us-central1.run.app/api/v1/auth/login" -Method OPTIONS -Headers @{"Origin"="https://kinetic-frontend-1065403267999.us-central1.run.app"; "Access-Control-Request-Method"="POST"; "Access-Control-Request-Headers"="content-type"} -UseBasicParsing | Select-Object StatusCode

# 4. Open the frontend
Start-Process "https://kinetic-frontend-1065403267999.us-central1.run.app"
```

---

## Database Management

### Connection details

| Field | Value |
|-------|-------|
| Instance | `safehaultms` (PostgreSQL 18) |
| Database | `safehaul_tms` |
| User | `safehaul_tms` |
| Password | `Welcomeme96.` |
| Connection (from Cloud Run) | Unix socket: `/cloudsql/tms-service-491512:us-central1:safehaultms` |
| Full DATABASE_URL | `postgresql+asyncpg://safehaul_tms:Welcomeme96.@/safehaul_tms?host=/cloudsql/tms-service-491512:us-central1:safehaultms` |

There is also a `postgres` superuser with the same password (`Welcomeme96.`).

### Recreate database from scratch

If you need to wipe and recreate:

```powershell
# 1. Delete existing database (may fail if connections are active — redeploy backend first to drop connections)
& "C:\Users\tom\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd" sql databases delete safehaul_tms --instance=safehaultms --quiet

# 2. Create fresh database
& "C:\Users\tom\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd" sql databases create safehaul_tms --instance=safehaultms --charset=UTF8 --collation=en_US.UTF8

# 3. Redeploy backend — seed script auto-creates tables and test data on startup
& "C:\Users\tom\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd" run deploy kinetic-api --image gcr.io/tms-service-491512/kinetic-api:latest --platform managed --region us-central1 --allow-unauthenticated --env-vars-file deploy_env.yaml --set-cloudsql-instances tms-service-491512:us-central1:safehaultms
```

### Check database via Cloud SQL Studio

1. Go to: **GCP Console → Cloud SQL → safehaultms → Cloud SQL Studio**
2. Login: Database `safehaul_tms`, User `safehaul_tms`, Password `Welcomeme96.`
3. Run: `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';`

---

## Key Files

| File | Purpose |
|------|---------|
| `frontend/Dockerfile` | Multi-stage Docker build. **Line 14**: `ARG NEXT_PUBLIC_API_URL` — this is baked into the JS bundle |
| `frontend/.env.local` | Local dev API URL (only used by `npm run dev`, NOT by Docker) |
| `frontend/lib/api.ts` | Axios client — reads `NEXT_PUBLIC_API_URL` at runtime from the baked-in value |
| `backend/Dockerfile` | Python 3.13 + seed on startup + Gunicorn. **CMD runs seed then server** |
| `backend/app/seed.py` | Creates all tables (`Base.metadata.create_all`) and seeds test data. Idempotent |
| `backend/app/config.py` | Pydantic settings — reads env vars. Has production validators |
| `backend/app/main.py` | FastAPI app — CORS set to `["*"]` on line 48 |
| `deploy_env.yaml` | Backend env vars for Cloud Run (DATABASE_URL, JWT_SECRET_KEY, CORS_ORIGINS) |
| `backend/.dockerignore` | Excludes `.env`, `*.sh`, `*.md`, `venv/`, etc. from Docker image |

---

## Environment Variables

### Frontend

| Variable | Where Set | Value | Notes |
|----------|-----------|-------|-------|
| `NEXT_PUBLIC_API_URL` | Dockerfile ARG (build time) | `https://kinetic-api-1065403267999.us-central1.run.app` | **Must be correct at build time** |
| `NODE_ENV` | Dockerfile | `production` | Set automatically |
| `PORT` | Dockerfile | `3000` | Cloud Run reads this |

### Backend (from `deploy_env.yaml`)

| Variable | Value |
|----------|-------|
| `ENVIRONMENT` | `production` |
| `JWT_SECRET_KEY` | `KineticTMS_Secret_99` |
| `DATABASE_URL` | `postgresql+asyncpg://safehaul_tms:Welcomeme96.@/safehaul_tms?host=/cloudsql/tms-service-491512:us-central1:safehaultms` |
| `CORS_ORIGINS` | `["*"]` |

---

## Rollback

```powershell
# List recent revisions
& "C:\Users\tom\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd" run revisions list --service kinetic-api --region us-central1 --limit=5

# Route traffic to a specific revision
& "C:\Users\tom\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd" run services update-traffic kinetic-api --to-revisions REVISION_NAME=100 --region us-central1
```

---

## Troubleshooting

### Login returns 500
Check the backend logs:
```powershell
& "C:\Users\tom\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd" logging read "resource.type=cloud_run_revision AND resource.labels.service_name=kinetic-api" --limit 5 --format "value(textPayload)" --freshness=5m
```

Common causes:
- `UndefinedTableError: relation "users" does not exist` → Database is empty. Redeploy backend to trigger seed.
- `InvalidPasswordError` → Wrong password in `DATABASE_URL`. Check `deploy_env.yaml`.
- `CORS_ORIGINS` parsing error → Use `'["*"]'` format in `deploy_env.yaml`.

### Production frontend shows "Authentication failed" but localhost works
- The `NEXT_PUBLIC_API_URL` in the Dockerfile is wrong. Check `frontend/Dockerfile` line 14.
- **You must rebuild the frontend** after changing this value. Runtime env vars do NOT work for `NEXT_PUBLIC_*`.

### Container fails to start (port timeout)
- Check if `CORS_ORIGINS` env var is parseable by pydantic. Use `'["*"]'` format.
- Check if seed script is crashing. Look at startup logs in Cloud Logging.

### CORS preflight returns 400
- `main.py` must have `allow_origins=["*"]` (not reading from config).
- Verify the latest revision is actually serving traffic (check `Routing traffic.....done` in deploy output).

---

## Quick Reference — Copy & Paste

### Deploy Everything (4 commands)

```powershell
# Backend
& "C:\Users\tom\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd" builds submit ./backend --tag gcr.io/tms-service-491512/kinetic-api:latest --timeout=600

& "C:\Users\tom\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd" run deploy kinetic-api --image gcr.io/tms-service-491512/kinetic-api:latest --platform managed --region us-central1 --allow-unauthenticated --env-vars-file deploy_env.yaml --set-cloudsql-instances tms-service-491512:us-central1:safehaultms

# Frontend
& "C:\Users\tom\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd" builds submit ./frontend --tag gcr.io/tms-service-491512/kinetic-frontend:latest --timeout=600

& "C:\Users\tom\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd" run deploy kinetic-frontend --image gcr.io/tms-service-491512/kinetic-frontend:latest --platform managed --region us-central1 --allow-unauthenticated --set-env-vars "NEXT_PUBLIC_API_URL=https://kinetic-api-1065403267999.us-central1.run.app"
```
