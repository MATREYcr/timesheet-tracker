# Feature — Weekly summary (core)

Per employee, for a chosen week: regular vs overtime hours and total pay. The core screen.

## Context / Why
This is what payroll is actually computed from. Overtime (hours beyond 40 in a week, paid at 1.5×)
is the one rule that makes timesheets non-trivial, so the calculation has to be exact, tested, and
shared — and the client must genuinely *consume* it, not display numbers the API pre-chewed.

## Scope
- **In:** the `calculateWeeklyPay` contract + unit tests; the raw weekly aggregate endpoint; the
  week-picker screen that derives and renders regular/overtime/pay; locale-aware money formatting.
- **Out:** computing pay on the server for this screen (the client does it); cross-week or
  multi-week totals (the dashboard does week KPIs separately).

## Decisions
| Decision | Choice | Why | Rejected |
| --- | --- | --- | --- |
| Where pay is computed | the **web client**, via shared `calculateWeeklyPay` | proves the client consumes the shared calc (a graded requirement) | API computes pay (client wouldn't exercise `shared`) |
| API payload | raw aggregate (`totalHours`, `hourlyRate`, `status`) | keep the calc in one place; API stays dumb | returning a computed pay breakdown |
| Rounding | `round2` half-up at the boundary | deterministic, payroll-safe; never compare raw floats | banker's rounding / float compares |
| Who appears | employees with ≥1 entry that week (active or inactive) | inactive employees' historical weeks stay visible | only active employees |

## Domain rules & invariants
```
regularHours  = min(totalHours, 40)
overtimeHours = max(totalHours - 40, 0)
regularPay    = round2(regularHours * rate)
overtimePay   = round2(overtimeHours * rate * 1.5)
totalPay      = round2(regularPay + overtimePay)
```
`round2` = half-up to 2 decimals (avoid float drift, e.g. `Math.round((n + Number.EPSILON) * 100)
/ 100`). The calc lives in `packages/shared` and must never be inlined in the API or client.

## Contracts
- **Pay contract (`shared`):**
  ```ts
  type WeeklyPay = {
    totalHours: number;
    regularHours: number;  // min(total, 40)
    overtimeHours: number; // max(total - 40, 0)
    regularPay: number;    // round2(regularHours * rate)
    overtimePay: number;   // round2(overtimeHours * rate * 1.5)
    totalPay: number;      // round2(regularPay + overtimePay)
  };
  function calculateWeeklyPay(totalHours: number, hourlyRate: number): WeeklyPay;
  ```
- **Type:** `WeeklySummaryRow` — `{ employeeId, firstName, lastName, hourlyRate, totalHours,
  status }` (computed, not stored).
- **Endpoint:** `GET /weekly-summary?weekStart=&page=&pageSize=&employeeId=` → `Paginated<WeeklySummaryRow>`,
  one row per employee with ≥1 time entry that week. The API does **not** compute pay or the
  regular/overtime split. Approve/reject and the per-week status live in
  [`approval-flow`](approval-flow.md).
- **Screen:** week picker (prev/next, Monday–Sunday range label); for each row, call
  `calculateWeeklyPay(totalHours, rate)` and render regular hours, overtime hours, and the pay
  breakdown (`regular + overtime = total`). Money formatted with `Intl.NumberFormat` per active
  locale (en → `$1,085.63`, es → `$1.085,63`). Overtime > 0 shows the amber pill.

## Edge cases (unit-tested in `shared`)
- Exactly **40h** → all regular, no overtime.
- **40.25h** → 40 regular + 0.25 overtime.
- Under 40h (e.g. **32h**) → no overtime.
- Decimal hours summing across days (e.g. 7.5 + 8 + 8.25 + …).
- **0h** → all zeros.
- Large hours (e.g. **60h**) → 40 regular + 20 overtime.
- Rounding: the assessment sketch **45.5h @ $22.50 → $900.00 + $185.63 = $1,085.63** (assert
  half-up).

## Known limitations
- `hourlyRate` is not snapshotted per approved week: editing the rate later changes the displayed
  pay of past approved weeks. Deliberate trade-off for scope (see [`overview`](../overview.md)). In
  production an approval would freeze the rate or store the computed pay.

## Verification / Done when
- `calculateWeeklyPay` passes the edge-case suite above (incl. the sketch and half-up rounding) —
  `pnpm nx test shared`.
- The weekly-summary screen renders the regular/overtime/pay split by calling the shared calc
  (frontend component test, PLAN 3.9) — not numbers pre-computed by the API.
- Money renders correctly per locale (en/es formats).
