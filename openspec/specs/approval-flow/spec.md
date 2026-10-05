# Approval Flow Specification

## Purpose

Let a reviewer approve or reject each employee's week. Approving freezes that week's time entries
so paid hours cannot change; rejecting sends the week back to be fixed and resubmitted.

## Requirements

### Requirement: Approval status per employee-week

Each (employee, week) SHALL have a status `pending`, `approved` or `rejected`, persisted in a
`weekly_approvals` table keyed by `(employeeId, weekStart)` with a unique constraint. Only the
status is stored. Absence of a row MUST be treated as `pending`. Status values come from the
shared `APPROVAL_STATUS` constant.

#### Scenario: No row means pending

- **WHEN** an employee-week has no `weekly_approvals` row
- **THEN** its status is reported as `pending`

#### Scenario: Table shape

- **WHEN** the `weekly_approvals` table is created
- **THEN** it has `id`, `employee_id` (fk), `week_start` (date), `status` (pgEnum),
  `created_at`, `updated_at` and a unique `(employee_id, week_start)`

### Requirement: Approve and reject

`POST /weekly-summary/approve` and `POST /weekly-summary/reject` SHALL accept
`{ employeeId, weekStart }` (validated by the shared `weeklyApprovalActionSchema`) and upsert the
status. Transitions: `pending → approved | rejected` and `approved ⇄ rejected`. A decision is
flipped with the opposite action; there is no separate "reopen" endpoint. Both actions MUST be
idempotent.

#### Scenario: Approve a pending week

- **WHEN** a reviewer approves a pending week
- **THEN** the status becomes `approved`

#### Scenario: Reject reopens an approved week

- **WHEN** a reviewer rejects an approved week
- **THEN** the status becomes `rejected` and its entries are editable again

#### Scenario: Re-approve after reject

- **WHEN** a reviewer approves a rejected week
- **THEN** the status becomes `approved`

#### Scenario: Idempotent approve

- **WHEN** a reviewer approves an already-approved week
- **THEN** the status stays `approved` and no error is returned

#### Scenario: Week with no entries

- **WHEN** a reviewer approves a week with no time entries
- **THEN** the approval is stored (nothing to lock yet)

#### Scenario: weekStart is not a Monday

- **WHEN** a client sends a `weekStart` that is not a Monday
- **THEN** the API responds 400 with `VALIDATION_ERROR`

### Requirement: Only approved locks

Only `approved` SHALL lock the week's time entries; `pending` and `rejected` weeks MUST remain
fully editable so a rejected week can be fixed and resubmitted. Enforcement lives in the
time-entries service (see `time-entries`).

#### Scenario: Locked after approval

- **WHEN** a week is approved
- **THEN** creating, editing or deleting an entry in it returns 409 `WEEK_LOCKED`

#### Scenario: Rejected stays editable

- **WHEN** a week is rejected
- **THEN** entry mutations in that week succeed

### Requirement: Read a single week's status

`GET /weekly-summary/approval?employeeId=&weekStart=` SHALL return
`{ employeeId, weekStart, status }`, reporting `pending` when no row exists and 404 `NOT_FOUND`
when the employee does not exist. The Time entries screen uses it to know the lock state without
fetching the full summary.

#### Scenario: Unknown employee

- **WHEN** the employee id does not exist
- **THEN** the API responds 404 with `NOT_FOUND`

### Requirement: Approval controls on the weekly summary

Each weekly summary row SHALL show the status badge (Pending muted, Approved success, Rejected
destructive) with Approve/Reject actions; approved rows offer **Reopen** (which rejects). The
actions SHALL update the cache optimistically and roll back on error.

#### Scenario: Optimistic approve with failure

- **WHEN** the user approves a row and the request fails
- **THEN** the badge shows `Approved` immediately and reverts to its previous status on error

### Requirement: Locking integration test

An API integration test MUST cover the flow against the isolated `timesheet_test` database:
create entries (pending) → approve → create/edit/delete blocked with 409 `WEEK_LOCKED` → reject →
edits succeed again.

#### Scenario: Integration test passes

- **WHEN** `pnpm nx run api:test` runs
- **THEN** the approval-locking integration test passes without touching the dev database
