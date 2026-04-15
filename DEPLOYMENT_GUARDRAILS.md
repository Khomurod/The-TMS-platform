# Deployment Guardrails (Read Before Editing CI/CD)

This project had repeated production deploy failures caused by tiny config changes.
The rules below are "stability guardrails" and should not be changed casually.

## Non-Negotiable Rules

1. Keep backend deploy as **no-traffic first**.
2. Keep backend deploy with **candidate tag**.
3. Keep smoke test against **candidate URL**, not revision `status.url`.
4. Keep traffic switch gated on smoke-test success.
5. Keep Cloud SQL instance normalization (`tr -d '\r\n' | xargs`).
6. Keep Cloud SQL instance format validation step.
7. Keep backend `database_url` sanitizer in `backend/app/config.py`.

If any of the above are removed/changed, deploys can silently break or loop.

## Why These Rules Exist

- Hidden whitespace in Cloud SQL names (`\r`, `\n`, trailing spaces) broke socket mounting.
- Some no-traffic revisions do not reliably return `status.url`.
- Switching traffic to "latest" without health verification can route users to bad revisions.
- Secret formatting issues can break startup/migrations in production only.

## Safe Deploy Flow (Required)

1. Build image.
2. Run migrations via Cloud Run Job.
3. Deploy backend with `--no-traffic --tag candidate`.
4. Probe `https://candidate---<service-url>/api/v1/health`.
5. Switch 100% traffic only if health returns HTTP 200.

## When It Is OK To Change Guarded Parts

Only for global infrastructure changes, for example:

- project/region/service rename,
- Cloud SQL instance replacement,
- platform migration (Cloud Run to another runtime),
- a deliberate new rollout strategy approved by maintainers.

## If A Deploy Starts Failing Again

1. Do not remove guardrails first.
2. Get exact failing step and execution/revision id.
3. Read Cloud Run job/revision logs with real project id.
4. Fix root cause, then keep guardrails intact.

