# Web Platform Specification

## Purpose

Cross-cutting conventions for `apps/web` (Next.js 16 App Router + TanStack Query + shadcn/ui +
Tailwind): structure, data layer, i18n, design system, UX states and the E2E suite shared by every
screen.

## Requirements

### Requirement: Feature folders and thin routes

Routes under `app/[locale]/` SHALL stay thin; each domain owns its `api.ts`, `components/` and
`hooks/` under `features/<domain>/`. shadcn components live in `components/ui/`.

#### Scenario: New screen

- **WHEN** a new screen is added
- **THEN** its page file only composes a component from `features/<domain>/`

### Requirement: Data layer

A single axios instance in `lib/http.ts` SHALL be the transport. Per-feature `api.ts` modules
expose typed endpoint functions, wrapped by TanStack Query hooks (`useEmployees`,
`useApproveWeek`, …). Forms SHALL use `react-hook-form` with the shared Zod schemas — no schema
duplication.

#### Scenario: Form validation

- **WHEN** the user enters `7.3` hours in the time entry form
- **THEN** the form shows the shared schema's validation error before any request is sent

### Requirement: UI internationalization

The UI SHALL ship in English and Spanish using next-intl with `[locale]` URL routing (English is
the default locale). All user-facing strings MUST live in message files, never hardcoded. A
locale switch is available in the shell, and API requests follow the active locale.

#### Scenario: Switch to Spanish

- **WHEN** the user switches the language toggle to ES
- **THEN** the URL moves to `/es/...` and every visible string is in Spanish

### Requirement: Design system and theming

Screens SHALL be built from shadcn/ui components first, with semantic tokens only (no raw
colors), recreating the `docs/design/` handoff: purple accent, zinc neutrals, plus `overtime`
(amber), `success`, `destructive`, `subtle` and `primary-soft` tokens defined for light and dark.
Dark mode SHALL use `next-themes` with a header toggle and respect the system preference.
Money/hours use tabular figures.

#### Scenario: Dark mode

- **WHEN** the OS prefers dark and the user has not chosen a theme
- **THEN** the app renders in dark mode using the dark token set

### Requirement: Loading, error and empty states

Every async screen SHALL render a loading state (skeleton/spinner), an error state from the
envelope (Alert with retry) and an empty state (shadcn `Empty`).

#### Scenario: API down

- **WHEN** a list request fails
- **THEN** the screen shows the localized error message with a retry action

### Requirement: Optimistic updates

Approve/reject and quick mutations SHALL update the TanStack Query cache immediately and roll back
on error.

#### Scenario: Rollback

- **WHEN** an optimistic mutation fails
- **THEN** the cache returns to its previous state

### Requirement: Paginated tables

Employees and Weekly summary SHALL use server-side pagination with a shadcn `Pagination` control
in the card footer and `placeholderData: keepPreviousData` so the table does not flash between
pages.

#### Scenario: Page change

- **WHEN** the user moves to the next page
- **THEN** the previous rows stay visible until the new page arrives

### Requirement: Reduced motion

Animations (dialogs, toasts, skeleton shimmer) SHALL stay subtle and honor
`prefers-reduced-motion`.

#### Scenario: Reduced motion preference

- **WHEN** the OS requests reduced motion
- **THEN** enter animations (`.animate-in`) are disabled

### Requirement: Frontend and E2E tests

The web app SHALL have at least one component test (the weekly summary table proving it uses the
shared calc). A Playwright suite in `apps/e2e` SHALL drive the real stack across Employees, Time
entries and the Weekly summary approve → entries-locked flow, using Page Objects, role-based
selectors and API-seeded fixtures that clean up after themselves. It runs serially against the
running stack and is not part of `pnpm test`.

#### Scenario: E2E approval lock

- **WHEN** `pnpm exec nx e2e e2e` runs against the running stack
- **THEN** the suite approves a week and verifies its entries are read-only
