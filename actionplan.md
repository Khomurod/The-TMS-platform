# 🚛 Safehaul TMS — Detailed Action Plan

> **Source of Truth:** [masterplan.md](file:///c:/Users/Kholmurod/Documents/GitHub/The%20TMS%20platform/masterplan.md)
> **UI Reference:** [prototype/](file:///c:/Users/Kholmurod/Documents/GitHub/The%20TMS%20platform/prototype)
> **Design System:** [DESIGN.md](file:///c:/Users/Kholmurod/Documents/GitHub/The%20TMS%20platform/prototype/freight_flow_mono/DESIGN.md) — "Safehaul Precision Framework"

---

## How This Plan Is Organized

The project is broken into **5 sequential phases** (matching the masterplan's phased execution plan). Each phase contains **granular tasks** organized by domain. Every task lists:

- **What** — the deliverable
- **Files** — new file(s) to create
- **Depends On** — prerequisite tasks
- **Acceptance Criteria** — how to know it's done

> [!IMPORTANT]
> **Phases are strictly sequential.** Do not begin Phase N+1 until Phase N is fully tested and verified. Within a phase, tasks marked with the same sub-number can be parallelized.

---

# PHASE 0 — Project Scaffolding & DevOps Foundation

> **Goal:** Set up the monorepo, install all dependencies, configure local dev tooling, and establish the CI pipeline so every subsequent phase has a working build from day one.

---

### 0.1 — Repository & Monorepo Structure

**What:** Create the top-level folder structure separating backend and frontend.

**Files to create:**
```
/backend/                       ← Python FastAPI project root
  /app/
    __init__.py
    main.py                     ← FastAPI app entry point
    config.py                   ← Settings via pydantic-settings (env vars)
  /alembic/                     ← DB migration tool
    env.py
    alembic.ini
  requirements.txt
  Dockerfile
  .env.example

/frontend/                      ← Next.js project root
  (initialized via `npx create-next-app`)
  .env.local.example

docker-compose.yml              ← Local PostgreSQL + backend + frontend
.gitignore
README.md
```

**Acceptance Criteria:**
- `docker-compose up` launches a local PostgreSQL 15 instance, backend on `:8000`, frontend on `:3000`.
- `http://localhost:8000/docs` returns the FastAPI Swagger UI.
- `http://localhost:3000` returns the Next.js default page.

---

### 0.2 — Backend Skeleton & Layered Architecture

**What:** Build the FastAPI project skeleton enforcing the 3-layer architecture (Routers → Services → Repositories) and domain directory layout.

**Files to create:**
```
/backend/app/
  /auth/           __init__.py, router.py, service.py, schemas.py
  /users/          __init__.py, router.py, service.py, schemas.py, repository.py
  /fleet/          __init__.py, router.py, service.py, schemas.py, repository.py
  /drivers/        __init__.py, router.py, service.py, schemas.py, repository.py
  /loads/          __init__.py, router.py, service.py, schemas.py, repository.py
  /accounting/     __init__.py, router.py, service.py, schemas.py, repository.py
  /brokers/        __init__.py, router.py, service.py, schemas.py, repository.py
  /settings_mod/   __init__.py, router.py, service.py, schemas.py, repository.py
  /core/
    database.py                 ← async SQLAlchemy engine & session factory
    dependencies.py             ← FastAPI Depends helpers (get_db, get_current_user)
    exceptions.py               ← Custom exception classes
    middleware.py               ← Tenant isolation middleware
    security.py                 ← JWT encode/decode, password hashing
  /models/
    __init__.py                 ← Imports all models for Alembic
    base.py                     ← DeclarativeBase + TenantMixin
```

**Acceptance Criteria:**
- All domain routers are registered in `main.py` under `/api/v1/` prefix.
- Health check endpoint `GET /api/v1/health` returns `200 OK`.
- File linting passes (`ruff check .`).

---

### 0.3 — Frontend Skeleton & Design System

**What:** Initialize the Next.js app (App Router) and implement the Safehaul Precision design system from `DESIGN.md`.

**Key Decisions:**
- **Next.js 14+** with App Router (`/app` directory)
- **Tailwind CSS** (as specified in masterplan §6)
- Fonts: **Manrope** (headlines) + **Inter** (body) via `next/font/google`

**Files to create:**
```
/frontend/
  /app/
    layout.tsx                  ← Root layout with fonts, sidebar shell
    page.tsx                    ← Redirect to /dashboard
    globals.css                 ← Tailwind base + design tokens from DESIGN.md
  /components/
    /ui/                        ← Atomic design components
      Button.tsx                ← Primary / Secondary / Tertiary variants
      Input.tsx                 ← Ghost-border input from DESIGN.md
      StatusPill.tsx            ← Delivered / In Transit / Delayed / etc.
      KPICard.tsx               ← Large numeric card (tabular-nums)
      DataTable.tsx             ← Zebra-striped, no-border table
      Modal.tsx                 ← Glassmorphism overlay
      SearchBar.tsx             ← Global search component
    /layout/
      Sidebar.tsx               ← Left nav (Dashboard, Loads, Fleet, Drivers, Accounting, Settings)
      TopBar.tsx                ← Search + dark mode toggle + notifications + user avatar
      Breadcrumb.tsx
    ThemeProvider.tsx            ← Dark/Light mode context
  /lib/
    api.ts                      ← Axios/fetch wrapper with auth headers
    constants.ts                ← Shared enums, status labels, colors
  tailwind.config.ts            ← Custom colors, spacing, fonts from DESIGN.md
```

**Design Token Mapping (from DESIGN.md → Tailwind):**

| DESIGN.md Token | Tailwind Var | Light | Dark |
|---|---|---|---|
| `surface` | `--surface` | `#f7f9fb` | `#0f1117` |
| `surface_container_low` | `--surface-low` | `#f2f4f6` | `#1a1c24` |
| `surface_container_lowest` | `--surface-lowest` | `#ffffff` | `#24262e` |
| `primary` | `--primary` | `#3525cd` | `#7c6ff7` |
| `primary_container` | `--primary-ctr` | `#4f46e5` | `#5b4fd6` |
| `on_surface` | `--on-surface` | `#191c1e` | `#e2e4e8` |
| `on_surface_variant` | `--on-surface-var` | `#464555` | `#9e9dae` |
| `outline_variant` | `--outline-var` | `#c7c4d8` | `#45435a` |

**Acceptance Criteria:**
- Sidebar renders with all 6 nav items matching the prototype screenshots.
- Dark/Light toggle works and persists in `localStorage`.
- All design tokens match `DESIGN.md` (no 1px borders on sections, tonal shifts only).

---

# PHASE 1 — Database Foundation

> **Goal:** Create the complete PostgreSQL schema via SQLAlchemy ORM models, covering all tables, relationships, constraints, `company_id` multi-tenancy, and financial decimal types. No application logic yet — just the verified schema.

---

### 1.1 — Base Model & Tenant Mixin

**What:** Create a `TenantMixin` that automatically injects `company_id` (UUID FK → `companies`) into every business table + common audit columns.

**File:** `/backend/app/models/base.py`

```python
# Key fields the mixin must provide:
company_id:   UUID, FK → companies.id, NOT NULL, indexed
id:           UUID, primary key, default=uuid4
created_at:   TIMESTAMP WITH TIME ZONE, server_default=now()
updated_at:   TIMESTAMP WITH TIME ZONE, onupdate=now()
is_active:    BOOLEAN, default=True          # soft-delete flag
```

**Acceptance Criteria:**
- Every model that inherits `TenantMixin` automatically gets `company_id`.
- `is_active` defaults to `True` (soft-delete pattern from masterplan Rule 3).

---

### 1.2 — Companies & Users Tables

**What:** The foundation of multi-tenancy and authentication.

**File:** `/backend/app/models/company.py`, `/backend/app/models/user.py`

**Table: `companies`**
| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `name` | VARCHAR(255) | Company name |
| `mc_number` | VARCHAR(50) | Motor Carrier number |
| `dot_number` | VARCHAR(50) | DOT number |
| `address` | TEXT | |
| `phone` | VARCHAR(20) | |
| `email` | VARCHAR(255) | |
| `is_active` | BOOLEAN | Soft delete |
| `created_at` | TIMESTAMPTZ | |
| `updated_at` | TIMESTAMPTZ | |

**Table: `users`**
| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `company_id` | UUID FK → `companies.id` | NULL for Super Admin |
| `email` | VARCHAR(255) UNIQUE | |
| `hashed_password` | VARCHAR(255) | |
| `first_name` | VARCHAR(100) | |
| `last_name` | VARCHAR(100) | |
| `role` | ENUM(`super_admin`, `company_admin`, `dispatcher`, `accountant`) | |
| `is_active` | BOOLEAN | |
| `last_login_at` | TIMESTAMPTZ | |
| `created_at` / `updated_at` | TIMESTAMPTZ | |

**Acceptance Criteria:**
- `users.company_id` has FK constraint with `ON DELETE RESTRICT`.
- `role` is a PostgreSQL ENUM.
- Super Admin has `company_id = NULL`.

---

### 1.3 — Brokers Table

**File:** `/backend/app/models/broker.py`

**Table: `brokers`**
| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `company_id` | UUID FK → `companies` | Tenant isolation |
| `name` | VARCHAR(255) | |
| `mc_number` | VARCHAR(50) | |
| `billing_address` | TEXT | |
| `contact_name` | VARCHAR(255) | |
| `contact_phone` | VARCHAR(20) | |
| `contact_email` | VARCHAR(255) | |
| `notes` | TEXT | |
| `is_active` / `created_at` / `updated_at` | | Standard audit |

---

### 1.4 — Drivers Table

**File:** `/backend/app/models/driver.py`

**Table: `drivers`**
| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `company_id` | UUID FK | |
| `first_name` | VARCHAR(100) | |
| `last_name` | VARCHAR(100) | |
| `date_of_birth` | DATE | |
| `phone` | VARCHAR(20) | |
| `email` | VARCHAR(255) | |
| `employment_type` | ENUM(`company_w2`, `owner_operator_1099`, `lease_operator`) | |
| `cdl_number` | VARCHAR(50) | |
| `cdl_class` | VARCHAR(10) | A, B, etc. |
| `cdl_expiry_date` | DATE | → feeds Compliance Alerts |
| `medical_card_expiry_date` | DATE | → feeds Compliance Alerts |
| `experience_years` | INTEGER | |
| `pay_rate_type` | ENUM(`cpm`, `percentage`, `fixed_per_load`, `hourly`, `salary`) | |
| `pay_rate_value` | NUMERIC(10,4) | e.g., 0.65 CPM or 80% |
| `use_company_defaults` | BOOLEAN | If true, ignore `pay_rate_*` |
| `bank_name` | VARCHAR(255) | Encrypted at rest |
| `bank_routing_number` | VARCHAR(50) | Encrypted |
| `bank_account_number` | VARCHAR(50) | Encrypted |
| `status` | ENUM(`available`, `on_route`, `off_duty`, `on_leave`, `terminated`) | |
| `is_active` / `created_at` / `updated_at` | | |

---

### 1.5 — Fleet Tables (Trucks & Trailers)

**File:** `/backend/app/models/fleet.py`

**Table: `trucks`**
| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `company_id` | UUID FK | |
| `unit_number` | VARCHAR(50) | e.g., "TRK-402" |
| `year` | INTEGER | |
| `make` | VARCHAR(100) | |
| `model` | VARCHAR(100) | |
| `vin` | VARCHAR(17) | |
| `license_plate` | VARCHAR(20) | |
| `ownership_type` | ENUM(`owned`, `financed`, `leased`, `rented`) | |
| `dot_inspection_date` | DATE | Last annual DOT |
| `dot_inspection_expiry` | DATE | → feeds Compliance Alerts |
| `status` | ENUM(`available`, `in_use`, `maintenance`) | |
| `is_active` / `created_at` / `updated_at` | | |

**Table: `trailers`**
| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `company_id` | UUID FK | |
| `unit_number` | VARCHAR(50) | |
| `year` | INTEGER | |
| `make` | VARCHAR(100) | |
| `model` | VARCHAR(100) | |
| `vin` | VARCHAR(17) | |
| `license_plate` | VARCHAR(20) | |
| `trailer_type` | ENUM(`dry_van`, `reefer`, `flatbed`, `step_deck`, `tanker`) | |
| `ownership_type` | ENUM(`owned`, `financed`, `leased`, `rented`) | |
| `dot_inspection_date` | DATE | |
| `dot_inspection_expiry` | DATE | |
| `status` | ENUM(`available`, `in_use`, `maintenance`) | |
| `is_active` / `created_at` / `updated_at` | | |

---

### 1.6 — Loads & Multi-Stop Tables (The Core)

**File:** `/backend/app/models/load.py`

**Table: `loads`**
| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `company_id` | UUID FK | |
| `load_number` | VARCHAR(50) UNIQUE per company | Auto-generated (e.g., "LD-92834") |
| `broker_id` | UUID FK → `brokers.id` | |
| `broker_load_id` | VARCHAR(100) | The broker's reference number (from Rate Con) |
| `driver_id` | UUID FK → `drivers.id` | NULLABLE (unassigned) |
| `truck_id` | UUID FK → `trucks.id` | NULLABLE |
| `trailer_id` | UUID FK → `trailers.id` | NULLABLE |
| `status` | ENUM(`planned`, `dispatched`, `at_pickup`, `in_transit`, `delivered`, `delayed`, `billed`, `paid`, `cancelled`) | Strict state machine |
| `base_rate` | NUMERIC(10,2) | Linehaul rate |
| `total_miles` | NUMERIC(10,2) | |
| `total_rate` | NUMERIC(10,2) | `base_rate + sum(accessorials)` |
| `contact_agent` | VARCHAR(255) | Broker agent name |
| `notes` | TEXT | |
| `is_active` / `created_at` / `updated_at` | | |

**Table: `load_stops` (Multi-Stop Array)**
| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `load_id` | UUID FK → `loads.id` ON DELETE CASCADE | |
| `company_id` | UUID FK | Tenant isolation even on child |
| `stop_type` | ENUM(`pickup`, `delivery`) | |
| `stop_sequence` | INTEGER | 1, 2, 3… controls ordering |
| `facility_name` | VARCHAR(255) | |
| `address` | TEXT | |
| `city` | VARCHAR(100) | |
| `state` | VARCHAR(50) | |
| `zip_code` | VARCHAR(20) | |
| `scheduled_date` | DATE | |
| `scheduled_time` | TIME | |
| `arrival_date` | TIMESTAMPTZ | Actual arrival |
| `departure_date` | TIMESTAMPTZ | Actual departure |
| `notes` | TEXT | PO#, Seal#, etc. |
| `created_at` | TIMESTAMPTZ | |

> [!IMPORTANT]
> Every load MUST have at minimum 2 stops: one `pickup` (sequence=1) and one `delivery` (sequence=last). The "Add Intermediate Stop" button in the prototype allows infinite additional stops.

---

### 1.7 — Accounting & Settlement Tables

**File:** `/backend/app/models/accounting.py`

**Table: `load_accessorials`**
| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `load_id` | UUID FK → `loads.id` | |
| `company_id` | UUID FK | |
| `type` | ENUM(`fuel_surcharge`, `detention`, `layover`, `lumper`, `stop_off`, `tarp`, `other`) | |
| `description` | VARCHAR(255) | |
| `amount` | NUMERIC(10,2) | **Never float** |
| `created_at` | TIMESTAMPTZ | |

**Table: `company_default_deductions`**
| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `company_id` | UUID FK | |
| `name` | VARCHAR(255) | e.g., "Weekly Trailer Rental" |
| `amount` | NUMERIC(10,2) | |
| `frequency` | ENUM(`per_load`, `weekly`, `monthly`) | |
| `is_active` | BOOLEAN | |

**Table: `driver_settlements`**
| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `company_id` | UUID FK | |
| `driver_id` | UUID FK → `drivers.id` | |
| `settlement_number` | VARCHAR(50) | e.g., "TMS-49202" |
| `period_start` | DATE | |
| `period_end` | DATE | |
| `gross_pay` | NUMERIC(10,2) | |
| `total_accessorials` | NUMERIC(10,2) | |
| `total_deductions` | NUMERIC(10,2) | |
| `net_pay` | NUMERIC(10,2) | |
| `status` | ENUM(`draft`, `ready`, `paid`) | |
| `paid_at` | TIMESTAMPTZ | |
| `created_at` / `updated_at` | | |

**Table: `settlement_line_items`**
| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `settlement_id` | UUID FK → `driver_settlements.id` | |
| `company_id` | UUID FK | |
| `load_id` | UUID FK → `loads.id` (NULLABLE) | |
| `type` | ENUM(`load_pay`, `accessorial`, `deduction`) | |
| `description` | VARCHAR(255) | |
| `amount` | NUMERIC(10,2) | Positive for earnings, negative for deductions |
| `created_at` | TIMESTAMPTZ | |

---

### 1.8 — Document Management Table

**File:** `/backend/app/models/document.py`

**Table: `documents`**
| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `company_id` | UUID FK | |
| `entity_type` | ENUM(`load`, `driver`, `truck`, `trailer`) | Polymorphic owner |
| `entity_id` | UUID | FK to the owning entity |
| `document_type` | ENUM(`rate_confirmation`, `pod_bol`, `cdl`, `medical_card`, `bank_info`, `dot_inspection`, `insurance`, `other`) | |
| `file_name` | VARCHAR(255) | |
| `file_url` | TEXT | GCS signed URL |
| `gcs_object_path` | TEXT | Internal GCS path |
| `uploaded_at` | TIMESTAMPTZ | |
| `expiry_date` | DATE | NULLABLE — for CDL, medical, DOT |

---

### 1.9 — Alembic Migrations & Schema Verification

**What:** Generate and run the initial Alembic migration. Verify the schema in PostgreSQL.

**Acceptance Criteria:**
- `alembic upgrade head` creates all tables successfully.
- All FK constraints are verified (`ON DELETE RESTRICT` on financial/historical, `CASCADE` on child arrays like `load_stops`).
- All financial columns use `NUMERIC(10,2)` — **zero float types**.
- `company_id` exists on every table except `companies` itself.
- `\dt` in `psql` shows all tables with correct names (lowercase, plural, snake_case).

---

# PHASE 2 — Authentication & Core Infrastructure

> **Goal:** Secure JWT authentication, Role-Based Access Control (RBAC), multi-tenancy middleware, and foundational API plumbing.

---

### 2.1 — JWT Authentication System

**What:** Register / Login endpoints issuing JWT access + refresh tokens.

**Files:** `/backend/app/auth/router.py`, `service.py`, `schemas.py`, `/backend/app/core/security.py`

**Endpoints:**
| Method | Path | Description |
|---|---|---|
| `POST` | `/api/v1/auth/register` | Create first Company + Admin user (onboarding) |
| `POST` | `/api/v1/auth/login` | Returns `{ accessToken, refreshToken }` |
| `POST` | `/api/v1/auth/refresh` | Refresh expired access token |
| `POST` | `/api/v1/auth/logout` | Invalidate refresh token |
| `GET` | `/api/v1/auth/me` | Return current user profile + role |

**Technical Details:**
- Access token: **15 min expiry**, contains `{ user_id, company_id, role }`.
- Refresh token: **7 day expiry**, stored in DB or httpOnly cookie.
- Password hashing: **bcrypt** via `passlib`.
- All tokens signed with HS256 using env var `JWT_SECRET_KEY`.

**Acceptance Criteria:**
- Login returns valid JWT. Subsequent authenticated requests pass.
- Invalid/expired tokens return `401 Unauthorized`.
- Passwords are never stored in plaintext.

---

### 2.2 — Multi-Tenancy Middleware (The Golden Rule)

**What:** Middleware that extracts `company_id` from JWT and injects it into every DB query.

**File:** `/backend/app/core/middleware.py`

**Logic:**
1. Intercept every request (except `/auth/*` and `/health`).
2. Decode JWT → extract `company_id`.
3. Inject `company_id` into a request-scoped context (e.g., `contextvars`).
4. All repository methods automatically filter by `WHERE company_id = :tenant`.
5. **It must be programmatically impossible** for Company A to see Company B's data.

**Acceptance Criteria:**
- Create 2 test companies. Login as Company A → cannot see Company B's data via any endpoint.
- Direct SQL injection of a different `company_id` in the request body is ignored (server always uses JWT's `company_id`).

---

### 2.3 — Role-Based Access Control (RBAC)

**What:** Permission decorators/dependencies that enforce role restrictions per endpoint.

**File:** `/backend/app/core/dependencies.py`

**Permission Matrix:**
| Feature | Super Admin | Company Admin | Dispatcher | Accountant |
|---|---|---|---|---|
| Manage tenants | ✅ | ❌ | ❌ | ❌ |
| Impersonate company | ✅ | ❌ | ❌ | ❌ |
| Manage users & roles | ✅ | ✅ | ❌ | ❌ |
| Company settings | ✅ | ✅ | ❌ | ❌ |
| Create/edit loads | ✅ | ✅ | ✅ | ❌ |
| Dispatch loads | ✅ | ✅ | ✅ | ❌ |
| View financial dashboard | ✅ | ✅ | ❌ | ✅ |
| Process settlements | ✅ | ✅ | ❌ | ✅ |
| Driver bank details | ✅ | ✅ | ❌ | ✅ |

**Acceptance Criteria:**
- Dispatcher cannot access `GET /api/v1/accounting/settlements`.
- Accountant cannot access `POST /api/v1/loads/{id}/dispatch`.
- Proper `403 Forbidden` responses for unauthorized access.

---

### 2.4 — Super Admin: Tenant Management & Impersonation

**What:** Super Admin endpoints to create/suspend companies and impersonate.

**Endpoints:**
| Method | Path | Description |
|---|---|---|
| `GET` | `/api/v1/admin/companies` | List all tenants |
| `POST` | `/api/v1/admin/companies` | Create a new tenant + admin user |
| `PATCH` | `/api/v1/admin/companies/{id}` | Suspend / reactivate |
| `POST` | `/api/v1/admin/impersonate/{company_id}` | Generate temp session token |

**Acceptance Criteria:**
- Impersonation creates a short-lived token (30 min) scoped to the target company.
- Only Super Admin role can access these endpoints.

---

### 2.5 — Frontend: Auth Pages & Protected Routes

**What:** Login page, auth context, and route guards.

**Files:**
```
/frontend/app/
  (auth)/
    login/page.tsx              ← Login form
  (dashboard)/
    layout.tsx                  ← Protected layout (sidebar + topbar)
/frontend/lib/
  auth-context.tsx              ← React context holding user + tokens
  api.ts                        ← Axios interceptor attaching Bearer token
```

**Acceptance Criteria:**
- Unauthenticated users are redirected to `/login`.
- JWT is stored in `httpOnly` cookie or secure `localStorage`.
- After login, user lands on the Dashboard.
- Role-based nav: Dispatchers don't see "Accounting" in sidebar.

---

# PHASE 3 — Profiles & Assets (CRUD Modules)

> **Goal:** Build complete CRUD APIs + frontend screens for Brokers, Drivers, Trucks, Trailers, and the Document Vault (GCS integration).

---

### 3.1 — Broker Directory (CRUD + Auto-Complete)

**Backend Endpoints:**
| Method | Path | Description |
|---|---|---|
| `GET` | `/api/v1/brokers` | List (paginated, searchable) |
| `GET` | `/api/v1/brokers/search?q=` | Auto-complete for load creation |
| `POST` | `/api/v1/brokers` | Create |
| `GET` | `/api/v1/brokers/{id}` | Detail view |
| `PUT` | `/api/v1/brokers/{id}` | Update |
| `DELETE` | `/api/v1/brokers/{id}` | Soft delete (`is_active = false`) |

**Frontend Page:** `/app/(dashboard)/brokers/page.tsx`
- Searchable table with columns: Name, MC#, Contact, Phone, Email.
- "Add New Broker" modal.

---

### 3.2 — Driver Management (CRUD + Compliance)

**Backend Endpoints:**
| Method | Path | Description |
|---|---|---|
| `GET` | `/api/v1/drivers` | List with filters (status, employment_type) |
| `POST` | `/api/v1/drivers` | Create driver profile |
| `GET` | `/api/v1/drivers/{id}` | Full profile + documents + load history |
| `PUT` | `/api/v1/drivers/{id}` | Update |
| `DELETE` | `/api/v1/drivers/{id}` | Soft delete (blocked if attached to active load) |
| `GET` | `/api/v1/drivers/available` | Only drivers with `status=available` |
| `GET` | `/api/v1/drivers/expiring` | CDL or Medical expiring within 30 days |

**Frontend Pages:**
- **Driver Directory** (`/drivers/page.tsx`) — Matches the fleet_directory prototype: table with avatar initials, name, CDL class, phone, pay type pill, CDL expiry, status pill. Bottom KPI cards: Compliance Score, Pending Expirations, HOS Utility.
- **Driver Profile** (`/drivers/[id]/page.tsx`) — Tabbed view: Profile, Documents, Load History, Pay Settings.

**Acceptance Criteria:**
- Cannot delete a driver assigned to an active (non-completed) load → returns `409 Conflict`.
- Expiring documents automatically appear on Dashboard's Compliance Alert Center.

---

### 3.3 — Fleet Equipment Management (Trucks + Trailers CRUD)

**Backend Endpoints:**
| Method | Path | Description |
|---|---|---|
| `GET` | `/api/v1/trucks` | List with status filter |
| `POST` | `/api/v1/trucks` | Create |
| `GET` | `/api/v1/trucks/{id}` | Detail |
| `PUT` | `/api/v1/trucks/{id}` | Update |
| `DELETE` | `/api/v1/trucks/{id}` | Soft delete |
| `GET` | `/api/v1/trucks/available` | Available + valid DOT only |
| `GET` | `/api/v1/trailers` | (same CRUD pattern) |
| `POST` | `/api/v1/trailers` | |
| `GET/PUT/DELETE` | `/api/v1/trailers/{id}` | |
| `GET` | `/api/v1/trailers/available` | |

**Failsafe Logic (in Service layer):**
- When a truck/trailer is assigned to a load: verify `status != maintenance` AND `dot_inspection_expiry > today()`.
- If either check fails → return `400 Bad Request` with clear error: "Cannot dispatch: DOT inspection expired."

**Frontend Page:** `/app/(dashboard)/fleet/page.tsx`
- Two tabs: Trucks / Trailers.
- Table matching prototype with unit#, year/make/model, VIN, type, ownership, DOT expiry, status pill.
- "Add New Truck/Trailer" modal.

---

### 3.4 — Document Vault (GCS Integration)

**What:** File upload/download system using Google Cloud Storage.

**Backend Endpoints:**
| Method | Path | Description |
|---|---|---|
| `POST` | `/api/v1/documents/upload` | Upload file → GCS bucket, save metadata |
| `GET` | `/api/v1/documents/{entity_type}/{entity_id}` | List documents for entity |
| `GET` | `/api/v1/documents/{id}/download` | Generate signed download URL |
| `DELETE` | `/api/v1/documents/{id}` | Remove from GCS + soft delete metadata |

**GCS Bucket Structure:**
```
gs://{bucket}/
  {company_id}/
    loads/{load_id}/rate_confirmation/
    loads/{load_id}/pod_bol/
    drivers/{driver_id}/cdl/
    drivers/{driver_id}/medical_card/
    drivers/{driver_id}/bank_info/
    fleet/{truck_id}/dot_inspection/
```

**Acceptance Criteria:**
- Files are uploaded to tenant-isolated GCS paths.
- Download URLs are signed (expire in 1 hour).
- Supported formats: PDF, PNG, JPG, JPEG (max 10MB).

---

### 3.5 — Company Settings & User Management

**Backend Endpoints:**
| Method | Path | Description |
|---|---|---|
| `GET` | `/api/v1/settings/company` | Get company profile |
| `PUT` | `/api/v1/settings/company` | Update company profile |
| `GET` | `/api/v1/settings/users` | List company users |
| `POST` | `/api/v1/settings/users` | Invite / create internal user |
| `PUT` | `/api/v1/settings/users/{id}` | Change role / deactivate |
| `GET` | `/api/v1/settings/defaults` | Get default deductions / rates |
| `PUT` | `/api/v1/settings/defaults` | Update company defaults |

**Frontend Page:** `/app/(dashboard)/settings/page.tsx`
- Tabs: Company Profile, Users & Permissions, Default Rates & Deductions.

---

# PHASE 4 — The Load Engine

> **Goal:** The heart of the TMS — load CRUD, multi-stop routing, strict state machine, load board UI, and broker auto-complete.

---

### 4.1 — Load CRUD API

**Backend Endpoints:**
| Method | Path | Description |
|---|---|---|
| `POST` | `/api/v1/loads` | Create load with broker, stops, financials |
| `GET` | `/api/v1/loads` | List with filters: status, driver, date range |
| `GET` | `/api/v1/loads/{id}` | Full load detail with stops, docs, financials |
| `PUT` | `/api/v1/loads/{id}` | Update load info |
| `DELETE` | `/api/v1/loads/{id}` | Soft delete (only if `status=planned`) |

**Create Load Request Schema (matching prototype):**
```json
{
  "brokerId": "uuid",
  "brokerLoadId": "5508922",
  "contactAgent": "Name or Extension",
  "baseRate": 3200.00,
  "stops": [
    {
      "stopType": "pickup",
      "stopSequence": 1,
      "facilityName": "Facility Name",
      "address": "123 Main St",
      "city": "Chicago", "state": "IL", "zipCode": "60601",
      "scheduledDate": "2024-10-24",
      "scheduledTime": "08:00",
      "notes": "PO#, Seal, etc."
    },
    {
      "stopType": "delivery",
      "stopSequence": 2,
      "facilityName": "Receiver Name",
      "address": "456 Oak Ave",
      "city": "Austin", "state": "TX", "zipCode": "78701",
      "scheduledDate": "2024-10-26",
      "scheduledTime": "16:00",
      "notes": "Delivery requirements..."
    }
  ],
  "accessorials": [
    { "type": "fuel_surcharge", "amount": 450.00 }
  ],
  "driverId": null,
  "truckId": "uuid",
  "trailerId": null
}
```

---

### 4.2 — Load State Machine

**What:** Enforce strict status transitions. Invalid transitions return `400`.

**File:** `/backend/app/loads/service.py`

**Allowed Transitions:**
```
planned      → dispatched, cancelled
dispatched   → at_pickup, cancelled
at_pickup    → in_transit
in_transit   → delivered, delayed
delayed      → in_transit, delivered
delivered    → billed
billed       → paid
```

**Side Effects:**
| Transition | Side Effect |
|---|---|
| `→ dispatched` | Truck/Trailer status → `in_use`, Driver status → `on_route` |
| `→ delivered` | Truck/Trailer status → `available`, Driver status → `available` |
| `→ cancelled` | Release truck/trailer/driver back to `available` |

**Endpoint:**
| Method | Path | Description |
|---|---|---|
| `PATCH` | `/api/v1/loads/{id}/status` | `{ "status": "dispatched" }` |

---

### 4.3 — Load Assignment with Failsafes

**What:** Assign driver + truck + trailer to a load, with compliance checks.

**Endpoint:**
| Method | Path | Description |
|---|---|---|
| `PATCH` | `/api/v1/loads/{id}/assign` | `{ driverId, truckId, trailerId }` |

**Validation Checks (all must pass):**
1. Driver `status = available` AND `is_active = true`.
2. Driver CDL not expired.
3. Truck `status = available` AND `dot_inspection_expiry > today()`.
4. Trailer `status = available` AND `dot_inspection_expiry > today()` (if assigned).

**If any check fails → `400 Bad Request`** with a specific error message naming the failing condition.

---

### 4.4 — Load Board Tabs API

**What:** Three filtered views matching the prototype tabs.

**Endpoints:**
| Method | Path | Description |
|---|---|---|
| `GET` | `/api/v1/loads/live` | `status IN (dispatched, at_pickup, in_transit, delayed)` |
| `GET` | `/api/v1/loads/upcoming` | `status = planned` AND `earliest stop date > today` |
| `GET` | `/api/v1/loads/completed` | `status IN (delivered, billed, paid)` |

**Each returns:** Paginated list with Load ID, Broker, Pickup city/date, Delivery city/date, Driver name, Truck#, Rate, Status.

---

### 4.5 — Frontend: Load Board Page

**File:** `/app/(dashboard)/loads/page.tsx`

**UI (matching Load Board prototype):**
- Breadcrumb: Dashboard > Load Board
- **"+ Create New Load"** button (top right, primary gradient)
- **3 Tabs:** Live Loads (badge with count), Upcoming, Completed
- **3 KPI Cards:** Total Revenue (Weekly), Active Shipments (with delayed badge), On-Time Performance
- **Data Table:** Load ID, Broker, Pickup (city + date), Delivery (city + date), Driver (avatar + name), Truck#, Rate (green $), Status Pill
- **Pagination** at bottom
- **Urgent Alerts** section below table (delay warnings, unassigned loads)

---

### 4.6 — Frontend: Create New Load Page

**File:** `/app/(dashboard)/loads/new/page.tsx`

**UI (matching Create New Load prototype):**
- **Left Column (70%):**
  - Broker Information section: search auto-complete field, Load ID from Rate Con, Contact Agent
  - Routing Timeline: vertical track with Origin/Pickup (Stop 1) → "Add Intermediate Stop" button → Final Destination
  - Each stop card: Facility Name & Address, notes, date picker, time picker
  - "Auto-Saving Draft..." indicator
- **Right Column (30%):**
  - Financials card: Base Rate input, Fuel Surcharge, Detention/Layover, "+ Add Accessorial" button, Total Load Value (calculated)
  - Asset Assignment: Assign Driver dropdown (only available), Assign Truck/Trailer dropdown (only available + valid DOT)
  - Rate Confirmation: drag-and-drop PDF upload zone
- **Bottom Bar:** "Discard Load" (text) | "Save Draft" (secondary) | "Dispatch Load" (primary gradient)

---

### 4.7 — Frontend: Load Detail Page

**File:** `/app/(dashboard)/loads/[id]/page.tsx`

**UI:**
- Header: Load # + Status Pill + status transition buttons
- Route Timeline visualization (vertical)
- Driver & Equipment assignment cards
- Financials breakdown
- Document Vault (Rate Con + POD uploads)
- Status History / Activity Log

---

# PHASE 5 — Accounting, Settlements & Executive Dashboard

> **Goal:** Complex financial services for payroll, PDF generation, and the real-time Executive Dashboard powering KPI metrics.

---

### 5.1 — Driver Pay Calculation Service

**What:** The core math engine that calculates driver earnings per load.

**File:** `/backend/app/accounting/service.py`

**Calculation Logic (all NUMERIC, never float):**

```
FOR each load assigned to the driver in the settlement period:

  IF driver.pay_rate_type == "cpm":
      load_gross = load.total_miles × driver.pay_rate_value
  ELIF driver.pay_rate_type == "percentage":
      load_gross = load.base_rate × driver.pay_rate_value
  ELIF driver.pay_rate_type == "fixed_per_load":
      load_gross = driver.pay_rate_value
  ELIF driver.pay_rate_type == "hourly":
      load_gross = hours_worked × driver.pay_rate_value
  ELIF driver.pay_rate_type == "salary":
      load_gross = driver.pay_rate_value / pay_periods_per_year

  total_gross += load_gross

total_accessorials = SUM(load_accessorials for all loads in period)
total_deductions   = SUM(applicable company_default_deductions + one_off deductions)

net_pay = total_gross + total_accessorials - total_deductions
```

**Acceptance Criteria:**
- $0.65 CPM × 920 miles = exactly $598.00 (no floating point drift).
- 80% of $3,200 base = exactly $2,560.00.

---

### 5.2 — Settlement Management API

**Backend Endpoints:**
| Method | Path | Description |
|---|---|---|
| `POST` | `/api/v1/settlements/generate` | Generate draft settlement for driver + period |
| `GET` | `/api/v1/settlements` | List all settlements (filterable by status, driver) |
| `GET` | `/api/v1/settlements/{id}` | Full settlement detail with line items |
| `PATCH` | `/api/v1/settlements/{id}/approve` | Mark as `ready` |
| `PATCH` | `/api/v1/settlements/{id}/pay` | Mark as `paid`, set `paid_at` |
| `GET` | `/api/v1/settlements/{id}/pdf` | Generate & return PDF paystub |

---

### 5.3 — PDF Settlement Generation

**What:** Generate clean, printable PDF settlement paystubs.

**Library:** `reportlab` or `weasyprint`

**PDF Layout (matching Accounting prototype):**
- Header: Company logo + "Driver Settlement Report" + Settlement # + Period dates
- Driver Details: Name, Employee ID, Truck #
- **Gross Earnings Breakdown Table:** Date | Load # (Origin → Dest) | Miles | Rate/Mi | Gross Pay
- **Accessorials & Extras:** Fuel Surcharge, Detention, Stop-off Pay → Total Extras
- **Deductions:** Insurance, ELD Fee, Escrow → Total Deductions
- **Footer:** "FINAL SETTLEMENT TOTAL" = Gross + Extras − Deductions = **Net Pay**
- Confidential watermark + company branding

---

### 5.4 — Broker Invoicing

**Backend Endpoints:**
| Method | Path | Description |
|---|---|---|
| `POST` | `/api/v1/loads/{id}/invoice` | Generate invoice for broker |
| `GET` | `/api/v1/invoices` | List all invoices |
| `GET` | `/api/v1/invoices/{id}/pdf` | Download invoice PDF |

**Triggered by:** Load status transition to `billed`.

---

### 5.5 — Frontend: Accounting & Settlements Page

**File:** `/app/(dashboard)/accounting/page.tsx`

**UI (matching Accounting prototype):**
- **Left Panel (30%):** "Ready to Pay" list — driver cards showing name, fleet#, load count, gross amount, "Settlement Ready" badge. Clickable to select.
- **Right Panel (70%):** Settlement detail view showing:
  - Settlement header: company logo, settlement #, period, driver details
  - Gross Earnings Breakdown table
  - Accessorials & Extras breakdown
  - Deductions breakdown
  - Final Settlement Total (big number)
  - "Generate PDF & Download" primary button

---

### 5.6 — Executive Dashboard API

**What:** Aggregation queries powering the real-time dashboard KPIs.

**Backend Endpoints:**
| Method | Path | Description |
|---|---|---|
| `GET` | `/api/v1/dashboard/kpis` | All KPI metrics |
| `GET` | `/api/v1/dashboard/compliance-alerts` | Expiring docs within 30 days |
| `GET` | `/api/v1/dashboard/fleet-status` | Truck distribution |
| `GET` | `/api/v1/dashboard/recent-events` | Latest load status changes |

**KPI Calculations:**
| Metric | Formula |
|---|---|
| **Gross Revenue** | `SUM(loads.total_rate) WHERE status IN (delivered, billed, paid)` |
| **Average RPM** | `SUM(loads.total_rate) / SUM(loads.total_miles)` |
| **Active Loads** | `COUNT(loads) WHERE status IN (dispatched, at_pickup, in_transit)` |
| **Fleet Effectiveness** | `COUNT(drivers WHERE status=on_route) / COUNT(drivers WHERE is_active=true) × 100` |

**Compliance Alerts Query:**
```sql
SELECT * FROM drivers WHERE cdl_expiry_date <= NOW() + INTERVAL '30 days' AND is_active = true
UNION
SELECT * FROM drivers WHERE medical_card_expiry_date <= NOW() + INTERVAL '30 days' AND is_active = true
UNION
SELECT * FROM trucks WHERE dot_inspection_expiry <= NOW() + INTERVAL '30 days' AND is_active = true
```

---

### 5.7 — Frontend: Executive Dashboard Page

**File:** `/app/(dashboard)/dashboard/page.tsx`

**UI (matching Executive Dashboard prototype — both light & dark):**
- **Header:** "Executive Overview" + "Real-time performance metrics" + "+ Dispatch Load" CTA
- **4 KPI Cards (row):**
  - Gross Revenue ($428,940 with % vs last month)
  - Average RPM ($3.14 with $ change indicator)
  - Active Loads (84 with "12 scheduled for pickup" sub-text)
  - Fleet Effectiveness (92.4% with trend indicator)
- **Compliance Alert Center (left, ~60%):**
  - "2 CRITICAL" badge
  - Alert cards (red left border): driver name + expiring doc + "RENEWAL PORTAL" / "NOTIFY DRIVER" action links
  - Truck alerts: DOT overdue + "SCHEDULE SERVICE" / "VIEW MAINTENANCE LOGS"
- **Live Fleet Status (right, ~40%):**
  - Loaded / Empty (Ready) / In-Shop with horizontal bar charts + counts
  - Avg Turnaround Time + Utilization Rate mini-KPIs
- **Recent Logistical Events (full width):**
  - 3 event cards: Delivered (green), In Transit (blue), Delay Alert (red) — each with load#, description, timestamp, driver name

---

# PHASE 6 — Polish, Testing & Deployment

> **Goal:** End-to-end testing, performance optimization, security hardening, and production deployment to GCP.

---

### 6.1 — Backend Testing Suite

- **Unit tests** for all service-layer math (settlement calculations, state machine transitions).
- **Integration tests** for all API endpoints with test database.
- **Multi-tenancy tests** confirming zero data leakage between tenants.
- **RBAC tests** confirming permission enforcement.

---

### 6.2 — Frontend Testing

- Component tests for all UI components (KPICard, DataTable, StatusPill, etc.).
- E2E tests for critical flows: Login → Create Load → Dispatch → Deliver → Generate Settlement.

---

### 6.3 — Security Hardening

- Rate limiting on auth endpoints.
- CORS configuration.
- Input sanitization (SQL injection, XSS prevention).
- Sensitive field encryption at rest (bank details).
- HTTPS enforcement.

---

### 6.4 — GCP Production Deployment

**Infrastructure:**
| Service | GCP Product |
|---|---|
| Backend API | **Cloud Run** (serverless, auto-scaling) |
| Database | **Cloud SQL (PostgreSQL 15)** |
| File Storage | **Cloud Storage** (GCS bucket) |
| Frontend | **Cloud Run** or **Vercel** |
| Secrets | **Secret Manager** |
| CI/CD | **Cloud Build** or **GitHub Actions** |

**Deployment Steps:**
1. Provision Cloud SQL instance (PostgreSQL 15).
2. Create GCS bucket with tenant-isolated structure.
3. Build & push Docker images → Artifact Registry.
4. Deploy to Cloud Run with env vars from Secret Manager.
5. Configure custom domain + SSL.
6. Run Alembic migrations against production DB.
7. Create initial Super Admin account.

---

### 6.5 — Dark Mode Verification

- Verify all screens render correctly in dark mode matching the `executive_dashboard_dark_mode` prototype.
- Ensure all design token transitions work (surface → dark variants).
- Test dark mode persistence across sessions.

---

# Appendix: File Count Estimate

| Area | Estimated Files |
|---|---|
| Backend Models | ~10 |
| Backend Domain Modules (routers + services + repos + schemas × 7 domains) | ~35 |
| Backend Core (auth, middleware, security, DB, exceptions) | ~8 |
| Backend Tests | ~15 |
| Frontend Pages | ~12 |
| Frontend Components | ~20 |
| Frontend Lib/Utils | ~5 |
| Config / Docker / CI | ~8 |
| **Total** | **~113 files** |

---

# Appendix: Dependency Summary

**Backend (`requirements.txt`):**
```
fastapi>=0.110
uvicorn[standard]
sqlalchemy[asyncio]>=2.0
asyncpg
alembic
pydantic>=2.0
pydantic-settings
python-jose[cryptography]
passlib[bcrypt]
python-multipart
google-cloud-storage
reportlab
httpx
pytest
pytest-asyncio
```

**Frontend (`package.json`):**
```
next
react / react-dom
tailwindcss
@headlessui/react
lucide-react (icons)
axios
date-fns
zustand (state)
react-hook-form
zod (validation)
```
