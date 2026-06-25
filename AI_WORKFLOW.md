# AI Workflow — Mini Timesheets

> Part 3 of the Technical Assessment — how AI was used to build this project.

---

## Tools Used

| Tool | Role |
|---|---|
| **Claude Code** (CLI + VS Code extension) | Primary builder — wrote all code, specs, tests, and diagrams |
| **Claude.ai** (web, with claude-sonnet-4-6) | Design handoff review, architectural discussions |
| **Claude Design** (Canva MCP via claude.ai) | Generated the hi-fi UI mockups committed to `docs/design/` |
| **ctx7 CLI** (`npx ctx7@latest`)  | Fetched current docs for Nx, Hono, Drizzle, Next.js, next-intl before using their APIs |

Claude Code was the workhorse. Every file in this repo — types, routes, components, tests, SQL migrations, diagrams, this document — was written by Claude Code from the specs I defined.

---

## Philosophy: Spec First, Then Code

The first commit in this repo (`f106678`) was not an `npm init` or a `git init` — it was `CLAUDE.md`, `specs/`, and `.claude/skills/`. I set up the AI's operating context before writing a single line of product code.

The reasoning: Claude Code is fast, but it drifts without constraints. A precise spec is cheaper to write than a bad implementation is to fix. So for every non-trivial piece of work, the flow was:

1. **Write or read the spec** in `specs/` — domain rules, API contracts, edge cases, "Done when" criteria
2. **Implement against the spec** — Claude Code reads the spec as context and builds exactly what's documented
3. **Verify** — typecheck, tests, visual check
4. **If something changed**, update the spec first, then the code — never let them drift

The `specs/PLAN.md` file served as the build log: one checkbox per subphase, ticked as it was completed.

---

## Project-Specific Skills

As patterns repeated across phases, I wrote custom skills under `.claude/skills/` to encode them once and not re-explain them each time. Claude Code loaded the relevant skill before starting each type of task.

### `git-flow` — Phase-based git conventions
One branch per phase (`feat/phase-N-<slug>`), one conventional commit per subphase, push, then a PR back to `develop`. The skill enforces this so Claude Code never commits directly to `main` or `develop`. PR template included in `.claude/skills/git-flow/references/`.

### `create-module` — Vertical-slice feature builder
Given a spec, builds the full vertical slice in the correct order: `packages/shared` types + Zod schemas → error codes → DB schema → OpenAPI contract → service + mapper → routes → integration test → API client → TanStack Query hooks → React components → i18n strings → page. Mirrors the existing module structure exactly so every feature looks like the same hand.

### `db-change` — Safe Drizzle schema workflow
Encodes the project's DB conventions (numeric for money, `date` columns not `timestamp`, `pgEnum` for status columns, soft delete via `deactivatedAt`, never edit an applied migration) and walks through the generate → review → apply sequence. Idempotent seed guidance included.

### `spec-author` — Spec-first planner
Interviews on business need, scope, domain rules, API contracts, edge cases, and done-when criteria, then writes a spec file under `specs/features/<slug>.md` using a 9-section template. Does not implement code — separates design from build. Used when any new feature scope emerged (dashboard, pagination, employee filter).

### `agent-browser` — Visual verification
Drives the running app via a headless browser to verify the real UI in both locales (en/es) and both color modes (light/dark). Reads pages as text first (cheaper) and only screenshots when pixels matter. Closes the browser when done — the daemon keeps running otherwise.

### `shadcn` — UI component rules
Enforces shadcn-first UI: always reach for a shadcn/ui component before writing custom markup. Composition patterns, form patterns, semantic token usage (`bg-primary` not raw colors), icon conventions. Used throughout Phase 3.

### `find-docs` / ctx7 — Current documentation
Fetches live docs for any library before using its API. Critical for Nx, Hono, Drizzle, and Next.js 16 / next-intl — all of these changed significantly since the model's training cutoff. Invoked before touching any of those APIs.

There is also a `test-author` agent (`.claude/skills/` + agents config) that writes meaningful tests from spec's "Verification / Done when" + edge cases, mirrors existing test style, and runs the suite to report real bugs rather than massaging code to pass tests.

