# Foundation — Web platform (`apps/web`)

Next.js 16 (App Router) conventions shared by every screen. Consumes `packages/shared` for types,
Zod schemas, and the pay calculation. Server state via TanStack Query; UI via shadcn/ui +
Tailwind.

---

## Structure — feature folders

Routes stay thin; each domain owns its components, hooks, and API calls under `features/`. The
shared transport lives in `lib/http.ts`.

```
apps/web/src/
├── app/                    # routing only (thin pages)
│   ├── layout.tsx          # providers (TanStack Query, i18n)
│   ├── providers.tsx
│   └── [locale]/…          # employees / time-entries / weekly-summary / dashboard pages
├── features/
│   ├── employees/          api.ts + components/ + hooks/
│   ├── time-entries/       api.ts + components/ + hooks/
│   ├── weekly-summary/     api.ts + components/ (uses calculateWeeklyPay) + hooks/
│   └── dashboard/          api.ts + components/ + hooks/
├── components/
│   ├── ui/                 shadcn components
│   └── layout/             nav, locale switch
├── lib/
│   ├── http.ts             axios instance + interceptors (transport)
│   ├── query.ts            TanStack Query client
│   └── utils.ts            cn (shadcn)
└── i18n/                   en/es messages + locale routing
```

## Data layer

- **Transport (`lib/http.ts`)**: a single axios instance. A request interceptor injects
  `Accept-Language` by reading `document.documentElement.lang` (set server-side by
  `[locale]/layout.tsx` on the `<html>` element), so API errors come back in the active UI locale;
  a response interceptor turns the API error envelope into a typed `ApiError` (`code` + `status`).
  See [`error-envelope-i18n`](error-envelope-i18n.md).
- **Per-feature API (`features/<x>/api.ts`)**: typed endpoint functions using the `http` instance
  (e.g. `employeesApi.list/create/update/...`).
- **TanStack Query hooks** per feature wrap those calls (`useEmployees`, `useCreateEmployee`,
  `useApproveWeek`, ...). One seam → swappable for a generated SDK.
- Forms use `react-hook-form` + the **shared** Zod schemas (Standard Schema resolver) — no schema
  duplication.

## Visual design (design system)

Source of truth: `docs/design/` — a Claude Design handoff (exact tokens, prototype reference,
screenshots) plus `DESIGN_BRIEF.md`. Recreate it with shadcn primitives — never copy the `.dc.html`
(it's a design-tool artifact).

- **Theme tokens (`app/global.css`)**: map the handoff tokens onto shadcn's semantic variables for
  **light + dark**. Accent = **purple**; neutral zinc palette; `destructive` red. Plus extra
  semantic tokens consumed by the domain UI: `overtime` (amber), `success` (approved),
  `destructive-bg/border` (rejected), `subtle` (tertiary text), `primary-soft` (active badge).
- **Dark mode**: `next-themes` (`.dark` class) with a header theme toggle. No hardcoded colors —
  semantic tokens only.
- **Typography**: Geist. Scale per handoff (`h1` 24/700, table headers 11px uppercase in `subtle`,
  cells 14, total pay 15/700, badges 12/600). Tabular figures for money/hours.
- **Radii**: cards ~12px, controls 8px, badges full, dialog 14.
- **Global shell**: header/sidebar (logo + app title, segmented nav with an active pill, EN/ES
  toggle, theme toggle); centered container; each screen = heading + subtitle + toolbar + a
  card-wrapped table.
- **Status badges**: employee `Active` (primary-soft pill + dot) / `Inactive` (muted); approval
  `Pending` (muted) / `Approved` (success) / `Rejected` (destructive). **Overtime** renders as an
  amber pill when > 0 — the headline insight.
- Animations kept subtle (dialog/toast/skeleton shimmer); honor reduced-motion.

## UX conventions (cross-cutting)

- **Loading / error / empty** on every async screen: skeletons/spinners + error messages from the
  envelope (Alert + retry) + empty state (shadcn `Empty`).
- **Optimistic updates** (bonus) on approve/reject and quick mutations: update the cache
  immediately, roll back on error.
- **i18n** (bonus): all user-facing strings in en/es message files, with a locale switch; the
  `Accept-Language` header follows the active locale.
- **Pagination**: server-side on **Employees** and **Weekly summary** — `page`/`pageSize`, the
  `Paginated<T>` envelope, a shadcn `Pagination` control in the card footer, and TanStack Query
  `placeholderData: keepPreviousData` so the table doesn't flash between pages.
- **Employee filter**: a reusable searchable **combobox** (shadcn Popover + Command). Time entries
  uses it to pick the employee; Employees and Weekly summary use it (with an "All employees"
  option) to filter the table **server-side** via the `employeeId` param (resets to page 1).

## End-to-end (E2E)

Bonus: a Playwright suite in `apps/e2e` drives the real stack (web → API → DB) across the three
screens.

- **Page Object Model** (`src/pages/`) — each screen exposes intent-level methods; specs never
  touch selectors directly.
- **Role-based selectors** (`getByRole`/`getByLabel`) + Playwright auto-waiting — no CSS, no
  hardcoded sleeps.
- **API-seeded fixtures** (`src/fixtures/`) create employees/entries via the API and tear them
  down after each test (reject week → delete entries → deactivate), so runs are isolated and
  repeatable against the running app's DB.
- Past weeks (`lastWeekStart()`) satisfy the no-future-date rule; serial (`workers: 1`) since the
  suite shares one DB.
- Specs: employees, time-entries, and the weekly-summary **approve → entries-locked** flow.
- Runs against the app stack up; not part of `pnpm test` (separate `apps/e2e` Playwright project).

## Notes / deviations

- i18n is built on **next-intl** with `[locale]` URL routing; the app renders i18n server-side
  (SSR via a locale cookie) rather than purely static.
- The hi-fi design pass + collapsible sidebar shell landed **after** the functional screens
  (see PLAN 3.10–3.12), driven by the `docs/design/` handoff. The functional UI shipped first.
