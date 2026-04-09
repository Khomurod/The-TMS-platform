# 🚀 Safehaul TMS — Deployment Guide

> **Last updated**: April 9, 2026
>
> This is the single source of truth for deploying and operating the Safehaul
> TMS platform. It covers CI/CD (automatic), manual deployment, local
> development, and operational procedures.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Automatic Deployment (CI/CD)](#2-automatic-deployment-cicd)
3. [Manual Deployment](#3-manual-deployment)
4. [Local Development](#4-local-development)
5. [Database Migrations](#5-database-migrations)
6. [Environment Variables & Secrets](#6-environment-variables--secrets)
7. [Test Credentials](#7-test-credentials)
8. [Rollback](#8-rollback)
9. [Troubleshooting](#9-troubleshooting)

---

## 1. Architecture Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│                     Google Cloud Platform                            │
│                  Project: tms-service-491512                         │
│                                                                      │
│  ┌───────────────────┐          ┌───────────────────┐               │
│  │ kinetic-frontend   │  ──►    │   kinetic-api      │               │
│  │ (Cloud Run)        │  HTTPS  │   (Cloud Run)      │               │
│  │ Next.js 14         │         │   FastAPI + Python  │               │
│  │ Port 3000          │         │   Port 8000         │               │
│  └───────────────────┘          └────────┬──────────┘               │
│                                          │ Unix Socket              │
│                                          ▼                           │
│                                 ┌───────────────────┐               │
│                                 │   Cloud SQL        │               │
│                                 │   PostgreSQL       │               │
│                                 │   Instance:        │               │
│                                 │   safehaultms      │               │
│                                 └───────────────────┘               │
└──────────────────────────────────────────────────────────────────────┘
```

| Resource | URL / Identifier |
|----------|-----------------|
| **Frontend** | `https://kinetic-frontend-1065403267999.us-central1.run.app` |
| **Backend API** | `https://kinetic-api-1065403267999.us-central1.run.app` |
| **Health Check** | `https://kinetic-api-1065403267999.us-central1.run.app/api/v1/health` |
| **Cloud SQL Instance** | `tms-service-491512:us-central1:safehaultms` |
| **GCP Project** | `tms-service-491512` |

### Key Infrastructure Details

- **Authentication**: JWT (HS256) with httpOnly secure cookies + Bearer header fallback
- **Multi-tenancy**: Every DB query is scoped to `company_id` via middleware
- **Rate limiting**: Redis-backed (in-memory fallback if no Redis)
- **Bank data**: AES-encrypted at rest via `sqlalchemy-utils`
- **Image tags**: SHA-pinned (never `:latest` in production)
- **CORS**: Restricted to production frontend URL (not `*`)
- **Secrets**: Managed via GCP Secret Manager (not env files)

---

## 2. Automatic Deployment (CI/CD)

> **This is the primary deployment method.** Push to `main` and everything
> happens automatically.

### What Happens on `git push main`

```
git push main
    │
    ├── Frontend changed?
    │   ├── Build check (npm run build) ────► if PR, stop here
    │   └── Build Docker image (SHA tag)
    │       └── Deploy to Cloud Run
    │
    └── Backend changed?
        ├── Run pytest ────► if PR, stop here
        ├── Build Docker image (SHA tag)
        ├── Run DB migrations (ephemeral Cloud Run Job)
        ├── Deploy new revision (0% traffic)
        ├── Smoke test (/api/v1/health must return 200)
        └── Switch 100% traffic to new revision
```

### Deployment Flow Details

1. **Path detection** — only deploys services whose files actually changed
2. **Migrations first** — Alembic runs as a Cloud Run Job *before* the new code deploys
3. **Blue-green** — new backend revision gets 0% traffic until smoke test passes
4. **Automatic rollback** — if smoke test fails, traffic stays on the old revision

### Required GitHub Secrets

Go to **Settings → Secrets and variables → Actions** on your GitHub repository:

| Secret | Description | Example |
|--------|-------------|---------|
| `GCP_SA_KEY` | GCP service account JSON key (full file contents) | `{"type":"service_account",...}` |
| `GCP_PROJECT_ID` | GCP project ID | `tms-service-491512` |
| `API_URL` | Backend Cloud Run URL (used at frontend build time) | `https://kinetic-api-1065403267999.us-central1.run.app` |
| `CORS_ORIGINS` | Frontend URL for CORS (JSON array) | `["https://kinetic-frontend-1065403267999.us-central1.run.app"]` |

> **Note:** `DATABASE_URL` and `JWT_SECRET_KEY` are stored in **GCP Secret
> Manager** (not GitHub Secrets). The CI/CD pipeline references them via
> `--set-secrets` at deploy time.

### GCP Secret Manager Secrets

These are created once in GCP and referenced by the CI/CD pipeline:

| Secret Name | Purpose |
|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string (Unix socket format) |
| `JWT_SECRET_KEY` | Production JWT signing key |

To create or update these:
```bash
# Create
echo -n "your-value" | gcloud secrets create SECRET_NAME --data-file=- --project tms-service-491512

# Update
echo -n "new-value" | gcloud secrets versions add SECRET_NAME --data-file=- --project tms-service-491512
```

### How to Create a GCP Service Account Key

1. Go to https://console.cloud.google.com/iam-admin/serviceaccounts
2. Click **Create Service Account** → name it `github-actions`
3. Grant these roles:
   - Cloud Run Admin
   - Cloud Build Editor
   - Storage Admin
   - Service Account User
   - Secret Manager Secret Accessor
   - Cloud SQL Client
4. Click the service account → **Keys** → **Add Key** → **JSON**
5. Paste the downloaded JSON into the `GCP_SA_KEY` GitHub secret

---

## 3. Manual Deployment

Only use this if CI/CD is broken or you need to deploy from your local machine.

### Prerequisites

```powershell
# Authenticate
gcloud auth login
gcloud config set project tms-service-491512

# Verify
gcloud run services list --region us-central1
```

### Deploy Backend

```powershell
# 1. Build image (SHA-tagged)
$SHA = git rev-parse --short HEAD
gcloud builds submit ./backend `
  --tag "gcr.io/tms-service-491512/kinetic-api:$SHA" `
  --project tms-service-491512 --timeout=600

# 2. Run migrations
gcloud run jobs create "migrate-$SHA" `
  --image "gcr.io/tms-service-491512/kinetic-api:$SHA" `
  --region us-central1 `
  --project tms-service-491512 `
  --set-cloudsql-instances tms-service-491512:us-central1:safehaultms `
  --set-secrets "DATABASE_URL=DATABASE_URL:latest,JWT_SECRET_KEY=JWT_SECRET_KEY:latest" `
  --set-env-vars "ENVIRONMENT=production" `
  --command python `
  --args="-m" --args="alembic" --args="upgrade" --args="head" `
  --max-retries 0 --task-timeout 120s `
  --execute-now --wait

gcloud run jobs delete "migrate-$SHA" --region us-central1 --project tms-service-491512 --quiet

# 3. Deploy (no traffic initially)
gcloud run deploy kinetic-api `
  --image "gcr.io/tms-service-491512/kinetic-api:$SHA" `
  --platform managed --region us-central1 `
  --project tms-service-491512 `
  --allow-unauthenticated --no-traffic `
  --set-cloudsql-instances tms-service-491512:us-central1:safehaultms `
  --set-secrets "DATABASE_URL=DATABASE_URL:latest,JWT_SECRET_KEY=JWT_SECRET_KEY:latest" `
  --set-env-vars "ENVIRONMENT=production,CORS_ORIGINS=[""https://kinetic-frontend-1065403267999.us-central1.run.app""]"

# 4. Verify health
Invoke-WebRequest "https://kinetic-api-1065403267999.us-central1.run.app/api/v1/health" -UseBasicParsing | Select-Object -ExpandProperty Content

# 5. Switch traffic
$REV = (gcloud run revisions list --service kinetic-api --region us-central1 --format "value(metadata.name)" --limit 1)
gcloud run services update-traffic kinetic-api --to-revisions "$REV=100" --region us-central1
```

### Deploy Frontend

```powershell
$SHA = git rev-parse --short HEAD

# 1. Build with API_URL baked in
gcloud builds submit ./frontend `
  --tag "gcr.io/tms-service-491512/kinetic-frontend:$SHA" `
  --project tms-service-491512 --timeout=600

# 2. Deploy
gcloud run deploy kinetic-frontend `
  --image "gcr.io/tms-service-491512/kinetic-frontend:$SHA" `
  --platform managed --region us-central1 `
  --project tms-service-491512 `
  --allow-unauthenticated `
  --set-env-vars "NEXT_PUBLIC_API_URL=https://kinetic-api-1065403267999.us-central1.run.app"
```

> **Important:** `NEXT_PUBLIC_API_URL` is baked into the JavaScript bundle at
> build time. The `frontend/Dockerfile` has a default value on line 14. If the
> backend URL changes, the frontend must be **rebuilt**.

---

## 4. Local Development

### Option A: Frontend only (uses production backend)

```powershell
# Set API URL to production backend
cd frontend
echo "NEXT_PUBLIC_API_URL=https://kinetic-api-1065403267999.us-central1.run.app" > .env.local

npm install
npm run dev
# Open http://localhost:3000
```

### Option B: Full stack (local DB + backend + frontend)

```powershell
# Start PostgreSQL, backend, and frontend
docker compose up -d

# Seed test data (first time only)
docker compose exec backend python -m app.seed

# Open http://localhost:3000
# Backend at http://localhost:8000
# API docs at http://localhost:8000/docs
```

### Running without Docker

```powershell
# Terminal 1 — Backend
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Terminal 2 — Frontend
cd frontend
npm install
npm run dev
```

> Both require a local PostgreSQL instance. Update `.env` with your DB credentials.

---

## 5. Database Migrations

### How migrations work

- **CI/CD**: Migrations run automatically as an ephemeral Cloud Run Job
  *before* the new backend revision deploys.
- **Local**: The Dockerfile CMD runs `alembic upgrade head` on container start.
- **Driver**: Alembic uses `psycopg2` (sync) for migrations, while the app
  uses `asyncpg` (async) for runtime queries.

### Creating a new migration

```bash
cd backend
alembic revision --autogenerate -m "describe_your_change"
```

Review the generated file in `backend/alembic/versions/`, then commit and push.
CI/CD will apply it automatically on the next deploy.

### Checking migration status

```bash
# Local
cd backend
alembic current
alembic history --verbose

# Production (via Cloud Run Job)
gcloud run jobs create check-migration \
  --image gcr.io/tms-service-491512/kinetic-api:latest \
  --region us-central1 \
  --set-cloudsql-instances tms-service-491512:us-central1:safehaultms \
  --set-secrets "DATABASE_URL=DATABASE_URL:latest" \
  --command python --args="-m" --args="alembic" --args="current" \
  --execute-now --wait
```

---

## 6. Environment Variables & Secrets

### Backend

| Variable | Source | Required | Description |
|----------|--------|----------|-------------|
| `DATABASE_URL` | GCP Secret Manager | ✅ | PostgreSQL connection (Unix socket format) |
| `JWT_SECRET_KEY` | GCP Secret Manager | ✅ | JWT signing key (must not be default in prod) |
| `ENVIRONMENT` | Cloud Run env var | ✅ | `production` or `development` |
| `CORS_ORIGINS` | Cloud Run env var | ✅ | JSON array of allowed origins |
| `ENCRYPTION_KEY` | GCP Secret Manager | Optional | AES key for bank data (falls back to JWT key) |
| `REDIS_URL` | Cloud Run env var | Optional | Redis URL for cross-instance rate limiting |

### Frontend

| Variable | Source | Required | Description |
|----------|--------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Build-time ARG | ✅ | Backend API URL (baked into JS bundle) |

### Production validators

The app **refuses to start** in production if:
- `JWT_SECRET_KEY` is still the default `dev-secret-key-change-in-production`
- `DATABASE_URL` contains `Safehaul_dev_2024` (local dev credentials)
- `CORS_ORIGINS` only contains `localhost` origins

These guards are in `backend/app/config.py`.

---

## 7. Test Credentials

These are created by the seed script (`python -m app.seed`):

| Role | Email | Password |
|------|-------|----------|
| Super Admin | `superadmin@Safehaul.test` | `SuperAdmin1!` |
| Company Admin | `admin@wenzetrucking.com` | `WenzeAdmin1!` |
| Dispatcher | `dispatcher@wenzetrucking.com` | `Dispatch1!` |
| Accountant | `accounting@wenzetrucking.com` | `Account1!` |

> The seed script is idempotent — running it multiple times won't create
> duplicate records.

---

## 8. Rollback

### Automatic (CI/CD)

If the smoke test fails during CI/CD, traffic stays on the previous revision.
No manual action needed.

### Manual

```powershell
# List last 5 revisions
gcloud run revisions list --service kinetic-api --region us-central1 --limit 5

# Route traffic to a specific working revision
gcloud run services update-traffic kinetic-api `
  --to-revisions "REVISION_NAME=100" --region us-central1
```

---

## 9. Troubleshooting

### Backend returns 503 (unhealthy)

The database connection is down.

1. Check Cloud SQL is running in GCP Console
2. Verify `--set-cloudsql-instances` was passed in the deploy command
3. Verify `DATABASE_URL` uses Unix socket format:
   ```
   postgresql+asyncpg://USER:PASS@/DB?host=/cloudsql/tms-service-491512:us-central1:safehaultms
   ```
   **Not** TCP format (`@34.x.x.x:5432`).

### Frontend can't reach the backend

1. Check `NEXT_PUBLIC_API_URL` in the frontend build — it's baked at build time
2. Check `CORS_ORIGINS` includes the frontend URL
3. The frontend uses `withCredentials: true` for cookies — the backend CORS
   must have `allow_credentials=True` (already configured)

### Login returns 500

1. Schema mismatch — a new column exists in the ORM but not in the DB.
   Run migrations: `alembic upgrade head`
2. `DATABASE_URL` is wrong format (see above)
3. `--set-cloudsql-instances` was not passed

### Container fails to start ("port timeout")

1. Check the latest revision's logs in Cloud Console
2. Most common cause: migration failed. The Dockerfile runs `alembic upgrade
   head` on start — if it fails, the container exits immediately.
3. Verify the DB schema matches the ORM models

### Rate limiting not working across instances

Set `REDIS_URL` environment variable in Cloud Run. Without it, rate limiting
is per-worker only (in-memory fallback).

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `.github/workflows/ci-cd.yml` | CI/CD pipeline — the primary deployment method |
| `backend/Dockerfile` | Runs migrations → starts gunicorn (crashes on failure) |
| `backend/app/config.py` | All env vars + production validators |
| `backend/app/seed.py` | One-time test data seeder |
| `backend/alembic/versions/` | Migration history |
| `frontend/Dockerfile` | Multi-stage build. Line 14: `ARG NEXT_PUBLIC_API_URL` |
| `Makefile` | Convenience commands for manual deployment |
| `docker-compose.yml` | Local development stack |
| `.env` | Local development environment variables only |

---

> 💡 **Need help?** Open an issue at https://github.com/Khomurod/The-TMS-platform/issues
