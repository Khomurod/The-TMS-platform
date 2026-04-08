# Safehaul TMS — Simplification & Best Practices Roadmap

> This document describes the gap between the current deployment setup and
> industry standard, and gives a concrete implementation plan to close it.
> Changes are ordered from highest value / lowest effort to longest term.

---

## What's Actually Broken Right Now

| Pain | Root Cause | Today's Workaround |
|------|-----------|-------------------|
| Migrations can't run in Cloud Run Jobs | `asyncpg` doesn't support Unix socket DSN format | Manual SQL in Cloud SQL Studio |
| Migrations silently pass even when they fail | Dockerfile had `\|\| echo 'skipped'` | Fixed in last commit — now crashes loudly |
| Long gcloud commands are error-prone | No task runner or script | Copy-paste from DEPLOYMENT_STEPS.md |
| Credentials in `deploy_env.yaml` tracked in git | No secret manager integrated | Accepted risk (dev environment) |
| `:latest` tag in production | No SHA pinning | gcloud may resolve stale cached revisions |
| Frontend `NEXT_PUBLIC_API_URL` baked at build time | Next.js design constraint | Must rebuild frontend when backend URL changes |

---

## Fix 1 — Make Migrations Automatic (High Value, ~1 hour) ✅ Do This First

**Problem:** `asyncpg` is an async-only driver. Alembic's migration runner
needs a synchronous driver. When we try to run migrations via Cloud Run Jobs,
asyncpg can't form a Unix socket connection.

**Fix:** Add `psycopg2-binary` (sync driver) for migrations only. Update
`alembic/env.py` to swap the driver in the URL. The app itself continues
using `asyncpg` for all runtime queries.

### Step 1 — Add psycopg2 to requirements

```diff
# backend/requirements.txt
+psycopg2-binary==2.9.9
```

### Step 2 — Auto-convert DATABASE_URL in alembic env.py

```python
# backend/alembic/env.py  — replace the config.set_main_option line

def _sync_url(url: str) -> str:
    """Convert async asyncpg URL to sync psycopg2 URL for Alembic."""
    return url.replace("postgresql+asyncpg://", "postgresql+psycopg2://", 1)

config.set_main_option("sqlalchemy.url", _sync_url(settings.database_url))
```

### Step 3 — Switch alembic env.py from async to sync engine

```python
# Replace the entire async run_migrations_online() with a simpler sync version:

from sqlalchemy import engine_from_config, pool

def run_migrations_online() -> None:
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()
```

### Result

Alembic will now use `psycopg2` which:
- Supports PostgreSQL Unix socket connections (required for Cloud Run Jobs)
- Is synchronous (no event loop issues)
- Is the officially recommended driver for Alembic

After this change, Cloud Run Jobs-based migrations will work reliably.

---

## Fix 2 — Add a `Makefile` (Low Effort, Eliminates Typos Forever)

Stop copy-pasting long gcloud commands. One `make deploy` does everything.

