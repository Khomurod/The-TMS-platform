# 🏗️ Safehaul TMS — Frontend UI/UX Improvement Plan

> **Document Version:** 1.0  
> **Date:** April 2, 2026  
> **Author:** Principal Frontend Architect  
> **Scope:** Complete modernization of `frontend/components` to enterprise SaaS standards  

---

## 1. Executive Summary

Safehaul TMS has a **professionally architected backend** — Trip-based data model, PostgreSQL with proper relational schema, Zod validation, and a clean REST API. The frontend, however, tells a completely different story. What we ship to users right now is a schizophrenic mishmash of:

- **Inline `style={{}}` objects** littered across layout components (`TopBar.tsx`, `Sidebar.tsx`, `KPICard.tsx`) — making them completely immune to Tailwind's responsive, hover, focus, and dark-mode utilities.
- **Dead action buttons** in the TopBar (Dark Mode toggle, Settings, Notifications) that render Lucide icons but wire **zero event handlers** and have **no connected state**.
- **A custom `ThemeProvider.tsx`** that exists but is **never consumed** by the TopBar's sun icon — the dark mode toggle is literally decorative.
- **UI primitives (`Input.tsx`, `Button.tsx`)** built entirely with inline styles and manual `onMouseEnter`/`onMouseLeave` handlers, bypassing Tailwind entirely — resulting in zero `focus:ring`, zero `active:scale`, zero `transition-all` polish.
- **`Modal.tsx`** that *does* use Tailwind classes (the one bright spot) but references `animate-in fade-in zoom-in-95` which requires `tailwindcss-animate` — a package **not installed** in `package.json`.
- A `globals.css` that defines an **excellent** design token system (CSS custom properties, dark mode variables, typography scale) that is **largely ignored** by the components that render inline styles.

**The target aesthetic:** Modern, sleek, data-dense, accessible — aligned with the design language of Vercel's dashboard, Stripe's UI, or Linear's interface. Crisp typography, subtle depth via shadow and blur, functional micro-interactions, and a dark mode that actually works.

---

## 2. Comprehensive Issue Audit

### 2.1 The TopBar (`TopBar.tsx`) — Dead Buttons & Inline Style Prison

**File:** `frontend/components/layout/TopBar.tsx` (215 lines)

#### Problem 1: 100% Inline Styles — Zero Tailwind Integration

The entire component is rendered via `style={{}}` objects. Every single element — the header, breadcrumbs, search button, action buttons, user avatar — uses hardcoded inline CSS. This means:

