# Design

## Context

- The API (`apps/api`, Hono on `:3333`) and the web (`apps/web`, Next.js 16 on `:3000`) are
  separate origins. The web calls the API directly from the browser with axios
  (`NEXT_PUBLIC_API_URL`); there is no Next.js server-side data fetching.
- `apps/web/src/proxy.ts` is already the next-intl middleware (`localePrefix: 'as-needed'`,
  so English has no prefix and Spanish is `/es/...`).
- The app shell (sidebar + topbar) is mounted inside `app/providers.tsx`, so today every route
  renders inside it.
- Integration tests call the Hono app in-process through `app.request()`; the Playwright E2E
  fixtures seed data with plain axios calls to the API.
- See `proposal.md` for motivation and `specs/` for the required behavior.

## Goals / Non-Goals

**Goals:**

- The API is the single authority for sessions; the web never trusts a cookie on its own for
  data access.
- Keep the existing direct browser → API architecture (no new BFF layer).
- Work locally out of the box and be deployable to AWS with configuration only.

**Non-Goals:**

- Server-side rendering of protected data in Next.js.
- Database-backed authorization rules (ownership, roles).

## Decisions

### 1. Better Auth runs inside the Hono API, Drizzle adapter, `/api/auth/*`

The auth instance (`apps/api/src/auth.ts`) uses `drizzleAdapter(db, { provider: 'pg', schema,
usePlural: true })`, `emailAndPassword: { enabled: true, minPasswordLength: 8,
maxPasswordLength: 128 }`, `advanced.database.generateId: 'uuid'`, `secret`/`baseURL` from env
and `trustedOrigins: [CORS_ORIGIN]`. It is mounted with `app.on(['GET','POST'], '/api/auth/*',
c => auth.handler(c.req.raw))`.

- *Why:* one Postgres, one ORM, one migration flow (Drizzle Kit), and the same validated env.
- *Rejected:* auth in Next.js route handlers (the API would then need to validate sessions it
  doesn't own); a hosted IdP like Cognito (would hide the auth flow the practice is about — can
  be added later as a social/OIDC provider).

### 2. Auth tables are ours: `users`, `sessions`, `accounts`, `verifications`

Defined by hand in `db/schema/auth.ts` from the Better Auth CLI output (`npx
@better-auth/cli generate`), adapted to project conventions: plural table names, `uuid` ids,
`snake_case` columns, `timestamp with time zone`. A Drizzle Kit migration adds them.

- *Why:* the CLI is a starting point, but the schema must follow CLAUDE.md naming and live
  next to the other tables so `drizzle-kit generate` owns migrations.
- *Rejected:* Better Auth's built-in migrator (would bypass Drizzle Kit and the test DB setup).

### 3. Session guard as Hono middleware on the business router

`middleware/auth.ts` calls `auth.api.getSession({ headers: c.req.raw.headers })`, stores
`user`/`session` on the context (`AppEnv.Variables`) and throws `AppError('UNAUTHORIZED')` when
missing. It is applied to `apiRoutes` only, so `/health`, `/openapi`, `/docs` and
`/api/auth/*` stay public.

- *Why:* one place enforces auth; existing routes don't change; the error goes through the
  existing `onError` → localized envelope path.
- *Rejected:* per-route checks (easy to forget on a new route).

### 4. Cookies + credentialed CORS between `:3000` and `:3333`

CORS on all routes becomes `cors({ origin: CORS_ORIGIN, credentials: true })`. The browser
sends the cookie because `localhost:3000` and `localhost:3333` are the same *site* (ports don't
scope cookies). axios uses `withCredentials: true`; the Better Auth React client
(`createAuthClient({ baseURL: NEXT_PUBLIC_API_URL })`) uses `credentials: 'include'` by default.

- *For AWS:* deploy web and API on sub-domains of one parent domain (e.g. `app.example.com`
  and `api.example.com`) so cookies stay first-party; set `BETTER_AUTH_URL`, `CORS_ORIGIN` and
  `NEXT_PUBLIC_API_URL` accordingly. If they ever end on unrelated domains, enable Better Auth
  `advanced.crossSubDomainCookies` or add a same-origin rewrite — documented, not built now.
