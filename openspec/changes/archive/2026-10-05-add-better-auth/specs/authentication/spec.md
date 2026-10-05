# Spec Delta

## Purpose

User accounts with email and password and cookie-based sessions: register, sign in, sign out,
and how the API and the web client require an authenticated session before any timesheet data
is read or changed.

## ADDED Requirements

### Requirement: Register with email and password

A visitor SHALL be able to create an account with `name` (1–100 chars, trimmed), `email` (valid,
case-insensitive, unique) and `password` (8–128 chars). On success the user is signed in
immediately. Every signed-in user has full access to the app; there are no roles.

#### Scenario: Successful registration

- **WHEN** a visitor registers with name "Ana García", email "ana@example.com" and a valid
  password
- **THEN** the account is created, a session is started and the visitor lands on the dashboard

#### Scenario: Email already registered

- **WHEN** a visitor registers with an email that already has an account (in any letter case)
- **THEN** no account is created and a localized "email already registered" error is shown

#### Scenario: Weak password

- **WHEN** a visitor submits a password shorter than 8 characters
- **THEN** the form shows a localized validation error and no request is sent

### Requirement: Sign in

A registered user SHALL sign in with email and password. Invalid credentials MUST produce one
generic error that does not reveal whether the email exists.

#### Scenario: Valid credentials

- **WHEN** a user signs in with the correct email and password
- **THEN** a session is started and the user lands on the dashboard (or the page they were
  sent away from)

#### Scenario: Wrong password or unknown email

- **WHEN** a user signs in with a wrong password, or with an email that has no account
- **THEN** the same localized "invalid email or password" error is shown and no session is
  started

#### Scenario: Too many attempts

- **WHEN** the auth endpoints answer 429 because of repeated attempts
- **THEN** a localized "too many attempts, try again in a moment" error is shown

### Requirement: Sign out

A signed-in user SHALL be able to sign out from the app shell. Signing out MUST invalidate the
session on the server, not only in the browser, and clear any cached data on the client.

#### Scenario: Sign out

- **WHEN** a signed-in user clicks "Sign out"
- **THEN** the session is revoked, the user is sent to the login screen, and a request with the
  old session cookie is rejected with 401

### Requirement: Session handling

Sessions SHALL be carried in an HttpOnly cookie (`SameSite=Lax`, `Secure` in production), expire
after 7 days and be extended while in use. Passwords MUST be stored only as salted hashes and
never returned by any endpoint.

#### Scenario: Session survives reload

- **WHEN** a signed-in user reloads the page or opens a new tab
- **THEN** they remain signed in

#### Scenario: Cookie not readable by scripts

- **WHEN** page JavaScript reads `document.cookie`
- **THEN** the session token is not present

#### Scenario: Password never exposed

- **WHEN** any user or session data is returned by the API
- **THEN** it contains no password or password hash

### Requirement: API requires a session

Every business endpoint (`/employees`, `/time-entries`, `/weekly-summary`, `/dashboard` and
their sub-paths) MUST reject requests without a valid session with HTTP 401 and the error
envelope code `UNAUTHORIZED`. `/health`, the OpenAPI document, the API docs and the auth
endpoints stay public.

#### Scenario: No session

- **WHEN** `GET /employees` is called without a session cookie
- **THEN** the response is 401 with `{ "error": { "code": "UNAUTHORIZED", ... } }`

#### Scenario: Expired or revoked session

- **WHEN** a business endpoint is called with a cookie for a session that was signed out or has
  expired
- **THEN** the response is 401 `UNAUTHORIZED`
- **AND** the response expires the stale session cookie, so the browser no longer presents it

#### Scenario: Public endpoints

- **WHEN** `GET /health` is called without a session
- **THEN** it responds 200

### Requirement: Web routes require a session

Every app screen (dashboard, employees, time entries, weekly summary) SHALL require a session. A
visitor without one MUST be redirected to the login screen of the current locale, remembering
the requested path. A signed-in user opening login or register MUST be redirected to the
dashboard. After sign-in the user returns to the remembered path only if it is a same-site
relative path.

#### Scenario: Protected page while signed out

- **WHEN** a signed-out visitor opens `/es/weekly-summary`
- **THEN** they are redirected to `/es/login` and, after signing in, land on `/es/weekly-summary`

#### Scenario: Login page while signed in

- **WHEN** a signed-in user opens `/login`
- **THEN** they are redirected to the dashboard

#### Scenario: Open redirect attempt

- **WHEN** the login URL carries a return path pointing to another site (e.g.
  `//evil.example`)
- **THEN** the user lands on the dashboard instead

#### Scenario: Session lost mid-use

- **WHEN** an API call returns 401 while the user is on an app screen
- **THEN** the user is sent to the login screen

### Requirement: Auth screens

The web client SHALL provide Login and Register screens outside the app shell (no sidebar), in
English and Spanish, validated with the shared auth schemas, with links between them, a submit
button that shows progress and is disabled while submitting, and localized error messages.

#### Scenario: Switch between screens

- **WHEN** a visitor on Login clicks "Create an account"
- **THEN** the Register screen opens in the same locale

#### Scenario: Spanish

- **WHEN** a visitor opens `/es/login`
- **THEN** every label, button and error on the screen is in Spanish

### Requirement: Signed-in user in the app shell

The app shell SHALL show the signed-in user's name and email and a Sign out action, replacing
the static placeholder account.

#### Scenario: User shown

- **WHEN** "Ana García" is signed in
- **THEN** the sidebar footer shows "Ana García" and "ana@example.com"

### Requirement: Demo account

The seed SHALL create a demo account (`demo@timesheet.dev` / `Demo1234!`, name "Demo User")
idempotently so the app is usable right after setup. It MUST NOT overwrite an existing account
with that email.

#### Scenario: Seed twice

- **WHEN** `pnpm db:seed` runs twice
- **THEN** exactly one demo account exists and it can sign in

### Requirement: Real-flow verification

The repository SHALL include a repeatable browser check, driven by agent-browser against a
configurable base URL (local or deployed), that walks the real flow: blocked when signed out →
register a fresh user → dashboard visible → data screens load → sign out → blocked again → sign
in → dashboard. It MUST exit non-zero on the first failed step.

#### Scenario: Local run passes

- **WHEN** the check runs against the local stack with the app up
- **THEN** every step passes and the script exits 0

#### Scenario: Failure is reported

- **WHEN** any step fails (e.g. the API rejects the session)
- **THEN** the script prints the failing step and exits non-zero
