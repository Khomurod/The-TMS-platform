# 🚀 Safehaul TMS — Deployment Guide

> **This guide is written for non-developers.** You do not need to understand code to follow it. Just copy and paste the commands exactly as shown, replacing the `PLACEHOLDER` values with your own.

---

## Table of Contents

1. [Prerequisites — What to Install](#1-prerequisites--what-to-install)
2. [One-Time GCP Setup](#2-one-time-gcp-setup)
3. [Deploy the Backend to Cloud Run](#3-deploy-the-backend-to-cloud-run)
4. [Seed the Database](#4-seed-the-database)
5. [Deploy the Frontend](#5-deploy-the-frontend)
6. [Local Development](#6-local-development)
7. [Automatic Deployment (CI/CD)](#7-automatic-deployment-cicd)

---

## 1. Prerequisites — What to Install

Before you can deploy anything, install these four tools on your computer:

### 1.1 Google Cloud SDK (`gcloud`)
This lets you control Google Cloud from your terminal.

- Download and install from: https://cloud.google.com/sdk/docs/install
- After installing, open a terminal and run:
  ```bash
  gcloud --version
  ```
  You should see a version number like `Google Cloud SDK 460.0.0`.

### 1.2 Firebase CLI
This lets you deploy to Firebase Hosting.

```bash
npm install -g firebase-tools
```

Verify it works:
```bash
firebase --version
```

### 1.3 Node.js 20 or newer
Required to build the frontend.

- Download from: https://nodejs.org (choose the "LTS" version)
- After installing, verify:
  ```bash
  node --version
  ```
  You should see `v20.x.x` or higher.

### 1.4 Docker Desktop
Required for local development only (not needed for cloud deployment).

- Download from: https://www.docker.com/products/docker-desktop
- Install and start Docker Desktop before running local commands.

---

## 2. One-Time GCP Setup

You only need to do this once when setting up the project for the first time.

### 2.1 Create a GCP Project

1. Go to https://console.cloud.google.com
2. Click **"Select a project"** at the top, then **"New Project"**
3. Give it a name (e.g., `Safehaul-tms`) and note the **Project ID** (e.g., `Safehaul-tms-123456`)

### 2.2 Enable Required APIs

Run these commands in your terminal (replace `YOUR_PROJECT_ID` with your actual project ID):

```bash
gcloud config set project YOUR_PROJECT_ID

gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable sqladmin.googleapis.com
gcloud services enable secretmanager.googleapis.com
```

### 2.3 Create a Cloud SQL PostgreSQL 16 Instance

In the GCP Console:
1. Go to **SQL** → **Create Instance**
2. Choose **PostgreSQL**
3. Select version **PostgreSQL 16**
4. Set an instance ID (e.g., `Safehaul-db`)
5. Choose a region (e.g., `us-central1`)
6. Note down the **Connection name** — it looks like `YOUR_PROJECT_ID:us-central1:Safehaul-db`

### 2.4 Create a Database and User

In your Cloud SQL instance:
1. Go to **Databases** tab → **Create Database** (e.g., `Safehaul_tms`)
2. Go to **Users** tab → **Add User** (e.g., username: `Safehaul_user`, password: choose a strong password)

### 2.5 Note Your Connection String

Your `DATABASE_URL` will look like:
```
postgresql+asyncpg://Safehaul_user:YOUR_PASSWORD@/Safehaul_tms?host=/cloudsql/YOUR_PROJECT_ID:us-central1:Safehaul-db
```

Write this down — you will need it in the next step.

---

## 3. Deploy the Backend to Cloud Run

Open your terminal and navigate to the project folder, then run these commands one by one.

### 3.1 Log in to Google Cloud

```bash
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
```

A browser window will open. Sign in with your Google account.

### 3.2 Build and Push the Backend Image

```bash
gcloud builds submit ./backend --tag gcr.io/YOUR_PROJECT_ID/Safehaul-api:latest
```

This will take 2–5 minutes. You will see build logs scrolling by — that is normal.

### 3.3 Deploy to Cloud Run

```bash
gcloud run deploy Safehaul-api \
  --image gcr.io/YOUR_PROJECT_ID/Safehaul-api:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars "ENVIRONMENT=production" \
  --set-env-vars "JWT_SECRET_KEY=GENERATE_A_RANDOM_SECRET" \
  --set-env-vars "DATABASE_URL=postgresql+asyncpg://USER:PASS@/DB_NAME?host=/cloudsql/PROJECT:REGION:INSTANCE" \
  --set-env-vars "CORS_ORIGINS=[\"https://Safehaul-web-XXXXX-uc.a.run.app\"]"
```

**Before running, replace:**
- `YOUR_PROJECT_ID` → your GCP project ID
- `GENERATE_A_RANDOM_SECRET` → a long random string (you can use https://www.random.org/passwords/?num=1&len=32&format=html&rnd=new)
- `DATABASE_URL` → the connection string from Section 2.5
- `https://Safehaul-web-XXXXX-uc.a.run.app` → your frontend URL (from Section 5 after you deploy the frontend)

After deployment, Cloud Run will give you a **Service URL** like:
```
https://Safehaul-api-abc123-uc.a.run.app
```

Write this down — it is your backend API URL.

---

## 4. Seed the Database

The seed command creates initial test data (admin users, demo company, sample loads, etc.).

### Option A: Using Cloud Run Jobs (Production)

```bash
gcloud run jobs create seed-db \
  --image gcr.io/YOUR_PROJECT_ID/Safehaul-api:latest \
  --region us-central1 \
  --command "python" \
  --args "-m,app.seed" \
  --set-env-vars "DATABASE_URL=postgresql+asyncpg://USER:PASS@/DB_NAME?host=/cloudsql/PROJECT:REGION:INSTANCE" \
  --execute-now
```

Replace `DATABASE_URL` with your actual connection string from Section 2.5.

### Option B: Local Development (Docker)

```bash
docker compose up -d
docker compose exec backend python -m app.seed
```

> **Test credentials created by the seed:**
> - Super Admin: `superadmin@Safehaul.dev` / `SuperAdmin123!`
> - Company Admin: `admin@wenzetrucking.com` / `Admin123!`

---

## 5. Deploy the Frontend

You have two options. **Option A (Cloud Run) is recommended** because it supports all app features including server-side rendering.

### Option A: Deploy to Cloud Run (Recommended)

This is the same approach as the CI/CD pipeline.

```bash
gcloud builds submit ./frontend --tag gcr.io/YOUR_PROJECT_ID/Safehaul-web:latest

gcloud run deploy Safehaul-web \
  --image gcr.io/YOUR_PROJECT_ID/Safehaul-web:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars "NEXT_PUBLIC_API_URL=https://Safehaul-api-XXXXX-uc.a.run.app"
```

Replace `https://Safehaul-api-XXXXX-uc.a.run.app` with the backend URL you got in Section 3.3.

After deployment, you will get a frontend URL like `https://Safehaul-web-abc123-uc.a.run.app`.

---

### Option B: Deploy to Firebase Hosting (`.web.app` domain)

> ⚠️ **Important — code change required before using this option:**
>
> Firebase Hosting only serves **static files** and does not support Next.js Server-Side Rendering (SSR). Dynamic pages and SSR features will not work. **Option A (Cloud Run) is strongly recommended for the full app.**
>
> If you specifically want Firebase Hosting, you must first edit `frontend/next.config.ts` and change:
> ```ts
> output: 'standalone'
> ```
> to:
> ```ts
> output: 'export'
> ```
> Then rebuild. The `frontend/firebase.json` in this repository is a ready-to-use template for this approach once that code change has been made.

```bash
cd frontend
firebase login
firebase init
# When prompted:
# - Select "Hosting"
# - Link to your existing GCP/Firebase project
# - Set public directory to: out
# - Configure as single-page app: Yes

npm run build
firebase deploy --only hosting
```

Your app will be available at `https://YOUR_FIREBASE_PROJECT_ID.web.app`.

---

## 6. Local Development

Use this to run the entire app on your own computer for testing.

### 6.1 Clone the Repository

```bash
git clone https://github.com/Khomurod/The-TMS-platform.git
cd The-TMS-platform
```

### 6.2 Start Everything with Docker

```bash
docker compose up -d
```

Wait about 30 seconds for all services to start.

### 6.3 Seed Test Data

```bash
docker compose exec backend python -m app.seed
```

### 6.4 Open the App

Open your browser and go to: **http://localhost:3000**

### Test Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Super Admin | `superadmin@Safehaul.dev` | `SuperAdmin123!` |
| Company Admin | `admin@wenzetrucking.com` | `Admin123!` |
| Dispatcher | `dispatcher@wenzetrucking.com` | `Dispatch1!` |
| Accountant | `accounting@wenzetrucking.com` | `Account1!` |

---

## 7. Automatic Deployment (CI/CD)

The repository is set up so that every time you push code to the `main` branch, **GitHub Actions automatically builds and deploys** both the backend and frontend to Cloud Run.

You do **not** need to run any deployment commands manually — just push to `main` and it deploys automatically.

### Required GitHub Secrets

For the CI/CD pipeline to work, you need to add these secrets to your GitHub repository:

1. Go to your repository on GitHub
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **"New repository secret"** for each of the following:

| Secret Name | Description | Example Value |
|-------------|-------------|---------------|
| `GCP_SA_KEY` | GCP service account key (full JSON content) | `{"type":"service_account","project_id":"..."}` |
| `GCP_PROJECT_ID` | Your GCP project ID | `Safehaul-tms-123456` |
| `CORS_ORIGINS` | The URL of your frontend (for CORS) | `https://Safehaul-web-abc123-uc.a.run.app` |
| `API_URL` | The URL of your backend API | `https://Safehaul-api-abc123-uc.a.run.app` |

### How to Create a GCP Service Account Key

1. Go to https://console.cloud.google.com/iam-admin/serviceaccounts
2. Click **"Create Service Account"**
3. Give it a name (e.g., `github-actions`)
4. Grant it these roles:
   - Cloud Run Admin
   - Cloud Build Editor
   - Storage Admin
   - Service Account User
5. Click on the service account → **Keys** tab → **Add Key** → **Create new key** → **JSON**
6. Download the JSON file and paste its entire contents into the `GCP_SA_KEY` secret

---

## Troubleshooting

### "Permission denied" errors
Make sure your GCP service account has the correct roles (see Section 7).

### Frontend can't reach the backend
Double-check that `NEXT_PUBLIC_API_URL` points to your deployed backend URL and that `CORS_ORIGINS` in the backend includes your frontend URL.

### Database connection errors
Verify that your `DATABASE_URL` is correctly formatted and that the Cloud SQL instance is in the same GCP project and region.

### Docker won't start locally
Make sure Docker Desktop is running before using `docker compose` commands.

---

> 💡 **Need help?** Open an issue at https://github.com/Khomurod/The-TMS-platform/issues
