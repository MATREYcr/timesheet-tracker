# Feature — Dashboard

A "this week" overview with a few KPIs, computed server-side.

> Added after the core screens (see PLAN). Not one of the three sketch screens — a small
> read-only landing view so the home page shows something useful without over-fetching.

## Context / Why
Landing straight on a table is abrupt. A handful of week KPIs (active staff, total hours, total
pay, how many weeks still need review) gives an at-a-glance state. Doing it as a dedicated endpoint
avoids pulling the full roster + summary just to show a few numbers.

## Scope
- **In:** a single `GET /dashboard?weekStart=` returning the week's KPIs + a short pending preview.
- **Out:** historical trends, charts, per-employee drill-down (that's [`weekly-summary`](weekly-summary.md)).

## Decisions
| Decision | Choice | Why | Rejected |
| --- | --- | --- | --- |
| Where pay is computed | **server-side**, via shared `calculateWeeklyPay` | a read-only KPI view; cheaper than shipping every row to the client | computing on the client (would over-fetch) |
| Payload | counts + totals + ≤5 preview rows | enough for a glance without the full list | the full weekly summary |

This is the deliberate exception to "the client computes pay": the *weekly summary screen* still
derives pay on the client (the graded requirement); the dashboard is a separate read-only view, and
running the **same shared calc** on the server proves it is genuinely platform-agnostic.

## Contracts
- **Type:** `DashboardSummary`:
  ```json
  { "weekStart": "2026-06-15", "activeEmployees": 14, "totalHours": 586,
    "totalPay": 13340.5, "pendingCount": 6, "pending": [ /* ≤5 WeeklySummaryRow */ ] }
  ```
- `activeEmployees` is a SQL count; `pendingCount` is derived in the service from the weekly
  aggregate (the count of pending rows, not a separate SQL query); `totalHours` is summed
  server-side; `totalPay` runs the shared `calculateWeeklyPay` over each employee's weekly
  aggregate and sums.
- **Endpoint:** `GET /dashboard?weekStart=`.

## Verification / Done when
- `GET /dashboard?weekStart=` returns the KPIs and a ≤5-row pending preview for the given week.
- `totalPay` matches summing the shared calc over the week's aggregates.
