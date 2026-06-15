# Web architecture — Option A vs Option B

> **Decision: Option A (`features/` folders)** — chosen for a domain layer decoupled
> from routing and consistency with the API's modular `modules/`. UI: decent shadcn
> defaults first, visual polish pass at the end.

Decision aid for structuring `apps/web` (Next.js 16 App Router). Both options share
the same principles: thin routes, a data layer isolated in `lib/api.ts` (the single
place that does `fetch`), TanStack Query hooks for server state, shadcn/ui for UI,
and consuming `@timesheet/shared` (types, Zod, `calculateWeeklyPay`). They differ
**only in where each feature's components and hooks live**.

---

## Option A — Feature folders (`features/`)

Domain code lives in a top-level `features/` directory, decoupled from routing.

```
apps/web/src/
├── app/                          # routing only
│   ├── layout.tsx
│   ├── employees/page.tsx        # renders <EmployeesScreen/>
│   ├── time-entries/page.tsx
│   └── weekly-summary/page.tsx
├── features/
│   ├── employees/
│   │   ├── components/           # EmployeeTable, EmployeeFormDialog, StatusBadge
│   │   └── hooks/                # use-employees.ts (TanStack Query)
│   ├── time-entries/
│   │   ├── components/
│   │   └── hooks/
│   └── weekly-summary/
│       ├── components/           # SummaryRow (uses calculateWeeklyPay), WeekPicker
│       └── hooks/
├── components/
│   ├── ui/                       # shadcn
│   └── layout/                   # AppNav, LocaleSwitch
├── lib/                          # api.ts, query.ts, utils.ts
└── i18n/                         # en.ts, es.ts, config.ts
```

**Pros:** domain decoupled from routing; easy to reuse a feature across many routes;
mirrors the API's modular `modules/` (consistent mental model across the monorepo).
**Cons:** slightly less idiomatic for Next App Router; feature lives "away" from the
route that uses it.

---

## Option B — Colocation in `app/` (Next-idiomatic)

Each feature's components and hooks live **next to its route**, in private folders
(`_components`, `_hooks`) that Next ignores as routes.

```
apps/web/src/
├── app/
│   ├── layout.tsx
│   ├── providers.tsx             # QueryClientProvider + i18n
│   ├── employees/
│   │   ├── page.tsx              # thin
│   │   ├── _components/          # employee-table.tsx, employee-form-dialog.tsx, status-badge.tsx
│   │   └── _hooks/               # use-employees.ts
│   ├── time-entries/
│   │   ├── page.tsx
│   │   ├── _components/          # employee-select.tsx, time-entry-list.tsx, time-entry-form.tsx
│   │   └── _hooks/               # use-time-entries.ts
│   └── weekly-summary/
│       ├── page.tsx
│       ├── _components/          # week-picker.tsx, summary-row.tsx (uses calculateWeeklyPay)
│       └── _hooks/               # use-weekly-summary.ts
├── components/
│   ├── ui/                       # shadcn
│   └── layout/                   # app-nav.tsx, locale-switch.tsx
├── lib/                          # api.ts, query.ts, utils.ts
└── i18n/                         # en.ts, es.ts, config.ts
```

**Pros:** most idiomatic for Next App Router; code sits next to the route that uses
it; uses the official `_folder` private convention; perfect when features map ~1:1
to routes (our case). **Cons:** feature coupled to its route location; cross-route
reuse is less natural; diverges from the API's `modules/` naming.

---

## Side-by-side

| Aspect                        | A — `features/`                                                    | B — colocation in `app/`         |
| ----------------------------- | ------------------------------------------------------------------ | -------------------------------- |
| Where feature code lives      | Separate `features/` dir                                           | Next to the route (`_*` folders) |
| Idiomatic for Next App Router | Less                                                               | **More**                         |
| Decoupled from routing        | **Yes**                                                            | No (tied to route path)          |
| Cross-route reuse             | **Easier**                                                         | Harder (but not needed here)     |
| Consistency with the API      | **High** (like `modules/`)                                         | Lower                            |
| Fit for 3 routes, 1:1 mapping | Good                                                               | **Great**                        |
| Shared everywhere             | `lib/api.ts`, `lib/query.ts`, `@timesheet/shared`, `components/ui` |

---

## Recommendation

There is no single "most professional" structure — both are recognized, clean
patterns, and the real differentiator is _consistency and fit_, not the folder
names. For **this app** — three screens that map almost one-to-one to routes, with no
expected cross-route reuse — **Option B (colocation)** reads as the more idiomatic,
Next-native choice: a reviewer familiar with the App Router immediately recognizes
the `_components`/`_hooks` convention, and keeping a feature's UI and data hooks right
beside the route that renders them minimizes indirection. **Option A** is equally
defensible and has the edge if you value a domain layer fully decoupled from routing
or want the web to mirror the API's modular `modules/` layout exactly. Either way the
important architectural decisions are the same: routes stay thin, all HTTP is funneled
through `lib/api.ts` (a clean seam that could later be swapped for a generated SDK),
server state goes through TanStack Query hooks, and UI is composed from shadcn/ui
while business types, validation and the pay calculation come from `@timesheet/shared`.
