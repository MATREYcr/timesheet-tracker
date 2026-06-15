# CLAUDE.md

Project instructions for AI agents (Claude Code) working in this repository.
Read this fully before writing any code. These rules override default behavior.

---

## 1. What this project is

**Mini Timesheets** — a small timesheet tracker for hourly employees, built as a
take-home assessment. It is a deliberately simplified slice of a US payroll system.

The app does three things:

1. Keep a roster of hourly employees (name + hourly rate).
2. Let someone log time entries for them (date + hours worked).
3. Show a weekly summary per employee (regular vs overtime hours, total pay) and
   let a reviewer approve or reject each employee's week. Approved weeks are locked.

This is a normal CRUD application. **It contains no AI features.** AI (Claude Code)
is the tool used to _build_ it, not part of the product.

---

## 2. Tech stack (locked — do not substitute without asking)

| Layer        | Technology                                                        |
| ------------ | ----------------------------------------------------------------- |
| Monorepo     | **Nx** + **pnpm workspaces**                                      |
| API          | **Hono** + **Drizzle ORM** + **Zod**, **PostgreSQL**              |
| Database     | PostgreSQL via **docker-compose**                                 |
| Web client   | **Next.js 16** (App Router) + **TanStack Query**                  |
| Styling / UI | **Tailwind CSS** + **shadcn/ui**                                  |
| Shared logic | Plain TypeScript (headless) — types, Zod schemas, pay calculation |
| Tests        | **Vitest**                                                        |
| Language     | TypeScript end to end, `strict` mode on                           |

Always fetch current docs (via the `ctx7` CLI) before using Nx, Hono, Drizzle, or
Next.js APIs — these change often and training data may be stale.

---

## 3. Monorepo layout

```
timesheet-tracker/
├── apps/
│   ├── api/                Hono + Drizzle REST API
│   └── web/                Next.js 16 client
├── packages/
│   └── shared/             Headless TS: types, Zod schemas, pay calculation
├── specs/                  Spec-driven plans (source of truth before coding)
├── docker-compose.yml      PostgreSQL
├── CLAUDE.md               This file
├── README.md               Setup instructions (must work from a fresh clone)
├── WRITEUP.md              Part 2 — written by the human, NO AI (see §9)
└── AI_WORKFLOW.md          Part 3 — how AI was used
```

---

## 4. Domain rules (business logic — easy to get wrong, get these exactly right)

### Employees

- Fields: `firstName`, `lastName`, `hourlyRate`, `status` (`active` | `inactive`).
- **Soft delete only.** Deactivating sets a `deactivatedAt` timestamp; never delete
  the row. Inactive employees are hidden from default lists but their historical
  time entries remain visible. `status` is derived from `deactivatedAt` being null.

### Time entries

- Fields: `employeeId`, `date` (date-only, `YYYY-MM-DD`, no time, no timezone),
  `hours` (decimal, e.g. `7.5`).
- Validation (enforced via shared Zod schemas):
  - Hours must be between **0.25 and 24** inclusive, **in 0.25 increments**
    (quarter-hour granularity; `7.5` ok, `7.3` rejected).
  - **No future dates** (relative to today).
  - **No entries for inactive employees.**
  - No **create/edit/delete** of entries whose week is already **approved** (locking).

### Week definition

- A week runs **Monday → Sunday**.
- `weekStart` is always the Monday (date-only) of that week and is the canonical
  key for a week. Define this once in `packages/shared` and reuse everywhere.

### Overtime & pay (THE core calculation — see §5)

- Overtime = hours worked **beyond 40 in a single week**.
- `regularHours = min(totalHours, 40)`, `overtimeHours = max(totalHours - 40, 0)`.
- `pay = regularHours * rate + overtimeHours * rate * 1.5`.
- Monetary amounts are rounded **half-up to 2 decimals** at the final boundary.
  Never compare raw floats for equality.

### Weekly summary (computed, not stored)

- For a given `weekStart`, return one row per employee **who has at least one time
  entry in that week** — active or inactive. This is how an inactive employee's
  historical weeks stay visible (per soft-delete rules).
- The API returns the **raw aggregate** per employee: `totalHours`, `hourlyRate`,
  and the approval `status`. It does **not** compute pay. The **web client** derives
  regular/overtime hours and pay by calling `calculateWeeklyPay` from `packages/shared`
  (see §5). This guarantees the client genuinely consumes the shared calculation.

### Approval flow

- Each (employee, week) has a status: `pending` → `approved` or `rejected`.
- Persisted in its own `weekly_approvals` table keyed by `(employeeId, weekStart)`.
  Absence of a row = implicitly `pending`. Only the status is stored.
- **Only `approved` locks** the week's time entries (no create/edit/delete).
  `pending` and `rejected` weeks remain fully editable, so a rejected week can be
  fixed and re-submitted. Re-approving after a reject is allowed.

---

## 5. Architecture rules (graded heavily — do not violate)

1. **The overtime/pay calculation MUST live in `packages/shared`** and be covered by
   unit tests. It must **never** be inlined in API routes or client components.
2. **The client MUST consume the shared package** for its types, Zod validation
   schemas, and the pay calculation. Do not duplicate or redefine them. Concretely:
   the weekly summary screen calls `calculateWeeklyPay(totalHours, rate)` from
   `shared` to render regular/overtime/pay — it must not just display numbers
   pre-computed by the API.
3. **`packages/shared` is headless and platform-agnostic.** No React, no React
   Native, no `window`, no `process`, no framework imports. Pure TypeScript only.
