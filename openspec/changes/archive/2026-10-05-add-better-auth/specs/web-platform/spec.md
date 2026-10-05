# Spec Delta

## MODIFIED Requirements

### Requirement: Data layer

A single axios instance in `lib/http.ts` SHALL be the transport; it MUST send credentials
(session cookie) on every request and, on a 401 `UNAUTHORIZED` response, send the user to the
login screen of the active locale. Per-feature `api.ts` modules expose typed endpoint functions,
wrapped by TanStack Query hooks (`useEmployees`, `useApproveWeek`, …). Forms SHALL use
`react-hook-form` with the shared Zod schemas — no schema duplication.

#### Scenario: Form validation

- **WHEN** the user enters `7.3` hours in the time entry form
- **THEN** the form shows the shared schema's validation error before any request is sent

#### Scenario: Credentials sent

- **WHEN** any screen calls the API
- **THEN** the request includes the session cookie

#### Scenario: 401 redirects to login

- **WHEN** an API call answers 401 `UNAUTHORIZED`
- **THEN** the user is sent to the login screen

### Requirement: Frontend and E2E tests

The web app SHALL have at least one component test (the weekly summary table proving it uses the
shared calc). A Playwright suite in `apps/e2e` SHALL drive the real stack across Auth (register,
sign in, sign out, protected redirect), Employees, Time entries and the Weekly summary approve →
entries-locked flow, using Page Objects, role-based selectors and API-seeded fixtures that clean
up after themselves. The suite signs in once and reuses the session; API fixtures send the same
session. It runs serially against the running stack and is not part of `pnpm test`.

#### Scenario: E2E approval lock

- **WHEN** `pnpm exec nx e2e e2e` runs against the running stack
- **THEN** the suite approves a week and verifies its entries are read-only

#### Scenario: E2E auth

- **WHEN** the auth spec runs
- **THEN** it verifies a signed-out visitor is redirected to login, registration lands on the
  dashboard and sign out blocks the app again

## ADDED Requirements

### Requirement: Auth screens outside the app shell

Login and Register SHALL render without the sidebar and topbar; all other screens render inside
the app shell. Theme, locale switch and toasts are available on both.

#### Scenario: Login layout

- **WHEN** the user opens the login screen
- **THEN** no sidebar navigation is rendered and the locale and theme toggles are available
