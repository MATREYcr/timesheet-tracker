# Spec 00 — Overview

The master spec. Domain model, locked decisions, data model, and build order.
Per-area detail lives in `01`–`03`.

---

## 1. Goal

A timesheet tracker for hourly employees with three capabilities:

1. Manage a roster of hourly employees.
2. Log time entries (date + hours) per employee.
3. Show a weekly summary (regular vs overtime, pay) and approve/reject each
   employee's week; approved weeks lock their entries.

Deliverables: `apps/api`, `apps/web`, `packages/shared`, with tests and a README
that works from a fresh clone.

---

## 2. Locked decisions

| Decision        | Choice                                               | Why                                               |
| --------------- | ---------------------------------------------------- | ------------------------------------------------- |
| Monorepo        | Nx + pnpm                                            | Matches the target stack; pnpm required           |
| Client          | Web — Next.js 15 (App Router)                        | Strongest platform; mirrors their Goat web app    |
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

Known limitation (by design, for scope): `hourlyRate` is not snapshotted per approved
week, so editing an employee's rate also changes the displayed pay of their past
approved weeks. In production an approval would freeze the rate (or store computed
pay). Noted here as a deliberate trade-off for the WRITEUP.

---

## 3. Domain model

### Employee

- `id`, `firstName`, `lastName`, `hourlyRate` (numeric), `deactivatedAt`
  (timestamp | null), `createdAt`, `updatedAt`.
- `status` is derived: `active` when `deactivatedAt` is null, else `inactive`.
- Soft delete: deactivating sets `deactivatedAt`; the row is never removed.

### TimeEntry

- `id`, `employeeId`, `date` (date-only), `hours` (decimal 0.25–24, in 0.25
  increments), `createdAt`, `updatedAt`.
- Belongs to one employee. Cannot be created/edited/deleted for inactive employees,
  on future dates, or within an already-approved week.

### WeeklyApproval

- `id`, `employeeId`, `weekStart` (Monday, date-only), `status`
  (`pending` | `approved` | `rejected`), `createdAt`, `updatedAt`.
- Unique on `(employeeId, weekStart)`.
- Absence of a row means the week is implicitly `pending`.
- **Only `approved`** locks all time entries whose date falls in that week.
  `pending`/`rejected` stay editable; re-approving after a reject is allowed.

### Computed: WeeklySummary (not stored)

- The **API** returns the raw aggregate per (employee, week): `totalHours`,
  `hourlyRate`, and the `status` from WeeklyApproval. Rows are returned only for
  employees with ≥1 time entry in that week (active or inactive).
- The **web client** derives `regularHours`, `overtimeHours`, `regularPay`,
  `overtimePay`, `totalPay` by calling `calculateWeeklyPay` from `packages/shared`.

---

## 4. The core calculation (lives in `packages/shared`)

```
regularHours  = min(totalHours, 40)
overtimeHours = max(totalHours - 40, 0)
regularPay    = round2(regularHours * rate)
overtimePay   = round2(overtimeHours * rate * 1.5)
totalPay      = round2(regularPay + overtimePay)
```

`round2` = half-up to 2 decimals. Edge cases to test: exactly 40h, 40.25h,
decimal hours summing across days, 0h, very large hours. See `01-shared-package.md`.

---

## 5. API surface (detail in `02-api.md`)

```
GET    /employees?includeInactive=bool
POST   /employees
PATCH  /employees/:id
POST   /employees/:id/deactivate
POST   /employees/:id/reactivate

GET    /employees/:id/time-entries?weekStart=YYYY-MM-DD
POST   /time-entries
PATCH  /time-entries/:id
DELETE /time-entries/:id

GET    /weekly-summary?weekStart=YYYY-MM-DD          # raw aggregate per employee (client computes pay)
POST   /weekly-summary/approve                        # { employeeId, weekStart }
POST   /weekly-summary/reject                         # { employeeId, weekStart }
```

All errors use the shared envelope `{ error: { code, message } }` with en/es
messages by `Accept-Language`.

---

## 6. Screens (detail in `03-web.md`)

1. **Employees** — list (+ show inactive toggle), create/edit form, deactivate/reactivate.
2. **Time entries** — per selected employee, list + log/edit/delete form.
3. **Weekly summary** — week picker, per-employee regular/overtime/pay, approve/reject,
   locked state when approved.

---

## 7. Build order

1. **Scaffold** — Nx workspace, pnpm, docker-compose (Postgres), three projects.
2. **`packages/shared`** — types, Zod schemas, pay calc + unit tests. (Highest value.)
3. **`apps/api`** — Drizzle schema + migrations, routes, error envelope, i18n,
   approval/locking + integration test.
4. **`apps/web`** — Next.js, TanStack Query, shadcn, three screens, i18n,
   optimistic updates + one frontend test.
5. **Docs** — README (fresh-clone setup), AI_WORKFLOW.md. (WRITEUP.md by human.)
