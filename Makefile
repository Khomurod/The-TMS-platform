# ═══════════════════════════════════════════════════════════════════
#   Safehaul TMS — Makefile
#
#   Local Development:
#     make setup             # First-time setup (install deps)
#     make dev               # Start everything locally (Docker)
#     make dev-backend       # Backend only (no Docker, needs local DB)
#     make dev-frontend      # Frontend only (no Docker)
#     make dev-stop          # Stop Docker dev environment
#
#   Production Deployment:
#     make deploy            # Full deploy: backend + frontend
#     make deploy-backend    # Backend only (build → migrate → deploy)
#     make deploy-frontend   # Frontend only
#     make migrate           # Run migrations via Cloud Run Job
#     make health            # Check production health
#     make seed              # One-time: seed fresh database
#
#   Prerequisites:
#     - gcloud CLI authenticated (for production deploys)
#     - Docker Desktop (for local dev via docker-compose)
#     - Python 3.13+ and Node.js 20+ (for non-Docker local dev)
# ═══════════════════════════════════════════════════════════════════

PROJECT    := tms-service-491512
REGION     := us-central1
BACKEND    := kinetic-api
FRONTEND   := kinetic-frontend
SQL_INST   := $(PROJECT):$(REGION):safehaultms
GCLOUD     := "C:\Users\tom\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd"

SHA        := $(shell git rev-parse --short HEAD)
BACKEND_IMG  := gcr.io/$(PROJECT)/$(BACKEND):$(SHA)
FRONTEND_IMG := gcr.io/$(PROJECT)/$(FRONTEND):$(SHA)

# ═══════════════════════════════════════════════════════════════════
#   LOCAL DEVELOPMENT
# ═══════════════════════════════════════════════════════════════════

.PHONY: setup
setup:
	@echo "══ First-time setup — installing dependencies"
	@echo "── Backend (Python)..."
	cd backend && pip install -r requirements.txt
	@echo "── Frontend (Node.js)..."
	cd frontend && npm install
	@echo ""
	@echo "✅ Setup complete! Run 'make dev' to start developing."
	@echo "   Or 'docker-compose up' if you prefer Docker."

.PHONY: dev
dev:
	@echo "══ Starting local dev environment (Docker)..."
	@echo "   Backend:  http://localhost:8000/docs"
	@echo "   Frontend: http://localhost:3000"
	docker-compose up --build

.PHONY: dev-backend
dev-backend:
	@echo "══ Starting backend dev server (port 8000)..."
	@echo "   Docs: http://localhost:8000/docs"
	cd backend && python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

.PHONY: dev-frontend
dev-frontend:
	@echo "══ Starting frontend dev server (port 3000)..."
	@echo "   App: http://localhost:3000"
	cd frontend && npm run dev

.PHONY: dev-stop
dev-stop:
	@echo "══ Stopping Docker dev environment..."
	docker-compose down

.PHONY: dev-reset
dev-reset:
	@echo "══ Resetting local dev environment (removes DB data)..."
	docker-compose down -v
	@echo "✅ Clean slate. Run 'make dev' to start fresh."

# ═══════════════════════════════════════════════════════════════════
#   PRODUCTION DEPLOYMENT
# ═══════════════════════════════════════════════════════════════════

# ── Backend ──────────────────────────────────────────────────────────

.PHONY: build-backend
build-backend:
	@echo "══ Building backend image: $(BACKEND_IMG)"
	$(GCLOUD) builds submit ./backend \
		--tag $(BACKEND_IMG) \
		--tag gcr.io/$(PROJECT)/$(BACKEND):latest \
		--project $(PROJECT) \
		--timeout=600

.PHONY: migrate
migrate:
	@echo "══ Running migrations via Cloud Run Job: migrate-$(SHA)"
	$(GCLOUD) run jobs create migrate-$(SHA) \
		--image $(BACKEND_IMG) \
		--region $(REGION) \
		--project $(PROJECT) \
		--set-cloudsql-instances $(SQL_INST) \
		--set-secrets "DATABASE_URL=DATABASE_URL:latest,JWT_SECRET_KEY=JWT_SECRET_KEY:latest" \
		--set-env-vars "ENVIRONMENT=production,CORS_ORIGINS=[\"*\"]" \
		--command python \
		--args="-m" --args="alembic" --args="upgrade" --args="head" \
		--max-retries 0 \
		--task-timeout 120s \
		--execute-now \
		--wait
	@echo "══ Cleaning up migration job"
	$(GCLOUD) run jobs delete migrate-$(SHA) \
		--region $(REGION) \
		--project $(PROJECT) \
		--quiet

