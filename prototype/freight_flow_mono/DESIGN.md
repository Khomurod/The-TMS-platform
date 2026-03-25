# Design System Strategy: The Kinetic Precision Framework

## 1. Overview & Creative North Star
In the world of logistics and transportation, data is the engine, but clarity is the fuel. This design system moves beyond the "standard SaaS dashboard" to embrace a Creative North Star we call **"The Kinetic Architect."** 

The aesthetic is characterized by high-density information presented through a lens of premium editorial design. We reject the "boxed-in" feeling of traditional ERP software. Instead, we use intentional asymmetry, expansive negative space, and a sophisticated layering of surfaces to create an environment that feels authoritative yet breathable. By prioritizing typographic hierarchy and tonal depth over rigid lines, we transform a complex TMS into a high-performance instrument.

## 2. Colors & Surface Architecture
Our palette is rooted in a "Soft Slate" foundation, providing a calm, low-strain environment for power users who spend hours in the interface.

### The "No-Line" Rule
To achieve a premium, modern feel, **1px solid borders are strictly prohibited for sectioning.** We do not "box" content. Instead, boundaries must be defined through:
- **Tonal Shifts:** Transitioning from `surface` (#f7f9fb) to `surface_container_low` (#f2f4f6).
- **Negative Space:** Utilizing the `spacing-8` (1.75rem) or `spacing-10` (2.25rem) tokens to create natural "gutters" of air between functional groups.

### Surface Hierarchy & Nesting
Treat the UI as a physical desk with stacked sheets of fine material.
- **Level 0 (Base):** `surface` (#f7f9fb) — The primary app shell.
- **Level 1 (Sections):** `surface_container_low` (#f2f4f6) — Defines large functional areas (e.g., the sidebar or a secondary navigation rail).
- **Level 2 (Active Content):** `surface_container_lowest` (#ffffff) — Used for cards and primary data tables. This "Pure White" pops against the slate background, drawing the eye to the work.

### The "Glass & Gradient" Rule
For floating elements like Command Menus or Modals, use **Glassmorphism**. Apply `surface_container_lowest` at 80% opacity with a `backdrop-blur` of 12px. To give the brand "soul," use a subtle linear gradient on primary CTAs: `primary` (#3525cd) to `primary_container` (#4f46e5). This adds a three-dimensional richness that flat colors cannot replicate.

## 3. Typography: The Editorial Edge
We use a dual-font strategy to balance industrial utility with premium character.

*   **Display & Headlines (Manrope):** Chosen for its geometric precision and modern "tech-forward" feel. Use `headline-lg` for dashboard summaries to instill confidence.
*   **Body & Labels (Inter):** The workhorse. Inter is used for all data-dense areas. 
*   **The KPI Rule:** All numerical data (weights, costs, ETAs) must use `font-variant-numeric: tabular-nums`. Large KPIs should use `title-lg` with a `font-weight: 700` to act as visual anchors.
*   **Semantic Labeling:** `label-sm` is reserved for metadata. It should use `on_surface_variant` (#464555) to maintain a clear hierarchy between "Label" and "Value."

## 4. Elevation & Depth
We eschew the heavy shadows of the 2010s in favor of **Tonal Layering**.

*   **Layering Principle:** High-priority cards (like an active shipment) should sit on `surface_container_lowest` (#ffffff) while the background is `surface_container` (#eceef0). The contrast alone creates the "lift."
*   **Ambient Shadows:** When a shadow is required for a floating state (e.g., a dragged shipment row), use a diffused shadow: `box-shadow: 0 12px 32px -8px rgba(25, 28, 30, 0.06)`. Note the use of `on_surface` for the shadow tint rather than pure black.
*   **Ghost Border Fallback:** For accessibility in forms, use the "Ghost Border." Apply `outline_variant` (#c7c4d8) at **15% opacity**. It should be felt, not seen.

## 5. Components

### Buttons & Interaction
- **Primary:** Gradient-filled (`primary` to `primary_container`), `radius-md` (0.375rem). No border.
- **Secondary:** Surface-colored with a `surface_variant` ghost border. 
- **Tertiary:** Text-only using `primary` color, with a subtle `surface_container_high` background shift on hover.

### Data Tables (The TMS Core)
- **Zebra Striping:** Forbid 1px dividers. Use `surface_container_low` for even rows and `surface_container_lowest` for odd rows.
- **Cell Padding:** Use `spacing-4` (0.9rem) vertically to allow the data to breathe.
- **Status Pills:** Use high-contrast containers. 
    - *Delivered:* `on_tertiary_container` text on a soft green background.
    - *Severe Alert:* `tertiary` (#97000c) text on `tertiary_fixed` (#ffdad6).

### Inputs & Forms
- **Fields:** No dark borders. Use `surface_container_high` as the background fill with a 1px "Ghost Border." On focus, transition the background to `surface_container_lowest` and the border to `primary`.
- **Labels:** Always use `label-md` in `on_surface_variant`. Never use placeholder text as a substitute for a label.

### Logistics-Specific Components
- **The Route Timeline:** Use a vertical 2px track in `outline_variant`. Milestones are `primary` dots. Avoid "heavy" icons; use simple geometric shapes to maintain a clean aesthetic.
- **Telemetry Chips:** Small, high-density chips for "Temp: 32°F" or "Speed: 55mph" using `surface_container_highest` and `label-sm`.

## 6. Do's and Don'ts

### Do
- **Do** use `spacing-12` and `spacing-16` for page margins to create a high-end, editorial feel.
- **Do** use "Tabular Numbers" for any column containing digits to ensure perfect alignment.
- **Do** rely on background color shifts to define "Active" vs. "Inactive" states rather than heavy borders.

### Don't
- **Don't** use 100% black (#000000) for text. Use `on_surface` (#191c1e) to reduce eye strain.
- **Don't** use "Drop Shadows" on standard cards. Reserve elevation for elements that actually "float" (modals, dropdowns).
- **Don't** use standard 1px dividers to separate list items. Use vertical white space (`spacing-3` or `spacing-4`).