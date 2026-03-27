# 🚀 Kinetic TMS — Deployment Guide

> **No local installs required.** Everything is done inside **Google Cloud Shell** — a free browser-based terminal that already has `gcloud`, `docker`, `git`, `node`, and `python` pre-installed.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [One-Time GCP Setup](#2-one-time-gcp-setup)
3. [Deploy via Cloud Shell (Recommended)](#3-deploy-via-cloud-shell-recommended)
4. [Verify Deployment](#4-verify-deployment)
5. [Local Development](#5-local-development)
6. [CI/CD (Automatic Deployment)](#6-cicd-automatic-deployment)
7. [Troubleshooting](#7-troubleshooting)

---

## 1. Prerequisites

All you need is a **Google Cloud account** (free tier is fine to start).

**No software to install on your PC.**

1. Go to [https://console.cloud.google.com](https://console.cloud.google.com)
2. Sign in with your Google account
3. Click the **Cloud Shell** icon (`>_`) in the top-right toolbar — a terminal opens at the bottom of your browser

That terminal is your deployment environment. All commands in this guide are run there.

---

## 2. One-Time GCP Setup

Skip this section if a GCP project with Cloud SQL is already created.

### 2.1 Create a GCP Project

1. In the Console, click **"Select a project"** → **"New Project"**
2. Enter a name (e.g., `tms-service`) and note the auto-generated **Project ID**
3. Click **Create**

### 2.2 Enable Required APIs

In Cloud Shell, replace `YOUR_PROJECT_ID` and run:

```bash
gcloud config set project YOUR_PROJECT_ID

gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  sqladmin.googleapis.com \
  sql-component.googleapis.com \
  artifactregistry.googleapis.com
```

### 2.3 Create a Cloud SQL Instance (via GCP Console UI)

> ⚠️ **Use the Console UI, not the CLI.** The CLI tier flags can conflict with the Enterprise edition and produce errors.

1. In the Console, go to **SQL** → **Create Instance**
2. Choose **PostgreSQL**
3. Select edition: **Enterprise** (not Enterprise Plus)
4. Select version: **PostgreSQL 18** (or latest available)
5. Give it an instance ID (e.g., `tms-db`)
6. Choose region: `us-central1`
7. Note the **Public IP address** shown on the instance overview page

### 2.4 Create a Database and User

In your Cloud SQL instance (still in the Console UI):

1. **Databases** tab → **Create Database** (e.g., `tms_db`)
2. **Users** tab → **Add User** → choose a username (e.g., `tms_user`) and a strong password

### 2.5 Create a Cloud Storage Bucket

```bash
gsutil mb -p YOUR_PROJECT_ID gs://YOUR_BUCKET_NAME
```

---

## 3. Deploy via Cloud Shell (Recommended)

Open Cloud Shell from [https://console.cloud.google.com](https://console.cloud.google.com) and run the following steps.

### 3.1 Clone the Repository

```bash
git clone https://github.com/Khomurod/The-TMS-platform.git --depth 1
cd The-TMS-platform
```

### 3.2 Set Your Variables

```bash
export PROJECT_ID=YOUR_PROJECT_ID
export DB_USER=YOUR_DB_USER
export DB_PASS=YOUR_DB_PASSWORD
export DB_IP=YOUR_CLOUD_SQL_IP
export DB_NAME=YOUR_DB_NAME
export BUCKET=YOUR_GCS_BUCKET_NAME
```

### 3.3 Build and Deploy the Backend

**Build the image:**

```bash
gcloud builds submit ./backend --tag gcr.io/$PROJECT_ID/kinetic-api:latest
```

**Deploy to Cloud Run** (`--port 8000` is required — Cloud Run defaults to 8080 but the backend listens on 8000):

```bash
gcloud run deploy kinetic-api \
  --image gcr.io/$PROJECT_ID/kinetic-api:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8000 \
  --set-env-vars "ENVIRONMENT=production" \
  --set-env-vars "JWT_SECRET_KEY=$(openssl rand -hex 32)" \
  --set-env-vars "DATABASE_URL=postgresql+asyncpg://$DB_USER:$DB_PASS@$DB_IP:5432/$DB_NAME" \
  --set-env-vars 'CORS_ORIGINS=["*"]' \
  --set-env-vars "GCS_BUCKET_NAME=$BUCKET" \
  --set-env-vars "GCP_PROJECT_ID=$PROJECT_ID" \
  --memory 512Mi \
  --min-instances 0 \
  --max-instances 3
```

After the command completes, note the **Service URL** printed (e.g., `https://kinetic-api-XXXXX-uc.a.run.app`).

```bash
export BACKEND_URL=https://kinetic-api-XXXXX-uc.a.run.app   # paste your actual URL
```

### 3.4 Create Database Tables

Run this once to initialise all tables (from Cloud Shell inside the repo directory):

```bash
pip install sqlalchemy asyncpg greenlet --quiet

python3 -c "
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
import sys, os
sys.path.insert(0, 'backend')
from app.models.base import Base
from app.models.company import Company
from app.models.user import User
from app.models.driver import Driver
from app.models.fleet import Truck, Trailer
from app.models.broker import Broker
from app.models.load import Load, LoadStop

DATABASE_URL = 'postgresql+asyncpg://$DB_USER:$DB_PASS@$DB_IP:5432/$DB_NAME'

async def create_tables():
    engine = create_async_engine(DATABASE_URL)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print('All tables created!')
    await engine.dispose()

asyncio.run(create_tables())
"
```

### 3.5 Build and Deploy the Frontend

`NEXT_PUBLIC_API_URL` must be passed as a **build argument** because Next.js inlines it at build time — setting it as a runtime env var has no effect.

**Build the image** (pass the backend URL as a build arg):

```bash
gcloud builds submit ./frontend \
  --tag gcr.io/$PROJECT_ID/kinetic-frontend:latest \
  --build-arg=NEXT_PUBLIC_API_URL=$BACKEND_URL
```

**Deploy to Cloud Run** (`--port 3000` is required):

```bash
gcloud run deploy kinetic-frontend \
  --image gcr.io/$PROJECT_ID/kinetic-frontend:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 3000 \
  --memory 512Mi \
  --min-instances 0 \
  --max-instances 3
```

Note the **Frontend Service URL** (e.g., `https://kinetic-frontend-XXXXX-uc.a.run.app`).

```bash
export FRONTEND_URL=https://kinetic-frontend-XXXXX-uc.a.run.app   # paste your actual URL
```

### 3.6 Update Backend CORS with the Real Frontend URL

Replace the wildcard `CORS_ORIGINS` with the actual frontend URL. **Always include `--port 8000`** when updating — omitting it resets the port to the Cloud Run default (8080) and breaks the service.

```bash
gcloud run services update kinetic-api \
  --region us-central1 \
  --port 8000 \
  --set-env-vars "CORS_ORIGINS=[\"$FRONTEND_URL\"]"
```

---

## 4. Verify Deployment

Run this block in Cloud Shell to confirm everything is working:

```bash
echo "=== Backend Health ===" && \
curl -s $BACKEND_URL/api/v1/health && echo "" && \
echo "" && \
echo "=== Test Registration ===" && \
curl -s -X POST $BACKEND_URL/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"company_name":"Test Co","email":"verify@example.com","password":"TestPass123!","first_name":"Jane","last_name":"Doe"}' && echo "" && \
echo "" && \
echo "=== Frontend Status ===" && \
curl -s -o /dev/null -w "HTTP %{http_code}\n" $FRONTEND_URL
```

Expected output:
- **Backend Health**: `{"status":"healthy","service":"Kinetic TMS API","version":"0.1.0"}`
- **Registration**: a JSON user object (not `Internal Server Error`)
- **Frontend Status**: `HTTP 200` (or `HTTP 307` redirect — both indicate the service is running)

---

## 5. Local Development

Use this to run the entire app on your own computer for testing.

### 5.1 Clone and Start

```bash
git clone https://github.com/Khomurod/The-TMS-platform.git
cd The-TMS-platform
docker compose up -d
```

Wait about 30 seconds for all services to start, then open **http://localhost:3000**.

### 5.2 Seed Test Data

```bash
docker compose exec backend python -m app.seed
```

### Test Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Super Admin | `superadmin@kinetic.dev` | `SuperAdmin123!` |
| Company Admin | `admin@wenzetrucking.com` | `Admin123!` |
| Dispatcher | `dispatcher@wenzetrucking.com` | `Dispatch1!` |
| Accountant | `accounting@wenzetrucking.com` | `Account1!` |

---

## 6. CI/CD (Automatic Deployment)

Every push to the `main` branch triggers GitHub Actions to build and deploy both services automatically.

### Required GitHub Secrets

Go to your repository → **Settings** → **Secrets and variables** → **Actions** and add:

| Secret Name | Example Value |
|-------------|---------------|
| `GCP_SA_KEY` | Full JSON content of a GCP service-account key |
| `GCP_PROJECT_ID` | `tms-service-491512` |
| `CORS_ORIGINS` | `https://kinetic-frontend-XXXXX-uc.a.run.app` |
| `API_URL` | `https://kinetic-api-XXXXX-uc.a.run.app` |

### Creating a GCP Service Account Key

1. Go to https://console.cloud.google.com/iam-admin/serviceaccounts
2. **Create Service Account** → give it a name (e.g., `github-actions`)
3. Grant roles: **Cloud Run Admin**, **Cloud Build Editor**, **Storage Admin**, **Service Account User**
4. **Keys** tab → **Add Key** → **Create new key** → **JSON**
5. Paste the entire JSON file contents into the `GCP_SA_KEY` secret

---

## 7. Troubleshooting

### Cloud Run defaults to port 8080 — backend uses 8000

Always pass `--port 8000` when deploying **or updating** the backend service. Omitting it on an `update` command resets the port to 8080 and causes 502 errors.

### `NEXT_PUBLIC_API_URL` has no effect at runtime

Next.js inlines `NEXT_PUBLIC_*` variables at build time. Setting them as Cloud Run environment variables does nothing. You **must** pass `NEXT_PUBLIC_API_URL` as a `--build-arg` during `gcloud builds submit` (see Section 3.5). The `frontend/Dockerfile` is already configured to accept this arg.

### `db-f1-micro` tier fails with Enterprise edition

The `db-f1-micro` tier is only available with the Legacy edition, not Enterprise. Use the GCP Console UI to create the Cloud SQL instance and pick a supported tier (e.g., `db-g1-small` or higher) for the Enterprise edition.

### Database tables must be created before the app works

Cloud Run does not run migrations automatically. After the first deploy, run the `create_tables` script from Section 3.4 (or run `alembic upgrade head` from inside the backend container). The registration endpoint returns `Internal Server Error` until the tables exist.

### `gcloud run services update` can break the service

When running `gcloud run services update`, always re-specify `--port` and any env vars you intend to keep. Updating env vars without `--port` resets the port to 8080. Prefer using `--set-env-vars` rather than `--update-env-vars` to be explicit.

---

> 💡 **Need help?** Open an issue at https://github.com/Khomurod/The-TMS-platform/issues