4. **Consistent error envelope** for every API error:
   ```json
   { "error": { "code": "STABLE_CODE", "message": "safe user-facing text" } }
   ```
   with an appropriate HTTP status. `code` is stable and machine-readable; `message`
   is safe to show to users (never leak internals or stack traces).
5. **API error messages must support English and Spanish**, selected by the
   `Accept-Language` header (default English). Map each `code` → `{ en, es }`.

---

## 6. Conventions

- **TypeScript:** `strict` mode. No `any` (use `unknown` + narrowing). Prefer
  `type`/inference; share types from `packages/shared`.
- **Validation:** one Zod schema per concept in `shared`, used by both API (request
  parsing) and web (form validation). Single source of truth.
- **Money:** store `hourlyRate` as a precise numeric type (Drizzle `numeric`), never
  a float column. Round only at display/output boundaries, half-up, 2 decimals.
- **Dates:** date-only values are strings (`YYYY-MM-DD`). Timestamps
  (`deactivatedAt`, `createdAt`) are real timestamps. **Never** parse a date-only
  value with `new Date(str)` (local-timezone shift bug) — keep it as a string and
  use the UTC-safe helpers in `shared`. Use Postgres `date` columns, not `timestamp`.
- **Accept-Language:** parse robustly — accept `en`, `es`, `en-US`, `es-ES`, and
  weighted lists (`es,en;q=0.8`); match on the primary subtag; default to `en`.
- **Money formatting:** the calculation in `shared` returns rounded numbers; the UI
  formats them with `Intl.NumberFormat` per active locale (en → `$1,085.63`,
  es → `$1.085,63`). Never hand-roll currency strings.
- **Naming:** `camelCase` in TS, `snake_case` in the database (map via Drizzle).
- **i18n:** UI ships in English and Spanish (bonus scope). Keep all user-facing
  strings in translation files, never hardcoded.
- **Comments:** only when they add value — explain the **why** (non-obvious
  decisions, trade-offs, gotchas), never restate the **what** the code already says.
  No redundant file-header summaries; prefer self-documenting code and names.
- **Commits:** small, conventional (`feat:`, `fix:`, `chore:`, `test:`, `docs:`).

---

## 7. Testing (meaningful, not exhaustive)

- **Required:** unit tests for the pay calculation in `shared`, covering edge cases:
  exactly 40h, just over 40h, decimal hours, zero hours, hours split across days.
- **Required:** at least one API integration test — the approval flow locking
  entries is the prime candidate.
- **Bonus:** at least one frontend test (a hook or component).
- Run with Vitest. Tests must pass from a fresh clone.

---

## 8. Workflow (spec-driven)

This project is built spec-first. The flow for any non-trivial piece of work:

1. Read / write the relevant spec in `specs/` — define _what_ and the edge cases
   before writing code.
2. Implement against the spec.
3. Verify with tests.
4. If requirements change, update the spec, then the code.

`specs/` files are committed as-is and are deliverable artifacts. Do not delete or
polish them away.

### Capturing preferences & corrections

If the user corrects the same bad practice more than once, or states a way they
prefer things done, **record it as a rule in this `CLAUDE.md`** (in the most fitting
section) so it is applied automatically from then on — don't make them repeat
themselves. Keep each captured rule short and concrete.

### Skills

If a project-specific pattern starts repeating and is painful to redo by hand
(e.g. "add an API route with Zod validation + error envelope + i18n"), create a
focused custom skill under `.claude/skills/` to capture it. Only create a skill
when a real, recurring need appears — never preemptively. One-off knowledge belongs
in `CLAUDE.md` or a spec, not a skill.

---

## 9. Hard rules — do not break these

- **Always build to the specs.** `CLAUDE.md` + `specs/` are the source of truth;
  implement against them, never improvise around a documented decision. If a
  decision changes during the work, **update the relevant spec (and this file)
  first, then change the code** — code and specs must never drift apart.
- **`WRITEUP.md` is written entirely by the human. Never write, edit, or polish it
  with AI.** It is evaluated as the candidate's own voice. Do not touch it.
- Do not put the pay calculation anywhere except `packages/shared`.
- Do not import framework/platform code into `packages/shared`.
- Do not hard-delete employees.
- Do not leak internal errors through the API envelope.
- The project must run from a fresh clone by following `README.md`.

---

## 10. Common commands

> Filled in as the project is scaffolded. Keep this section accurate.

```bash
pnpm install              # install all workspace dependencies
docker compose up -d      # start PostgreSQL
# (db migrate / seed — TBD)
# (dev api / dev web — TBD)
# (test — TBD)
```

---

<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

# General Guidelines for working with Nx

- For navigating/exploring the workspace, invoke the `nx-workspace` skill first - it has patterns for querying projects, targets, and dependencies
- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- Prefix nx commands with the workspace's package manager (e.g., `pnpm nx build`, `npm exec nx test`) - avoids using globally installed CLI
- You have access to the Nx MCP server and its tools, use them to help the user
- For Nx plugin best practices, check `node_modules/@nx/<plugin>/PLUGIN.md`. Not all plugins have this file - proceed without it if unavailable.
- NEVER guess CLI flags - always check nx_docs or `--help` first when unsure

## Scaffolding & Generators

- For scaffolding tasks (creating apps, libs, project structure, setup), ALWAYS invoke the `nx-generate` skill FIRST before exploring or calling MCP tools

## When to use nx_docs

- USE for: advanced config options, unfamiliar flags, migration guides, plugin configuration, edge cases
- DON'T USE for: basic generator syntax (`nx g @nx/react:app`), standard commands, things you already know
- The `nx-generate` skill handles generator discovery internally - don't call nx_docs just to look up generator syntax

<!-- nx configuration end-->