- **No hover states** via Tailwind (`hover:bg-slate-100` is impossible inline)
- **No focus-visible outlines** for accessibility (`focus-visible:ring-2` can't be done inline)
- **No responsive behavior** (`md:hidden`, `lg:flex` — impossible)
- **No dark mode support** — every color is a hardcoded hex like `#ffffff`, `#0f172a`, `#94a3b8`

```
// Line 45-57: The ENTIRE header is an inline-styled div
<header style={{
  height: 48,
  background: "#ffffff",        // ← Hardcoded. Dark mode? What dark mode?
  borderBottom: "1px solid #e2e8f0",
  ...
}}>
```

#### Problem 2: Dead Icon Buttons (Lines 184–210)

The TopBar renders four icon buttons — `Sun` (theme toggle), `Settings`, `Send`, `Bell` (notifications) — with **zero `onClick` handlers**:

```tsx
// Lines 185-190: Completely inert buttons
<button style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "inherit" }}>
  <Sun style={{ width: 16, height: 16 }} />    // ← No onClick. No useTheme(). Decorative.
</button>
<button style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "inherit" }}>
  <Settings style={{ width: 16, height: 16 }} /> // ← No onClick. Goes nowhere.
</button>
```

The `ThemeProvider.tsx` exports a `useTheme()` hook with `toggleTheme()`, but **TopBar never imports it**. The Sun icon is a lie.

#### Problem 3: Notification Bell Has a Red Dot, But No Logic (Lines 194–201)

```tsx
<button style={{ ... position: "relative" }}>
  <Bell style={{ width: 16, height: 16 }} />
  <span style={{
    position: "absolute", top: 2, right: 2,
    width: 6, height: 6, borderRadius: "50%",
    background: "#ef4444",   // ← Static red dot. Always visible. No notification count.
  }} />
</button>
```

The notification bell perpetually shows a red dot regardless of actual notification state. There is no notification state, no dropdown, no count.

#### Problem 4: Create New Dropdown Uses Inline Hover Handlers (Lines 148–164)

The `+ Create new` dropdown is functional (it opens/closes), but its menu items use `onMouseEnter`/`onMouseLeave` for hover effects:

```tsx
onMouseEnter={e => e.currentTarget.style.background = "#f1f5f9"}
onMouseLeave={e => e.currentTarget.style.background = "transparent"}
```

This is fragile, non-composable, and won't work for keyboard navigation. No `focus-visible` support.

---

### 2.2 The Sidebar (`Sidebar.tsx`) — Good Structure, Inline Style Disease

**File:** `frontend/components/layout/Sidebar.tsx` (333 lines)

#### Positive Findings
- ✅ Lucide icons are already installed and used correctly (`lucide-react@0.577.0`)
- ✅ No text emojis (`📦`, `👥`) — **this was already fixed** in a prior phase
- ✅ Single-expand accordion behavior works
- ✅ `NewBadge` integration for unreleased features
- ✅ User identity footer with avatar, name, email, and logout

#### Remaining Problems

**Problem 1: 100% Inline Styles (Same as TopBar)**

Every nav item, every hover state, every active indicator is an inline style object:

```tsx
// Lines 214-222: Inline everything
style={{
  display: "flex", alignItems: "center", width: "100%",
  padding: "7px 10px", borderRadius: 6, border: "none",
  background: parentActive ? "rgba(59,130,246,0.12)" : "transparent",
  color: parentActive ? "#60a5fa" : "#cbd5e1",
  ...
}}
```

This makes it impossible to use Tailwind's `group-hover:`, `data-[active]:`, or `dark:` modifiers.

**Problem 2: Manual Hover Handlers (Lines 223–224, 243–244, 276–277)**

Each nav item has:
```tsx
onMouseEnter={e => { if (!parentActive) e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
onMouseLeave={e => { if (!parentActive) e.currentTarget.style.background = "transparent"; }}
```

These should be simple `hover:bg-white/5` Tailwind classes.

**Problem 3: UnderDevModal Uses Inline Styles (Lines 81–134)**

The "Under Development" modal inside the Sidebar uses inline styles instead of `Modal.tsx` or Tailwind. It even has its own `backdrop-filter: blur(4px)` defined inline — duplicating what `globals.css` already defines via the `.glass` utility class.

**Problem 4: Hardcoded Dark Navy Colors**

The sidebar gradient `background: "linear-gradient(180deg, #0f172a 0%, #1e293b 100%)"` (line 178) is hardcoded. In dark mode, this will remain identical. The sidebar should reference CSS variables so it can adapt.

---

### 2.3 UI Primitives — Missing Modern Polish

#### `Input.tsx` (57 lines)

**Problems:**

1. **Entirely inline-styled.** Uses `style={{}}` objects with CSS variables (credit for that), but misses all Tailwind focus/hover utilities.
2. **Focus effect via `onFocus`/`onBlur` JS handlers** (lines 36–43) — this is what CSS `focus:` pseudo-classes are for. The JS approach:
   - Flickers on rapid focus/blur
   - Cannot be overridden by parent composition
   - Fails on SSR (no hydration mismatch protection)
3. **No `focus:ring` outline** — the input has `outline: "none"` (line 30) and relies on a subtle `borderColor` change. This is an accessibility violation (WCAG 2.4.7 — Focus Visible).
4. **No `shadow-sm`** for depth — the input is flat, borderless-looking because the border is `rgba(199, 196, 216, 0.15)` (nearly invisible).
5. **No `transition-all`** — only `transition: "background-color 0.15s ease, border-color 0.15s ease"` — misses shadow, ring, transform transitions.
6. **No `placeholder:text-` styling** defined.

#### `Button.tsx` (71 lines)

**Problems:**

1. **Entirely inline-styled** with `variantStyles` as a `React.CSSProperties` record.
2. **Hover via `onMouseEnter`/`onMouseLeave`** (lines 54–63) — only reduces opacity for primary, only changes background for tertiary. No hover state for secondary.
3. **No `active:scale-[0.98]`** press animation — buttons feel dead on click.
4. **No `focus-visible:ring-2`** — zero keyboard accessibility feedback.
5. **No disabled state styling** — no `disabled:opacity-50 disabled:cursor-not-allowed`.
6. **No icon animation** — the `icon` prop is rendered statically with no hover transitions.
7. **Linear gradient** for primary is good, but needs `shadow-md` for elevation and `hover:shadow-lg` for depth feedback.

#### `Modal.tsx` (80 lines)

**Positive Findings:**
- ✅ Uses Tailwind classes (the **only** component that does)
- ✅ Has `bg-black/40 backdrop-blur-sm` overlay
- ✅ Has `animate-in fade-in zoom-in-95` entrance animation class
- ✅ Exports `inputClass`, `selectClass`, `btnPrimary`, `btnSecondary` as reusable class strings
- ✅ Proper `onClose` handlers (click-outside, Escape key, body scroll lock)

**Problems:**

1. **`animate-in fade-in zoom-in-95`** — These classes require `tailwindcss-animate`, which is **NOT in `package.json`**. This means the animation silently fails — the modal just pops in without transition.
2. **No exit animation** — modal disappears instantly when `isOpen` becomes false (conditional render `if (!isOpen) return null`). For smooth UX, we need an exit animation with a state machine or `@headlessui/react`'s `Transition` (already installed).
3. **Hardcoded light-mode colors** — `bg-white`, `border-gray-200`, `text-gray-900` — none of these respond to `.dark` class.
4. **The exported utility classes** (`inputClass`, `btnPrimary`, etc.) are defined here but have no connection to `Input.tsx` or `Button.tsx` — complete duplication.

---

### 2.4 Theming & Dark Mode (`globals.css`, `ThemeProvider.tsx`)

**File:** `frontend/app/globals.css` (339 lines)

#### What's Good

The `globals.css` is actually **well-architected**:

- ✅ Comprehensive CSS custom property system (`:root` + `.dark`)
- ✅ Surface architecture with 7 surface tones
- ✅ Status colors for logistics, financial, and compliance domains
- ✅ Typography scale classes (`.headline-lg`, `.body-md`, `.label-sm`, etc.)
- ✅ Utility classes: `.card`, `.glass`, `.gradient-primary`, `.shadow-ambient`
- ✅ Custom scrollbar styling
- ✅ Proper font declarations (Manrope display + Inter body)

#### What's Broken

1. **Components don't use the CSS variables.** `TopBar.tsx` uses `#ffffff`, `#0f172a`, `#94a3b8` — not `var(--surface-lowest)`, `var(--on-surface)`, `var(--outline)`. This means the entire TopBar is dark-mode-blind.

2. **Dashboard layout hardcodes colors:**
   ```tsx
   // app/(dashboard)/layout.tsx, line 55
   <div style={{ display: "flex", minHeight: "100vh", background: "#f1f5f9" }}>
   ```
   Should be `var(--surface)`.

3. **Loading state hardcodes colors:**
   ```tsx
   // app/(dashboard)/layout.tsx, lines 43-48
   background: "#f8fafc", color: "#64748b"
   ```

4. **`ThemeProvider.tsx` works correctly** — it toggles the `dark` class on `<html>` and persists to localStorage. But it uses a custom context instead of `next-themes`, which would handle:
   - Flash-of-incorrect-theme prevention (script injection)
   - System preference detection
   - Proper SSR hydration

5. **`.dark` selector in `globals.css` is comprehensive** but no component except the Sidebar's nav items even partially references the CSS variables, so the dark mode palette is an unused asset.

---

### 2.5 Additional Component Issues

#### `KPICard.tsx` — Inline Styles, No Hover, No Animations
- Entirely inline-styled. No `hover:shadow-md` lift effect. No `transition-all` for dark mode color changes. No border definition (cards appear to float without grounding).

#### `DataTable.tsx` — Best-in-Class Structure, Minor Issues
- Uses a proper hybrid of Tailwind classes + CSS variables. **This is the gold standard** in the codebase.
- Minor: hover effects on rows use `onMouseEnter`/`onMouseLeave` inline handlers.
- Minor: column menu and row action menus lack `animate-in` transitions.

#### `PageHeader.tsx` — Clean Tailwind + CSS Variables
- Well-implemented. Uses Tailwind layout + CSS variable colors. Near production quality.

#### `loads/new/page.tsx` — Functional But Flat
- Uses a local `fieldStyle` inline object for all inputs instead of the `Input.tsx` component or the `inputClass` from `Modal.tsx`.
- Focus states are missing entirely — inputs have `outline: "none"` and no focus ring.
- The `Field` component is locally defined, duplicating `FormField` from `Modal.tsx`.

---

## 3. The Implementation Blueprint

### Phase 1: Foundation — Install Dependencies & Fix Theming

**Estimated effort: 2 hours**

#### Step 1.1: Install Missing Dependencies

```bash
cd frontend
npm install tailwindcss-animate next-themes
```

- `tailwindcss-animate` — Enables `animate-in`, `fade-in`, `zoom-in-95`, `slide-in-from-*` classes that `Modal.tsx` already references.
- `next-themes` — Production-grade theme provider (replaces our custom `ThemeProvider.tsx`).

#### Step 1.2: Configure `tailwindcss-animate`

Since the project uses Tailwind v4 with `@import "tailwindcss"` in `globals.css`, add the plugin import:

```css
/* globals.css — Add at the top, after the tailwindcss import */
@import "tailwindcss";
@import "tailwindcss-animate";
```

#### Step 1.3: Replace `ThemeProvider.tsx` with `next-themes`

Replace the custom implementation with `next-themes`'s `ThemeProvider`:

```tsx
// components/ThemeProvider.tsx — NEW IMPLEMENTATION
"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { type ReactNode } from "react";

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"           // Applies "dark" class to <html>
      defaultTheme="light"
      storageKey="Safehaul-theme"
      disableTransitionOnChange={false}
    >
      {children}
    </NextThemesProvider>
  );
}
```

Update `app/layout.tsx` to suppress hydration warnings (already has `suppressHydrationWarning`).

#### Step 1.4: Purge Hardcoded Hex Colors from Layout

In `app/(dashboard)/layout.tsx`, replace all hardcoded hex backgrounds with CSS variable references:

```tsx
// BEFORE (line 55):
<div style={{ display: "flex", minHeight: "100vh", background: "#f1f5f9" }}>

// AFTER:
<div style={{ display: "flex", minHeight: "100vh", background: "var(--surface)" }}>
```

```tsx
// BEFORE (lines 43-48, loading state):
background: "#f8fafc", color: "#64748b"

// AFTER:
background: "var(--surface)", color: "var(--on-surface-variant)"
```

---

### Phase 2: TopBar Revitalization — Kill the Dead Buttons

**Estimated effort: 3 hours**

#### Step 2.1: Convert TopBar to Tailwind Classes

Rewrite the `<header>` and all child elements from inline styles to Tailwind utility classes. The entire component should have **zero `style={{}}` objects** for layout, color, or spacing.

Target structure:
```tsx
<header className="h-12 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-5 sticky top-0 z-10 shrink-0 transition-colors">
```

#### Step 2.2: Wire the Dark Mode Toggle

Connect the Sun icon to `next-themes`:

```tsx
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";

// Inside TopBar component:
const { theme, setTheme } = useTheme();

// The button:
<button
  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
  aria-label="Toggle dark mode"
>
  {theme === "dark" ? (
    <Sun className="w-4 h-4" />
  ) : (
    <Moon className="w-4 h-4" />
  )}
</button>
```

#### Step 2.3: Wire Settings Button to `/settings`

```tsx
<button
  onClick={() => router.push("/settings")}
  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
  aria-label="Settings"
>
  <Settings className="w-4 h-4" />
</button>
```

#### Step 2.4: Add Notification Dropdown (or Remove the Fake Red Dot)

Option A (minimal): Remove the static red dot until notification infrastructure exists:
```tsx
<button className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative">
  <Bell className="w-4 h-4" />
  {/* Red dot only when notificationCount > 0 */}
  {notificationCount > 0 && (
    <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-red-500 rounded-full ring-2 ring-white dark:ring-slate-900" />
  )}
</button>
```

Option B (full): Build a notification panel dropdown — scope this for a future phase.

#### Step 2.5: Upgrade Create New Dropdown

Replace `onMouseEnter`/`onMouseLeave` with Tailwind hover classes and add keyboard support:

```tsx
<Link
  href={opt.href}
  className="flex items-center gap-2 px-3 py-2 text-[12.5px] font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-md mx-1 transition-colors focus-visible:outline-none focus-visible:bg-slate-50"
>
  {opt.icon}
  {opt.label}
</Link>
```

---

### Phase 3: Sidebar Migration — Inline Styles → Tailwind

**Estimated effort: 3 hours**

#### Step 3.1: Convert Layout Container

```tsx
// BEFORE (lines 176-182):
style={{
  width: 240, minWidth: 240,
  background: "linear-gradient(180deg, #0f172a 0%, #1e293b 100%)",
  ...
}}

// AFTER:
className="w-60 min-w-60 bg-gradient-to-b from-slate-900 to-slate-800 flex flex-col h-screen sticky top-0 z-30 overflow-hidden border-r border-slate-700"
```

#### Step 3.2: Convert Nav Items to Data-Attribute Driven Styling

Use `data-active` attributes instead of ternary-style objects:

```tsx
<button
  data-active={parentActive}
  className="flex items-center w-full px-2.5 py-1.5 rounded-md text-[13px] font-medium gap-2.5 mb-px border-l-[3px] transition-colors
    text-slate-300 border-transparent hover:bg-white/5
    data-[active=true]:text-blue-400 data-[active=true]:bg-blue-500/12 data-[active=true]:border-blue-500 data-[active=true]:font-semibold"
>
```

This eliminates every `onMouseEnter`/`onMouseLeave` handler.

#### Step 3.3: Merge UnderDevModal into `Modal.tsx`

Delete the inline `UnderDevModal` function and use the shared `Modal.tsx` component with a custom body. This deduplicates overlay logic and ensures consistent animations.

---

### Phase 4: "Tailwind Magic" — Modernizing UI Primitives

**Estimated effort: 4 hours**

#### Step 4.1: Rewrite `Input.tsx`

Delete the inline-styled implementation. Replace with a clean Tailwind component:

**Target Input Classes:**
```
w-full px-3.5 py-2.5
bg-white dark:bg-slate-800
border border-slate-200 dark:border-slate-700
rounded-lg
text-sm text-slate-900 dark:text-slate-100
placeholder:text-slate-400 dark:placeholder:text-slate-500
shadow-sm
transition-all duration-150 ease-in-out
focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20
hover:border-slate-300 dark:hover:border-slate-600
disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-50 dark:disabled:bg-slate-900
```

**Error state variant:**
```
border-red-500 dark:border-red-400
focus:ring-red-500/20 dark:focus:ring-red-400/20
```

#### Step 4.2: Rewrite `Button.tsx`

Replace the `variantStyles` inline record with Tailwind variant classes:

**Primary Button Classes:**
```
inline-flex items-center justify-center gap-2
px-5 py-2.5 rounded-lg
text-sm font-semibold text-white
bg-gradient-to-r from-[var(--primary)] to-[var(--primary-container)]
shadow-md shadow-blue-500/20
transition-all duration-150
hover:shadow-lg hover:shadow-blue-500/30 hover:brightness-110
active:scale-[0.98] active:shadow-sm
focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 focus-visible:ring-offset-2
disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100
```

**Secondary Button Classes:**
```
inline-flex items-center justify-center gap-2
px-5 py-2.5 rounded-lg
text-sm font-medium
text-slate-700 dark:text-slate-300
bg-white dark:bg-slate-800
border border-slate-200 dark:border-slate-700
shadow-sm
transition-all duration-150
hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600
active:scale-[0.98]
focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 focus-visible:ring-offset-2
```

**Tertiary / Ghost Button Classes:**
```
inline-flex items-center justify-center gap-2
px-4 py-2 rounded-lg
text-sm font-medium
text-blue-600 dark:text-blue-400
bg-transparent
transition-all duration-150
hover:bg-blue-50 dark:hover:bg-blue-500/10
active:scale-[0.98]
focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40
```

#### Step 4.3: Upgrade `Modal.tsx`

1. **Install `tailwindcss-animate`** (Phase 1) to make `animate-in` work.
2. **Add dark mode classes:**

```tsx
// Overlay:
className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"

// Content panel:
className={`${widthClass} w-full mx-4 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 animate-in fade-in zoom-in-95 duration-200`}

// Header:
className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800"

// Title:
className="text-lg font-bold text-slate-900 dark:text-slate-100"

// Close button:
className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
```

3. **Add exit animation** using `@headlessui/react`'s `Transition` (already installed):

```tsx
import { Transition } from "@headlessui/react";

<Transition show={isOpen} as={Fragment}>
  <div className="fixed inset-0 z-50">
    <Transition.Child
      as={Fragment}
      enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100"
      leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0"
    >
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
    </Transition.Child>
    <Transition.Child
      as={Fragment}
      enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100"
      leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95"
    >
      {/* Modal content panel */}
    </Transition.Child>
  </div>
</Transition>
```

#### Step 4.4: Unify Exported Utility Classes

Remove the `inputClass`, `selectClass`, `btnPrimary`, `btnSecondary` exports from `Modal.tsx`. Any page that needs an input should import `<Input />` from `Input.tsx`. Any page needing a button should use `<Button variant="primary" />`. No more string-class exports — they always drift from the actual component implementations.

---

### Phase 5: Page-Level Polish

**Estimated effort: 3 hours**

#### Step 5.1: `loads/new/page.tsx` — Use Real Primitives

1. **Delete the local `fieldStyle` object** and local `Field` component.
2. **Import `Input` from `@/components/ui/Input`** and `FormField` from `@/components/ui/Modal`** (or refactor `FormField` into its own file).
3. **Replace all `<input style={fieldStyle} ... />`** with `<Input label="..." ... />`.
4. **Replace the `<select style={fieldStyle} ...>`** with a proper styled select (or create a `Select.tsx` component).

#### Step 5.2: `KPICard.tsx` — Add Depth and Interaction

Convert from inline styles to Tailwind:

```tsx
<div className="card p-6 flex-1 min-w-[180px] relative transition-all duration-200 hover:shadow-md group">
```

Add a subtle hover lift:
```tsx
className="... hover:-translate-y-0.5 hover:shadow-md transition-all duration-200"
```

#### Step 5.3: Dashboard Layout Loading State

Replace the plain "Loading..." text with a skeleton or at minimum a branded spinner:

```tsx
<div className="flex items-center justify-center min-h-screen bg-[var(--surface)]">
  <div className="flex flex-col items-center gap-3">
    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center animate-pulse">
      <Truck className="w-5 h-5 text-white" />
    </div>
    <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">Loading Safehaul...</span>
  </div>
</div>
```

---

## 4. Target Code Snippets

### 4.1 Target `Input.tsx` — The Polished Input

```tsx
"use client";

import { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils"; // simple classnames merge utility

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={cn(
            // Base
            "w-full px-3.5 py-2.5 rounded-lg text-sm",
            "bg-white dark:bg-slate-800",
            "border border-slate-200 dark:border-slate-700",
            "text-slate-900 dark:text-slate-100",
            "placeholder:text-slate-400 dark:placeholder:text-slate-500",
            "shadow-sm",
            // Transitions
            "transition-all duration-150 ease-in-out",
            // Focus
            "focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20",
            "dark:focus:border-blue-400 dark:focus:ring-blue-400/20",
            // Hover
            "hover:border-slate-300 dark:hover:border-slate-600",
            // Disabled
            "disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-50 dark:disabled:bg-slate-900",
            // Error
            error && "border-red-500 dark:border-red-400 focus:ring-red-500/20 dark:focus:ring-red-400/20 focus:border-red-500",
            className,
          )}
          {...props}
        />
        {error && (
          <span className="text-xs font-medium text-red-500 dark:text-red-400 flex items-center gap-1">
            {error}
          </span>
        )}
        {hint && !error && (
          <span className="text-xs text-slate-400 dark:text-slate-500">{hint}</span>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
export default Input;
```

> **Note:** This requires a `cn()` utility. Create `lib/utils.ts`:
> ```ts
> export function cn(...classes: (string | false | null | undefined)[]) {
>   return classes.filter(Boolean).join(" ");
> }
> ```

---

### 4.2 Target Dark Mode Toggle Button

```tsx
"use client";

import { useTheme } from "next-themes";
import { Sun, Moon, Monitor } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="w-8 h-8" />; // Prevent hydration mismatch

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="
        relative p-1.5 rounded-lg
        text-slate-400
        hover:text-slate-600 dark:hover:text-slate-300
        hover:bg-slate-100 dark:hover:bg-slate-800
        transition-all duration-150
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900
        active:scale-95
      "
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
    >
      <Sun
        className={`w-4 h-4 transition-all duration-300 ${
          theme === "dark"
            ? "rotate-0 scale-100"
            : "rotate-90 scale-0 absolute inset-0 m-auto"
        }`}
      />
      <Moon
        className={`w-4 h-4 transition-all duration-300 ${
          theme === "dark"
            ? "-rotate-90 scale-0 absolute inset-0 m-auto"
            : "rotate-0 scale-100"
        }`}
      />
    </button>
  );
}
```

---

### 4.3 Target `Button.tsx` — Multi-Variant Button

```tsx
"use client";

import { ButtonHTMLAttributes, ReactNode, forwardRef } from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

type ButtonVariant = "primary" | "secondary" | "tertiary" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
  loading?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: cn(
    "text-white bg-gradient-to-r from-[var(--primary)] to-[var(--primary-container)]",
    "shadow-md shadow-blue-500/20",
    "hover:shadow-lg hover:shadow-blue-500/30 hover:brightness-110",
  ),
  secondary: cn(
    "text-slate-700 dark:text-slate-300",
    "bg-white dark:bg-slate-800",
    "border border-slate-200 dark:border-slate-700",
    "shadow-sm",
    "hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600",
  ),
  tertiary: cn(
    "text-blue-600 dark:text-blue-400",
    "bg-transparent",
    "hover:bg-blue-50 dark:hover:bg-blue-500/10",
  ),
  danger: cn(
    "text-white bg-red-600",
    "shadow-md shadow-red-500/20",
    "hover:bg-red-700 hover:shadow-lg hover:shadow-red-500/30",
  ),
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs rounded-md gap-1.5",
  md: "px-5 py-2.5 text-sm rounded-lg gap-2",
  lg: "px-6 py-3 text-base rounded-lg gap-2.5",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", icon, loading, children, className, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center font-semibold",
          "transition-all duration-150",
          "active:scale-[0.98] active:shadow-sm",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100",
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        {...props}
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : icon}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
export default Button;
```

---

## 5. Execution Priority & Dependency Order

| Phase | Scope | Depends On | LOE |
|-------|-------|-----------|-----|
| **Phase 1** | Foundation (deps, theming, CSS) | Nothing | 2h |
| **Phase 2** | TopBar rewrite | Phase 1 | 3h |
| **Phase 3** | Sidebar migration | Phase 1 | 3h |
| **Phase 4** | UI Primitives (Input, Button, Modal) | Phase 1 | 4h |
| **Phase 5** | Page-level polish (loads/new, KPICard, loading) | Phase 4 | 3h |

**Total estimated effort: ~15 hours of focused engineering work.**

---

## 6. Definition of Done

A phase is "done" when:

- [ ] Zero `style={{}}` objects remain in the modified files (all styling via Tailwind classes)
- [ ] Zero `onMouseEnter`/`onMouseLeave` inline hover handlers remain
- [ ] Dark mode toggle works end-to-end (button → `next-themes` → `.dark` class → CSS variables → visual change)
- [ ] All interactive elements have `focus-visible:ring` outlines
- [ ] All buttons have `active:scale-[0.98]` press feedback
- [ ] Modal entrance/exit animations are smooth
- [ ] `globals.css` design tokens are consumed by components (not hardcoded hex)
- [ ] The app looks premium in both light and dark mode
- [ ] No accessibility regressions (focus management, ARIA labels, color contrast)
