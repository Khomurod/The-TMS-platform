#!/bin/sh
# Run database migrations and seed on startup, then start the server
echo "=== Running database seed (creates tables + test data) ==="
python -m app.seed
echo "=== Starting Gunicorn server ==="
exec gunicorn app.main:app \
  --worker-class uvicorn.workers.UvicornWorker \
  --workers ${WORKERS:-2} \
  --bind 0.0.0.0:${PORT:-8000} \
  --timeout 120 \
  --access-logfile -
