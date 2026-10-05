# Shared Package Specification

## Purpose

`packages/shared` is the headless, platform-agnostic heart of the project: domain types, Zod
validation schemas, the pay calculation, date/week helpers and error codes, consumed identically
by the API and the web client so neither duplicates business rules.

## Requirements

### Requirement: Headless and platform-agnostic

`packages/shared` MUST be pure TypeScript. It MUST NOT import React, React Native, Next.js, Hono,
Drizzle or any other framework, and MUST NOT reference `window`, `document` or `process`.

#### Scenario: Framework import is rejected

- **WHEN** a change adds a framework or platform import to `packages/shared`
- **THEN** it violates this spec and must be moved to the consuming app

### Requirement: Single source of validation and types

There SHALL be one Zod schema per concept in `packages/shared`, used by the API for request
parsing and by the web client for form validation. Domain types MUST be derived from those schemas
(`z.infer`) rather than hand-written alongside them, so a schema and its type cannot desync.
Neither app may redefine them.

#### Scenario: Same rule on both sides

- **WHEN** the hours rule changes in `hoursSchema`
- **THEN** both the API validation and the web form pick it up without further edits

### Requirement: Pay calculation lives only here

`calculateWeeklyPay` and `round2` SHALL live in `packages/shared` (contract in `weekly-summary`)
and MUST NOT be reimplemented or inlined anywhere else.

#### Scenario: Pay computed elsewhere

- **WHEN** an API route or client component computes `rate * 1.5` itself
- **THEN** it violates this spec and must call `calculateWeeklyPay` instead

### Requirement: UTC-safe date helpers

Date-only values SHALL be `YYYY-MM-DD` strings. The package SHALL provide `getWeekStart(date)`
(Monday of the week) and `isFutureDate(date, today?)` using pure string/UTC math. Code MUST NOT
parse a date-only value with `new Date(str)` (local-timezone shift bug).

#### Scenario: Every weekday maps to its Monday

- **WHEN** `getWeekStart` is called for each day Monday through Sunday of one week
- **THEN** all return the same Monday

### Requirement: Canonical error codes

The package SHALL export the stable `ERROR_CODES` union (`VALIDATION_ERROR`, `NOT_FOUND`,
`EMPLOYEE_INACTIVE`, `WEEK_LOCKED`, `INTERNAL_ERROR`) and the `ApiErrorBody` envelope type. New
codes are added to this union; localized messages live in the API (see `error-envelope-i18n`).

#### Scenario: New error code

- **WHEN** a feature needs a new error code
- **THEN** it is added to `ERROR_CODES` and given en/es messages and an HTTP status in the API

### Requirement: Pagination contract

The package SHALL export `paginationQuerySchema` (`page` ≥ 1 default 1; `pageSize` 1–100 default
10) and the `Paginated<T>` type `{ data, page, pageSize, total, totalPages }`.

#### Scenario: Default pagination

- **WHEN** a list request omits `page` and `pageSize`
- **THEN** they resolve to `1` and `10`

### Requirement: Unit-tested

The package MUST have Vitest unit tests for the pay calculation edge cases (see `weekly-summary`),
the date helpers (each weekday, month/year boundaries) and the input schemas.

#### Scenario: Shared tests pass

- **WHEN** `pnpm nx run shared:test` runs
- **THEN** all suites pass
