# Weekly Summary Specification

## Purpose

Per employee, for a chosen week, show regular vs overtime hours and total pay — the core screen
payroll is computed from. The overtime/pay calculation lives in `packages/shared`, is unit-tested,
and the web client genuinely consumes it instead of displaying numbers pre-computed by the API.

## Requirements

### Requirement: Week definition

A week SHALL run Monday → Sunday. `weekStart` is always the Monday (date-only) of that week and is
the canonical key for a week. It MUST be derived by the shared `getWeekStart` helper using
UTC-safe string math, reused everywhere.

#### Scenario: Sunday belongs to the previous Monday

- **WHEN** `getWeekStart("2026-06-14")` is called (a Sunday)
- **THEN** it returns `"2026-06-08"`

#### Scenario: Month/year boundary

- **WHEN** `getWeekStart` is called for a date whose Monday is in the previous month or year
- **THEN** it returns that Monday correctly without a timezone shift

### Requirement: Overtime and pay calculation

`calculateWeeklyPay(totalHours, hourlyRate)` in `packages/shared` SHALL return
`{ totalHours, regularHours, overtimeHours, regularPay, overtimePay, totalPay }` where:

```
regularHours  = min(totalHours, 40)
overtimeHours = max(totalHours - 40, 0)
regularPay    = round2(regularHours * rate)
overtimePay   = round2(overtimeHours * rate * 1.5)
totalPay      = round2(regularPay + overtimePay)
```

`round2` MUST round half-up to 2 decimals, float-safe. The calculation MUST NOT be inlined in API
routes or client components, and raw floats MUST NOT be compared for equality.

#### Scenario: Exactly 40 hours

- **WHEN** `calculateWeeklyPay(40, 20)` is called
- **THEN** `regularHours = 40`, `overtimeHours = 0`, `totalPay = 800`

#### Scenario: Just over 40 hours

- **WHEN** `calculateWeeklyPay(40.25, 20)` is called
- **THEN** `regularHours = 40` and `overtimeHours = 0.25`

#### Scenario: Under 40 hours

- **WHEN** `calculateWeeklyPay(32, 20)` is called
- **THEN** `overtimeHours = 0` and `totalPay = 640`

#### Scenario: Zero hours

- **WHEN** `calculateWeeklyPay(0, 20)` is called
- **THEN** every field is `0`

#### Scenario: Large hours

- **WHEN** `calculateWeeklyPay(60, 20)` is called
- **THEN** `regularHours = 40` and `overtimeHours = 20`

#### Scenario: Decimal hours split across days

- **WHEN** a week's entries are 7.5 + 8 + 8.25 + … and their sum is passed in
- **THEN** the result matches the formula without float drift

#### Scenario: Half-up rounding (assessment sketch)

- **WHEN** `calculateWeeklyPay(45.5, 22.5)` is called
- **THEN** `regularPay = 900.00`, `overtimePay = 185.63` and `totalPay = 1085.63`

### Requirement: Weekly aggregate endpoint

`GET /weekly-summary?weekStart=&page=&pageSize=&employeeId=` SHALL return
`Paginated<WeeklySummaryRow>` with one row per employee who has at least one time entry that week
— active or inactive. Each row is `{ employeeId, firstName, lastName, hourlyRate, totalHours,
status }`. The API MUST NOT compute pay or the regular/overtime split for this endpoint; the
summary is computed, never stored.

#### Scenario: Only employees with entries

- **WHEN** a week has entries for 3 of 10 employees
- **THEN** the endpoint returns exactly those 3 rows

#### Scenario: Inactive employee included

- **WHEN** an inactive employee has entries in the requested week
- **THEN** their row is included

#### Scenario: No pay in payload

- **WHEN** the endpoint responds
- **THEN** rows contain `totalHours` and `hourlyRate` but no pay or overtime fields

### Requirement: Client derives pay with the shared calculation

The Weekly summary screen SHALL call `calculateWeeklyPay(totalHours, hourlyRate)` from
`packages/shared` for every row to render regular hours, overtime hours and the pay breakdown
(`regular + overtime = total`). Overtime greater than 0 SHALL be highlighted with the amber
overtime pill.

#### Scenario: Row rendering

- **WHEN** a row has `totalHours = 45.5` and `hourlyRate = 22.5`
- **THEN** the screen shows 40 regular, 5.5 overtime (amber pill) and a total of `$1,085.63` in
  English

### Requirement: Week navigation

The screen SHALL provide a week picker with previous/next controls and a Monday–Sunday range
label, plus a server-side employee filter and pagination.

#### Scenario: Next week

- **WHEN** the user clicks next
- **THEN** the screen loads the summary for `weekStart + 7 days`

### Requirement: Locale-aware money formatting

Money SHALL be formatted with `Intl.NumberFormat` for the active locale; currency strings MUST NOT
be hand-rolled.

#### Scenario: English

- **WHEN** the locale is `en` and the total is 1085.63
- **THEN** it renders `$1,085.63`

#### Scenario: Spanish

- **WHEN** the locale is `es` and the total is 1085.63
- **THEN** it renders `$1.085,63`

## Known limitations

`hourlyRate` is not snapshotted per approved week: editing the rate later changes the displayed
pay of past approved weeks. In production an approval would freeze the rate or store the computed
pay.
