# Approval flow & locking

The per-(employee, week) approval state machine. Only `approved` locks that week's time entries;
`reject` reopens. Absence of a row = implicitly `pending`.

```mermaid
stateDiagram-v2
    [*] --> pending: no approval row
    pending --> approved: approve
    pending --> rejected: reject
    approved --> rejected: reject (reopen)
    rejected --> approved: approve (re-approve)

    note right of approved
        Week LOCKED
        create / edit / delete of any entry
        in this week → WEEK_LOCKED (409)
    end note
    note right of rejected
        Editable again — fix and resubmit
    end note
```

The lock is enforced in the time-entries service, inside a transaction, so the check and the write
are atomic:

```mermaid
sequenceDiagram
    actor Reviewer
    participant Web
    participant API as API (time-entries service)
    participant DB as PostgreSQL

    Reviewer->>Web: edit/delete an entry
    Web->>API: PATCH/DELETE /time-entries/:id
    API->>DB: read approval for (employee, week) [tx]
    alt week is approved
        API-->>Web: 409 WEEK_LOCKED
    else pending / rejected
        API->>DB: write the change [tx]
        API-->>Web: 200 OK
    end
```

See [`specs/features/approval-flow.md`](../../specs/features/approval-flow.md).
