# Spec 02 — `apps/api`

Hono + Drizzle + PostgreSQL REST API. Consumes `packages/shared` for types,
schemas, the pay calculation, and error codes. The app is ESM (aligned with shared).

---

## Architecture — modular by feature

Organised by feature (a "module" owns everything for its domain), not by technical
layer. Hono is unopinionated, so structure is by convention: each module exports a
Hono sub-router, aggregated in `routes/index.ts` and mounted once by `app.ts`. Plain
service functions (no DI container — Hono has none, unlike Nest). Cross-cutting code
lives in `common/`, `middleware/`, `config/`, `db/`. Keep modules lean: a service
exists where there is real logic (locking, soft delete, weekly aggregation), not
anaemic CRUD pass-throughs. Folders only where ≥2 related files; singletons stay flat.

```
apps/api/src/
├── main.ts                       # bootstrap @hono/node-server + graceful shutdown
├── app.ts                        # middleware, /health, mount apiRoutes, onError
├── config/
│   └── env.ts                    # process.env validated with Zod (fail-fast)
├── common/                       # cross-cutting helpers/types (no barrel — avoids cycles)
│   ├── errors.ts                 # AppError + ErrorCode -> HTTP status map
│   ├── on-error.ts               # central handler -> { error: { code, message } }
│   ├── i18n.ts                   # Accept-Language parse + code -> { en, es }
│   └── types.ts                  # AppEnv (Hono context type)
├── middleware/                   # request-pipeline middleware
│   ├── locale.ts                 # resolve locale onto the context
│   └── validate.ts               # zValidator wrapper -> VALIDATION_ERROR envelope
├── db/
│   ├── client.ts                 # drizzle client (postgres-js) + closeDb
│   ├── schema/                   # one file per entity + index barrel
│   └── seed.ts                   # sketch-matching seed (tsx)
├── routes/
│   └── index.ts                  # aggregates the module routers
└── modules/
    ├── employees/                # routes + service + mapper
    ├── time-entries/             # routes + service (no mapper needed beyond rows)
    └── weekly-summary/           # routes + service
```

Request flow: `logger -> cors -> locale -> validate (shared Zod) -> route -> service
(drizzle + rules, throws AppError) -> onError -> localized envelope`.

Key decisions:

- **env** validated once with Zod (`config/env.ts`); no hardcoded fallbacks. CORS
  origin configurable via `CORS_ORIGIN`.
- **Mutations run in a transaction** (time entries) so the week-locked check and the
  write are atomic.
- `updatedAt` is maintained by Drizzle `$onUpdate` (not set manually).
- Status values come from `@timesheet/shared` (`EMPLOYEE_STATUS`/`APPROVAL_STATUS`),
  reused in mappers, services and the Drizzle pgEnum — no bare string literals.
- Explicit return types on exported service functions (module-boundary contract).
- Validation uses `@hono/zod-validator` with the schemas from `@timesheet/shared`,
  so API and web validate against the exact same rules. RPC client (`hc`) is not
  used, so separating handlers into services is fine.

---

## Database schema (Drizzle)

- `employees` — `id` (uuid pk), `first_name`, `last_name`, `hourly_rate` (numeric),
  `deactivated_at` (timestamp null), `created_at`, `updated_at`.
- `time_entries` — `id` (uuid pk), `employee_id` (fk), `date` (date), `hours`
  (numeric), `created_at`, `updated_at`. Index on `(employee_id, date)`.
- `weekly_approvals` — `id` (uuid pk), `employee_id` (fk), `week_start` (date),
  `status` (enum), `created_at`, `updated_at`. Unique `(employee_id, week_start)`.

Migrations managed by Drizzle Kit. A seed script inserts a few employees + entries
so the app is usable immediately after setup.

## Endpoints

| Method | Path                                   | Notes                                  |
| ------ | -------------------------------------- | -------------------------------------- |
| GET    | `/employees?includeInactive=bool`      | Inactive hidden unless flag set        |
| POST   | `/employees`                           | Validates via shared schema            |
| PATCH  | `/employees/:id`                       | Edit name/rate                         |
| POST   | `/employees/:id/deactivate`            | Sets `deactivatedAt` (soft delete)     |
| POST   | `/employees/:id/reactivate`            | Clears `deactivatedAt`                 |
| GET    | `/time-entries?employeeId=&weekStart=` | List for an employee; optional week    |
| POST   | `/time-entries`                        | Full validation (see below)            |
| PATCH  | `/time-entries/:id`                    | Blocked if week approved               |
| DELETE | `/time-entries/:id`                    | Blocked if week approved               |
| GET    | `/weekly-summary?weekStart=`           | Raw aggregate per employee (see below) |
| POST   | `/weekly-summary/approve`              | `{ employeeId, weekStart }`            |
| POST   | `/weekly-summary/reject`               | `{ employeeId, weekStart }`            |

## Weekly summary response (raw — client computes pay)

`GET /weekly-summary?weekStart=` returns one row per employee with **≥1 time entry
in that week** (active or inactive, so inactive employees' historical weeks stay
visible). Each row: `{ employeeId, firstName, lastName, hourlyRate, totalHours,
status }`. The API does **not** compute pay or the regular/overtime split — the web
client derives those with `calculateWeeklyPay` from `shared`.

## Validation rules (server-enforced, via shared schemas)

- Time entry: hours 0.25–24 in 0.25 increments, no future date, employee must be
  active, week not approved.
- **Create/edit/delete** of an entry whose week is `approved` → `WEEK_LOCKED` (409).
  `pending`/`rejected` weeks are editable.
- Approving/rejecting upserts the `weekly_approvals` row. Re-approving after a
  reject is allowed.
- `Accept-Language` parsed robustly (`en`, `es`, `en-US`, `es,en;q=0.8`); match
  primary subtag; default `en`.

## Error envelope

Every error response:

```json
{
  "error": {
    "code": "WEEK_LOCKED",
    "message": "This week is approved and locked."
  }
}
```

- `code`: stable, from the shared `ErrorCode` union.
- `message`: localized en/es by `Accept-Language` (default en). Never leak internals.
- HTTP status mapped per code (validation → 400, not found → 404, conflict/locked →
  409, etc.).

### Error code → message map (en/es)

Maintained in the API, keyed by the shared `ErrorCode`. Examples:

| code                | status | en                                        | es                                                      |
| ------------------- | ------ | ----------------------------------------- | ------------------------------------------------------- |
| `VALIDATION_ERROR`  | 400    | Invalid request data.                     | Datos de solicitud inválidos.                           |
| `EMPLOYEE_INACTIVE` | 409    | Cannot log time for an inactive employee. | No se puede registrar tiempo para un empleado inactivo. |
| `FUTURE_DATE`       | 400    | Date cannot be in the future.             | La fecha no puede ser futura.                           |
| `WEEK_LOCKED`       | 409    | This week is approved and locked.         | Esta semana está aprobada y bloqueada.                  |
| `NOT_FOUND`         | 404    | Resource not found.                       | Recurso no encontrado.                                  |

## Integration test (required)

Approval-locking flow:

1. Create employee + time entries for a week.
2. Approve the week.
3. Assert editing/deleting an entry in that week returns `WEEK_LOCKED` (409).
4. (Optional) Reject re-opens the week and edits succeed again.

Use an isolated test database (or transaction rollback) so tests are repeatable.
