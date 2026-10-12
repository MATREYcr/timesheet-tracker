# Employees Specification

## Purpose

Keep a roster of hourly employees (name + hourly rate). Every other capability hangs off an
employee, and their past timesheets must stay auditable for payroll — so removing someone is a
soft delete that never erases history.

## Requirements

### Requirement: Employee record

An employee SHALL have `id` (uuid), `firstName`, `lastName`, `hourlyRate`, `deactivatedAt`
(timestamp or null), `createdAt` and `updatedAt`. `hourlyRate` MUST be stored in a precise
`numeric` column, never a float. The `Employee` type SHALL be derived from the shared Zod schema
in `packages/shared`.

#### Scenario: Stored columns use snake_case

- **WHEN** the `employees` table is created
- **THEN** it has `id`, `first_name`, `last_name`, `hourly_rate` (numeric), `deactivated_at`
  (nullable timestamp), `created_at` and `updated_at`

### Requirement: Derived status

An employee's `status` SHALL be derived from `deactivatedAt` and never stored: `active` when
`deactivatedAt` is null, otherwise `inactive`. A separate stored status column could desync.

#### Scenario: Active employee

- **WHEN** an employee has `deactivatedAt = null`
- **THEN** the API returns `status: "active"`

#### Scenario: Inactive employee

- **WHEN** an employee has a non-null `deactivatedAt`
- **THEN** the API returns `status: "inactive"`

### Requirement: Create and edit employees

The system SHALL create (`POST /employees`) and edit (`PATCH /employees/:id`) employees,
validating input with the shared `createEmployeeSchema` / `updateEmployeeSchema`: `firstName` and
`lastName` trimmed, 1–100 chars; `hourlyRate` greater than 0 and at most 10000. Editing
`hourlyRate` is allowed at any time.

#### Scenario: Valid employee is created

- **WHEN** a client posts `{ firstName: "Ana", lastName: "García", hourlyRate: 22.5 }`
- **THEN** the employee is created with `status: "active"`

#### Scenario: Invalid input is rejected

- **WHEN** a client posts an empty `firstName` or a `hourlyRate` of `0`
- **THEN** the API responds 400 with error code `VALIDATION_ERROR`

#### Scenario: Unknown employee

- **WHEN** a client patches `/employees/:id` with an id that does not exist
- **THEN** the API responds 404 with error code `NOT_FOUND`

### Requirement: Soft delete only

Employees MUST NOT be hard-deleted. `POST /employees/:id/deactivate` SHALL set `deactivatedAt`;
`POST /employees/:id/reactivate` SHALL clear it. The row and its time entries are always kept.

#### Scenario: Deactivate keeps history

- **WHEN** an employee with time entries is deactivated
- **THEN** the employee row and all their time entries still exist
- **AND** `status` becomes `inactive`

#### Scenario: Reactivate

- **WHEN** an inactive employee is reactivated
- **THEN** `deactivatedAt` is cleared and the employee reappears in default lists

### Requirement: Roster listing

`GET /employees` SHALL hide inactive employees unless `includeInactive=true`, be paginated
(`page`, `pageSize`, see `api-platform`), and support an optional `employeeId` filter and an
optional `search` that matches case-insensitively over `firstName || ' ' || lastName`.

#### Scenario: Inactive hidden by default

- **WHEN** a client calls `GET /employees` without `includeInactive`
- **THEN** only active employees are returned

#### Scenario: Show inactive

- **WHEN** a client calls `GET /employees?includeInactive=true`
- **THEN** active and inactive employees are returned

#### Scenario: Search across full name

- **WHEN** a client calls `GET /employees?search=ana ga`
- **THEN** "Ana García" is returned

### Requirement: Inactive employees remain visible historically

Inactive employees SHALL be hidden from the default roster only; their historical time entries and
weekly summaries MUST remain visible (see `time-entries`, `weekly-summary`).

#### Scenario: Inactive employee in a past week

- **WHEN** an inactive employee has entries in a past week
- **THEN** that week's summary still includes a row for them

### Requirement: Employees screen

The web client SHALL provide an Employees screen listing the roster in a paginated table with a
show-inactive toggle, a server-side employee filter (searchable combobox with an "All employees"
option), a form dialog to create/edit employees validated with the same shared schemas, and
confirmed deactivate/reactivate row actions.

#### Scenario: Filter resets pagination

- **WHEN** the user picks an employee in the filter while on page 3
- **THEN** the table shows page 1 filtered by that `employeeId`

## Known limitations

`hourlyRate` is not snapshotted at approval: editing it retroactively changes the displayed pay of
past approved weeks. Deliberate trade-off for scope (owned by `weekly-summary`).
