# Safehaul TMS - QA Reliability & Logic Audit Report

## Executive Summary
This report outlines the findings from a rigorous logical and reliability test of the Safehaul TMS application, focusing on Multi-Tenant Isolation, State Machines, Compliance Guardrails, RBAC Security, and API Reliability. The goal of this audit is to identify edge cases and logic vulnerabilities without modifying core application code.

## Vector 1: Multi-Tenant Data Isolation
**Status: PASSED (with minor observations)**
* **Analysis**: The architecture leverages a `TenantMiddleware` to extract the `company_id` from the JWT and inject it into `contextvars`. A `TenantMixin` ensures every database table includes `company_id`. Repository queries correctly apply `.where(Model.company_id == self.company_id)`.
* **Findings**:
  * The isolation is solid. Queries such as `select(Trip).where(Trip.load_id == load_id).where(Trip.company_id == self.company_id)` correctly prevent cross-tenant data leakage.
  * Creation flows explicitly set `company_id=self.company_id` for nested objects (e.g., `LoadStop`).

## Vector 2: The Load & Trip State Machine
**Status: WARNING**
* **Analysis**: The state machine operates on an 8-stage pipeline (`offer` → `booked` → `assigned` → `dispatched` → `in_transit` → `delivered` → `invoiced` → `paid`). Transitions are strictly guarded by a central `LOAD_TRANSITIONS` mapping and a `_advance_status_no_commit` engine. Concurrency is handled well using PostgreSQL advisory locks (`pg_advisory_xact_lock`) and `FOR UPDATE` on asset rows.
* **Findings**:
  * **Warning - Missing Status Validation in Invoice Generation**: The `generate_invoice` method in `app/accounting/service.py` fetches the load and explicitly throws if it doesn't exist or lacks a broker. However, it does *not* explicitly check if `load.status == LoadStatus.delivered` or `LoadStatus.invoiced`. While the frontend might only call this for delivered loads, an API consumer could potentially call this endpoint on a load in the "offer" or "dispatched" state, resulting in a premature invoice batch.

## Vector 3: Compliance & Dispatch Guardrails
**Status: PASSED**
* **Analysis**: The system correctly implements a 3-tier urgency logic (`check_driver_compliance`). It effectively compares `date` objects, completely bypassing leap year or month math bugs. Missing dates correctly skip checking logic, or if no CDL exists at all, it's flagged as `critical`.
* **Findings**:
  * `enforce_compliance` correctly blocks dispatch in `dispatch_load` if a driver has a critical violation.
  * Same-day expirations (`days_until < 0` or `<= 7`) trigger critical alerts correctly.
  * **Optimization**: The logic currently does not flag missing medical cards if `medical_card_expiry_date` is `None`. It only checks the CDL number for strict existence. Depending on business rules, a missing medical card might also warrant a "critical" violation.

## Vector 4: RBAC & Authentication Security
**Status: PASSED**
* **Analysis**: Authentication routing uses an elegant Auth Gateway pattern. `get_verified_token` handles the sole decoding of JWTs, checking `is_token_blacklisted_db` for logout revocation. `require_roles` depends on this gateway.
* **Findings**:
  * Strict dependency on `get_verified_token` guarantees that every authenticated request runs the blacklist check. It is impossible to bypass the revocation check when utilizing `require_roles`.
  * Roles are correctly partitioned across routers. Soft-deletes are restricted to `company_admin`, dispatching is restricted to `company_admin` or `dispatcher`, and accounting functions require `accountant` or `company_admin`.

## Vector 5: API Reliability & Edge Cases
**Status: PASSED (with minor optimizations)**
* **Analysis**: Pydantic schemas rely heavily on `Optional[...] = None`, mitigating crashes from older, nullable DB records. Decimal rounding inside `calculate_settlement_for_trips` safely uses `quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)`, preventing trailing float arithmetic bugs.
* **Findings**:
  * The Yandex AI OCR service correctly wraps HTTP requests in try-except blocks, throwing `504` on Timeout and `502` on HTTP network errors or malformed JSON payloads.
  * **Optimization**: `Hourly` and `Salary` pay rate calculations currently throw generic HTTP 400 errors as they are "not yet supported".
