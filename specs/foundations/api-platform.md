# Foundation — API platform (`apps/api`)

Hono + Drizzle + PostgreSQL conventions shared by every API feature. The app is ESM (aligned with
`shared`). Consumes `packages/shared` for types, schemas, the pay calculation, and error codes.

---

## Architecture — modular by feature

Organised by feature (a "module" owns everything for its domain), not by technical layer. Hono is
unopinionated, so structure is by convention: each module exports a Hono sub-router, aggregated in
`routes/index.ts` and mounted once by `app.ts`. Plain service functions (no DI container — Hono
has none, unlike Nest). Cross-cutting code lives in `common/`, `middleware/`, `config/`, `db/`.
Keep modules lean: a service exists where there is real logic (locking, soft delete, weekly
aggregation), not anaemic CRUD pass-throughs. Folders only where ≥2 related files; singletons stay
flat.

```
apps/api/src/
├── main.ts                       # bootstrap @hono/node-server + graceful shutdown
├── app.ts                        # middleware, /health, mount apiRoutes, onError
├── config/
│   └── env.ts                    # process.env validated with Zod (fail-fast)
├── common/                       # cross-cutting helpers/types
│   ├── errors/                   # app-error.ts (AppError + code->status), messages.ts
│   │                             #   (Accept-Language parse + en/es map), on-error.ts (envelope), index.ts
│   ├── http-status.ts            # HttpStatus constants (no bare status numbers)
│   ├── openapi.ts                # createModuleApp(): zod-openapi app + defaultHook -> VALIDATION_ERROR
│   └── types.ts                  # AppEnv (Hono context type)
├── middleware/                   # request-pipeline middleware
│   └── locale.ts                 # resolve locale onto the context
├── db/
│   ├── client.ts                 # drizzle client (postgres-js) + closeDb
│   ├── schema/                   # one file per entity + index barrel
│   └── seed.ts                   # sketch-matching seed (tsx)
├── routes/
│   └── index.ts                  # aggregates the module routers
└── modules/
    ├── employees/                # routes + service + mapper
    ├── time-entries/             # routes + service
    ├── weekly-summary/           # routes + service
    └── dashboard/                # routes + service
```

Request flow: `logger -> cors -> locale -> route (zod-openapi defaultHook validates with shared Zod,
throws VALIDATION_ERROR) -> service (drizzle + rules, throws AppError) -> onError -> localized
envelope`.

## Key decisions

- **env** validated once with Zod (`config/env.ts`); no hardcoded fallbacks. CORS origin
  configurable via `CORS_ORIGIN`. `NODE_ENV` validated.
- **Mutations run in a transaction** (time entries) so the week-locked check and the write are
  atomic.
- `updatedAt` is maintained by Drizzle `$onUpdate` (not set manually).
- Status values come from `@timesheet/shared` (`EMPLOYEE_STATUS`/`APPROVAL_STATUS`), reused in
  mappers, services and the Drizzle `pgEnum` — no bare string literals.
- Explicit return types on exported service functions (module-boundary contract).
- Validation goes through `@hono/zod-openapi` (`createModuleApp()` wires a `defaultHook` that maps
  schema failures to `VALIDATION_ERROR`) with the schemas from `@timesheet/shared`, so API and web
  validate against the exact same rules — and the same schemas generate the OpenAPI spec. RPC
  client (`hc`) is not used, so separating handlers into services is fine.

## Database

- One Drizzle table file per entity under `db/schema/`; each table's columns live in its feature
  spec (`features/employees`, `features/time-entries`, `features/approval-flow`).
- Migrations managed by **Drizzle Kit**. A seed script (`tsx db/seed.ts`) inserts a
  sketch-matching dataset so the app is usable immediately after setup (idempotent: clears then
  inserts).

## Pagination

List endpoints that can grow are **paginated server-side** (`/employees`, `/weekly-summary`).
Query: `page` (1-based, default 1) + `pageSize` (default 10, max 100), validated by
`paginationQuerySchema` from `shared`. Response is the `Paginated<T>` envelope:

```json
{ "data": [ ... ], "page": 1, "pageSize": 10, "total": 42, "totalPages": 5 }
```

`page`/`pageSize` echo the request; `total` is the full (pre-pagination) row count so the client
can render a pager. `/time-entries` is **not** paginated — it's already bounded to one (employee,
week) (≤ 7 rows).

## Testing

- **Integration tests run against an isolated `timesheet_test` database**, never the dev/prod DB.
  A Vitest `globalSetup` (`apps/api/test/global-setup.ts`) creates it if missing and migrates it
  once per run; `db/client.ts` swaps to it automatically under Vitest (`activeDbUrl`), deriving the
  URL from `DATABASE_URL` (db name → `timesheet_test`) unless `TEST_DATABASE_URL` is set.
- Tests `TRUNCATE … RESTART IDENTITY CASCADE` for a clean slate, so they're isolated and
  repeatable. This replaced the earlier "scoped far-past week" workaround that risked dev data.
- Service logic that's purely computational should be extracted and unit-tested directly; DB
  orchestration is covered by integration tests through `app.request()`.

## Notes / deviations

- An **OpenAPI 3.1 spec + Swagger UI** (localized via `Accept-Language`) was added over the
  existing routes (`*.openapi.ts` per module) after the core API — additive, no rewrite. Was a
  bonus-backlog item, pulled forward.
