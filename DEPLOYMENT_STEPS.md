# Safehaul TMS — Deployment Guide

> **Last deployed**: April 8, 2026 — Both services confirmed healthy.
>
> **Read the ⚠️ CRITICAL sections before touching anything.** Every item there
> was learned the hard way.

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
│  │ Next.js            │         │   FastAPI/Python    │               │
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
| **Frontend** | https://kinetic-frontend-1065403267999.us-central1.run.app |
| **Backend API** | https://kinetic-api-1065403267999.us-central1.run.app |
| **Cloud SQL Instance** | `tms-service-491512:us-central1:safehaultms` |
| **Database** | `safehaul_tms` |
| **DB User** | `safehaul_tms` / `Welcomeme96.` |
| **GCP Project** | `tms-service-491512` |

---

## ⚠️ CRITICAL — Hard-Won Lessons (Read Every Time)

### 1. ALWAYS run schema migrations BEFORE deploying new backend code

The backend container will **crash silently at startup** if the DB schema is
behind the ORM models. The Dockerfile runs migrations on startup, but they
may fail silently due to connection issues. The only reliable approach:

**Apply schema changes manually via Cloud SQL Studio BEFORE deploying.**

See [Database Migrations](#database-migrations) section below.

### 2. Backend requires `--set-cloudsql-instances` — without it the DB connection fails

Cloud Run mounts the Cloud SQL Unix socket ONLY when this flag is set:
```
--set-cloudsql-instances tms-service-491512:us-central1:safehaultms
```
Without it the container starts but **every DB query fails**. The health
check returns 200 but `/api/v1/auth/login` returns 500.

### 3. The DATABASE_URL must use Unix socket format — NOT a TCP IP address

**Correct** (Unix socket — works inside Cloud Run):
```
postgresql+asyncpg://safehaul_tms:Welcomeme96.@/safehaul_tms?host=/cloudsql/tms-service-491512:us-central1:safehaultms
```
**Wrong** (TCP — will timeout and fail):
```
postgresql+asyncpg://safehaul_tms:Welcomeme96.@34.63.40.37:5432/safehaul_tms
```

### 4. `NEXT_PUBLIC_API_URL` is baked into the frontend JS bundle at build time

Setting it as a Cloud Run environment variable at deploy time **does nothing**.
It must be correct in `frontend/Dockerfile` ARG or passed as `--build-arg`.
If the backend URL ever changes, **rebuild the frontend**.

### 5. gcloud sometimes reuses an old failed revision — check the revision list

After a failed deploy, gcloud may try the same revision again. Always verify
with `gcloud run revisions list` and check STATUS is `True`. If needed,
route traffic manually to the last good revision.

### 6. The seed script runs EVERY startup — it is idempotent, but it queries all models

`python -m app.seed` runs `Base.metadata.create_all` and then queries every
table. If a column exists in the ORM but not in the DB → crash. This is
why schema migrations must happen before deploying new code.

### 7. Cloud Run Jobs are NOT reliable for running migrations

We tried using Cloud Run Jobs to run `alembic upgrade head` before deploy.
It failed every time due to:
- `asyncpg` doesn't support Unix socket via standard URL notation in Jobs
- `--args` quoting/syntax differs between gcloud versions
- IAM permissions differ between Jobs and Services

**Use Cloud SQL Studio instead.** See [Database Migrations](#database-migrations).

---

## Prerequisites

**gcloud** — note the `.cmd` wrapper, required on Windows:
```powershell
& "C:\Users\tom\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd" auth login
& "C:\Users\tom\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd" config set project tms-service-491512
```

**Node.js** (v24, portable zip install):
```powershell
$env:Path = "C:\Users\tom\node\node-v24.14.0-win-x64;$env:Path"
```

---

## Database Migrations

**Do this FIRST whenever you add a new column, table, or enum value.**

1. Open: https://console.cloud.google.com/sql/instances/safehaultms/studio?project=tms-service-491512
2. Click **"New SQL Editor tab"**
3. Authenticate: Database `safehaul_tms`, User `safehaul_tms`, Password `Welcomeme96.`
4. Paste your migration SQL and click **Run**

### Migration history (what's already applied to production)

| Migration | What it does | Applied |
|-----------|-------------|---------|
| `de2fbe1077a4` | Creates `token_blacklist` table | ✅ |
| `218d85a93d52` | Adds `cancelled` to trip status (VARCHAR, not PG ENUM) | ✅ N/A |
| `7cfad6aff5c9` | Adds `delivered_at` column to `loads` | ✅ |

> **Note**: Trips use a VARCHAR column for status, not a PostgreSQL native ENUM
> type. `ALTER TYPE tripstatus_enum` will fail — that type doesn't exist.

### Template for adding a new column

```sql
-- Add column (idempotent)
ALTER TABLE your_table ADD COLUMN IF NOT EXISTS your_column DATA_TYPE;

-- Add index if needed
CREATE INDEX IF NOT EXISTS ix_your_table_your_column ON your_table (your_column);
```

---

## Deploy Backend

> **Do [Database Migrations](#database-migrations) first if you added any schema changes.**

```powershell
# Step 1 — Build & push image
& "C:\Users\tom\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd" builds submit ./backend --tag gcr.io/tms-service-491512/kinetic-api:latest --project tms-service-491512 --timeout=600

# Step 2 — Deploy (all env vars come from deploy_env.yaml)
& "C:\Users\tom\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd" run deploy kinetic-api --image gcr.io/tms-service-491512/kinetic-api:latest --platform managed --region us-central1 --allow-unauthenticated --env-vars-file deploy_env.yaml --set-cloudsql-instances tms-service-491512:us-central1:safehaultms
```

After deploy, **always verify**:
```powershell
Invoke-WebRequest -Uri "https://kinetic-api-1065403267999.us-central1.run.app/api/v1/health" -UseBasicParsing | Select-Object -ExpandProperty Content
# Expected: {"status":"healthy","database":"connected"}
```

---

## Deploy Frontend

```powershell
# Step 1 — Build & push image
& "C:\Users\tom\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd" builds submit ./frontend --tag gcr.io/tms-service-491512/kinetic-frontend:latest --project tms-service-491512 --timeout=600

# Step 2 — Deploy
& "C:\Users\tom\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd" run deploy kinetic-frontend --image gcr.io/tms-service-491512/kinetic-frontend:latest --platform managed --region us-central1 --allow-unauthenticated --set-env-vars "NEXT_PUBLIC_API_URL=https://kinetic-api-1065403267999.us-central1.run.app"
```

> The `NEXT_PUBLIC_API_URL` in `frontend/Dockerfile` line 14 already has the
> correct default value. The `--set-env-vars` above is redundant but harmless.
> You only need `--build-arg` if the URL changes.

---

## Deploy Everything (4 commands)

Run in order. Wait for each to complete before running the next.

```powershell
# 1. Backend build
& "C:\Users\tom\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd" builds submit ./backend --tag gcr.io/tms-service-491512/kinetic-api:latest --project tms-service-491512 --timeout=600

# 2. Backend deploy
& "C:\Users\tom\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd" run deploy kinetic-api --image gcr.io/tms-service-491512/kinetic-api:latest --platform managed --region us-central1 --allow-unauthenticated --env-vars-file deploy_env.yaml --set-cloudsql-instances tms-service-491512:us-central1:safehaultms

# 3. Frontend build
& "C:\Users\tom\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd" builds submit ./frontend --tag gcr.io/tms-service-491512/kinetic-frontend:latest --project tms-service-491512 --timeout=600

# 4. Frontend deploy
& "C:\Users\tom\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd" run deploy kinetic-frontend --image gcr.io/tms-service-491512/kinetic-frontend:latest --platform managed --region us-central1 --allow-unauthenticated --set-env-vars "NEXT_PUBLIC_API_URL=https://kinetic-api-1065403267999.us-central1.run.app"
```

---

## Local Development

Frontend runs locally, calls the **production backend API**.

```powershell
# frontend/.env.local must contain:
# NEXT_PUBLIC_API_URL=https://kinetic-api-1065403267999.us-central1.run.app

$env:Path = "C:\Users\tom\node\node-v24.14.0-win-x64;$env:Path"
Set-Location c:\Users\tom\Documents\GitHub\The-TMS-platform\frontend
node C:\Users\tom\node\node-v24.14.0-win-x64\node_modules\npm\bin\npm-cli.js run dev
```

---

## Test Credentials

| Role | Email | Password |
|------|-------|----------|
| Super Admin | `superadmin@Safehaul.test` | `SuperAdmin1!` |
| Company Admin | `admin@wenzetrucking.com` | `WenzeAdmin1!` |
| Dispatcher | `dispatcher@wenzetrucking.com` | `Dispatch1!` |
| Accountant | `accounting@wenzetrucking.com` | `Account1!` |

---

## Rollback

```powershell
# List last 5 revisions and their status
& "C:\Users\tom\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd" run revisions list --service kinetic-api --region us-central1 --limit 5

# Route 100% traffic to a specific working revision
& "C:\Users\tom\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd" run services update-traffic kinetic-api --to-revisions REVISION_NAME=100 --region us-central1
```

---

## Troubleshooting

### Container fails to start ("port timeout")

1. Check revision list — is STATUS `True` or empty?
   ```powershell
   & "C:\Users\tom\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd" run revisions list --service kinetic-api --region us-central1 --limit 3
   ```
2. Go to Cloud SQL Studio → check the schema matches the ORM models.
   Common culprit: a new column in the ORM that doesn't exist in the DB yet.
3. Check if `deploy_env.yaml` is present and has the correct `DATABASE_URL`
   (Unix socket format, not IP address).

### Login returns 500

- Schema mismatch (see above)
- `deploy_env.yaml` `DATABASE_URL` is wrong format
- `--set-cloudsql-instances` was not passed in the deploy command

### Frontend shows "Authentication failed" or can't reach API

- Check `frontend/Dockerfile` line 14 — `NEXT_PUBLIC_API_URL` must be the
  correct backend URL. Runtime env vars do **not** override it.
- Rebuild and redeploy the frontend.

### gcloud reuses a previously failed revision

If the deploy command references an old revision name even after a new build:
- Run `gcloud run revisions list` to confirm the latest revision and its SHA
- Manually route traffic: `gcloud run services update-traffic ... --to-revisions NEW_REV=100`

---

## Environment Variables

### Backend (`deploy_env.yaml` — committed to repo, sources of truth)

```yaml
ENVIRONMENT: production
JWT_SECRET_KEY: KineticTMS_Secret_99
DATABASE_URL: "postgresql+asyncpg://safehaul_tms:Welcomeme96.@/safehaul_tms?host=/cloudsql/tms-service-491512:us-central1:safehaultms"
CORS_ORIGINS: '["*"]'
```

### Frontend

| Variable | Set where | Value |
|----------|-----------|-------|
| `NEXT_PUBLIC_API_URL` | `frontend/Dockerfile` ARG (build time) | `https://kinetic-api-1065403267999.us-central1.run.app` |

---

## Key Files

| File | Purpose |
|------|---------|
| `deploy_env.yaml` | Backend production env vars. Use with `--env-vars-file`. |
| `backend/Dockerfile` | Runs `alembic upgrade head` (may fail silently) → seed → gunicorn |
| `backend/app/seed.py` | Creates tables + seeds test data. Runs every startup. Idempotent. |
| `backend/alembic/versions/` | Migration history. New schema changes go here. |
| `frontend/Dockerfile` | Line 14: `ARG NEXT_PUBLIC_API_URL` — baked into JS bundle at build time |
| `frontend/.env.local` | Local dev only. NOT used by Docker. |

---

## Is This Industry Best Practice?

**Honest answer: partially.** Here's what's good and what isn't:

### ✅ What's good
- Cloud Run is a solid, scalable serverless platform
- Cloud SQL with Unix socket is secure (no exposed TCP port)
- `deploy_env.yaml` is a clean single source of truth for env vars
- CI pipeline (GitHub Actions) builds and tests on every push to `main`
- Token revocation, RBAC, and tenant isolation are properly implemented

### ❌ What's not industry best practice (and why it keeps hurting us)

| Issue | Best Practice | Current State |
|-------|--------------|---------------|
| **Migrations at container startup** | Run migrations as a separate step before code deploys | Dockerfile runs alembic and silently swallows errors with `\|\| echo` |
| **`:latest` tag in production** | Use immutable SHA digest tags (`@sha256:...`) | Using `:latest` — gcloud can resolve the same cached revision |
| **Secrets in `deploy_env.yaml`** | Use Google Secret Manager | Credentials committed to git |
| **Seed script on every startup** | One-time seed via a separate job | Seed runs every container start (safe but wasteful) |
| **Manual schema migrations** | Applied automatically by CI before traffic switches | Currently manual via Cloud SQL Studio |

### The practical path forward (in priority order)

1. **Fix the migration suppression in Dockerfile** — change `|| echo 'skipped'`
   to `|| exit 1` so a failed migration crashes the container immediately
   instead of silently corrupting state. Then the startup health check catches it.

2. **Add a `start.sh` script** that validates the schema before starting gunicorn.

3. **Move secrets to Google Secret Manager** — reference them in Cloud Run
   via `--set-secrets` instead of `--env-vars-file`.

4. **Use SHA-pinned image tags** in production deploys (gcloud build outputs
   the SHA — capture it and use `--image ...@sha256:...`).

---

## Wipe & Recreate Database (Nuclear Option)

Only do this if the database is completely broken.

```powershell
# 1. Delete database
& "C:\Users\tom\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd" sql databases delete safehaul_tms --instance=safehaultms --quiet

# 2. Create fresh database
& "C:\Users\tom\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd" sql databases create safehaul_tms --instance=safehaultms --charset=UTF8

# 3. Redeploy backend — seed script will auto-create all tables and seed data
& "C:\Users\tom\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd" run deploy kinetic-api --image gcr.io/tms-service-491512/kinetic-api:latest --platform managed --region us-central1 --allow-unauthenticated --env-vars-file deploy_env.yaml --set-cloudsql-instances tms-service-491512:us-central1:safehaultms
```