```makefile
# Makefile — place in repo root

PROJECT    := tms-service-491512
REGION     := us-central1
BACKEND    := kinetic-api
FRONTEND   := kinetic-frontend
SQL_INST   := $(PROJECT):$(REGION):safehaultms
GCLOUD     := "C:\Users\tom\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd"

SHA        := $(shell git rev-parse --short HEAD)
BACKEND_IMG  := gcr.io/$(PROJECT)/$(BACKEND):$(SHA)
FRONTEND_IMG := gcr.io/$(PROJECT)/$(FRONTEND):$(SHA)

# ── Backend ──────────────────────────────────────────────────────────

.PHONY: build-backend
build-backend:
	$(GCLOUD) builds submit ./backend --tag $(BACKEND_IMG) --tag gcr.io/$(PROJECT)/$(BACKEND):latest --project $(PROJECT) --timeout=600

.PHONY: migrate
migrate:
	$(GCLOUD) run jobs create migrate-$(SHA) \
		--image $(BACKEND_IMG) \
		--region $(REGION) \
		--project $(PROJECT) \
		--set-cloudsql-instances $(SQL_INST) \
		--env-vars-file deploy_env.yaml \
		--command python \
		--args="-m" --args="alembic" --args="upgrade" --args="head" \
		--max-retries 0 \
		--task-timeout 120s \
		--execute-now \
		--wait
	$(GCLOUD) run jobs delete migrate-$(SHA) --region $(REGION) --project $(PROJECT) --quiet

.PHONY: deploy-backend
deploy-backend: build-backend migrate
	$(GCLOUD) run deploy $(BACKEND) \
		--image $(BACKEND_IMG) \
		--platform managed \
		--region $(REGION) \
		--project $(PROJECT) \
		--allow-unauthenticated \
		--set-cloudsql-instances $(SQL_INST) \
		--env-vars-file deploy_env.yaml
	$(GCLOUD) run services update-traffic $(BACKEND) --to-latest --region $(REGION) --project $(PROJECT)

# ── Frontend ─────────────────────────────────────────────────────────

.PHONY: build-frontend
build-frontend:
	$(GCLOUD) builds submit ./frontend --tag $(FRONTEND_IMG) --tag gcr.io/$(PROJECT)/$(FRONTEND):latest --project $(PROJECT) --timeout=600

.PHONY: deploy-frontend
deploy-frontend: build-frontend
	$(GCLOUD) run deploy $(FRONTEND) \
		--image $(FRONTEND_IMG) \
		--platform managed \
		--region $(REGION) \
		--project $(PROJECT) \
		--allow-unauthenticated \
		--set-env-vars "NEXT_PUBLIC_API_URL=https://$(BACKEND)-1065403267999.$(REGION).run.app"

# ── Full deploy ───────────────────────────────────────────────────────

.PHONY: deploy
deploy: deploy-backend deploy-frontend

# ── Health check ─────────────────────────────────────────────────────

.PHONY: health
health:
	curl -s https://$(BACKEND)-1065403267999.$(REGION).run.app/api/v1/health | python -m json.tool
```

> **Note on `--args`**: Each argument must be passed as a separate `--args` flag
> in gcloud (not comma-separated). This is the syntax difference that broke the
> Cloud Run Jobs migration step in CI previously.

Usage:
```bash
make deploy          # full deploy: backend (build + migrate + deploy) + frontend
make deploy-backend  # backend only
make deploy-frontend # frontend only
make health          # check production health
```

---

## Fix 3 — Move Secrets to Google Secret Manager (Security, ~30 min)

**Current:** Credentials in `deploy_env.yaml` tracked in git.
**Best practice:** Secrets in Google Secret Manager, referenced by name.

```bash
# One-time setup — create secrets
gcloud secrets create DATABASE_URL --data-file=- <<< "postgresql+asyncpg://..."
gcloud secrets create JWT_SECRET_KEY --data-file=- <<< "your-jwt-secret"
gcloud secrets create DB_PASSWORD --data-file=- <<< "Welcomeme96."

# Grant Cloud Run service account access
gcloud secrets add-iam-policy-binding DATABASE_URL \
  --member="serviceAccount:1065403267999-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

Then in the deploy command, replace `--env-vars-file deploy_env.yaml` with:
```bash
--set-secrets "DATABASE_URL=DATABASE_URL:latest,JWT_SECRET_KEY=JWT_SECRET_KEY:latest"
--set-env-vars "ENVIRONMENT=production,CORS_ORIGINS=[\"*\"]"
```

And delete `deploy_env.yaml` from git tracking.

---

## Fix 4 — Pin Image Tags with Git SHA (Reliability, ~15 min)

**Current:** `:latest` tag — gcloud can serve a stale cached revision.
**Best practice:** Every deploy uses a unique immutable tag (`git rev-parse --short HEAD`).

The Makefile in Fix 2 already does this (`BACKEND_IMG := ...$(SHA)`).

Additionally, update CI to use the SHA as the image tag and pass it explicitly:
```yaml
# .github/workflows/ci-cd.yml
- name: Build backend image
  run: |
    docker build \
      -t gcr.io/${{ secrets.GCP_PROJECT_ID }}/${{ env.BACKEND_SERVICE }}:${{ github.sha }} \
      -t gcr.io/${{ secrets.GCP_PROJECT_ID }}/${{ env.BACKEND_SERVICE }}:latest \
      ./backend