---

## Chronological Build Log

### Phase 0 — Scaffold & tooling
**Branch:** `chore/phase-0-scaffold` → PR #2

Set up the AI operating context before any product code:
- `CLAUDE.md` — the project constitution (hard rules, domain rules, architecture rules, naming conventions)
- `specs/` directory with `overview.md` and initial feature stubs
- `.claude/skills/git-flow` — so every subsequent phase would follow the branch/commit/PR flow

Then scaffolded the monorepo:
- `pnpm create-nx-workspace` with the official TypeScript preset (Nx 22 + pnpm 10)
- `docker-compose.yml` for PostgreSQL 16 (host port 5433 to avoid local conflicts)
- Three Nx projects: `packages/shared` (js lib + Vitest), `apps/api` (node + Hono-ready), `apps/web` (Next.js 16 App Router)
- Vitest, ESLint flat config, Prettier wired across all three

**Why this order:** The AI needs its instructions before it writes anything. CLAUDE.md-first means every subsequent session opens with the rules already loaded.

---

### Phase 1 — `packages/shared` — The headless core
**Branch:** `feat/phase-1-shared-package` → PR #3

Spec: `specs/foundations/shared-package.md`

Built in subphases, smallest dependency first:

**1.1 Domain types** — `Employee`, `TimeEntry`, `WeeklyApproval`, `WeeklySummaryRow`, `EmployeeStatus`, `ApprovalStatus` enums. No logic yet, just the shape of the domain.

**1.2 Error codes** — `ErrorCode` union and `ApiErrorBody` envelope shape (`{ error: { code, message } }`). Owned by shared so both API and web could import the same type.

**1.3 UTC-safe date helpers** — `getWeekStart(date)`, `getWeekEnd(weekStart)`, `isFutureDate()`, `addDays()`, `isInWeek()`. Never `new Date(str)` — avoids the local-timezone shift bug that breaks payroll date logic. 8 unit tests covering weekday boundaries and month/year rollovers.

**1.4 Zod schemas** — One schema per concept, inferred TypeScript types. TimeEntry hours validated to `[0.25, 24]` in 0.25 increments via `Number.isInteger(h / 0.25)` refinement. No future dates. Employee name/rate. Approval upsert (weekStart must be a Monday). 10 unit tests.

**1.5 `calculateWeeklyPay()`** — The graded requirement. Returns `{ regularHours, overtimeHours, regularPay, overtimePay, totalPay }`. Uses `round2()` (half-up via `Math.round((n + Number.EPSILON) * 100) / 100`) at the final boundary only — never intermediate. 7 unit tests: exactly 40h, 40.25h (one quarter-hour of OT), 0h, 60h, the assessment's sketch case (45.5h @ $22.50/h → $1,085.63), and rounding edge cases.

**1.6 Public API** — Clean `index.ts` re-exports. Package marked `"sideEffects": false`. README documents the surface.

**Why shared first:** Both the API (request validation) and the web client (form validation + pay calculation) consume this package. Building it first means neither layer ever diverges from the domain contract. The pay calculation especially: if the API pre-computed it, the client would have no reason to use the shared package — so the spec explicitly required the client to call `calculateWeeklyPay()` itself, and building shared first enforced that architecturally.

---

### Phase 2 — `apps/api` — Hono + Drizzle
**Branch:** `feat/phase-2-api` → PR #4

Spec: `specs/foundations/api-platform.md` + feature specs (`employees.md`, `time-entries.md`, `approval-flow.md`, `weekly-summary.md`)

**2.1–2.2 DB schema + migrations** — Three Drizzle tables:
- `employees` (uuid PK, `hourly_rate` as `numeric`, `deactivated_at` timestamp nullable, soft-delete only)
- `time_entries` (uuid PK, `date` as Postgres `date` column, `hours` as `numeric`, FK to employees, index on `(employee_id, date)`)
- `weekly_approvals` (uuid PK, `(employee_id, week_start)` unique constraint, `pgEnum` for status)

