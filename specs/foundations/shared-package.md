# Foundation — `packages/shared`

The headless heart of the project. Pure TypeScript, consumed by both API and web. No React, no
React Native, no `window`, no `process`, no framework imports.

---

## Responsibilities

1. **Types** — the domain model (`Employee`, `TimeEntry`, `WeeklyApproval`, `WeeklySummary`,
   enums). Detailed per-feature contracts live in `features/`.
2. **Zod schemas** — validation for inputs, used by API request parsing AND web form validation.
   Single source of truth. (Per-feature rules live in each feature spec.)
3. **Pay calculation** — overtime + pay, fully unit tested. Contract owned by
   [`features/weekly-summary`](../features/weekly-summary.md), but it physically lives here so it
   stays platform-agnostic.
4. **Date/week helpers** — `weekStart` derivation, week ranges, future-date check.
5. **Error codes** — the canonical list of stable `code`s so API and web agree on them. The
   envelope + en/es mapping live in
   [`foundations/error-envelope-i18n`](error-envelope-i18n.md).

## Structure

Organised by domain, with cross-cutting helpers under `utils/`. Each domain file holds its Zod
schemas and the types **derived** from them (single source — no separate hand-written types).

```
packages/shared/src/
├── employee/employee.ts        employee schemas + derived types
├── time-entry/time-entry.ts    time-entry schemas + derived types
├── approval/approval.ts        approval schemas + status enum + derived types
├── week/                       pay.ts (calculateWeeklyPay, round2) + summary.ts (WeeklySummaryRow)
├── utils/                      dates.ts, errors.ts (ErrorCode + envelope), locale.ts, pagination.ts
└── index.ts                    public exports
```

## Date helpers

- `getWeekStart(date: string): string` — returns the Monday (date-only) of the week containing
  `date`. Pure string/UTC math, no local timezone.
- `isFutureDate(date: string, today?: string): boolean`.

## Public API

A clean `index.ts` re-exports the surface (types, errors, dates, schemas, pay). Headless — no
platform imports. The package README documents the surface.

## Unit tests (required, in this package)

- **Date helpers:** `getWeekStart` for each weekday (Mon..Sun) returns the correct Monday,
  including month/year boundaries.
- **Pay calculation:** the edge-case suite is specified and owned by
  [`features/weekly-summary`](../features/weekly-summary.md) (it lives here as `week/pay.spec.ts`).

## Notes / deviations

- Domain types are **derived** from the Zod schemas (single source) rather than hand-written
  alongside them, so a schema and its type can never desync.
