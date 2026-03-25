# 🚛 Master Product Requirements Document (PRD) & Technical Blueprint
**Project:** Next-Gen Transportation Management System (TMS)
**Phase:** Minimum Viable Product (MVP)
**Architecture:** Cloud-Native B2B SaaS (Software-as-a-Service), Multi-Tenant

---

## 🌟 1. Executive Summary & Product Vision

### 1.1 What We Are Building
We are building a **Transportation Management System (TMS)** — a modern, cloud-based software platform designed specifically for **trucking companies** to manage their daily operations, finances, and logistics in one centralized system.

### 1.2 The Purpose & Problems We Are Solving
The goal is to replace manual processes, fragmented spreadsheets, physical whiteboards, and outdated software with a single, intuitive, and scalable platform. 

**Key Problems Solved:**
* Disorganized multi-stop load tracking and routing.
* Manual driver payment calculations resulting in rounding errors.
* Lack of real-time visibility into operations and fleet utilization.
* Poor financial tracking and missing document (POD) management.
* Inefficient fleet utilization and missed compliance deadlines (CDLs, DOT inspections).

### 1.3 MVP Scope & Core Concept
At its core, the system revolves around connecting key entities: **Loads, Drivers, Trucks/Trailers, Brokers, and Financial Data.** Everything is interconnected to provide **Clarity, Automation, and Accuracy**.

To ensure a rock-solid foundation, the MVP strictly focuses on the **Carrier (Trucking Company) side**. Driver-facing mobile apps and Broker-facing portals are excluded from this MVP to prevent feature creep, but the backend architecture is explicitly designed to support them seamlessly in future phases.

---

## 👥 2. User Roles & Permissions (Role-Based Access Control)
The system operates on strict data isolation (multi-tenancy) and permission tiers.

### 2.1 Super Admin (System Owner / "God Mode")
*   **Who:** The SaaS platform developers/owners.
*   **Capabilities:** Create, suspend, or manage Carrier Companies (Tenants) and Admins. Monitor overall platform activity (total active companies, platform revenue).
*   **Impersonation Mode:** Securely generate a temporary session to "Log in as Company X" to troubleshoot customer support tickets exactly as the user sees the app, without needing their passwords.

### 2.2 Company Admin (Carrier Owner)
*   **Who:** The owner or general manager of the individual trucking company.
*   **Capabilities:** Full control over their company's isolated environment. Manage internal users, assign roles/permissions, set global accounting defaults, and view overarching financial dashboards.

### 2.3 Dispatcher
*   **Capabilities:** Manages loads, assigns drivers/trucks, and updates tracking statuses. Restricted from seeing the overarching company gross revenue dashboard or sensitive driver bank details.

### 2.4 Accountant
*   **Capabilities:** Processes driver payroll, calculates load revenue, manages broker invoicing, and handles financial deductions and accessorials.

---

## 🔄 3. Key Operational Workflows (The User Journey)
*The system logic must naturally support these chronological lifecycles.*

### 🚚 3.1 The Load Lifecycle Workflow
1. **Create Load:** Enter Broker info, base rate, dates, and multi-stop locations.
2. **Assign:** Attach an available Driver and compliant Truck/Trailer.
3. **Dispatch:** Move status to `Dispatched` and send instructions.
4. **Track Progress:** Update statuses (`At Pickup` ➔ `In Transit`).
5. **Deliver:** Mark as `Delivered` and upload the Signed Proof of Delivery (POD/BOL).
6. **Settle:** Send to Accounting to calculate revenue, invoice the broker, and trigger driver payments (`Billed` ➔ `Paid`).

### 👤 3.2 The Driver Payment Workflow
1. **Assign Rate:** System reads the Driver's assigned rate structure (CPM, % of gross, or fixed).
2. **Complete Load:** Driver finishes the delivery and submits documents.
3. **Calculate Earnings:** Apply base rate + **Accessorials** (detention, layover) - **Deductions** (fuel advances, tolls, lease payments).
4. **Generate Settlement:** Create a clean, printable PDF paystub.
5. **Record Payment:** Mark the settlement as paid in the system.

### 🚛 3.3 The Fleet Usage Workflow
1. **Status Check:** Dispatcher attempts to assign a truck to a load.
2. **Failsafe Logic:** System verifies DOT inspection is valid and the truck is not "In the Shop."
3. **Update:** Truck automatically shows as "In Use" / "Loaded".
4. **Release:** Truck returns to "Available" once the load is delivered.

---

## 🧩 4. Core Business Modules (MVP Features)

