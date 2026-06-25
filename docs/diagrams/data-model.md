# Data model (ER)

The **database** schema (`apps/api/src/db/schema`). Persistence layer only — computed shapes like
the weekly summary (and the pay breakdown) are derived in
[`specs/features/weekly-summary.md`](../../specs/features/weekly-summary.md), not stored.

```mermaid
erDiagram
    employees ||--o{ time_entries : "has"
    employees ||--o{ weekly_approvals : "has"

    employees {
        uuid id PK
        text first_name
        text last_name
        numeric hourly_rate
        timestamp deactivated_at "null = active (soft delete)"
        timestamp created_at
        timestamp updated_at
    }
    time_entries {
        uuid id PK
        uuid employee_id FK
        date date
        numeric hours "0.25–24, 0.25 steps"
        timestamp created_at
        timestamp updated_at
    }
    weekly_approvals {
        uuid id PK
        uuid employee_id FK
        date week_start "Monday of the week"
        enum status "pending | approved | rejected"
        timestamp created_at
        timestamp updated_at
    }
```

- `employees` is **soft-deleted** via `deactivated_at` — rows are never removed, so historical
  `time_entries` and `weekly_approvals` stay intact.
- `time_entries` has an index on `(employee_id, date)`.
- `weekly_approvals` has a **unique** `(employee_id, week_start)` — absence of a row means
  implicitly `pending`.
- Money/hours are `numeric` (never float). Dates are `date` (date-only, no timezone).

See [`specs/foundations/api-platform.md`](../../specs/foundations/api-platform.md) and the feature
specs for the rules behind each table.
