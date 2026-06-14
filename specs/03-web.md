# Spec 03 — `apps/web`

Next.js 15 (App Router) client. Consumes `packages/shared` for types, Zod schemas,
and the pay calculation. Server state via TanStack Query; UI via shadcn/ui + Tailwind.

---

## Structure

```
apps/web/src/
├── app/
│   ├── employees/          Screen 1
│   ├── time-entries/       Screen 2
│   └── weekly-summary/     Screen 3 (core)
├── lib/
│   ├── api.ts              typed fetch client (sends Accept-Language)
│   └── query.ts            TanStack Query client/provider
├── components/             shared UI (shadcn-based)
└── i18n/                   en/es translations + locale switch
```

## Data layer

- A small typed `api` client wraps `fetch`, sets `Accept-Language` from the current
  locale, and parses the error envelope into a typed error.
- TanStack Query hooks per resource: `useEmployees`, `useTimeEntries`,
  `useWeeklySummary`, plus mutations (`useCreateEmployee`, `useApproveWeek`, ...).
- Forms use `react-hook-form` + `@hookform/resolvers/zod` with the **shared** Zod
  schemas — no schema duplication.

## Screens

### Screen 1 — Employees
- List of employees; "Show inactive" toggle (drives `includeInactive`).
- Row: name, `$rate/h`, status badge, Edit + Deactivate/Reactivate actions.
- Create/edit via dialog (shadcn `Dialog`) with validated form.

### Screen 2 — Time entries
- Employee selector (shadcn `Select`).
- List of that employee's entries (date + hours) with Edit/Delete.
- Log-time form (date + hours), validated. Entries in approved weeks render as
  read-only / disabled.

### Screen 3 — Weekly summary (core)
- Week picker with prev/next around `weekStart` (Monday–Sunday range label).
- Fetches the **raw aggregate** (`totalHours`, `hourlyRate`, `status`) per employee
  from the API, then calls `calculateWeeklyPay(totalHours, rate)` from `shared` to
  render regular hours, overtime hours, and the pay breakdown
  (`regular + overtime = total`). The client computes the pay — not the API.
- Monetary values formatted with `Intl.NumberFormat` for the active locale
  (en → `$1,085.63`, es → `$1.085,63`).
- Pending/rejected rows show Approve / Reject; approved rows show a locked indicator.

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
