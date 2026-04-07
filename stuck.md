# 🚧 Stuck — Login Broken (No Users in Production DB)

**Date:** 2026-04-07  
**Status:** Unresolved — app is deployed but no one can log in

---

## What's Broken

All login attempts on the live app return **"Invalid email or password"**:

- `superadmin@safehaul.com` / `SafehaulAdmin2024!` — ❌ fails
- `superadmin@Safehaul.test` / `SuperAdmin1!` — ❌ fails
- `admin@wenzetrucking.com` / `WenzeAdmin1!` — ❌ fails

The backend API is **running and healthy**. The database is **connected**. The problem is that the production database (`safehaul_tms` on `34.63.40.37`) has **no users or companies in it** — it was never seeded, or was wiped at some point.

---

## Root Cause

The production PostgreSQL database at:
```
postgresql://safehaul_tms:Welcomeme96.@34.63.40.37:5432/safehaul_tms
```
Has the schema (tables were created by migrations/`create_all`), but **no row data** — no companies, no users.

The seed script `backend/create_admin.py` was never successfully run against the production database.

---

## What Was Attempted

1. Tested all documented credentials — all fail with 401
2. Tried to run `create_admin.py` locally → **blocked**: Cloud SQL at `34.63.40.37` doesn't accept direct connections from outside GCP (firewall blocks port 5432)
3. Checked live env vars via `gcloud run services describe` — all correct (DB URL, JWT key, etc.)
4. Checked backend logs — too slow to retrieve via local `gcloud` CLI (CLI had stuck processes)

---

## Recommended Fix (pick one)

### ✅ Option 1 — Cloud SQL Studio (fastest, no code needed)

1. Go to: https://console.cloud.google.com/sql/instances?project=tms-service-491512
2. Click the instance → **Cloud SQL Studio**
3. Connect with: DB=`safehaul_tms`, User=`safehaul_tms`, Password=`Welcomeme96.`
4. Run this SQL to create the super admin:

```sql
-- Step 1: Create platform company
INSERT INTO companies (id, name, created_at, updated_at)
VALUES (gen_random_uuid(), 'Safehaul Platform', now(), now())
ON CONFLICT DO NOTHING;

-- Step 2: Create super admin user
-- Password hash below is bcrypt of 'SafehaulAdmin2024!'
-- Regenerate with: python -c "import bcrypt; print(bcrypt.hashpw(b'SafehaulAdmin2024!', bcrypt.gensalt()).decode())"
INSERT INTO users (id, company_id, email, hashed_password, first_name, last_name, role, is_active, created_at, updated_at)
SELECT
  gen_random_uuid(),
  c.id,
  'superadmin@safehaul.com',
  '$2b$12$REPLACE_WITH_REAL_BCRYPT_HASH',
  'Super', 'Admin',
  'super_admin',
  true,
  now(), now()
FROM companies c
WHERE c.name = 'Safehaul Platform'
ON CONFLICT (email) DO NOTHING;
```

> ⚠️ **Replace `$2b$12$REPLACE_WITH_REAL_BCRYPT_HASH`** with a real bcrypt hash.
> Generate it by running locally:
> ```
> cd backend
> python -c "from app.core.security import hash_password; print(hash_password('SafehaulAdmin2024!'))"
> ```

---

### ✅ Option 2 — Run `create_admin.py` via Cloud Run Job (cleanest)

The script `backend/create_admin.py` already does everything correctly. Run it as a one-off Cloud Run Job:

```bash
gcloud run jobs create seed-admin \
  --image gcr.io/tms-service-491512/kinetic-api:latest \
  --region us-central1 \
  --project tms-service-491512 \
  --set-env-vars "DATABASE_URL=postgresql+asyncpg://safehaul_tms:Welcomeme96.@34.63.40.37:5432/safehaul_tms" \
  --set-env-vars "JWT_SECRET_KEY=6baf208dab80ab53446964ca2e222e0c174e1e5ef33dc2bc8ae0c00f860a47c6" \
  --set-env-vars "ENVIRONMENT=production" \
  --set-env-vars "CORS_ORIGINS=[\"https://kinetic-frontend-1065403267999.us-central1.run.app\"]" \
  --command "python" \
  --args "create_admin.py"

gcloud run jobs execute seed-admin \
  --region us-central1 \
  --project tms-service-491512 \
  --wait
```

After it runs, log in with:
- **Email:** `superadmin@safehaul.com`
- **Password:** `SafehaulAdmin2024!`

---

### ✅ Option 3 — Authorize your IP in Cloud SQL, run locally

1. Go to: https://console.cloud.google.com/sql/instances?project=tms-service-491512
2. Click instance → **Connections** → **Networking** → **Add a network**
3. Add your current public IP (find it at https://whatismyip.com)
4. Then from this project root run:
   ```
   cd backend
   $env:DATABASE_URL="postgresql+asyncpg://safehaul_tms:Welcomeme96.@34.63.40.37:5432/safehaul_tms"
   $env:ENVIRONMENT="production"
   $env:JWT_SECRET_KEY="6baf208dab80ab53446964ca2e222e0c174e1e5ef33dc2bc8ae0c00f860a47c6"
   $env:CORS_ORIGINS='["https://kinetic-frontend-1065403267999.us-central1.run.app"]'
   python create_admin.py
   ```
5. Remove your IP from Cloud SQL authorized networks afterwards

---

## After the Fix

Once any option above is done, log in with:

| Field | Value |
|---|---|
| Email | `superadmin@safehaul.com` |
| Password | `SafehaulAdmin2024!` |

To seed the full demo company (Wenze Trucking + drivers/loads), run `backend/seed_wenze.py` the same way.
