# Verification — add-better-auth

Real-browser checks run with **agent-browser 0.27** against the local dev stack (web
`http://localhost:3000`, API `http://localhost:3333`, Postgres seeded) on 2026-10-05.
Pages were read as accessibility snapshots; no screenshots were needed.

## Repeatable script — `pnpm verify:auth`

`scripts/verify/auth-flow.sh` (31 steps) passed end to end:

| Area            | Checked                                                                           |
| --------------- | --------------------------------------------------------------------------------- |
| API guard       | `GET /employees` without a session → 401                                          |
| Protected route | `/weekly-summary` signed out → `/login?next=%2Fweekly-summary`, login form shown  |
| Register        | fresh user → lands on `/`, dashboard renders, email shown in sidebar              |
| Cookie          | session token absent from `document.cookie` (HttpOnly)                            |
| Browser → API   | `fetch(API/employees, { credentials: 'include' })` → 200 (cookie + CORS)          |
| Data screens    | employees, time entries, weekly summary load signed in                            |
| Sign out        | back on `/login`; `/employees` redirects to login; old session → 401 from the API |
| Sign in         | returns to the remembered `/employees`, data loads                                |

Failure path: a copy with a wrong password on the final sign-in stopped at step 30
(`returns to the remembered page … FAILED`), printed the current URL and exited **1**; the
isolated browser session was closed by the exit trap.

## Exploratory pass (en / es)

| Scenario                                               | Result                                                                                                                       |
| ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| Login validation, empty submit (es)                    | "Introduce un correo electrónico válido." / "Introduce tu contraseña." — no request sent                                     |
| Wrong password (es)                                    | "Correo o contraseña incorrectos."                                                                                           |
| Register via link keeps `?next=` (es)                  | `/es/register?next=%2Fweekly-summary` → after register lands on `/es/weekly-summary`                                         |
| Sidebar user                                           | "Ana García" + email, "Cerrar sesión"; demo account shows "Demo User / demo@timesheet.dev"                                   |
| Session revoked mid-use (rows deleted in DB)           | next API call → 401 → `/es/login?next=%2Femployees`, no redirect loop (stale cookie expired by the 401)                      |
| Signed-in user opens `/login` / `/es/login`            | redirected to `/` / `/es`                                                                                                    |
| Approve a week (en → es)                               | confirm dialog → row "Aprobada"; creating an entry in that week → 409 `WEEK_LOCKED` "Esta semana está aprobada y bloqueada." |
| Theme toggle                                           | light ⇄ dark (`html.dark`) works on the app shell                                                                            |
| Locale switch on an app screen                         | EN → ES keeps the page (`/es/weekly-summary`), user menu translated                                                          |
| Register validation (es)                               | "Introduce tu nombre." / "Introduce un correo electrónico válido." / "La contraseña debe tener al menos 8 caracteres."       |
| Duplicate email in another case (`DEMO@timesheet.dev`) | "Ya existe una cuenta con este correo."                                                                                      |

## Observations

- One `fetch` issued through `agent-browser eval` immediately after a UI sign-in reached the
  API without the cookie (401 in ~1 ms, no DB lookup). It did not reproduce in three fresh
  sessions (all requests carried the cookie), and the app's own requests were unaffected; most
  likely the eval ran while the page was still navigating after `router.replace`. Noted, not
  treated as a defect.
- `wait --load networkidle` never settles against `next dev` (HMR websocket), so the script
  asserts on `location` and visible text instead.
- Switching locale on the login screen drops the `?next=` parameter (the locale switch replaces
  the pathname only). Minor; the user still lands on the dashboard after sign-in.

## Automated suites

- `pnpm nx run shared:test` — auth schema tests pass.
- `pnpm nx run api:test` — 6 files / 31 tests, incl. `auth.integration.spec.ts`.
- `pnpm nx run web:test` — login form test (validation, safe `next`, generic error).
- `pnpm exec nx e2e e2e` — 14 Playwright tests (4 new auth + 10 existing, now signed in).
