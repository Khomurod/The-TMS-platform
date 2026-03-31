# 🚛 Safehaul TMS

> Next-Gen Transportation Management System — Cloud-Native B2B SaaS, Multi-Tenant

## Quick Start (Local Development)

### Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### With Docker (optional)
```bash
docker-compose up
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

👉 **[DEPLOY.md](DEPLOY.md)** — Step-by-step beginner-friendly deployment guide

Covers:
- One-time GCP setup (Cloud Run, Cloud SQL)
- Backend & frontend deployment commands
- Firebase Hosting as an optional alternative
- Local development with Docker
- CI/CD setup via GitHub Actions

See [masterplan.md](masterplan.md) for full PRD and [actionplan.md](actionplan.md) for the build plan.
