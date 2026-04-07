# Safehaul TMS — Deployment Steps

> **Last deployed**: April 7, 2026 — Revision `kinetic-frontend-00023-ggn`

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Google Cloud Platform                        │
│                     Project: tms-service-491512                     │
│                                                                     │
│  ┌──────────────────┐          ┌──────────────────┐                │
│  │  kinetic-frontend │  ──▶    │   kinetic-api    │                │
│  │  (Cloud Run)      │  HTTP   │   (Cloud Run)    │                │
│  │  Next.js 16       │         │   FastAPI/Python  │                │
│  │  Port 3000        │         │   Port 8000       │                │
│  └──────────────────┘          └────────┬─────────┘                │
│                                         │                           │
│                                         ▼                           │
│                                ┌──────────────────┐                │
│                                │   Cloud SQL      │                │
│                                │   PostgreSQL 16  │                │
│                                │   safehaultms    │                │
│                                └──────────────────┘                │
└─────────────────────────────────────────────────────────────────────┘
```

| Service | URL |
|---------|-----|
| **Frontend** | https://kinetic-frontend-1065403267999.us-central1.run.app |
| **Backend API** | https://kinetic-api-1065403267999.us-central1.run.app |

---

## Prerequisites

1. **Google Cloud SDK** installed and in PATH
   - On this machine, the `.cmd` wrapper must be used due to PowerShell execution policy:
     ```
     C:\Users\tom\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd
     ```

2. **Authenticated** to GCP:
   ```powershell
   & "C:\Users\tom\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd" auth login
   ```

3. **Project set** to `tms-service-491512`:
   ```powershell
   & "C:\Users\tom\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd" config set project tms-service-491512
   ```

4. **Node.js** (for local builds/testing only — v24 installed as zip at `C:\Users\tom\node\node-v24.14.0-win-x64`)

---

## Method 1: Manual Deployment (2 commands)

This is the fastest way to deploy. Run from the **repository root** (`The-TMS-platform/`).

### Step 1 — Build & Push Container Image

```powershell
& "C:\Users\tom\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd" builds submit ./frontend --tag gcr.io/tms-service-491512/kinetic-frontend:latest --timeout=600
```

**What this does:**
1. Uploads the `frontend/` directory to Google Cloud Build
2. Cloud Build reads `frontend/Dockerfile` and executes a multi-stage build:
   - **Stage 1 (`deps`)**: Installs `node_modules` from `package-lock.json`
   - **Stage 2 (`builder`)**: Copies source code + `node_modules`, runs `npm run build` (Next.js production build with TypeScript checking)
   - **Stage 3 (`runner`)**: Copies only the standalone output (no `node_modules`, no source) into a minimal Alpine image
3. Pushes the final image to `gcr.io/tms-service-491512/kinetic-frontend:latest`

**Expected output:**
```
✓ Compiled successfully in 11.1s
✓ Generating static pages (15/15) in 823ms
STATUS: SUCCESS
```

**Typical duration**: 2–3 minutes

### Step 2 — Deploy to Cloud Run

```powershell
& "C:\Users\tom\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd" run deploy kinetic-frontend --image gcr.io/tms-service-491512/kinetic-frontend:latest --platform managed --region us-central1 --allow-unauthenticated --set-env-vars "NEXT_PUBLIC_API_URL=https://kinetic-api-1065403267999.us-central1.run.app"
```

**What this does:**
1. Creates a new Cloud Run **revision** from the container image
2. Sets the `NEXT_PUBLIC_API_URL` environment variable (tells the frontend where the API lives)
3. Routes 100% of traffic to the new revision
4. Keeps previous revisions available for instant rollback

**Expected output:**
```
Service [kinetic-frontend] revision [kinetic-frontend-00023-ggn] has been deployed
and is serving 100 percent of traffic.
Service URL: https://kinetic-frontend-1065403267999.us-central1.run.app
```

**Typical duration**: 30–60 seconds

---

## Method 2: Automatic Deployment (CI/CD)

Pushing to `main` on GitHub triggers automatic deployment via GitHub Actions.

### How it works

The pipeline is defined in `.github/workflows/ci-cd.yml`:

1. **Path detection** — Only deploys what changed:
   - `frontend/**` changes → deploys frontend
   - `backend/**` changes → deploys backend
   - Both changed → deploys both

2. **Build check** — Runs `npm run build` to verify TypeScript + compilation

3. **Deploy** — Builds Docker image, pushes to GCR, deploys to Cloud Run

### Trigger it

```powershell
git add -A
git commit -m "your commit message"
git push origin main
```

### Required GitHub Secrets

These must be configured at **Settings → Secrets → Actions** in the GitHub repo:

| Secret | Value |
|--------|-------|
| `GCP_SA_KEY` | Service account JSON key (full file contents) |
| `GCP_PROJECT_ID` | `tms-service-491512` |
| `API_URL` | `https://kinetic-api-1065403267999.us-central1.run.app` |
| `CORS_ORIGINS` | `https://kinetic-frontend-1065403267999.us-central1.run.app` |
| `JWT_SECRET_KEY` | Production JWT secret |
| `DATABASE_URL` | `postgresql+asyncpg://safehaul_tms:...@/safehaul_tms?host=/cloudsql/tms-service-491512:us-central1:safehaultms` |
| `GCS_BUCKET_NAME` | `tms_bucket123` |

---

## Deploy the Backend

Same 2-step process, targeting `./backend` and `kinetic-api`:

### Step 1 — Build

```powershell
& "C:\Users\tom\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd" builds submit ./backend --tag gcr.io/tms-service-491512/kinetic-api:latest --timeout=600
```

### Step 2 — Deploy

```powershell
& "C:\Users\tom\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd" run deploy kinetic-api --image gcr.io/tms-service-491512/kinetic-api:latest --platform managed --region us-central1 --allow-unauthenticated --env-vars-file deploy_env.yaml
```

> The `deploy_env.yaml` file in the repo root contains all backend environment variables (DATABASE_URL, JWT_SECRET_KEY, CORS_ORIGINS, etc.)

---

## Verify Deployment

After deploying, verify:

```powershell
# Check the frontend is responding
curl https://kinetic-frontend-1065403267999.us-central1.run.app

# Check the backend health endpoint
curl https://kinetic-api-1065403267999.us-central1.run.app/api/v1/health

# List all revisions (shows deployment history)
& "C:\Users\tom\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd" run revisions list --service kinetic-frontend --region us-central1 --format="table(REVISION,ACTIVE,LAST_DEPLOYED)"
```

---

## Rollback

If a deployment breaks something, instantly rollback to the previous revision:

```powershell
# 1. List recent revisions
& "C:\Users\tom\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd" run revisions list --service kinetic-frontend --region us-central1 --limit=5

# 2. Route traffic to the previous working revision
& "C:\Users\tom\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd" run services update-traffic kinetic-frontend --to-revisions REVISION_NAME=100 --region us-central1
```

Replace `REVISION_NAME` with the revision you want to roll back to (e.g., `kinetic-frontend-00022-abc`).

---

## Local Build & Test (before deploying)

Always verify locally before pushing to production:

```powershell
# Set Node.js in PATH
$env:Path = "C:\Users\tom\node\node-v24.14.0-win-x64;$env:Path"

# Navigate to frontend
cd c:\Users\tom\Documents\GitHub\The-TMS-platform\frontend

# Run the production build
node C:\Users\tom\node\node-v24.14.0-win-x64\node_modules\npm\bin\npm-cli.js run build
```

**Expected**: `✓ Compiled successfully` with 0 TypeScript errors and all routes listed.

---

## Key Files

| File | Purpose |
|------|---------|
| `frontend/Dockerfile` | Multi-stage Docker build for Next.js (standalone output) |
| `frontend/next.config.ts` | Next.js config — `output: 'standalone'` enables Docker support |
| `frontend/.env.local` | Local dev API URL (`NEXT_PUBLIC_API_URL`) |
| `backend/Dockerfile` | Python 3.13 + Gunicorn/Uvicorn for FastAPI |
| `deploy_env.yaml` | Backend environment variables for Cloud Run |
| `.github/workflows/ci-cd.yml` | GitHub Actions CI/CD pipeline |

---

## Environment Variables

### Frontend (set at deploy time)

| Variable | Value | Notes |
|----------|-------|-------|
| `NEXT_PUBLIC_API_URL` | `https://kinetic-api-1065403267999.us-central1.run.app` | Baked into the JS bundle at build time |
| `NODE_ENV` | `production` | Set automatically by Dockerfile |
| `PORT` | `3000` | Cloud Run reads this to route traffic |

### Backend (from `deploy_env.yaml`)

| Variable | Value |
|----------|-------|
| `ENVIRONMENT` | `production` |
| `JWT_SECRET_KEY` | `KineticTMS_Secret_99` |
| `DATABASE_URL` | `postgresql+asyncpg://safehaul_tms:...@/safehaul_tms?host=/cloudsql/tms-service-491512:us-central1:safehaultms` |
| `CORS_ORIGINS` | `["https://kinetic-frontend-1065403267999.us-central1.run.app"]` |

---

## Quick Reference — Copy & Paste

### Deploy Frontend (2 commands)
```powershell
& "C:\Users\tom\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd" builds submit ./frontend --tag gcr.io/tms-service-491512/kinetic-frontend:latest --timeout=600

& "C:\Users\tom\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd" run deploy kinetic-frontend --image gcr.io/tms-service-491512/kinetic-frontend:latest --platform managed --region us-central1 --allow-unauthenticated --set-env-vars "NEXT_PUBLIC_API_URL=https://kinetic-api-1065403267999.us-central1.run.app"
```

### Deploy Backend (2 commands)
```powershell
& "C:\Users\tom\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd" builds submit ./backend --tag gcr.io/tms-service-491512/kinetic-api:latest --timeout=600

& "C:\Users\tom\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd" run deploy kinetic-api --image gcr.io/tms-service-491512/kinetic-api:latest --platform managed --region us-central1 --allow-unauthenticated --env-vars-file deploy_env.yaml
```