### Module 1: The Executive Dashboard & Analytics
*The real-time command center.*
*   **Financial Metrics:** Gross Company Revenue and **Average RPM** (Revenue Per Mile = Total Gross ÷ Total Loaded Miles).
*   **Fleet Effectiveness Rate:** KPI showing the percentage of available drivers currently assigned to a load vs. sitting empty.
*   **Asset Counters:** Live tracker of trucks (Loaded, Empty, In Shop).
*   **Compliance Alert Center:** Flashing RED visual warnings if a Driver's CDL/Medical Card or a Truck's DOT Inspection expires within the next 30 days.

### Module 2: Load Management & Dispatch Engine (The Core Engine)
*Tracks freight from booking to final delivery.*
*   **Smart Broker Directory:** Auto-completes and saves Broker Name, Billing Address, and MC Number globally to save future data entry.
*   **Multi-Stop Routing (Crucial):** Supports an *infinite array of Stops* (Multiple Pickups / Deliveries), each with specific dates, times, and facility addresses.
*   **Strict State Machine:** `Planned` ➔ `Dispatched` ➔ `At Pickup` ➔ `In Transit` ➔ `Delivered` ➔ `Delayed` ➔ `Billed` ➔ `Paid`.
*   **Load Boards (Tabs):** Live Loads (highlights delayed freight), Upcoming Loads, Past/Completed Loads.
*   **Document Vault:** Dedicated upload zones for the pre-trip Broker Rate Confirmation and post-trip Signed POD/BOL.

### Module 3: Driver & Safety Management
*The HR hub ensuring drivers are paid correctly and are legally compliant.*
*   **Profiles:** Name, DOB, Contact Info, Experience.
*   **Employment Type:** Company Driver (W2), Owner-Operator (1099), or Lease Operator.
*   **Compensation Setup:** Assign to "Company Defaults" OR create custom overrides (e.g., Driver A gets 80%, Driver B gets $0.65 CPM).
*   **Document Vault:** Secure file uploads for CDLs, Medical Cards, and Bank Info. Expiration dates automatically feed into the Dashboard Alert Center.

### Module 4: Fleet Equipment Management
*Digitizing physical assets to ensure road-legality and optimize usage.*
*   **Profiles:** Track Trucks & Trailers (Year, Make, Model, VIN, License Plate, Type: Dry Van/Reefer/Flatbed).
*   **Ownership Type:** Owned, Financed, Leased, or Rented.
*   **Asset Status:** Available, In Use, or Maintenance (In the Shop).
*   **Strict Failsafe:** System *programmatically prevents* dispatching equipment to a live load if its Annual DOT Inspection is expired or marked "Maintenance."

### Module 5: Accounting & Financial Settlements
*Automating payroll and invoicing to eliminate manual spreadsheet errors.*
*   **Company Defaults:** Admins set global standard deductions (e.g., $250 weekly trailer rental, 10% dispatch fee).
*   **Load Financials:** Support Base Linehaul plus **Accessorials** (Detention Pay, Lumper Reimbursement, Fuel Surcharges).
*   **Driver Settlements:** Automatically calculate Gross Pay, process one-off or recurring **Deductions** (Fuel advances, lease payments, escrow holdbacks), and generate a clean PDF Settlement Paystub detailing Net Pay.

### Module 6: Settings & Configuration
*   Manage company profile settings, configure default rates, manage internal user permissions, and enable/disable system modules.

---

## 🎨 5. UI/UX Philosophy
The system must be designed for operational speed and non-technical users:
*   **Simple & Accessible:** Easy to understand with a minimal learning curve.
*   **Professional:** Clean, modern, highly structured layout.
*   **Efficient:** Reduce clicks, utilize instant data auto-complete, fast navigation.
*   **Adaptive Environment:** Native toggle for **Dark Mode / Light Mode** to accommodate 24/7 dispatch office environments.

---

## 🏗️ 6. Technical Architecture (The Stack)
To ensure the system scales and processes complex financial math without rounding errors, the stack is strictly defined:

*   **Backend API:** **Python 3.11+ using FastAPI**. Chosen for unmatched execution speed, native asynchronous support, strict Pydantic type-checking (essential for bug-free AI generation), and auto-generated OpenAPI (Swagger) documentation.
*   **Database:** **Google Cloud SQL (PostgreSQL)**. A TMS is an ERP requiring highly structured, relational data integrity for multi-stop joins and exact financial math. PostgreSQL handles this and multi-tenant isolation perfectly.
*   **Cloud Infrastructure:** **Google Cloud Platform (GCP)**. Utilizing **Cloud Run** for serverless, auto-scaling backend compute, and **Cloud Storage (GCS)** for secure bucket storage of all PDFs/Images.
*   **Frontend UI:** **React.js (Next.js)** or **Vue.js**, styled with **Tailwind CSS**.

