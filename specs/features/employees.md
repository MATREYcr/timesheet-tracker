# Feature — Employees

Keep a roster of hourly employees; deactivating is a soft delete that preserves history.

## Context / Why
Every other capability hangs off an employee (you log time *for* an employee, you approve *their*
week). Hourly employees come and go, but their past timesheets must stay auditable for payroll —
so removing someone can never erase their history.

## Scope
- **In:** list (with a show-inactive toggle), create, edit (name/rate), deactivate, reactivate.
- **Out:** hard delete; bulk import; per-field history/audit of rate changes.

## Decisions
| Decision | Choice | Why | Rejected |
| --- | --- | --- | --- |
| Removal | soft delete (`deactivatedAt` timestamp) | history must survive for payroll | row deletion (loses past entries) |
| `status` | derived from `deactivatedAt`, not stored | one source of truth, can't desync | a separate stored status column |
| Default list | hides inactive unless `includeInactive` | keeps the working roster clean | always showing everyone |

## Domain rules & invariants
- `status` is `active` when `deactivatedAt` is null, else `inactive` — derived, never stored.
- Inactive employees are hidden from default lists but their historical time entries and weeks
  remain visible (see [`time-entries`](time-entries.md), [`weekly-summary`](weekly-summary.md)).
- No time entries may be created/edited for an inactive employee (enforced in
  [`time-entries`](time-entries.md)).

## Contracts
- **Type:** `Employee` — `id`, `firstName`, `lastName`, `hourlyRate` (numeric), `deactivatedAt`
  (timestamp | null), `createdAt`, `updatedAt`.
- **Validation (`shared`):** create/update employee schemas (first/last name, `hourlyRate`
  numeric).
- **Table:** `employees` — `id` (uuid pk), `first_name`, `last_name`, `hourly_rate` (numeric),
  `deactivated_at` (timestamp null), `created_at`, `updated_at`.
- **Endpoints:**
  - `GET /employees?includeInactive=&page=&pageSize=&employeeId=&search=` — inactive hidden unless
    the flag is set; paginated; optional `employeeId` filter; optional `search` (case-insensitive
    `ilike` over `firstName || ' ' || lastName`) for the combobox.
  - `POST /employees` — validates via shared schema
  - `PATCH /employees/:id` — edit name/rate
  - `POST /employees/:id/deactivate` — sets `deactivatedAt`
  - `POST /employees/:id/reactivate` — clears `deactivatedAt`
- **Error codes:** `VALIDATION_ERROR` (400), `NOT_FOUND` (404).

## Edge cases
- Reactivating an employee → clears `deactivatedAt`, returns to default lists.
- `search` matches across first + last name as one string ("ana ga" → "Ana García").
- An inactive employee still appears in historical weekly summaries (not in the default roster).
- Editing `hourlyRate` is allowed any time (see Known limitations for the payroll caveat).

## Known limitations
- Editing `hourlyRate` retroactively changes the displayed pay of past approved weeks — the rate
  is not snapshotted at approval. Deliberate, for scope; owned by
  [`weekly-summary`](weekly-summary.md) and noted in [`overview`](../overview.md).

## Verification / Done when
- Inactive employees are hidden by default and shown with `includeInactive=true`.
- Create/edit validate via the shared schema; invalid input and missing ids return the localized
  envelope (`VALIDATION_ERROR` / `NOT_FOUND`).
- Deactivate/reactivate flip `deactivatedAt` without deleting the row or its entries.
