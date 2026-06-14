# @timesheet/shared

Headless, platform-agnostic TypeScript consumed by both the API and the web client.
No React, no `window`, no framework imports — pure logic and contracts.

## What it exports

- **types** — `Employee`, `TimeEntry`, `WeeklyApproval`, `WeeklySummaryRow`, status unions.
- **errors** — `ErrorCode` union + `ApiErrorBody` envelope (shared contract; en/es messages live in the API).
- **dates** — UTC-safe date-only helpers: `getWeekStart`, `getWeekEnd`, `addDays`, `isInWeek`, `isFutureDate` (weeks run Monday→Sunday).
- **schemas** — Zod schemas + inferred input types, used by API request parsing and web form validation.
- **pay** — `calculateWeeklyPay(totalHours, hourlyRate)` and `round2`: the single home of the overtime/pay calculation.

## Commands

```bash
nx test @timesheet/shared       # unit tests (Vitest)
nx build @timesheet/shared      # build (tsc)
nx typecheck @timesheet/shared  # type-check
```