.PHONY: deploy-backend
deploy-backend: build-backend migrate
	@echo "══ Deploying backend revision: $(BACKEND_IMG)"
	$(GCLOUD) run deploy $(BACKEND) \
		--image $(BACKEND_IMG) \
		--platform managed \
		--region $(REGION) \
		--project $(PROJECT) \
		--allow-unauthenticated \
		--set-cloudsql-instances $(SQL_INST) \
		--set-secrets "DATABASE_URL=DATABASE_URL:latest,JWT_SECRET_KEY=JWT_SECRET_KEY:latest" \
		--set-env-vars "ENVIRONMENT=production,CORS_ORIGINS=[\"*\"]"
	@echo "══ Switching 100%% traffic to latest revision"
	$(GCLOUD) run services update-traffic $(BACKEND) \
		--to-latest \
		--region $(REGION) \
		--project $(PROJECT)
	@echo "✅ Backend deployed: $(BACKEND_IMG)"

# ── Frontend ─────────────────────────────────────────────────────────

.PHONY: build-frontend
build-frontend:
	@echo "══ Building frontend image: $(FRONTEND_IMG)"
	$(GCLOUD) builds submit ./frontend \
		--tag $(FRONTEND_IMG) \
		--tag gcr.io/$(PROJECT)/$(FRONTEND):latest \
		--project $(PROJECT) \
		--timeout=600

.PHONY: deploy-frontend
deploy-frontend: build-frontend
	@echo "══ Deploying frontend revision: $(FRONTEND_IMG)"
	$(GCLOUD) run deploy $(FRONTEND) \
		--image $(FRONTEND_IMG) \
		--platform managed \
		--region $(REGION) \
		--project $(PROJECT) \
		--allow-unauthenticated \
		--set-env-vars "NEXT_PUBLIC_API_URL=https://$(BACKEND)-1065403267999.$(REGION).run.app"
	@echo "✅ Frontend deployed: $(FRONTEND_IMG)"

# ── Full deploy ───────────────────────────────────────────────────────

.PHONY: deploy
deploy: deploy-backend deploy-frontend
	@echo ""
	@echo "═══════════════════════════════════════════════"
	@echo "  ✅ Full deploy complete (SHA: $(SHA))"
	@echo "  Backend:  https://$(BACKEND)-1065403267999.$(REGION).run.app"
	@echo "  Frontend: https://$(FRONTEND)-1065403267999.$(REGION).run.app"
	@echo "═══════════════════════════════════════════════"

# ── Utilities ─────────────────────────────────────────────────────────

.PHONY: health
health:
	@echo "══ Checking backend health..."
	@curl -s https://$(BACKEND)-1065403267999.$(REGION).run.app/api/v1/health | python -m json.tool

.PHONY: seed
seed:
	@echo "══ Running database seed (one-time operation)"
	$(GCLOUD) run jobs create seed-db-$(SHA) \
		--image $(BACKEND_IMG) \
		--region $(REGION) \
		--project $(PROJECT) \
		--set-cloudsql-instances $(SQL_INST) \
		--set-secrets "DATABASE_URL=DATABASE_URL:latest,JWT_SECRET_KEY=JWT_SECRET_KEY:latest" \
		--set-env-vars "ENVIRONMENT=production,CORS_ORIGINS=[\"*\"]" \
		--command python \
		--args="-m" --args="app.seed" \
		--max-retries 0 \
		--task-timeout 300s \
		--execute-now \
		--wait
	$(GCLOUD) run jobs delete seed-db-$(SHA) \
		--region $(REGION) \
		--project $(PROJECT) \
		--quiet
	@echo "✅ Database seeded"

.PHONY: logs
logs:
	@echo "══ Tailing backend logs..."
	$(GCLOUD) run services logs tail $(BACKEND) \
		--region $(REGION) \
		--project $(PROJECT)
