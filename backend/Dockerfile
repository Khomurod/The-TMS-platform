# ═══════════════════════════════════════════════════════════════════
#   Safehaul TMS — Backend Dockerfile (Cloud Run Ready)
# ═══════════════════════════════════════════════════════════════════

FROM python:3.13-slim AS base

# System deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc libpq-dev && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Non-root user for security
RUN addgroup --system --gid 1001 appgroup && \
    adduser --system --uid 1001 --ingroup appgroup appuser
USER appuser

# Cloud Run expects PORT env var
ENV PORT=8000

EXPOSE 8000

# Run Alembic migrations then seed DB, then start gunicorn.
# CRITICAL: migrations must succeed. If they fail, crash immediately
# so Cloud Run rejects this revision instead of serving broken code.
CMD sh -c "\
    python -m alembic upgrade head && \
    python -m app.seed && \
    gunicorn app.main:app \
      --worker-class uvicorn.workers.UvicornWorker \
      --workers ${WORKERS:-2} \
      --bind 0.0.0.0:${PORT:-8000} \
      --timeout 120 \
      --access-logfile -"
