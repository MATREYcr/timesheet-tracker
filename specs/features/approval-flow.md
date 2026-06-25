# Feature — Approval flow & locking

Approve or reject an employee's week; approving locks that week's time entries from editing.

## Context / Why
Payroll is computed from reviewed weeks. A reviewer marks each employee's week as approved
(freezes its entries so paid hours can't change) or rejected (sends it back to be fixed). Without
this there's no guarantee the hours that get paid were actually reviewed.

## Scope
- **In:** per-(employee, week) status; approve/reject; locking entries in approved weeks;
  reopening via reject; reading a single week's status for the Time entries screen.
- **Out:** snapshotting `hourlyRate` at approval (see [`weekly-summary`](weekly-summary.md)); an
  audit trail of who approved; bulk/multi-employee approval.

## Decisions
| Decision | Choice | Why | Rejected |
| --- | --- | --- | --- |
| Persistence | `weekly_approvals` table, status only | minimal; absence of a row = `pending` | a status column on every time entry (redundant) |
| What locks | only `approved` | a `rejected` week must be fixable and resubmitted | locking `rejected` too (traps the reviewer) |
| Reopen | the opposite action (reject) | one verb per transition; no extra "reopen" state | a separate `reopen` endpoint |
| Lock enforcement | in the time-entries service, in a transaction | the lock check and the write must be atomic | UI-only guard (bypassable) |

## Domain rules & invariants
- Key: `(employeeId, weekStart)`, where `weekStart` is the Monday (date-only) of that week.
- Absence of a row means implicitly `pending`.
- Transitions: `pending → approved | rejected`; `approved ⇄ rejected` (re-approving is allowed).
  The decision is flipped with the opposite action — there is no separate "reopen".
- `approved` ⇒ create/edit/delete of any entry whose date falls in that week → `WEEK_LOCKED`
  (enforced in [`time-entries`](time-entries.md)).

## Contracts
- **Type:** `ApprovalStatus = 'pending' | 'approved' | 'rejected'`; `WeeklyApproval`.
- **Validation (`shared`):** approve/reject schema (`employeeId` uuid, `weekStart` must be a
  Monday).
- **Table:** `weekly_approvals` — `id` (uuid pk), `employee_id` (fk), `week_start` (date),
  `status` (pgEnum), `created_at`, `updated_at`. Unique `(employee_id, week_start)`.
- **Endpoints:**
  - `POST /weekly-summary/approve` — `{ employeeId, weekStart }` → upsert status `approved`
  - `POST /weekly-summary/reject` — `{ employeeId, weekStart }` → upsert status `rejected`
  - `GET /weekly-summary/approval?employeeId=&weekStart=` → `{ employeeId, weekStart, status }`
    (`pending` when no row exists, `404` when the employee doesn't exist)
- **Error codes:** `WEEK_LOCKED` (409), `NOT_FOUND` (404), `VALIDATION_ERROR` (400).
- **Screen:** on the weekly summary, each row shows the status badge and Approve/Reject with
  optimistic updates; approved rows offer **Reopen** (reject). See
  [`weekly-summary`](weekly-summary.md).

## Edge cases
- Approving a week with no entries → allowed (status exists; nothing to lock yet).
- Editing an entry in a `pending`/`rejected` week → allowed.
- `weekStart` that isn't a Monday → `VALIDATION_ERROR`.
- Reject on an already-`approved` week → unlocks it; edits succeed again.
- Inactive employee with a historical week → still visible and approvable.
- Approve then approve again (idempotent) → stays `approved`, no error.

## Verification / Done when
- Integration test (PLAN 2.8) against the isolated test DB: create entries (pending) → approve →
  create/edit/delete blocked with `WEEK_LOCKED` (409) → reject re-opens and edits pass.
- Runs against `timesheet_test` (provisioned + migrated by the Vitest `globalSetup`, truncated per
  run) — never the dev/prod DB. See the Testing note in
  [`foundations/api-platform`](../foundations/api-platform.md).

## Notes / deviations
- `GET /weekly-summary/approval` was added after the core endpoints: the Time entries screen
  needed the lock state without over-fetching the full weekly summary (see PLAN 3.5).
