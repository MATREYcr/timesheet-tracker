# Proposal

## Why

The app has no authentication: anyone who can reach the API can read payroll data and approve
weeks. The project will be reused for AWS deployment practice, where it needs to behave like a
real application — users who register, sign in, and only then reach the timesheet screens and
API. Better Auth gives email/password sessions on our existing Hono + Drizzle + Postgres stack
without a third-party identity service.

## What Changes

- Add **Better Auth** to `apps/api`: email/password sign-up, sign-in, sign-out and session
  endpoints mounted at `/api/auth/*`, persisted in Postgres through the Drizzle adapter (new
  `users`, `sessions`, `accounts`, `verifications` tables via a Drizzle migration).
- **BREAKING**: every business endpoint (`/employees`, `/time-entries`, `/weekly-summary`,
  `/dashboard`) requires a valid session and returns **401 `UNAUTHORIZED`** in the error envelope
  (en/es) without one. `/health`, `/openapi`, `/docs` and `/api/auth/*` stay public.
- New error code `UNAUTHORIZED` (401) in the shared `ERROR_CODES` union with en/es messages.
- CORS switches to credentialed requests from the configured web origin; new required env vars
  `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL`.
- Shared Zod schemas for the sign-in and sign-up forms (`packages/shared`).
- `apps/web`: **Login** and **Register** screens (en/es, shadcn, shared schemas), route protection
  in `proxy.ts` composed with next-intl, the app shell hidden on auth screens, the signed-in user
  and a **Sign out** action in the sidebar (replacing the "Admin" placeholder), and a redirect to
  login when the API answers 401.
- Seed creates a demo user so the app is usable right after `pnpm db:seed`.
- Tests: API integration tests authenticate; a new auth integration test; Playwright E2E signs in
  and gains an auth spec.
- A repeatable **agent-browser real-flow check** (register → land on dashboard → sign out → blocked
  → sign in → use the app) that can be pointed at any deployed URL (local or AWS).

Out of scope: roles/permissions (every signed-in user can do everything), email verification,
password reset, OAuth/social providers, 2FA, rate-limit tuning, account settings.

## Capabilities

### New Capabilities

- `authentication`: user accounts with email/password, sessions, sign-up/sign-in/sign-out, how
  the API and web enforce an authenticated session, and the real-flow verification.

### Modified Capabilities

- `error-envelope-i18n`: new `UNAUTHORIZED` code mapped to 401 with en/es messages.
- `shared-package`: canonical error codes include `UNAUTHORIZED`; new auth form schemas.
- `api-platform`: business routes require a session; public routes listed; validated env gains
  auth variables; CORS allows credentials from the web origin; seed creates a demo user;
  integration tests run authenticated.
- `web-platform`: protected routes and auth screens outside the app shell; the transport sends
  credentials and redirects to login on 401; E2E suite runs signed in.

## Impact

- **Dependencies**: `better-auth` in `apps/api` and `apps/web`.
- **Database**: new migration adding four auth tables; no change to existing tables.
- **API**: `src/app.ts` (CORS, auth handler, session guard), new `src/auth.ts` +
  `src/middleware/auth.ts`, `config/env.ts`, `common/errors`, `db/schema`, `db/seed.ts`,
  `test/helpers.ts` and every integration spec (authenticated requests).
- **Web**: `proxy.ts`, `lib/http.ts`, new `lib/auth-client.ts`, route groups `(app)`/`(auth)`
  under `app/[locale]`, `providers.tsx`, sidebar footer, `i18n/locales/{en,es}.json`.
- **E2E**: `apps/e2e` fixtures and a global sign-in setup.
- **Docs/config**: `.env.example` files, README (setup + demo credentials), CLAUDE.md (product
  now includes auth), `openspec/config.yaml` context (auth no longer out of scope).
- **Clients**: any external caller of the API now needs a session cookie.