- *Rejected:* proxying the API through Next.js rewrites now (adds a hop and changes the
  current architecture before it is needed).

### 5. Web route protection: optimistic in `proxy.ts`, authoritative in the API

`proxy.ts` composes the existing next-intl middleware with a cookie check
(`getSessionCookie(request)` from `better-auth/cookies`): no cookie + protected path → redirect
to `/{locale}/login?next=<path>`; cookie + `/login|/register` → redirect to `/{locale}`. The
check is presence-only (no DB call). A stale cookie is caught by the API's 401, and the axios
interceptor then redirects to login.

- *Why:* fast redirects without a network hop on every navigation; real security stays in the
  API (spec: "API requires a session").
- *Rejected:* `auth.api.getSession` inside `proxy.ts` (the web would need DB access or an extra
  HTTP call per navigation).
- The `next` param is accepted only if it starts with a single `/` (not `//` or a scheme), to
  prevent open redirects.

### 6. Route groups split the shell

`app/[locale]/(app)/layout.tsx` renders the sidebar/topbar and wraps dashboard, employees,
time-entries and weekly-summary; `app/[locale]/(auth)/layout.tsx` renders a centered card with
locale + theme toggles. `providers.tsx` keeps only theme, query client, tooltip and toaster.
URLs don't change (route groups are invisible).

### 7. Forms and messages

Login/Register use `react-hook-form` + the new shared `signInSchema`/`signUpSchema`. Calls go
through `authClient.signIn.email` / `authClient.signUp.email`; Better Auth error codes
(`INVALID_EMAIL_OR_PASSWORD`, `USER_ALREADY_EXISTS`, …) map to keys in
`i18n/locales/{en,es}.json` with a generic fallback. On sign out: `authClient.signOut()`,
`queryClient.clear()`, `router.replace('/login')`.

### 8. Demo user via the auth API in the seed

The seed calls `auth.api.signUpEmail` for `demo@timesheet.dev` only if no user with that email
exists, so the password is hashed exactly as on registration. Business tables are still cleared
and re-inserted; auth tables are not truncated.

### 9. Tests

- **API integration:** `test/helpers.ts` signs up a test user once per file through
  `/api/auth/sign-up/email`, keeps the `set-cookie`, and adds it to every helper request.
  `truncate()` also clears auth tables. A new `auth.integration.spec.ts` covers 401 without
  session (en/es), sign-up → access, sign-out → 401, public `/health`.
- **Shared:** unit tests for the auth schemas.
- **E2E (Playwright):** a `globalSetup` registers a run-unique user through the API and writes
  `storageState`; fixtures send the same cookie to the API. New `auth.spec.ts` runs in a fresh
  context (no storage state).
- **agent-browser real flow:** `scripts/verify/auth-flow.sh` uses the `agent-browser` CLI
  (`open`, `snapshot -i`, `fill`, `click`, `wait`, `get url`) against `BASE_URL` (default
  `http://localhost:3000`) with a unique email per run, asserting URL/text after each step and
  failing fast (`set -euo pipefail` + a `step` helper). Exposed as `pnpm verify:auth`.

## Risks / Trade-offs

- [Breaking API for any external client] → documented in README; Swagger UI is same-site so a
  signed-in browser can still "try it out".
- [Presence-only cookie check lets a stale cookie render the shell briefly] → the first API call
  returns 401 and the interceptor redirects to login.
- [Cookies across unrelated AWS domains would be third-party and blocked] → deploy on sibling
  sub-domains (Decision 4); `BETTER_AUTH_URL`/`CORS_ORIGIN` are env-driven.
- [Better Auth schema drift on upgrades] → pin the minor version; regenerate with the CLI and
  diff against `db/schema/auth.ts` when upgrading.
- [agent-browser relies on visible labels] → the script targets roles/labels from the en
  messages and runs in English; it is a smoke check, Playwright remains the regression suite.

## Migration Plan

1. `pnpm install` (new `better-auth` dependency).
2. Add `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL` to `apps/api/.env` (from the updated
   `.env.example`; generate the secret with `openssl rand -base64 32`).
3. `pnpm db:migrate` (adds auth tables) and `pnpm db:seed` (adds the demo user).
4. Rollback: revert the change and drop the four auth tables; business tables are untouched.