- name: Deploy backend
  run: |
    gcloud run deploy ${{ env.BACKEND_SERVICE }} \
      --image gcr.io/${{ secrets.GCP_PROJECT_ID }}/${{ env.BACKEND_SERVICE }}:${{ github.sha }} \
      ...
```

Using `github.sha` (40-char full SHA) guarantees a unique image reference
and forces Cloud Run to create a new revision every time.

---

## Fix 5 — Proper CI/CD Migration Step (After Fix 1 is done)

**Current CI deploy steps:** build → deploy  
**Industry standard:** build → migrate → deploy → verify → route traffic

Once Fix 1 (psycopg2) is done, the Cloud Run Jobs migration step works.
Add it to CI between push and deploy:

```yaml
- name: Run DB migrations
  run: |
    JOB="migrate-${{ github.sha }}"
    gcloud run jobs create "$JOB" \
      --image gcr.io/${{ secrets.GCP_PROJECT_ID }}/${{ env.BACKEND_SERVICE }}:${{ github.sha }} \
      --region ${{ env.REGION }} \
      --project ${{ secrets.GCP_PROJECT_ID }} \
      --set-cloudsql-instances tms-service-491512:us-central1:safehaultms \
      --set-secrets "DATABASE_URL=DATABASE_URL:latest,JWT_SECRET_KEY=JWT_SECRET_KEY:latest" \
      --args="-m" --args="alembic" --args="upgrade" --args="head" \
      --max-retries 0 \
      --task-timeout 120s
    gcloud run jobs execute "$JOB" --region ${{ env.REGION }} --project ${{ secrets.GCP_PROJECT_ID }} --wait
    gcloud run jobs delete "$JOB" --region ${{ env.REGION }} --project ${{ secrets.GCP_PROJECT_ID }} --quiet
```

> **Key syntax note**: `--args` must be repeated once per argument.
> Do NOT use `--args="-m,alembic,upgrade,head"` (comma-separated fails).

---

## Fix 6 — Remove Seed from Container Startup (Long Term)

**Current:** `python -m app.seed` runs on every container start.  
**Problem:** Slow startup, and if a new column is missing, it crashes.  
**Best practice:** Seed is a one-time operation, run once after fresh DB creation.

```dockerfile
# backend/Dockerfile — ideal CMD
CMD sh -c "\
    python -m alembic upgrade head && \
    gunicorn app.main:app \
      --worker-class uvicorn.workers.UvicornWorker \
      --workers ${WORKERS:-2} \
      --bind 0.0.0.0:${PORT:-8000} \
      --timeout 120 \
      --access-logfile -"
```

Run the seed manually only when setting up a fresh database:
```bash
# Manual seed (one-time)
gcloud run jobs create seed-db \
  --image gcr.io/tms-service-491512/kinetic-api:latest \
  --set-cloudsql-instances tms-service-491512:us-central1:safehaultms \
  --env-vars-file deploy_env.yaml \
  --args="-m" --args="app.seed" \
  --execute-now --wait
```

---

## Implementation Priority

| Fix | Effort | Impact | Do When |
|-----|--------|--------|---------|
| ✅ Dockerfile crash on migration failure | Done | Prevents silent corruption | Done |
| 1. Add psycopg2, fix alembic env.py | 1 hour | Unlocks automated migrations | **Next** |
| 2. Makefile | 30 min | Eliminates typo deploys forever | **Next** |
| 3. Google Secret Manager | 30 min | Security compliance | Before going public |
| 4. SHA-pinned images | 15 min | Production reliability | With Makefile |
| 5. CI migration step | 15 min | Fully automated deploys | After Fix 1 |
| 6. Remove seed from startup | 1 hour | Faster, safer startups | When stable |

---

## What "Done" Looks Like

```bash
# Future state — one command deploys everything safely
make deploy

# What it does:
# 1. Builds backend image tagged with git SHA
# 2. Runs alembic upgrade head via Cloud Run Job (psycopg2, Unix socket)
# 3. Deploys new backend revision with no traffic
# 4. Smoke tests the new revision's health endpoint
# 5. Routes 100% traffic to new revision
# 6. Builds and deploys frontend
```

**Total time from `git push` to live: ~5 minutes.**  
**Human involvement: zero** (after the initial secret setup).
