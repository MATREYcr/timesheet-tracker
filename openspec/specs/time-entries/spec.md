# Time Entries Specification

## Purpose

Log the hours an employee worked on a given day. Entries are the raw input to payroll, so
validation is strict: quarter-hour granularity, no future dates, nothing for inactive employees,
and nothing inside a week that has already been approved.

## Requirements

### Requirement: Time entry record

A time entry SHALL have `id` (uuid), `employeeId`, `date` (date-only `YYYY-MM-DD`, no time, no
timezone), `hours` (numeric), `createdAt` and `updatedAt`. `date` MUST be a Postgres `date`
column and MUST be handled as a string (never parsed with `new Date(str)`).

#### Scenario: Stored columns

- **WHEN** the `time_entries` table is created
- **THEN** it has `id`, `employee_id` (fk), `date` (date), `hours` (numeric), `created_at`,
  `updated_at` and an index on `(employee_id, date)`

### Requirement: Hours validation

Hours MUST be between 0.25 and 24 inclusive, in 0.25 increments, enforced by the shared
`hoursSchema` in both the API and the web form. The increment check MUST be float-safe
(`Number.isInteger(hours / 0.25)`).

#### Scenario: Quarter-hour value accepted

- **WHEN** a client submits `hours: 7.5`
- **THEN** the entry is accepted

#### Scenario: Non-quarter value rejected

- **WHEN** a client submits `hours: 7.3`
- **THEN** the API responds 400 with `VALIDATION_ERROR`

#### Scenario: Out of range

- **WHEN** a client submits `hours: 0` or `hours: 24.25`
- **THEN** the API responds 400 with `VALIDATION_ERROR`

### Requirement: No future dates

An entry's `date` MUST NOT be after today, enforced by the shared `pastOrToday` schema. A future
date is input validation, not a separate domain error.

#### Scenario: Future date

- **WHEN** a client submits a date after today
- **THEN** the API responds 400 with `VALIDATION_ERROR`

#### Scenario: Today

- **WHEN** a client submits today's date
- **THEN** the entry is accepted

### Requirement: No entries for inactive employees

The system MUST reject creating or editing entries for an inactive employee.

#### Scenario: Inactive employee

- **WHEN** a client creates an entry for an employee with non-null `deactivatedAt`
- **THEN** the API responds 409 with `EMPLOYEE_INACTIVE`

### Requirement: Approved weeks are locked

Create, edit and delete MUST be rejected for any entry whose date falls in a week whose approval
status is `approved` (see `approval-flow`). The lock check and the write MUST run inside one
database transaction so they are atomic; a UI-only guard is not sufficient.

#### Scenario: Mutation in an approved week

- **WHEN** a client creates, edits or deletes an entry dated within an approved week
- **THEN** the API responds 409 with `WEEK_LOCKED`
- **AND** no data changes

#### Scenario: Mutation in a pending or rejected week

- **WHEN** a client edits an entry in a `pending` or `rejected` week
- **THEN** the edit succeeds

### Requirement: Time entries endpoints

The API SHALL expose `GET /time-entries?employeeId=&weekStart=` (not paginated — bounded to one
employee-week, ≤ 7 rows), `POST /time-entries`, `PATCH /time-entries/:id` and
`DELETE /time-entries/:id`.

#### Scenario: Unknown entry

- **WHEN** a client patches or deletes an entry id that does not exist
- **THEN** the API responds 404 with `NOT_FOUND`

### Requirement: Time entries screen

The web client SHALL scope the Time entries screen to one (employee, week), since locking is per
week. It SHALL read the week's lock state from `GET /weekly-summary/approval` (not the full weekly
summary) and render approved weeks read-only. For an inactive employee the entries are shown but
the form is hidden/disabled.

#### Scenario: Approved week is read-only

- **WHEN** the user opens an employee's approved week
- **THEN** entries are listed without create/edit/delete controls

#### Scenario: Inactive employee is read-only

- **WHEN** the user selects an inactive employee
- **THEN** their entries are shown and the entry form is disabled
