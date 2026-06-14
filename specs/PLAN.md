# Implementation Plan — Phases & Subphases

Granular execution roadmap. Phases run roughly in order; each subphase has a
concrete goal and a "Done when" acceptance check. Tick boxes as work completes.

> Area specs (the _what_) live in `00`–`03`. This file is the _how & order_.

---

## Phase 0 — Scaffold & tooling

- [x] **0.1 Workspace** — Nx workspace with pnpm (official `create-nx-workspace` TS
      preset, merged into the existing repo). Nx agent config consolidated into our
      `CLAUDE.md` + `.claude/settings.json`; other-tool configs discarded. Adapted
      pnpm-based CI added as a bonus.
      _Done when:_ `pnpm install` succeeds and `pnpm exec nx` runs. ✓
- [x] **0.2 Database infra** — `docker-compose.yml` with PostgreSQL 16 + named
      volume + healthcheck; `.env.example` with `DATABASE_URL`.
      _Done when:_ compose file validated (`docker compose config`). ✓ (Bringing it
      up needs Docker Desktop running — exercised in Phase 2.)
- [x] **0.3 Projects** — `packages/shared` (@nx/js lib, vitest), `apps/api`
      (@nx/node app, framework none for Hono), `apps/web` (@nx/next app, App Router,
      src). Next.js 16 installed by the generator. Scope `@timesheet/*`.
      _Done when:_ `nx show projects` lists all three; lint/typecheck/build pass. ✓
- [x] **0.4 Test/lint tooling** — Vitest in all three (api=node, web=jsdom+react,
      shared); `passWithNoTests` so empty projects don't fail. ESLint flat config +
      Prettier already wired by generators.
      _Done when:_ `pnpm test` runs (0 tests ok) and `pnpm lint` passes. ✓

---

## Phase 1 — `packages/shared` (highest value, build first)

- [x] **1.1 Types** — `Employee`, `TimeEntry`, `WeeklyApproval`, `WeeklySummaryRow`,
      `EmployeeStatus`/`ApprovalStatus` enums. ✓
- [x] **1.2 Error codes** — `ErrorCode` union + `ApiErrorBody` envelope in
      `errors.ts` (en/es messages stay in the API). ✓
- [ ] **1.3 Date/week helpers** — `getWeekStart`, `isFutureDate`, week range; pure
      (no local TZ).
      _Done when:_ unit tests pass for every weekday + month/year boundaries.
- [ ] **1.4 Zod schemas** — create/update employee, create/update time entry,
      approve/reject; inferred input types. Encode hours 0.25–24 **in 0.25
      increments** (`.multipleOf(0.25)`), no future date.
      _Done when:_ schemas validate good/bad inputs in tests.
- [ ] **1.5 Pay calculation** — `calculateWeeklyPay(totalHours, rate)` + `round2`.
      _Done when:_ unit tests cover 40h, 40.25h, <40h, decimals across days, 0h,
      60h, and a fractional-cents rounding case.
- [ ] **1.6 Public API** — clean `index.ts` exports; nothing platform-specific
      imported.
      _Done when:_ `apps/api` and `apps/web` can import from `@timesheet/shared`.

---

## Phase 2 — `apps/api` (Hono + Drizzle)

- [ ] **2.1 DB schema** — Drizzle tables: `employees`, `time_entries`,
      `weekly_approvals` (+ unique `(employee_id, week_start)`, indexes).
- [ ] **2.2 DB client + migrations** — Drizzle Kit config; first migration applied.
      _Done when:_ `drizzle-kit` generates + pushes the schema to Postgres.
- [ ] **2.3 Seed script** — a few employees + entries for an instantly usable app.
- [ ] **2.4 Error envelope + i18n middleware** — central error handler emitting
      `{ error: { code, message } }`; en/es map by `Accept-Language`.
      _Done when:_ an intentional error returns the localized envelope + right status.
- [ ] **2.5 Employees routes** — list (`includeInactive`), create, patch,
      deactivate, reactivate (soft delete).
      _Done when:_ inactive hidden by default; their entries still fetchable.
- [ ] **2.6 Time-entries routes** — list (week filter), create, patch, delete with
      full validation (active employee, no future date, week not locked).
- [ ] **2.7 Weekly-summary routes** — compute per-employee summary via shared calc;
      approve/reject upserts approval; approved week locks entries.
- [ ] **2.8 Integration test** — approval-locking flow (create → approve →
      edit/delete blocked with `WEEK_LOCKED` 409). Isolated test DB.

---

## Phase 3 — `apps/web` (Next.js 16)

- [ ] **3.1 App setup** — Next.js App Router, Tailwind, shadcn/ui init.
- [ ] **3.2 Data layer** — typed `api` client (sets `Accept-Language`, parses
      envelope) + TanStack Query provider/hooks.
- [ ] **3.3 i18n** — en/es translation files + locale switch; wires header.
- [ ] **3.4 Employees screen** — list + show-inactive toggle + create/edit dialog
      (shared Zod via react-hook-form) + deactivate/reactivate.
- [ ] **3.5 Time-entries screen** — employee selector + list + log/edit/delete;
      entries in approved weeks are read-only.
- [ ] **3.6 Weekly-summary screen (core)** — week picker, per-employee
      regular/overtime/pay (shared calc), approve/reject, locked state.
- [ ] **3.7 Loading/error states** — every async view has skeleton/spinner + envelope
      error display.
- [ ] **3.8 Optimistic updates** — approve/reject + quick mutations update cache
      immediately, roll back on error.
- [ ] **3.9 Frontend test** — one meaningful component/hook test.

---

## Phase 4 — Docs & delivery

- [ ] **4.1 README** — fresh-clone setup that actually works (prereqs, env,
      docker, migrate, seed, run api + web, test).
- [ ] **4.2 AI_WORKFLOW.md** — tools, how the specs/CLAUDE.md drove the build.
- [ ] **4.3 WRITEUP.md** — _human-written, no AI_ (why-you/why-us, 3 trade-offs,
      Part 2.1 questions).
- [ ] **4.4 Fresh-clone verification** — clone into a clean dir, follow README,
      confirm api + web + tests run.
- [ ] **4.5 Submit** — private repo + invite `santigp258` (or public); email
      `santiago@ocmiworkerscomp.com` with link, visibility, caveats.

---

## Progress notes

> Append short notes as phases complete (decisions made, deviations from spec).
> This becomes useful raw material for AI_WORKFLOW.md.