---

## 🤖 7. Strict AI Development Guidelines & Constraints
*The AI Agent generating the codebase MUST strictly adhere to these architectural rules to prevent spaghetti code, security flaws, and financial math errors.*

### Rule 1: Multi-Tenancy (Data Isolation) - THE GOLDEN RULE
*   This is a shared-database SaaS. Every single database table (except Super Admin configuration tables) **MUST contain a `company_id` (Tenant ID) column.**
*   The API layer must utilize middleware to intercept every HTTP request, validate the user's JWT Token, extract their `company_id`, and append `WHERE company_id = X` to **every single database query**. It must be programmatically impossible for Company A to query or modify Company B's data.

### Rule 2: Financial Data Accuracy
*   **Never use standard `float` for money.** Doing so creates severe rounding errors in payroll.
*   Use exact numeric types (e.g., `DECIMAL(10,2)` or `NUMERIC`) for all financial and mileage data in PostgreSQL and the Python backend.

### Rule 3: Relational Integrity & Soft Deletes
*   **Foreign Keys:** Enforce strict Foreign Keys. Use `ON DELETE RESTRICT` for financial/historical data (e.g., You cannot delete a driver if they are attached to a historical, paid load).
*   **Soft Deletes:** Logistics data must be auditable. Use an `is_active = False` or `deleted_at = TIMESTAMP` column to hide records from the UI while preserving accounting history. Do not use hard `DROP`/`DELETE` queries.
*   **Schema Contracts:** Make heavy use of Pydantic models to strictly define schema contracts and validate data before it touches the database.

### Rule 4: Modular Boundaries (Separation of Concerns)
*   Keep business logic in the backend. Do not build a monolithic file. 
*   Enforce a strict 3-layer architecture:
    1.  **Routers/Controllers:** Handle HTTP requests and auth checks. *No business math here.*
    2.  **Services:** Contain the core business logic, complex math (payroll), state-machine validations, and data orchestration.
    3.  **Repositories / ORM:** The *only* place where direct PostgreSQL queries (SQLAlchemy/SQLModel) occur.
*   Code must be separated into domain directories: `/auth`, `/users`, `/fleet`, `/drivers`, `/loads`, `/accounting`.

### Rule 5: Naming Conventions
*   **Python Backend:** `snake_case` for variables/functions. `PascalCase` for Classes/Models.
*   **PostgreSQL:** Lowercase, plural `snake_case` (e.g., `driver_settlements`, `load_stops`).
*   **API/JSON:** `camelCase` for all frontend interactions. The backend handles translation automatically during serialization.

---

## 🚀 8. Phased AI Execution Plan (Prompting Strategy)
*Do not instruct the AI to build the app in one prompt. Execute strictly in these sequential phases. Do not move to the next phase until the current one is fully tested.*

1.  **Phase 1: Database Foundation.** Write the complete PostgreSQL schema (SQLAlchemy models) covering all tables, multi-stop relationships, constraints, financial decimal types, and the `company_id` multi-tenant architecture. *Do not write app code until the schema is verified.*
2.  **Phase 2: Auth & Core Infrastructure.** Set up the FastAPI shell, connect to Google Cloud SQL, and build the secure JWT Authentication, RBAC, and multi-tenancy middleware.
3.  **Phase 3: Profiles & Assets (CRUD).** Build the API endpoints and frontend screens for Brokers, Drivers, Trucks, and Trailers (including GCP Cloud Storage integrations for document vault uploads).
4.  **Phase 4: The Load Engine.** Build Load Management APIs, including the complex multi-stop array logic, strict state machine statuses, and auto-complete broker logic.
5.  **Phase 5: Accounting & Dashboard.** Build the complex mathematical Python services for payroll statements, accessorials, deductions, PDF generation, and connect live data to the real-time Dashboard.

---

## 📈 9. Scalability Vision & End Goal (Post-MVP)
The MVP architecture is explicitly designed to effortlessly grow into a full enterprise platform. 

**Future Phases will include:**
*   Broker-facing load portals for direct freight bidding.
*   Driver-facing mobile applications (iOS/Android) for live GPS tracking and instant POD uploads from the road.
*   Automated route optimization and predictive maintenance insights.
*   AI-driven OCR (Optical Character Recognition) to automatically read PDF Rate Confirmations and build loads without manual data entry.

**End Goal:** Create a system that simplifies trucking operations, automates financial processes, provides crystal-clear insights, and scales gracefully into an industry-leading TMS.