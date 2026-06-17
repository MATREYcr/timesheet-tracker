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

UI: decent shadcn defaults first (functional), visual polish pass at the end.

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

## UX requirements

- Loading and error states on every async screen (skeletons/spinners + error
  messages from the envelope).
- **Optimistic updates** (bonus) on approve/reject and on quick mutations: update
  the cache immediately, roll back on error.
- **i18n** (bonus): all user-facing strings in en/es translation files, with a
  locale switch; the `Accept-Language` header follows the active locale.

## Frontend test (bonus)

One meaningful test — e.g. a component test asserting the weekly summary row renders
the correct regular/overtime/pay split for a given set of entries (driving the
shared calculation), or a hook test for an optimistic mutation.
