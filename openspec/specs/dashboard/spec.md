# Dashboard Specification

## Purpose

A read-only "this week" landing view with a few KPIs (active staff, total hours, total pay,
pending reviews) served by one endpoint, so the home page is useful without over-fetching the
roster and the full weekly summary.

## Requirements

### Requirement: Dashboard KPIs endpoint

`GET /dashboard?weekStart=` SHALL return a `DashboardSummary`:
`{ weekStart, activeEmployees, totalHours, totalPay, pendingCount, pending }` where `pending` is a
preview of at most 5 `WeeklySummaryRow`s. `activeEmployees` is a SQL count; `totalHours` is summed
server-side; `pendingCount` is derived in the service from the weekly aggregate (count of pending
rows), not a separate query.

#### Scenario: KPIs for a week

- **WHEN** a client calls `GET /dashboard?weekStart=2026-06-15`
- **THEN** the response contains the week's KPIs and at most 5 pending rows

### Requirement: Server-side pay via the shared calculation

`totalPay` SHALL be computed on the server by running the shared `calculateWeeklyPay` over each
employee's weekly aggregate and summing. This is the deliberate exception to "the client computes
pay": the weekly summary screen still derives pay on the client, and running the same shared calc
on the server shows it is platform-agnostic. The formula MUST NOT be reimplemented here.

#### Scenario: Total pay matches the shared calc

- **WHEN** the dashboard is requested for a week
- **THEN** `totalPay` equals the sum of `calculateWeeklyPay(totalHours, hourlyRate).totalPay`
  over that week's rows

### Requirement: Dashboard screen

The web client SHALL render the KPIs as stat cards and the pending preview as a short list linking
to the weekly summary. Historical trends, charts and per-employee drill-down are out of scope.

#### Scenario: Pending preview

- **WHEN** a week has 8 pending rows
- **THEN** the screen shows `pendingCount = 8` and lists 5 of them
