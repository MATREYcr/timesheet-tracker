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
- [x] **1.3 Date/week helpers** — `getWeekStart`, `getWeekEnd`, `addDays`,
      `isInWeek`, `isFutureDate`; UTC-safe (no local TZ). 8 unit tests cover every
      weekday + month/year boundaries. ✓
- [x] **1.4 Zod schemas** — create/update employee, create/update time entry,
      approve/reject; inferred input types. Hours 0.25–24 in 0.25 increments
      (float-safe `Number.isInteger(h / 0.25)` refine), no future date, weekStart
      must be Monday, uuid ids. 10 tests. ✓
      _Done when:_ schemas validate good/bad inputs in tests.
- [x] **1.5 Pay calculation** — `calculateWeeklyPay(totalHours, rate)` + `round2`
      (half-up). 7 tests: 40h, 40.25h, <40h, 0h, 60h, the assessment sketch
      (45.5h @ $22.50 → $1,085.63), and half-up rounding. ✓
- [x] **1.6 Public API** — clean `index.ts` re-exports (types, errors, dates,
      schemas, pay); headless, no platform imports. Package README documents the
      surface. Full monorepo `lint+typecheck+test+build` green. ✓

---

## Phase 2 — `apps/api` (Hono + Drizzle)

- [x] **2.1 DB schema** — Drizzle tables: `employees`, `time_entries`,
      `weekly_approvals` (numeric money/hours, date-only, soft-delete timestamp,
      FKs, composite index, unique `(employee_id, week_start)`). API set to ESM. ✓
- [x] **2.2 DB client + migrations** — postgres-js client; `drizzle.config.ts`
      loads root `.env`; migration `0000` generated and **applied** (3 tables
      verified). Host port remapped to 5433 to avoid clashing with a local
      PostgreSQL on 5432. db:\* scripts added. ✓
- [x] **2.3 Seed script** — `tsx src/db/seed.ts`: 3 employees (Ana inactive with a
      historical entry), Jane's 45.5h week (sketch), John's 32h week pre-approved to
      demo locking. Idempotent (clears then inserts). ✓
- [x] **2.4 Common layer** — `AppError` + status map, i18n (Accept-Language parse +
      en/es messages), central `onError` → envelope, locale middleware, zValidator
      wrapper. `app.ts` factory + `main.ts` bootstrap. 4 i18n unit tests; api
      typecheck/lint/test/build green. ✓
- [x] **2.5 Employees module** — routes + service + mapper: list (`includeInactive`),
      create, patch, deactivate, reactivate (soft delete). Verified end-to-end:
      inactive hidden by default; validation + NOT_FOUND return localized en/es
      envelope. ✓
- [x] **2.6 Time-entries module** — list (`?employeeId=&weekStart=`), create, patch,
      delete; service enforces active employee + week-not-locked (hours/future-date
      via shared Zod). ✓
- [x] **2.7 Weekly-summary module** — `GET ?weekStart=` returns the raw aggregate
      per employee (rows only for those with ≥1 entry that week); approve/reject
      upsert the approval. The API does NOT compute pay (client does). ✓
- [x] **2.8 Integration test** — approval-locking flow via `app.request()` against
      real Postgres: create (pending) → approve → create/edit/delete blocked with
      `WEEK_LOCKED` 409 → reject re-opens. 4 tests pass. CI runs a Postgres service. ✓

---

## Phase 3 — `apps/web` (Next.js 16)

- [x] **3.1 App setup** — Tailwind v4 (PostCSS) + shadcn/ui init (components.json,
      cn util, theme in global.css, Button). Removed Nx welcome scaffold + the
      example Next API route. Home placeholder links to the 3 screens. ✓
- [x] **3.2 Data layer** — `lib/http.ts` axios instance + interceptors (injects
      Accept-Language via `setApiLocale`, maps envelope → `ApiError`); per-feature
      `features/<x>/api.ts` endpoint functions; `lib/query.ts` QueryClient +
      `Providers`. `@timesheet/shared` linked. Per-feature TanStack Query hooks land
      with each screen (3.4–3.6). ✓
- [x] **3.3 i18n** — `react-i18next` (cross-platform: same JSON works in a future
      Expo app) with `locales/en.json`/`es.json`, typed keys via i18next module
      augmentation, `LanguageDetector` (localStorage), `LocaleSwitch`. Provider syncs
      `setApiLocale` so API errors match the UI locale. ✓
