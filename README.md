# Mini Timesheets

> Technical Assessment — Software Engineer L2 · OCMI Workers Comp

A production-grade timesheet tracker for hourly employees: roster management, time logging, weekly pay calculation with US overtime rules, and a reviewer approval flow — built as a full-stack monorepo.

![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![Hono](https://img.shields.io/badge/Hono-4.x-E36002?logo=hono&logoColor=white)
![Drizzle](https://img.shields.io/badge/Drizzle_ORM-0.45-C5F74F?logo=drizzle&logoColor=black)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)
![Nx](https://img.shields.io/badge/Nx-22-143055?logo=nx)

---

## Assessment Deliverables

### Core requirements

| Requirement | Status | Notes |
|---|---|---|
| Nx monorepo + pnpm workspaces | ✅ | `apps/api`, `apps/web`, `packages/shared` |
| `packages/shared` — headless, zero-framework | ✅ | Types, Zod schemas, pay calculation |
| Client consumes shared package | ✅ | Web calls `calculateWeeklyPay()` from shared |
| Employees screen (CRUD + soft delete) | ✅ | Deactivate / reactivate; row never removed |
| Time entries screen | ✅ | 0.25–24 h, ¼-h increments, no future dates |
| Weekly summary screen | ✅ | Regular/overtime/pay, approval flow |
| Overtime calculation (>40 h/week @ 1.5×) | ✅ | Lives in shared, unit-tested |
| Approval flow locking | ✅ | Approved weeks block create/edit/delete |
| Error envelope `{ error: { code, message } }` | ✅ | Every API error, stable machine-readable codes |
| API i18n errors (en / es via Accept-Language) | ✅ | Weighted lists, regional tags, default en |
| Unit tests — pay calculation | ✅ | Edge cases: exactly 40 h, decimal hours, rounding |
| Integration test — approval locking | ✅ | Vitest against a real isolated DB |
| README that works from fresh clone | ✅ | See §&nbsp;[Quick Start](#quick-start) below |

### Bonus deliverables

| Bonus | Status | Notes |
|---|---|---|
| UI i18n — English & Spanish | ✅ | next-intl, `[locale]` URL routing, 100% of strings |
| Optimistic updates | ✅ | Approve/reject update cache instantly, rollback on error |
| Nx workspace orchestration | ✅ | `nx run-many`, `nx affected`, cache, task graph |
| OpenAPI 3.1 + Swagger UI | ✅ | `/docs/ui` auto-generated from Zod schemas |
| Playwright E2E suite | ✅ | All 3 core screens covered |
| Dashboard screen (KPIs) | ✅ | Active staff · Total hours · Total pay · Pending count |
| Dark mode | ✅ | next-themes, system preference respected |
| Animations + reduced-motion | ✅ | Dialog, skeleton shimmer, `prefers-reduced-motion` |
| Database seed | ✅ | 14 employees + 4 weeks of varied hour data |
| Mermaid architecture diagrams | ✅ | `docs/diagrams/` — architecture, ER, state machine |
| Spec-driven development artifacts | ✅ | Full `specs/` directory committed as deliverable |
| Frontend component test | ✅ | `weekly-summary-table.spec.tsx` |

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   Browser (Next.js 16)                  │
│  Employees · Time Entries · Weekly Summary · Dashboard  │
│  TanStack Query · react-hook-form · shadcn/ui           │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTP / JSON
┌──────────────────────▼──────────────────────────────────┐
│                  REST API (Hono 4)                       │
│  /employees · /time-entries · /weekly-summary · /dash   │
│  Drizzle ORM · Zod validation · error envelope + i18n   │
└──────────────────────┬──────────────────────────────────┘
                       │ SQL
┌──────────────────────▼──────────────────────────────────┐
│              PostgreSQL 16 (Docker)                      │
│  employees · time_entries · weekly_approvals            │
└─────────────────────────────────────────────────────────┘

              ↕ imported by both layers
┌─────────────────────────────────────────────────────────┐
│              packages/shared  (headless TS)             │
│  calculateWeeklyPay · Zod schemas · types · date utils  │
└─────────────────────────────────────────────────────────┘
```

`packages/shared` is the architectural hub. It contains **no framework imports** — pure TypeScript consumed identically by the API (request validation) and the web client (form validation + pay calculation).

The weekly summary intentionally demonstrates this: the API returns raw `totalHours` + `hourlyRate`; the client calls `calculateWeeklyPay(totalHours, rate)` from shared to derive regular hours, overtime hours, and pay. Neither layer duplicates the formula.

Full diagrams (Mermaid): [`docs/diagrams/`](docs/diagrams/)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Monorepo | **Nx 22** + **pnpm workspaces** |
| API | **Hono 4** + **Drizzle ORM 0.45** + **Zod 4** |
| Database | **PostgreSQL 16** via docker-compose |
| Web client | **Next.js 16** (App Router) + **TanStack Query 5** |
| Styling / UI | **Tailwind CSS 4** + **shadcn/ui** |
| Shared logic | **Plain TypeScript** — headless, platform-agnostic |
| Testing | **Vitest 4** (unit + integration) + **Playwright** (E2E) |
| Language | TypeScript 5.9, `strict` mode throughout |

---

## Quick Start

### Prerequisites

| Tool | Minimum version | Check |
|---|---|---|
| Node.js | 20 | `node -v` |
| pnpm | 9 | `pnpm -v` |
| Docker Desktop | any recent | `docker -v` |

### 1 — Clone and install

```bash
git clone <repo-url> timesheet-tracker
cd timesheet-tracker
pnpm install
```

### 2 — Create the environment files

**API / database** — create a `.env` at the **repo root** (next to `docker-compose.yml`):

```dotenv
# .env
DATABASE_URL=postgresql://timesheet:timesheet@localhost:5433/timesheet

# Optional — overrides the port Docker exposes PostgreSQL on.
# Only needed if 5433 is already taken on your machine.
# DB_HOST_PORT=5434
```

> The API also accepts `PORT` (default `3333`) and `CORS_ORIGIN` (default `*`).

**Web client** — copy the example file:

```bash
cp apps/web/.env.example apps/web/.env.local
```

This sets `NEXT_PUBLIC_API_URL=http://localhost:3333`. Only change it if the API runs on a different port.

### 3 — Start PostgreSQL

```bash
docker compose up -d
```

Wait a few seconds for the health check to pass:

```bash
docker compose ps   # Status should be "healthy"
```

### 4 — Run database migrations

```bash
pnpm db:migrate
```

### 5 — Seed sample data (recommended)

```bash
pnpm db:seed
```

This inserts **14 employees** and **4 weeks** of time entries with varied hours (some with overtime, some pending, some approved) so every screen has realistic data immediately.

### 6 — Start the development servers

```bash
pnpm dev
```

This command starts Docker (if not already running), the API server, and the Next.js dev server concurrently via Nx.

| Service | URL |
|---|---|
| Web app | http://localhost:3000 |
| API | http://localhost:3333 |
| Swagger UI | http://localhost:3333/docs/ui |
| Health check | http://localhost:3333/health |

The web app redirects automatically to `/en` (or `/es` — use the language toggle in the top-right corner).

### Troubleshooting

**Port 5433 already in use**

Add `DB_HOST_PORT=5434` to `.env`, then run `docker compose up -d` again (compose re-reads it).

**`DATABASE_URL is required` error on API start**

The `.env` file must be at the repo root (same directory as `docker-compose.yml`). The API loads it from there regardless of working directory.

**`Cannot connect to database` on first migrate**

The Postgres container takes a few seconds to be ready. Run `docker compose ps` and wait until status is `healthy`, then retry `pnpm db:migrate`.

**Nx cache issues after switching branches**

```bash
pnpm nx reset
```

---

## Running Tests

### Unit + Integration tests

```bash
pnpm test
```

Runs all Vitest suites across the monorepo via `nx run-many`. Integration tests spin up against a dedicated `timesheet_test` database (auto-created and migrated by the Vitest global setup — no manual step needed).

Run a specific project only:

```bash
pnpm nx run shared:test
pnpm nx run api:test
pnpm nx run web:test
```

### End-to-End tests (Playwright)

**First time only** — install the browser binaries (Chromium, Firefox, WebKit):

```bash
pnpm nx run e2e:e2e:install
```

E2E tests require the full stack running. In one terminal:

```bash
pnpm dev
```

In a second terminal:

```bash
pnpm nx run e2e:e2e
```

The browser opens automatically so you can watch the tests run.

Playwright covers all three core screens:

- `employees.spec.ts` — create, edit, deactivate, reactivate
- `time-entries.spec.ts` — log hours, edit, delete, locking
- `weekly-summary.spec.ts` — approve → entries locked → reject → entries unlocked

### Type check

```bash
pnpm typecheck
```

Runs `tsc --noEmit` across all packages in strict mode.

---

## Project Structure

```
timesheet-tracker/
├── apps/
│   ├── api/                        Hono REST API
│   │   ├── src/
│   │   │   ├── main.ts             Entry point (@hono/node-server)
│   │   │   ├── app.ts              Middleware, /health, error handler
│   │   │   ├── config/env.ts       Zod-validated environment variables
│   │   │   ├── common/errors/      AppError, error envelope, en/es messages
│   │   │   ├── db/
│   │   │   │   ├── schema/         Drizzle table definitions (3 tables)
│   │   │   │   └── seed.ts         Idempotent seed script
│   │   │   └── modules/
│   │   │       ├── employees/      routes · service · mapper · openapi
│   │   │       ├── time-entries/   routes · service · mapper · openapi
│   │   │       ├── weekly-summary/ routes · service · openapi
│   │   │       └── dashboard/      routes · service · openapi
│   │   └── drizzle/                Generated SQL migrations
│   │
│   ├── web/                        Next.js 16 App Router client
│   │   └── src/
│   │       ├── app/[locale]/       Locale-prefixed routes (en / es)
│   │       ├── features/           Co-located API · hooks · components
│   │       │   ├── employees/
│   │       │   ├── time-entries/
│   │       │   ├── weekly-summary/
│   │       │   └── dashboard/
│   │       ├── components/         Shared UI primitives + shadcn/ui
│   │       ├── lib/                axios client · TanStack Query · formatters
│   │       └── i18n/messages/      en.json · es.json
│   │
│   └── e2e/                        Playwright end-to-end tests
│
├── packages/
│   └── shared/                     Headless TypeScript (no framework deps)
│       └── src/
│           ├── week/pay.ts         calculateWeeklyPay() — THE core calculation
│           ├── employee/           Employee type + Zod schemas
│           ├── time-entry/         TimeEntry type + Zod schemas
│           ├── approval/           WeeklyApproval type + Zod schemas
│           └── utils/              dates · errors · locale · pagination
│
├── specs/                          Spec-driven docs (committed as deliverables)
│   ├── overview.md                 Domain model + API surface index
│   ├── PLAN.md                     Build log with "Done when" criteria per phase
│   ├── foundations/                shared-package · error-envelope · api · web
│   └── features/                   employees · time-entries · weekly-summary · approval · dashboard
│
├── docs/diagrams/                  Mermaid architecture / ER / state-machine
├── docker-compose.yml              PostgreSQL 16 on port 5433
├── package.json                    Workspace root scripts
├── pnpm-workspace.yaml
├── nx.json
├── vitest.workspace.ts
├── CLAUDE.md                       AI agent instructions (Part 3 artifact)
├── AI_WORKFLOW.md                  AI workflow writeup (Part 3)
└── WRITEUP.md                      Written communication (Part 2, human-authored)
```

---

## Domain Model

### Employees

- `status` is derived: `active` if `deactivatedAt` is `null`, `inactive` otherwise.
- **Soft delete only** — deactivating sets `deactivatedAt`; the row is never removed.
- Inactive employees are hidden from default lists but their time entries and approval history remain visible.

### Time Entries

- `date` is a date-only string (`YYYY-MM-DD`) — no timezone, no time component.
- `hours` must be between **0.25 and 24**, in **0.25 increments** (quarter-hour granularity).
- Rejected by the API if: the date is in the future, the employee is inactive, or the week is `approved`.

### Week Definition

- A week runs **Monday → Sunday**. `weekStart` is always the Monday of that week.
- Defined once in `packages/shared` (`getWeekStart()`) and reused everywhere.

### Overtime & Pay

```
regularHours  = min(totalHours, 40)
overtimeHours = max(totalHours − 40, 0)
pay           = regularHours × rate + overtimeHours × rate × 1.5
```

Monetary values are rounded **half-up to 2 decimals** at the final boundary. The formula lives in `packages/shared/src/week/pay.ts` and is unit-tested.

### Approval Flow

```
        ┌─────────┐
  ───►  │ pending │
        └────┬────┘
    approve  │  reject
       ┌─────┴────┐
       ▼          ▼
  ┌──────────┐ ┌──────────┐
  │ approved │ │ rejected │
  └──────────┘ └──────────┘
       │               │
       │ reject        │ approve
       └───────────────┘
```

- `approved` is the **only status that locks** time entries.
- `pending` and `rejected` weeks remain fully editable.
- Flipping between `approved` and `rejected` is always allowed.
- Absence of a row in `weekly_approvals` = implicitly `pending`.

---

## API Reference

All errors use the envelope: `{ "error": { "code": "STABLE_CODE", "message": "…" } }`.
Interactive docs: **http://localhost:3333/docs/ui**

### Employees

| Method | Path | Description |
|---|---|---|
| `GET` | `/employees` | List employees (paginated). `?includeInactive` `?search` |
| `POST` | `/employees` | Create employee |
| `PATCH` | `/employees/:id` | Update name or hourly rate |
| `POST` | `/employees/:id/deactivate` | Soft-delete (sets `deactivatedAt`) |
| `POST` | `/employees/:id/reactivate` | Re-activate |

### Time Entries

| Method | Path | Description |
|---|---|---|
| `GET` | `/time-entries` | List entries. `?employeeId` `?weekStart` |
| `POST` | `/time-entries` | Log hours (blocked if week approved or employee inactive) |
| `PATCH` | `/time-entries/:id` | Edit hours or date (blocked if week approved) |
| `DELETE` | `/time-entries/:id` | Remove entry (blocked if week approved) |

### Weekly Summary

| Method | Path | Description |
|---|---|---|
| `GET` | `/weekly-summary` | Summary per employee for a week (paginated) |
| `GET` | `/weekly-summary/approval` | Single approval record |
| `POST` | `/weekly-summary/approve` | Approve a week → locks entries |
| `POST` | `/weekly-summary/reject` | Reject a week → unlocks entries |

### Dashboard

| Method | Path | Description |
|---|---|---|
| `GET` | `/dashboard` | KPIs + pending approvals preview for a given `?weekStart` |

---

## Key Design Decisions

### 1 — Shared package as the single source of truth

All types, Zod schemas, and the pay calculation are defined exactly once in `packages/shared` and imported by both the API and the web client. This eliminates the class of bug where client and server diverge on validation rules or rounding behavior. The package enforces this at the module boundary: no React, no Node built-ins, no `window` — pure TypeScript only.

### 2 — Client-side pay calculation (deliberate)

The API returns raw aggregates (`totalHours`, `hourlyRate`, approval `status`). The web client calls `calculateWeeklyPay()` from shared to render regular hours, overtime hours, and total pay. This satisfies the assessment requirement ("the client must genuinely consume the shared calculation") and demonstrates that the formula is portable — usable in a React Native client with zero changes.

### 3 — Atomic locking enforcement

Time-entry mutations (create, update, delete) check the week's approval status **inside the same database transaction** as the write. This prevents a race condition where two concurrent requests could both read `pending`, both pass the check, and both write. The lock check and the DML are atomic.

### 4 — Error codes as stable contracts

Every API error has a machine-readable `code` (`WEEK_LOCKED`, `EMPLOYEE_INACTIVE`, `NOT_FOUND`, etc.) alongside a human-readable `message`. Codes are defined in `packages/shared/src/utils/errors.ts` and never change — clients can branch on them without parsing strings. Messages are localized in `apps/api/src/common/errors/messages.ts`.

---

## Common Commands Reference

```bash
# Install all workspace dependencies
pnpm install

# Start PostgreSQL
docker compose up -d

# Database
pnpm db:migrate          # Apply Drizzle migrations
pnpm db:seed             # Seed 14 employees + 4 weeks of data
pnpm nx run api:db:studio  # Open Drizzle Studio (visual DB browser)

# Development
pnpm dev                 # Start API + Web (and Docker) concurrently

# Testing
pnpm test                    # All unit + integration tests
pnpm nx run e2e:e2e:install  # Install Playwright browsers (first time only)
pnpm nx run e2e:e2e          # E2E with browser window visible (app must be running)
pnpm nx run e2e:e2e:report   # Open last HTML test report
pnpm typecheck               # Full TypeScript strict check

# Quality
pnpm lint                # ESLint across all packages
pnpm format              # Prettier write
pnpm format:check        # Prettier check (CI mode)

# Build
pnpm build               # Production build for all apps
```
