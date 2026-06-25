# Feature — Time entries

Log the hours an employee worked on a given day, with payroll-safe validation.

## Context / Why
The timesheet is the raw input to payroll: hours worked per day. Entry has to be forgiving enough
for daily logging (quarter-hour granularity) but strict enough that bad data never reaches a pay
calculation — no future dates, no impossible hours, nothing for someone who's been deactivated,
and nothing inside a week that's already been signed off.

## Scope
- **In:** list an employee's entries for a week, create, edit, delete; quarter-hour validation.
- **Out:** bulk entry; importing from external clocks; partial-day time ranges (we store hours,
  not start/end times).

## Decisions
| Decision | Choice | Why | Rejected |
| --- | --- | --- | --- |
| Granularity | hours as decimal, 0.25 steps | quarter-hour is the payroll norm; `7.5` ok, `7.3` not | free-form minutes |
| Screen scoping | per (employee, week) | locking is per week, so the editable unit is a week | one giant flat list |
| Lock enforcement | in the service, inside a transaction | the lock check and the write must be atomic | UI-only guard (bypassable) |

## Domain rules & invariants
- Hours between **0.25 and 24** inclusive, in **0.25 increments** (float-safe check, e.g.
  `Number.isInteger(h / 0.25)`).
- **No future dates** (relative to today).
- **No entries for inactive employees.**
- No create/edit/delete in a week that is `approved` — see [`approval-flow`](approval-flow.md)
  for the locking rule; enforcement lives here.

## Contracts
- **Type:** `TimeEntry` — `id`, `employeeId`, `date` (date-only), `hours` (numeric), `createdAt`,
  `updatedAt`.
- **Validation (`shared`):** create/update time-entry schemas (hours 0.25–24 in 0.25 steps, no
  future date).
- **Table:** `time_entries` — `id` (uuid pk), `employee_id` (fk), `date` (date), `hours`
  (numeric), `created_at`, `updated_at`. Index on `(employee_id, date)`.
- **Endpoints:**
  - `GET /time-entries?employeeId=&weekStart=` — list for an employee; optional week. Not
    paginated (bounded to ≤ 7 rows).
  - `POST /time-entries` — full validation (hours, future date, active employee, week not locked)
  - `PATCH /time-entries/:id` — blocked if the week is approved
  - `DELETE /time-entries/:id` — blocked if the week is approved
- **Error codes:** `VALIDATION_ERROR` (400 — includes future dates, see below), `EMPLOYEE_INACTIVE`
  (409), `WEEK_LOCKED` (409), `NOT_FOUND` (404).
- **Transactions:** mutations run in a transaction so the week-locked check and the write are
  atomic.

## Edge cases
- `7.3` hours → rejected (not a 0.25 multiple); `7.5` → accepted.
- A date in the future → `VALIDATION_ERROR` (enforced by the shared `pastOrToday` schema; future
  dates are input validation, not a separate domain error).
- Entry for an inactive employee → `EMPLOYEE_INACTIVE`.
- Create/edit/delete inside an `approved` week → `WEEK_LOCKED` (409).
- Same employee viewable but read-only when inactive: the screen shows entries but hides the form.

## Verification / Done when
- Schemas accept good inputs and reject `7.3`, future dates, and out-of-range hours (unit-tested
  in `shared`).
- A `WEEK_LOCKED` entry mutation returns 409 (covered by the approval-flow integration test).
- The Time entries screen renders approved weeks read-only via
  `GET /weekly-summary/approval` and disables the form for inactive employees.

## Notes / deviations
- The lock state on the screen is read from `GET /weekly-summary/approval` (added later — see
  [`approval-flow`](approval-flow.md)) instead of over-fetching the full weekly summary.
