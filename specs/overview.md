# Overview

The master index. Domain model, locked decisions, and build order. Cross-cutting concerns live
in `foundations/`; each capability has a self-contained spec in `features/`.

> Visual companions in [`docs/diagrams/`](../docs/diagrams/): architecture, data model (ER), and
> the approval flow.

---

## 1. Goal

A timesheet tracker for hourly employees with three capabilities:

1. Manage a roster of hourly employees.
2. Log time entries (date + hours) per employee.
3. Show a weekly summary (regular vs overtime, pay) and approve/reject each employee's week;
   approved weeks lock their entries.

Deliverables: `apps/api`, `apps/web`, `packages/shared`, with tests and a README that works
from a fresh clone.

---

## 2. Locked decisions

| Decision        | Choice                                               | Why                                               |
| --------------- | ---------------------------------------------------- | ------------------------------------------------- |
| Monorepo        | Nx + pnpm                                            | Matches the target stack; pnpm required           |
| Client          | Web — Next.js 16 (App Router)                        | Strongest platform; mirrors their Goat web app    |
| Database        | PostgreSQL via docker-compose                        | Reproducible infra; matches their real stack      |
| API framework   | Hono                                                 | Preferred by the brief                            |
| ORM             | Drizzle                                              | Preferred by the brief                            |
| UI              | shadcn/ui + Tailwind                                 | Fast, accessible, professional                    |
| Week start      | Monday                                               | Matches the sketch (Jun 08 – Jun 14)              |
| Dates           | Date-only strings (`YYYY-MM-DD`)                     | Avoids timezone bugs in payroll                   |
| Money rounding  | Half-up, 2 decimals at boundary                      | Deterministic, payroll-safe                       |
| Hours input     | 0.25–24, in 0.25 increments                          | The 0.25 minimum implies quarter-hour granularity |
| Pay computed by | Web client (via shared calc)                         | Satisfies "client must consume the calculation"   |
| Locking         | Only `approved` locks; `rejected` editable           | Lets a rejected week be fixed & re-submitted      |
| Bonus scope     | UI i18n (en/es), optimistic updates, 1 frontend test | Balanced range without losing depth               |

Out of scope: authentication, multi-tenancy, real tax logic, payments.

Known limitation (by design, for scope): `hourlyRate` is not snapshotted per approved week, so
editing an employee's rate also changes the displayed pay of their past approved weeks. In
production an approval would freeze the rate (or store computed pay). Noted here as a deliberate
trade-off for the WRITEUP. Owned by [`features/weekly-summary`](features/weekly-summary.md).

---

## 3. Domain model

The full contracts live in each feature spec; this is the index.

### Employee — [`features/employees`](features/employees.md)
- `id`, `firstName`, `lastName`, `hourlyRate` (numeric), `deactivatedAt` (timestamp | null),
  `createdAt`, `updatedAt`.
- `status` is derived: `active` when `deactivatedAt` is null, else `inactive`.
- Soft delete: deactivating sets `deactivatedAt`; the row is never removed.

### TimeEntry — [`features/time-entries`](features/time-entries.md)
- `id`, `employeeId`, `date` (date-only), `hours` (decimal 0.25–24, in 0.25 increments),
  `createdAt`, `updatedAt`.
- Belongs to one employee. Cannot be created/edited/deleted for inactive employees, on future
  dates, or within an already-approved week.

### WeeklyApproval — [`features/approval-flow`](features/approval-flow.md)
- `id`, `employeeId`, `weekStart` (Monday, date-only), `status`
  (`pending` | `approved` | `rejected`), `createdAt`, `updatedAt`.
- Unique on `(employeeId, weekStart)`. Absence of a row means implicitly `pending`.
- **Only `approved`** locks all time entries whose date falls in that week. `pending`/`rejected`
  stay editable; re-approving after a reject is allowed.

### Computed: WeeklySummary (not stored) — [`features/weekly-summary`](features/weekly-summary.md)
- The **API** returns the raw aggregate per (employee, week): `totalHours`, `hourlyRate`, and the
  `status` from WeeklyApproval. Rows are returned only for employees with ≥1 time entry in that
  week (active or inactive).
- The **web client** derives `regularHours`, `overtimeHours`, `regularPay`, `overtimePay`,
  `totalPay` by calling `calculateWeeklyPay` from `packages/shared`.

---

## 4. The core calculation

Lives in `packages/shared`; the contract and unit tests are owned by
[`features/weekly-summary`](features/weekly-summary.md):

```
regularHours  = min(totalHours, 40)
overtimeHours = max(totalHours - 40, 0)
regularPay    = round2(regularHours * rate)
overtimePay   = round2(overtimeHours * rate * 1.5)
totalPay      = round2(regularPay + overtimePay)
```

`round2` = half-up to 2 decimals.

---

## 5. API surface (index)

Detailed contracts live in each feature spec; conventions in
[`foundations/api-platform`](foundations/api-platform.md).

```
GET/POST/PATCH  /employees …                  → features/employees
POST            /employees/:id/(de|re)activate → features/employees
GET/POST/PATCH/DELETE  /time-entries …         → features/time-entries
GET             /weekly-summary …              → features/weekly-summary
GET/POST        /weekly-summary/approval|approve|reject → features/approval-flow
GET             /dashboard …                   → features/dashboard
```

All errors use the shared envelope `{ error: { code, message } }` with en/es messages — see
[`foundations/error-envelope-i18n`](foundations/error-envelope-i18n.md).

---

## 6. Screens (index)

UI conventions (structure, data layer, design system) in
[`foundations/web-platform`](foundations/web-platform.md).

1. **Employees** — [`features/employees`](features/employees.md)
2. **Time entries** — [`features/time-entries`](features/time-entries.md)
3. **Weekly summary** (core) — [`features/weekly-summary`](features/weekly-summary.md)
4. **Dashboard** — [`features/dashboard`](features/dashboard.md) (added after the core screens)

---

## 7. Build order

1. **Scaffold** — Nx workspace, pnpm, docker-compose (Postgres), three projects.
2. **`packages/shared`** — types, Zod schemas, pay calc + unit tests. (Highest value.)
3. **`apps/api`** — Drizzle schema + migrations, routes, error envelope, i18n, approval/locking
   + integration test.
4. **`apps/web`** — Next.js, TanStack Query, shadcn, three screens, i18n, optimistic updates +
   one frontend test.
5. **Docs** — README (fresh-clone setup), AI_WORKFLOW.md. (WRITEUP.md by human.)

The granular execution log (phases, subphases, "Done when", and the real deviations along the
way) lives in [`PLAN.md`](PLAN.md).
