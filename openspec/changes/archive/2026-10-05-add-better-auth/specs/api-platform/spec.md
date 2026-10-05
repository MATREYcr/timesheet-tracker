# Spec Delta

## MODIFIED Requirements

### Requirement: Validated environment

`process.env` SHALL be validated once with Zod in `config/env.ts`, failing fast on startup, with
no hardcoded fallbacks. `DATABASE_URL`, `CORS_ORIGIN`, `NODE_ENV`, `BETTER_AUTH_SECRET` (at least
32 characters) and `BETTER_AUTH_URL` (the API's public URL) are validated.

#### Scenario: Missing DATABASE_URL

- **WHEN** the API starts without `DATABASE_URL`
- **THEN** it exits immediately with a clear "DATABASE_URL is required" error

#### Scenario: Weak auth secret

- **WHEN** the API starts with a `BETTER_AUTH_SECRET` shorter than 32 characters
- **THEN** it exits immediately with a clear validation error

### Requirement: Database lifecycle

PostgreSQL SHALL run via docker-compose (host port 5433). Tables are defined one file per entity
under `db/schema/` with `snake_case` columns mapped to `camelCase`. Migrations are managed by
Drizzle Kit and an applied migration MUST NOT be edited. A seed script SHALL insert a
sketch-matching demo dataset idempotently (clear then insert) and ensure the demo account exists
without deleting other user accounts.

#### Scenario: Re-running the seed

- **WHEN** `pnpm db:seed` runs twice
- **THEN** the database ends with the same demo dataset, without duplicates

#### Scenario: Registered users survive a re-seed

- **WHEN** a user registers and `pnpm db:seed` runs afterwards
- **THEN** that user can still sign in

### Requirement: Isolated integration tests

Integration tests MUST run against an isolated `timesheet_test` database, never the dev database.
A Vitest `globalSetup` creates and migrates it once per run; the DB client switches to it under
Vitest (derived from `DATABASE_URL` unless `TEST_DATABASE_URL` is set). Tests truncate with
`RESTART IDENTITY CASCADE` for a clean slate and call business endpoints with a real session
obtained through the sign-up endpoint.

#### Scenario: Tests do not touch dev data

- **WHEN** `pnpm nx run api:test` runs with the dev database seeded
- **THEN** the dev data is unchanged afterwards

#### Scenario: Authenticated test requests

- **WHEN** an integration test calls a business endpoint through the test helpers
- **THEN** the request carries a valid session cookie

## ADDED Requirements

### Requirement: Credentialed CORS

CORS SHALL allow credentials only from the configured web origin (`CORS_ORIGIN`), never a
wildcard, and the auth endpoints SHALL trust only that origin.

#### Scenario: Web origin

- **WHEN** the web app at `CORS_ORIGIN` calls the API with credentials
- **THEN** the response includes `Access-Control-Allow-Origin: <CORS_ORIGIN>` and
  `Access-Control-Allow-Credentials: true`

#### Scenario: Foreign origin

- **WHEN** a page on another origin calls the sign-in endpoint
- **THEN** the request is rejected and no session is created