Money and hours always `numeric` columns — never float. Dates always `date` — never `timestamp`. These are payroll-correctness rules.

**2.3 Seed script** — 3 employees matching the assessment sketch (one inactive with historical entries, one with 45.5h week matching the exact pay example, one pre-approved to demo locking). Idempotent: truncate + insert.

**2.4 Common layer** — The cross-cutting infrastructure that every route uses:
- `AppError` with HTTP status mapping
- `onError` global handler → always emits `{ error: { code, message } }` envelope
- `Accept-Language` parser (handles `en`, `es`, `en-US`, `es-ES`, weighted lists like `es,en;q=0.8`; primary subtag match; default `en`)
- `locale` middleware resolves language onto Hono context
- `zValidator` wrapper maps Zod failures to `VALIDATION_ERROR` envelope
- En/es message map keyed by `ErrorCode`

**2.5 Employees module** — `GET /employees` (list, pagination, `includeInactive` flag, `search`), `POST`, `PATCH`, `POST /:id/deactivate`, `POST /:id/reactivate`. Service enforces soft-delete semantics — `deactivatedAt` set/cleared, row never removed, status derived from null check.

**2.6–2.7 Time-entries + weekly-summary modules** — Time-entry mutations run inside a transaction: the lock check (read `weekly_approvals` status) and the DML write are atomic. This prevents a race condition where two concurrent requests both see `pending`, both pass, and both write. The `GET /weekly-summary` endpoint returns raw aggregates — `totalHours` and `hourlyRate` — and deliberately does *not* compute pay. The client does that.

**2.8 Integration test** — Approval-locking flow against a real isolated `timesheet_test` database. Vitest `globalSetup` provisions and migrates it once per run. Tests run via `app.request()` (in-memory, no actual server). 4 test cases: create entries → approve → write blocked (`WEEK_LOCKED 409`) → reject → write allowed again. Additional tests for soft-delete visibility, validation edge cases, and weekly aggregate correctness added later.

**Bonus: OpenAPI 3.1 + Swagger UI** — `@hono/zod-openapi` added per module. Each feature has a `*.openapi.ts` contract file. Swagger UI at `/docs/ui`, OpenAPI JSON at `/openapi.json`. Added after core API without rewrites.

---

### Phase 3 — `apps/web` — Next.js 16 client
**Branch:** `feat/phase-3-web` → PR #6

Spec: `specs/foundations/web-platform.md` + feature specs

Built in sub-passes rather than one monolithic branch.

**3.1 Foundation** — Tailwind CSS v4 + shadcn/ui init (components.json, `cn()` utility, semantic tokens in `global.css`). Removed Nx scaffold placeholders.

**3.2 Data layer** — `lib/http.ts`: axios instance with request interceptor (injects `Accept-Language` from `<html lang>`) and response interceptor (maps API envelope to typed `ApiError`). Per-feature `api.ts` files. `@timesheet/shared` linked as a workspace dependency — this is where the pay calculation import lives.

**3.3 i18n** — Started with `react-i18next`, later migrated to `next-intl` (3.19) with native `[locale]` URL routing and SSR. The migration was necessary to avoid hydration mismatches when Next.js renders server-side with one locale and the client rehydrates with another. Migration was a spec-update-first, code-second change.

**3.4–3.6 Core screens** — Employees (CRUD + soft delete), Time Entries (week-scoped, lock-aware), Weekly Summary (the graded screen). The weekly summary is where the shared package is visibly consumed:

```tsx
// web calls calculateWeeklyPay from packages/shared — the graded requirement
const { regularHours, overtimeHours, totalPay } = calculateWeeklyPay(row.totalHours, row.hourlyRate);
```

Money formatted with `Intl.NumberFormat` per active locale (en → `$1,085.63`, es → `$1.085,63`). Optimistic updates on approve/reject — the UI flips immediately, rolls back on error.

**3.7–3.9 Loading/error/empty + test** — Every async view has a skeleton loader, error alert with retry, and empty state. Frontend component test (`weekly-summary-table.spec.tsx`) asserts the row calls `calculateWeeklyPay` and renders the correct pay breakdown.

