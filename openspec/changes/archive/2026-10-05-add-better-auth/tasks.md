# Tasks

## 1. Shared contracts

- [x] 1.1 Add `UNAUTHORIZED` to `ERROR_CODES` in `packages/shared/src/utils/errors.ts` and verify `pnpm nx run shared:typecheck` reports the missing `UNAUTHORIZED` entries in the API status/message maps (fixed in 2.x)
- [x] 1.2 Add `packages/shared/src/auth/auth.ts` with `signInSchema` / `signUpSchema` + derived types, export them from `index.ts`, and verify new unit tests in `auth/auth.spec.ts` (short password, email trim + lowercase, name 1–100) pass with `pnpm nx run shared:test`

## 2. API — auth server and session guard

- [x] 2.1 Add `better-auth` to `apps/api`, extend `config/env.ts` with `BETTER_AUTH_SECRET` (min 32) and `BETTER_AUTH_URL` (url), update `apps/api/.env.example`, and verify the API refuses to start with a short secret
- [x] 2.2 Add `db/schema/auth.ts` (`users`, `sessions`, `accounts`, `verifications`; uuid ids, snake_case, timestamptz) following the db-change skill, generate the migration with `pnpm --filter @timesheet/api db:generate`, review the SQL, and verify `pnpm db:migrate` creates the four tables
- [x] 2.3 Create `src/auth.ts` (Drizzle adapter, email/password 8–128, uuid ids, trustedOrigins = `CORS_ORIGIN`) and mount `/api/auth/*` in `app.ts`; switch CORS to `credentials: true`; verify with curl that sign-up/sign-in set an HttpOnly `SameSite=Lax` cookie and `get-session` returns the user without password fields
- [x] 2.4 Add `UNAUTHORIZED` → 401 to `ERROR_STATUS` and en/es messages to `common/errors/messages.ts`; verify `pnpm nx run api:typecheck` passes
- [x] 2.5 Add `middleware/auth.ts` (session on context, `AppError('UNAUTHORIZED')` when absent), extend `AppEnv`, apply it to `apiRoutes` only; verify with curl that `/employees` returns 401 envelope without cookie (en and es) and 200 with it, and `/health` stays 200
- [x] 2.6 Update `test/helpers.ts` (sign up once per file, attach cookie to every helper request, truncate auth tables) and verify the existing integration suites pass again with `pnpm nx run api:test`
- [x] 2.7 Add `src/modules/auth/auth.integration.spec.ts` covering 401 without session (en/es), sign-up → access, sign-out → 401 with the old cookie, public `/health`, foreign Origin sign-in rejected, and verify it passes
- [x] 2.8 Seed the demo user (`demo@timesheet.dev` / `Demo1234!`) via `auth.api.signUpEmail` only if missing, without truncating auth tables; verify running `pnpm db:seed` twice leaves one demo user who can sign in

## 3. Web — auth client, protection and screens

- [x] 3.1 Add `better-auth` to `apps/web`, create `lib/auth-client.ts` (`createAuthClient` with `NEXT_PUBLIC_API_URL`), set `withCredentials: true` in `lib/http.ts` and redirect to the locale's login on a 401 `UNAUTHORIZED`; verify `pnpm nx run web:typecheck`
- [x] 3.2 Split `app/[locale]` into `(app)` (sidebar + topbar layout, existing pages moved, URLs unchanged) and `(auth)` (centered layout with locale + theme toggles); slim `providers.tsx`; verify every existing page still renders at the same URL
- [x] 3.3 Compose `proxy.ts`: session-cookie check (protected → `/{locale}/login?next=`, login/register while signed in → `/{locale}`) before next-intl; safe `next` handling; verify in the browser that `/es/weekly-summary` signed-out redirects to `/es/login?next=%2Fweekly-summary`
- [x] 3.4 Build Login and Register screens with shadcn + `react-hook-form` + shared schemas, progress state, links between them, Better Auth error codes mapped to en/es messages; add all strings to `en.json`/`es.json`; verify wrong password shows the generic localized error and registration lands on the dashboard
- [x] 3.5 Replace the sidebar "Admin" placeholder with the session user's name/email and a Sign out action (revoke, `queryClient.clear()`, go to login); verify the user is shown and sign out returns to login
- [x] 3.6 Add a component test for the login form (shared-schema validation message, submit calls `signIn.email`) and verify `pnpm nx run web:test` passes; run `pnpm lint` for web

## 4. E2E (Playwright)

- [x] 4.1 Add a Playwright `globalSetup` that registers a run-unique user through the API and saves `storageState`; make fixtures send the session cookie on their axios calls; verify the existing employees/time-entries/weekly-summary specs pass with `pnpm exec nx e2e e2e`
- [x] 4.2 Add `auth.spec.ts` (fresh context: signed-out redirect, register → dashboard, sign out → blocked, sign in → dashboard) with a page object, and verify it passes

## 5. Real-flow verification with agent-browser

- [x] 5.1 Add `scripts/verify/auth-flow.sh` (agent-browser CLI, `BASE_URL` default `http://localhost:3000`, unique email per run, `step` helper, fail fast, closes the browser on exit) and a root `pnpm verify:auth` script; verify it exits 0 against the local stack
- [x] 5.2 Make one step fail on purpose (e.g. wrong password) and verify the script reports the step and exits non-zero, then revert
- [x] 5.3 Run an exploratory agent-browser pass in en and es (login, register errors, dashboard, employees, time entries, weekly summary approve, sign out, dark mode) reading snapshots, and record the results in this change's `verification.md`

## 6. Docs and close-out

- [x] 6.1 Update README (env vars, migrate/seed, demo credentials, auth section, `pnpm verify:auth`, AWS cookie note), CLAUDE.md (product now has auth; stack adds Better Auth; §10 commands) and `openspec/config.yaml` context (auth no longer out of scope); verify the README setup works from the `.env.example` files
- [x] 6.2 Run `pnpm typecheck`, `pnpm lint`, `pnpm test` and `openspec validate --all --strict`; verify all pass
