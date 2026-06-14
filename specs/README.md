# specs/

Spec-driven development plans for Mini Timesheets.

A **spec** is written _before_ the code: it defines what to build, the contracts,
and the edge cases, so the implementation (often AI-assisted) has a clear target
instead of improvising. The spec is the source of truth; code is checked against it.

These files are committed as-is and are deliverable artifacts for the AI workflow
(Part 3). They are intentionally not polished — they reflect the real process.

## Files

| File                   | Scope                                                |
| ---------------------- | ---------------------------------------------------- |
| `00-overview.md`       | Domain model, key decisions, data model, build order |
| `01-shared-package.md` | `packages/shared` — types, Zod schemas, pay calc     |
| `02-api.md`            | `apps/api` — endpoints, error envelope, i18n, db     |
| `03-web.md`            | `apps/web` — screens, data hooks, i18n, UX           |

## How to use

1. Read the relevant spec before implementing a slice.
2. Implement against it; verify with tests.
3. If requirements change, update the spec first, then the code.
