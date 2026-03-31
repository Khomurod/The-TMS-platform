gcloud run jobs create seed-db-success `
  --image gcr.io/tms-service-491512/safehaul-api:latest `
  --region us-central1 `
  --command python `
  --args "-m","app.seed" `
  --set-cloudsql-instances tms-service-491512:us-central1:safehaultms `
  --set-env-vars DATABASE_URL="postgresql+asyncpg://safehaul_tms:SafehaulAdmin123!@/safehaul_tms?host=/cloudsql/tms-service-491512:us-central1:safehaultms" `
  --project tms-service-491512 `
  --execute-now