- [x] **3.4 Employees screen** — list + show-inactive toggle + create/edit dialog
      (shared Zod via react-hook-form + standardSchemaResolver) + deactivate/reactivate.
      Per-row pending, global mutation error toasts, shadcn Field forms. ✓
- [x] **3.5 Time-entries screen** — employee selector + week picker + log/edit/delete;
      approved weeks render read-only (lock via new `GET /weekly-summary/approval`),
      inactive employees viewable but not editable; delete behind a confirm. ✓
- [x] **3.6 Weekly-summary screen (core)** — week picker, per-employee
      regular/overtime/pay derived client-side via `calculateWeeklyPay`, approve/reject
      with optimistic updates + reopen, locked state. ✓
- [x] **3.7 Loading/error states** — every async view has skeleton + envelope error
      (Alert + retry) + empty state (shadcn Empty). ✓
- [x] **3.8 Optimistic updates** — approve/reject flip the cached row immediately and
      roll back on error; invalidate the time-entry lock state. ✓
- [x] **3.9 Frontend test** — Vitest + Testing Library component test asserting the
      weekly summary row renders the shared regular/overtime/pay split. ✓

### UI redesign (hi-fi pass — driven by `docs/design/` handoff)

- [x] **3.10 Design tokens + theme** — mapped the handoff tokens onto shadcn semantic
      vars in `global.css` (light + dark): purple accent, zinc neutrals, plus
      `overtime`/`success`/`destructive-bg`/`subtle`/`primary-soft`. ✓
- [x] **3.11 Dark mode + global shell** — `next-themes` + theme toggle; sticky header
      with segmented nav (active pill), EN/ES + theme toggles; card-wrapped tables. ✓
- [x] **3.12 Screen polish** — status badges (dot/soft pill), amber overtime pill,
      table header style, card tables, link-style row actions, week picker group. ✓
- [ ] **3.13 Visual QA** — verify each screen in en/es × light/dark against
      `docs/design/screenshots/`; typecheck + lint + build + test green.

### Server-side pagination (Employees + Weekly summary)

- [x] **3.14 Contract** — `shared`: `Paginated<T>`, `paginationQuerySchema`
      (`page`/`pageSize`), `buildPaginated` helper; spec the envelope (02-api, 03-web). ✓
- [x] **3.15 API** — `/employees` and `/weekly-summary` accept `page`/`pageSize`,
      return `Paginated<T>` (limit/offset + count); integration test updated. ✓
- [x] **3.16 Web** — feature `api.ts` consumes the envelope; hooks use
      `keepPreviousData`; shadcn `Pagination` in the card footer. Time entries unchanged. ✓

### Employee filter (searchable combobox)

- [x] **3.17 API filter** — optional `employeeId` on `/employees` and
      `/weekly-summary` (server-side `where`); `total` reflects the filtered set. ✓
- [ ] **3.18 Web combobox** — reusable searchable `EmployeeCombobox`
      (shadcn Popover + Command). Time entries uses it to pick the employee;
      Employees + Weekly summary use it to filter the table (resets to page 1).

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

## Bonus backlog (optional — only after required scope, document in WRITEUP)

Do these only if time remains; none are required. Order = priority.

- [ ] **Swagger / OpenAPI** for the API — generate the spec from the Zod schemas
      (`hono-openapi`) + Swagger UI (`@hono/swagger-ui`) at `/docs`. On-theme with
      OCMI's OpenAPI stack. Verify Zod v4 compatibility first. Additive (annotate
      existing routes; no rewrite). **After the web.**
- [ ] **`nx affected` in CI** — switch CI from `run-many` to `affected` to run only
      what changed. Leverages the Nx task graph we already have.
- [ ] **Extra API tests** — soft-delete visibility, future-date/inactive validation,
      weekly aggregation correctness.
- [ ] **E2E test** (Playwright) — the core flow: create employee → log time →
      approve → entries locked. Higher value than Storybook for 3 screens.
- [ ] **Storybook** — component catalog. Lowest priority for this scope.
- [ ] **Generated API client (SDK)** — only meaningful across repos/clients; the
      monorepo + shared types already give type-safety, so likely skipped.

---

## Progress notes

> Append short notes as phases complete (decisions made, deviations from spec).
> This becomes useful raw material for AI_WORKFLOW.md.
