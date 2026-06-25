# specs/

Spec-driven development plans for Mini Timesheets.

A **spec** is written _before_ the code: it defines what to build, the contracts, and the edge
cases, so the implementation (often AI-assisted) has a clear target instead of improvising. The
spec is the source of truth; code is checked against it.

These files are committed as-is and are deliverable artifacts for the AI workflow (Part 3). They
are intentionally not polished — they reflect the real process, deviations and all.

## Structure

```
specs/
├── overview.md           # domain model, locked decisions (with why), build order — the index
├── foundations/          # cross-cutting concerns that aren't a single feature
│   ├── shared-package.md      # headless contract: types, dates, errors, public API
│   ├── error-envelope-i18n.md # error envelope + en/es + Accept-Language + code→message map
│   ├── api-platform.md        # Hono conventions: modules, request flow, tx, pagination, db
│   └── web-platform.md        # Next.js structure, data layer, design system, UX conventions
├── features/             # one self-contained spec per capability (cuts across packages)
│   ├── employees.md
│   ├── time-entries.md
│   ├── weekly-summary.md      # ⭐ the pay calculation + the core screen
│   ├── approval-flow.md       # ⭐ approvals + locking + the integration test
│   └── dashboard.md
├── PLAN.md               # the how & order — chronological build log with "Done when" checks
└── README.md             # this file
```

Authoring convention: feature specs follow the 9-section template in the `spec-author` skill
(`.claude/skills/spec-author/`). The overview is the index; `foundations/` holds anything
cross-cutting; each `features/` spec owns one capability across all layers.

## How to use

1. Read the relevant feature spec (and the foundations it leans on) before implementing a slice.
2. Implement against it; verify with the "Done when" in `PLAN.md`.
3. If requirements change, update the spec first, then the code — record the deviation.