**3.10–3.12 UI redesign** — Claude Design (via claude.ai's Canva MCP) generated hi-fi mockups committed to `docs/design/`. Claude Code then mapped the design tokens to shadcn semantic variables (purple accent, zinc neutrals, amber for overtime, green for approved, red for rejected). Dark mode via `next-themes`. Sticky header with logo, segmented nav, locale switch, theme toggle.

**3.14–3.18 Pagination + employee filter** — `Paginated<T>` contract added to `packages/shared`. Server-side pagination on `/employees` and `/weekly-summary` (1-based, default 10, max 100). Shadcn Pagination control in card footer, `keepPreviousData` to avoid flash. Searchable `EmployeeCombobox` (shadcn Popover + Command) for employee filtering across screens.

---

### Phase 4 — Docs, tests, delivery
**Branches:** various → PRs #7, #8, #9, #10, #11

- **Mermaid diagrams** committed to `docs/diagrams/` — architecture (dependency + runtime view), ER diagram (3 tables), approval state machine + locking sequence
- **Playwright E2E suite** (`apps/e2e`) — 3 specs covering all core screens with Page Object Model. Employees: create, edit, deactivate, reactivate. Time entries: log, edit, delete, locking. Weekly summary: approve → entries locked → reject → entries unlocked
- **README rewrite** — comprehensive fresh-clone guide verified by actually cloning to a clean directory
- **Spec sync** — specs updated to match final implementation after each phase; `spec-guardian` agent used to audit drift

---

## How Each Session Typically Ran

A typical working session looked like this:

1. **Open Claude Code** in the project root (VS Code extension or CLI)
2. **Load the relevant skill** — e.g., `/create-module` before building a feature, `/db-change` before touching the schema, `/git-flow` before committing
3. **Point at the spec** — "Build the time-entries module per `specs/features/time-entries.md`"
4. **Review each file before accepting** — Claude Code shows diffs; I approved or redirected
5. **Run typecheck** — `pnpm typecheck` — before finishing any subphase (captured as a memory rule after one session where a type error was missed)
6. **Visual verify** — `/agent-browser` to check the real UI in en/es × light/dark
7. **Commit + PR** — `/git-flow` to create the branch commit and open the PR; I merged

Claude Code never pushed directly. Every merge was a human approval.

---

## What AI Did vs. What I Did

**Claude Code built:**
- All TypeScript code across all three packages
- All Drizzle schemas and migrations
- All Vitest tests (unit, integration, component)
- All Playwright E2E specs
- All Mermaid diagrams
- All API error messages in en/es
- All i18n message files (en.json, es.json)
- The OpenAPI spec and Swagger UI wiring
- This document

**I (the human) did:**
- Defined the acceptance criteria and domain rules (CLAUDE.md, specs)
- Approved or rejected each phase PR — no merge without review
- Redirected when the AI drifted from the spec or picked a wrong abstraction
- Wrote `WRITEUP.md` — human voice only, no AI
- Verified the README by following it on a clean environment
- Submitted the assessment

---

## Artifacts in This Repo (Part 3 Deliverables)

| Artifact | Path | Purpose |
|---|---|---|
| Project constitution | `CLAUDE.md` | AI's operating context: hard rules, domain rules, architecture rules |
| Build plan | `specs/PLAN.md` | Phase-by-phase chronology with "Done when" criteria |
| Domain overview | `specs/overview.md` | Domain model + locked architectural decisions |
| Foundation specs | `specs/foundations/` | Shared package, API platform, web platform, error envelope + i18n |
| Feature specs | `specs/features/` | Employees, time entries, approval flow, weekly summary, dashboard |
| Custom skills | `.claude/skills/` | git-flow, create-module, db-change, spec-author, agent-browser, shadcn, find-docs |
| Design handoff | `docs/design/` | Claude Design hi-fi mockups + design brief |
| Architecture diagrams | `docs/diagrams/` | Mermaid architecture, ER, approval state machine |

All committed as-is, not cleaned up — these are the real working artifacts.
