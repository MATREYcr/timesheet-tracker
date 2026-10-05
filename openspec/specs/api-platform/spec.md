# API Platform Specification

## Purpose

Cross-cutting conventions for `apps/api` (Hono + Drizzle + PostgreSQL): module structure, request
validation, configuration, transactions, pagination, OpenAPI docs, database lifecycle and test
isolation.

## Requirements

### Requirement: Modular by feature

The API SHALL be organized by feature: each module under `src/modules/<feature>/` owns its routes
and service and exports a Hono sub-router, aggregated in `routes/index.ts` and mounted once by
`app.ts`. Services are plain functions (no DI container) and exist only where there is real logic.
Exported service functions SHALL declare explicit return types.

#### Scenario: New module

- **WHEN** a new feature is added to the API
- **THEN** it lives in its own `modules/<feature>/` folder and is mounted through `routes/index.ts`

### Requirement: Validation through shared schemas

Request validation SHALL go through `@hono/zod-openapi` using the schemas from
`@timesheet/shared`. `createModuleApp()` wires a `defaultHook` that maps schema failures to
`VALIDATION_ERROR`. Status values MUST come from the shared constants (`EMPLOYEE_STATUS`,
`APPROVAL_STATUS`), never bare string literals.

#### Scenario: Invalid query

- **WHEN** `GET /weekly-summary?weekStart=not-a-date` is called
- **THEN** the response is 400 `VALIDATION_ERROR` in the error envelope

### Requirement: Validated environment

`process.env` SHALL be validated once with Zod in `config/env.ts`, failing fast on startup, with
no hardcoded fallbacks. `DATABASE_URL`, `CORS_ORIGIN` and `NODE_ENV` are validated.

#### Scenario: Missing DATABASE_URL

- **WHEN** the API starts without `DATABASE_URL`
- **THEN** it exits immediately with a clear "DATABASE_URL is required" error

### Requirement: Transactional mutations

Time entry mutations SHALL run inside a database transaction so the week-locked check and the
write are atomic. `updatedAt` SHALL be maintained by Drizzle `$onUpdate`.

#### Scenario: Lock check and write share a transaction

- **WHEN** an entry is created, edited or deleted
- **THEN** the approval lookup and the write run inside the same `db.transaction`
- **AND** a `WEEK_LOCKED` error rolls the transaction back without writing

### Requirement: Server-side pagination

List endpoints that can grow (`/employees`, `/weekly-summary`) SHALL be paginated with
`page`/`pageSize` and return `Paginated<T>` where `total` is the full pre-pagination count.
`/time-entries` is not paginated (bounded to one employee-week).

#### Scenario: Page metadata

- **WHEN** there are 42 employees and a client requests `page=1&pageSize=10`
- **THEN** the response has 10 rows, `total = 42` and `totalPages = 5`

### Requirement: OpenAPI documentation

The API SHALL generate an OpenAPI 3.1 document from the same Zod schemas and serve Swagger UI
(localized via `Accept-Language`).

#### Scenario: Docs available

- **WHEN** the API is running
- **THEN** Swagger UI is served under `/docs`

### Requirement: Database lifecycle

PostgreSQL SHALL run via docker-compose (host port 5433). Tables are defined one file per entity
under `db/schema/` with `snake_case` columns mapped to `camelCase`. Migrations are managed by
Drizzle Kit and an applied migration MUST NOT be edited. A seed script SHALL insert a
sketch-matching demo dataset idempotently (clear then insert).

#### Scenario: Re-running the seed

- **WHEN** `pnpm db:seed` runs twice
- **THEN** the database ends with the same demo dataset, without duplicates

### Requirement: Isolated integration tests

Integration tests MUST run against an isolated `timesheet_test` database, never the dev database.
A Vitest `globalSetup` creates and migrates it once per run; the DB client switches to it under
Vitest (derived from `DATABASE_URL` unless `TEST_DATABASE_URL` is set). Tests truncate with
`RESTART IDENTITY CASCADE` for a clean slate.

#### Scenario: Tests do not touch dev data

- **WHEN** `pnpm nx run api:test` runs with the dev database seeded
- **THEN** the dev data is unchanged afterwards

### Requirement: Health endpoint

The API SHALL expose `GET /health` returning `{ "status": "ok" }`.

#### Scenario: Health check

- **WHEN** `GET /health` is called on a running API
- **THEN** it responds 200 with `{ "status": "ok" }`
