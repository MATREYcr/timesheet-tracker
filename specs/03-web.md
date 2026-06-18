# Spec 03 — `apps/web`

Next.js 16 (App Router) client. Consumes `packages/shared` for types, Zod schemas,
and the pay calculation. Server state via TanStack Query; UI via shadcn/ui + Tailwind.

---

## Structure — feature folders (Option A; see `web-architecture-options.md`)

Routes stay thin; each domain owns its components, hooks, and API calls under
`features/`. The shared transport lives in `lib/http.ts`.

```
apps/web/src/
├── app/                    # routing only (thin pages)
│   ├── layout.tsx          # providers (TanStack Query, i18n)
│   ├── providers.tsx
│   ├── employees/page.tsx
│   ├── time-entries/page.tsx
│   └── weekly-summary/page.tsx
├── features/
│   ├── employees/          api.ts + components/ + hooks/
│   ├── time-entries/       api.ts + components/ + hooks/
│   └── weekly-summary/     api.ts + components/ (uses calculateWeeklyPay) + hooks/
├── components/
│   ├── ui/                 shadcn components
│   └── layout/             nav, locale switch
├── lib/
│   ├── http.ts             axios instance + interceptors (transport)
│   ├── query.ts            TanStack Query client
│   └── utils.ts            cn (shadcn)
└── i18n/                   en/es translations + locale switch
```

UI: functional shadcn defaults first, then a hi-fi design pass — see
**Visual design (design system)** below (driven by `docs/design/`).

## Data layer

- **Transport (`lib/http.ts`)**: a single axios instance. A request interceptor
  injects `Accept-Language` (kept in sync via `setApiLocale`); a response interceptor
  turns the API error envelope into a typed `ApiError` (`code` + `status`).
- **Per-feature API (`features/<x>/api.ts`)**: typed endpoint functions using the
  `http` instance (e.g. `employeesApi.list/create/update/...`).
- **TanStack Query hooks** per feature wrap those calls (`useEmployees`,
  `useCreateEmployee`, `useApproveWeek`, ...). One seam → swappable for a generated SDK.
- Forms use `react-hook-form` + `@hookform/resolvers/zod` with the **shared** Zod
  schemas — no schema duplication.

## Screens

### Screen 1 — Employees

- List of employees; "Show inactive" toggle (drives `includeInactive`).
- Row: name, `$rate/h`, status badge, Edit + Deactivate/Reactivate actions.
- Create/edit via dialog (shadcn `Dialog`) with validated form.

### Screen 2 — Time entries

- Employee selector (shadcn `Select`) and a week picker (prev/next, Monday–Sunday
  range label) — the screen is **week-scoped** because locking is per week.
- List of that employee's entries for the selected week (date + hours) with
  Edit/Delete.
- Log-time form (date within the week + hours), validated via shared schemas.
- Lock state comes from `GET /weekly-summary/approval?employeeId=&weekStart=`.
  When the week is `approved`, entries render read-only and the form is hidden;
  the form is also disabled for inactive employees (no entries allowed).
- Reuses the same `WeekPicker` as Screen 3.

### Screen 3 — Weekly summary (core)

- Week picker with prev/next around `weekStart` (Monday–Sunday range label).
- Fetches the **raw aggregate** (`totalHours`, `hourlyRate`, `status`) per employee
  from the API, then calls `calculateWeeklyPay(totalHours, rate)` from `shared` to
  render regular hours, overtime hours, and the pay breakdown
  (`regular + overtime = total`). The client computes the pay — not the API.
- Monetary values formatted with `Intl.NumberFormat` for the active locale
  (en → `$1,085.63`, es → `$1.085,63`).
- Approve / Reject per row, with **optimistic updates** (flip the row status in the
  cache immediately, roll back on error). The status badge reflects the state;
  approved rows offer **Reopen** (reject) so an approval can be undone — consistent
  with the domain rule that rejected weeks reopen for editing.

## Visual design (design system)

The functional UI ships first; this pass elevates it to a hi-fi design. **Source of
truth: `docs/design/`** — a Claude Design handoff (`README.md` with exact tokens,
`prototype.dc.html` reference, `screenshots/`) plus `DESIGN_BRIEF.md`. Recreate it
with our shadcn primitives — never copy the `.dc.html` (it's a design-tool artifact).

- **Theme tokens (`app/global.css`)**: map the handoff tokens onto shadcn's semantic
  variables for **light + dark**. Accent = **purple** (Monedín brand: `#7c3aed`
  light / `#9d6bff` dark); neutral zinc palette; `destructive` red. Plus extra
  semantic tokens consumed by the domain UI: `overtime` (amber), `success` (approved),
  `destructive-bg/border` (rejected), `subtle` (tertiary text), `primary-soft`
  (active badge). Exposed via `@theme` so Tailwind utilities resolve them.
- **Dark mode**: `next-themes` (`.dark` class) with a header theme toggle. No
  hardcoded colors — semantic tokens only.
- **Typography**: Geist (already wired). Scale per handoff — `h1` 24/700, section
  subtitle 14, table headers 11px uppercase tracking in `subtle`, cells 14,
  total pay 15/700, badges 12/600. Tabular figures for money/hours.
- **Radii**: cards ~12px, controls (button/input/select) 8px, badges full, dialog 14.
- **Global shell**: sticky header (logo + app title, a **segmented** nav with an
  active pill, EN/ES toggle, theme toggle); centered `max-w-5xl` container; each
  screen = heading + subtitle + toolbar + a **card-wrapped table**.
- **Status badges**: employee `Active` (primary-soft pill + dot) / `Inactive` (muted);
  approval `Pending` (muted) / `Approved` (success) / `Rejected` (destructive).
- **Overtime** renders as an **amber pill** when > 0 — the headline insight.
- Animations kept subtle (dialog/toast/skeleton shimmer); honor reduced-motion.

## UX requirements

- Loading and error states on every async screen (skeletons/spinners + error
  messages from the envelope).
- **Optimistic updates** (bonus) on approve/reject and on quick mutations: update
  the cache immediately, roll back on error.
- **i18n** (bonus): all user-facing strings in en/es translation files, with a
  locale switch; the `Accept-Language` header follows the active locale.
- **Pagination**: server-side on **Employees** and **Weekly summary** (the lists
  that grow) — `page`/`pageSize` query params, the `Paginated<T>` envelope, a
  shadcn `Pagination` control in the card footer, and TanStack Query
  `placeholderData: keepPreviousData` so the table doesn't flash between pages.
  **Time entries** is not paginated (bounded to one employee/week).

## Frontend test (bonus)

One meaningful test — e.g. a component test asserting the weekly summary row renders
the correct regular/overtime/pay split for a given set of entries (driving the
shared calculation), or a hook test for an optimistic mutation.
