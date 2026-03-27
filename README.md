# 🚛 Kinetic TMS

> Next-Gen Transportation Management System — Cloud-Native B2B SaaS, Multi-Tenant

## Live Demo

| Service | URL |
|---------|-----|
| **Frontend** | https://kinetic-frontend-1065403267999.us-central1.run.app |
| **Backend API** | https://kinetic-api-1065403267999.us-central1.run.app |
| **API Docs** | https://kinetic-api-1065403267999.us-central1.run.app/docs |

## Quick Start (Local Development)

### With Docker (recommended)
```bash
docker compose up -d
```
Open **http://localhost:3000** — all services start automatically.

### Without Docker

**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## Architecture
- **Backend:** Python 3.11+ / FastAPI / SQLAlchemy (async) / PostgreSQL
- **Frontend:** Next.js 14+ / React / Tailwind CSS
- **Cloud:** GCP (Cloud Run + Cloud SQL + Cloud Storage)

## Project Structure
```
/backend/         ← FastAPI API server
/frontend/        ← Next.js web application
/prototype/       ← UI design references
docker-compose.yml
```

## How to Deploy

👉 **[DEPLOY.md](DEPLOY.md)** — Step-by-step deployment guide (no local installs required)

**Deployment uses Google Cloud Shell** — a free browser-based terminal at [console.cloud.google.com](https://console.cloud.google.com) that already has `gcloud`, `docker`, `git`, and `python` pre-installed. No software needs to be installed on your local computer.

Covers:
- One-time GCP setup (Cloud Run, Cloud SQL via Console UI)
- Backend & frontend deployment via Cloud Shell
- Database table creation
- Verify deployment with curl commands
- Local development with Docker Compose
- CI/CD setup via GitHub Actions

See [masterplan.md](masterplan.md) for full PRD and [actionplan.md](actionplan.md) for the build plan.

