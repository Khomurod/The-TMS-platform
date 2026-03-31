# ⚠️ Testing Credentials — Intentionally Exposed

> **These credentials are committed to this repository ON PURPOSE for team testing.**
> They belong to a sandboxed test/development environment and have no access to any
> real production data or systems.

---

## What's Exposed

| Credential | Value | Purpose |
|---|---|---|
| **GCS Service Account** | `tms-service@tms-service-491512.iam.gserviceaccount.com` | Upload/download files to `tms_bucket123` |
| **Database Password** | `Welcomeme96.` | Access `safehaul_tms` DB on the test Cloud SQL instance |
| **Database IP** | `34.63.40.37` | Test Cloud SQL (PostgreSQL 15) — not internet-facing by default |

---

## Scope / Permissions

- The GCS service account has access **only** to `tms_bucket123` in the `tms-service-491512` GCP project.
- The database user `safehaul_tms` has access **only** to the `safehaul_tms` database on the test instance.
- Neither credential has access to any production resources.

---

## Before Any Production Deployment

These credentials **must** be rotated and replaced with secrets from a secure vault (e.g., Google Secret Manager, GitHub Encrypted Secrets, Vault). Specifically:

1. **Rotate the GCS service account key**: IAM & Admin → Service Accounts → `tms-service` → Keys → Delete old key → Create new key.
2. **Change the database password**: Cloud SQL → Instances → Users → `safehaul_tms` → Change password.
3. **Set `ENVIRONMENT=production`** in the deployment environment — the app will refuse to start with default dev credentials.
4. **Store secrets** in GitHub Repository Secrets or your deployment platform's secret manager — never hard-code them.

---

## Test Login Credentials

These are seeded by running `cd backend && python -m app.seed`.

| Role | Email | Password |
|---|---|---|
| Super Admin | `superadmin@Safehaul.test` | `SuperAdmin1!` |
| Company Admin | `admin@wenzetrucking.com` | `WenzeAdmin1!` |
| Dispatcher | `dispatcher@wenzetrucking.com` | `Dispatch1!` |
| Accountant | `accounting@wenzetrucking.com` | `Account1!` |

**Company:** Wenze Trucking (MC-789456 / DOT-3214567)
