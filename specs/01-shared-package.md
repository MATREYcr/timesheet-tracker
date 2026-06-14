# Spec 01 — `packages/shared`

The headless heart of the project. Pure TypeScript, consumed by both API and web.
No React, no React Native, no `window`, no framework imports.

---

## Responsibilities

1. **Types** — the domain model (`Employee`, `TimeEntry`, `WeeklyApproval`,
   `WeeklySummary`, enums).
2. **Zod schemas** — validation for inputs, used by API request parsing AND web
   form validation. Single source of truth. Time-entry hours: `0.25–24` in `0.25`
   increments (`.multipleOf(0.25)`); date must not be in the future.
3. **Pay calculation** — overtime + pay, fully unit tested.
4. **Date/week helpers** — `weekStart` derivation, week ranges.
5. **Error codes** — the canonical list of stable error `code`s (so API and web
   agree on them).

## Proposed structure

```
packages/shared/src/
├── types.ts            domain types & enums
├── schemas.ts          Zod schemas (+ inferred input types)
├── pay.ts              calculateWeeklyPay() and round2()
├── dates.ts            getWeekStart(), isFutureDate(), week range helpers
├── errors.ts           ErrorCode union + envelope type
└── index.ts            public exports
```

## Pay calculation contract

```ts
type WeeklyPay = {
  totalHours: number;
  regularHours: number;   // min(total, 40)
  overtimeHours: number;  // max(total - 40, 0)
  regularPay: number;     // round2(regularHours * rate)
  overtimePay: number;    // round2(overtimeHours * rate * 1.5)
  totalPay: number;       // round2(regularPay + overtimePay)
};

function calculateWeeklyPay(totalHours: number, hourlyRate: number): WeeklyPay;
```

`round2(n)` = half-up rounding to 2 decimals (avoid float drift, e.g. via
`Math.round((n + Number.EPSILON) * 100) / 100`, verified against edge cases).

## Date helpers

- `getWeekStart(date: string): string` — returns the Monday (date-only) of the
  week containing `date`. Pure string/UTC math, no local timezone.
- `isFutureDate(date: string, today?: string): boolean`.

## Unit tests (required)

Cover at minimum:
- Exactly 40h → all regular, no overtime.
- 40.25h → 40 regular + 0.25 overtime.
- Under 40h (e.g. 32h) → no overtime.
- Decimal hours summing across days (e.g. 7.5 + 8 + 8.25 + ...).
- 0h → all zeros.
- Large hours (e.g. 60h) → 40 regular + 20 overtime.
- Rounding: a rate/hours combo that produces fractional cents (assert half-up).
- `getWeekStart` for each weekday (Mon..Sun) returns the correct Monday, including
  month/year boundaries.
