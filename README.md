# 🚛 Safehaul TMS

> Next-Gen Transportation Management System — Cloud-Native B2B SaaS, Multi-Tenant

## Quick Start

### Option 1: Docker (recommended — zero setup)

```bash
make dev
```

That's it. Opens:
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000/docs
- **PostgreSQL:** localhost:5432

### Option 2: Without Docker

```bash
# 1. Install dependencies (first time only)
make setup

# 2. Start PostgreSQL (Docker, or your own local instance)
docker-compose up db

# 3. In one terminal — backend:
make dev-backend

# 4. In another terminal — frontend:
make dev-frontend
```

### Test Credentials

| Role | Email | Password |
|------|-------|----------|
| Super Admin | `superadmin@Safehaul.test` | `SuperAdmin1!` |
| Company Admin | `admin@wenzetrucking.com` | `WenzeAdmin1!` |
| Dispatcher | `dispatcher@wenzetrucking.com` | `Dispatch1!` |
| Accountant | `accounting@wenzetrucking.com` | `Account1!` |

See [TESTING_CREDENTIALS.md](TESTING_CREDENTIALS.md) for full details.

---

## Deploy to Production

```bash
# Full deploy (backend + frontend) — one command
make deploy

# Or individually:
make deploy-backend    # Build → migrate → deploy backend
make deploy-frontend   # Build → deploy frontend
make health            # Check production health
```

All secrets are in Google Secret Manager. Images are tagged with Git SHA for immutability.

---

## Architecture

| Layer | Technology |
|-------|-----------|
| **Backend** | Python 3.13 / FastAPI / SQLAlchemy (async) / PostgreSQL |
| **Frontend** | Next.js 16 / React 19 / Tailwind CSS 4 / shadcn/ui |
| **Cloud** | GCP Cloud Run + Cloud SQL + Cloud Storage |
| **CI/CD** | GitHub Actions (build → migrate → deploy → smoke test → route) |

## Project Structure

```
├── backend/           ← FastAPI API server
├── frontend/          ← Next.js web application  
├── Makefile           ← All dev + deploy commands
├── docker-compose.yml ← Local dev environment
├── .github/workflows/ ← CI/CD pipeline
└── DEPLOY.md          ← Deployment & operations guide
```

## Make Targets Reference

| Command | What it does |
|---------|-------------|
| `make setup` | Install Python + Node.js dependencies |
| `make dev` | Start full local dev (Docker) |
| `make dev-backend` | Start backend only (hot-reload) |
| `make dev-frontend` | Start frontend only (hot-reload) |
| `make dev-stop` | Stop Docker dev environment |
| `make dev-reset` | Wipe local DB and start fresh |
| `make deploy` | Deploy everything to production |
| `make deploy-backend` | Deploy backend only |
| `make deploy-frontend` | Deploy frontend only |
| `make migrate` | Run DB migrations in production |
| `make seed` | Seed production DB (one-time) |
| `make health` | Check production health |
| `make logs` | Tail production logs |

---

## Docs

- **[DEPLOY.md](DEPLOY.md)** — Deployment, operations, and troubleshooting guide
- **[TESTING_CREDENTIALS.md](TESTING_CREDENTIALS.md)** — Test environment credentials
