# AI Workflow — Mini Timesheets

> Part 3 of the Technical Assessment — how AI was used to build this project.

---

## Tools Used

| Tool | Role |
|---|---|
| **Claude Code** (CLI + VS Code extension) | Primary builder — wrote all the code, specs, tests, and diagrams |
| **Claude Design** (claude.ai) | Generated the hi-fi UI prototype (`Mini Timesheets.dc.html`) and design tokens, committed to `docs/design/` |
| **ctx7 CLI** (`npx ctx7@latest`) | Fetched current docs for Nx, Hono, Drizzle, Next.js, next-intl before using their APIs |

Claude Code was the workhorse. Every file in this repo — types, routes, components, tests, SQL migrations, diagrams, this document — was written by Claude Code from the specs I defined.

**Model strategy:** inside Claude Code I switched models by the weight of the task — **Opus 4.8** for architecture and large changes (where a bad design is expensive to pay back), **Sonnet 4.6** for documentation and bounded, mechanical work.

---

## The method: how I use AI day to day

The way I work with Claude Code doesn't change much from project to project. It goes from "prepare the ground" to "build against that ground." Before writing code I converse, decide, and write the context the AI is going to obey; only then do I let it build.

1. **Discovery: talk the idea through.** Before anything formal, I hand the AI whatever documentation I have, explore the domain, and — in discussion — we decide the stack and general architecture. An exploratory phase: I try options, weigh trade-offs, discard. The big decisions here I make with the most capable model (Opus 4.8).

2. **Visualize the macro architecture with a diagram.** Before detailing anything, I draw what I decided in discovery — a Mermaid architecture diagram. A cheap sanity-check: seeing the macro at a glance exposes design problems before committing them to specs or code. The detail diagrams (ER, state machines) come later, out of the specs.

3. **Set the constitution (`CLAUDE.md`).** I crystallize discovery into rules: stack (marked _locked_), domain rules, macro architecture rules (what lives in shared, where the calculation goes, the error-envelope shape), conventions, and the "hard rules." This is where the expensive-to-change stuff gets pinned down, so the AI doesn't improvise it. It's the first thing the AI reads every session.

4. **Install reusable skills and agents.** Since I already know the stack, I install the **pre-built** skills/agents that fit (`shadcn`, `agent-browser`, `find-docs`): I don't reinvent what's already solved. The **custom** ones don't go here; they show up in step 6, out of real repetition.

5. **Design with specs (the _what_, not the _how_).** For each non-trivial piece I write a spec: expected behavior, contracts, edge cases, "done when." **This is where the local things get decided** — the feature's specific library and its trade-offs, recorded in the spec. Design is decided in text, where fixing is cheap. If a local decision changes later (e.g. react-i18next → next-intl), the spec is updated first and the code after.

6. **Build by vertical slices.** The per-subphase loop: spec → implement → verify (typecheck, tests, visual check). One commit per subphase, one branch per phase, a PR to review — driven through skills (`/create-module`, `/db-change`, `/git-flow`). I review every diff. **This is where the _custom_ skills/agents are born**, when a pattern of mine repeats and nothing covers it — never preemptively.

7. **Audit drift and capture corrections.** Before each PR I check the code hasn't drifted from the specs (the `spec-guardian` agent). And every time I correct the same bad pattern twice, I promote it to a rule — into `CLAUDE.md` or the agent's memory.

8. **Don't trust assumptions.** Fetch the library's current docs before using its API (APIs change faster than the model's cutoff), and verify the result in the app actually running. What isn't verified isn't done.

9. **Context hygiene.** Keep `CLAUDE.md` lean (it points to the specs instead of dumping everything) and clear the context between unrelated tasks.

> **Why this order:** Claude Code is fast but drifts without constraints. A precise spec is cheaper to write than a bad implementation is to fix. If a decision changes mid-way, I update the spec first and the code after. `specs/PLAN.md` is the build log: one checkbox per subphase.

---

# The method applied to Mini Timesheets

> Everything above is how I work in general. Below is that method grounded in this project — the real skills and agents in the repo, and the phase-by-phase log, from the first commit (`f106678`, which wasn't an `npm init` but `CLAUDE.md` + `specs/` + `.claude/`) to delivery.

## Skills & agents in the repo

**Skills** (`.claude/skills/`) — the relevant one loads before each type of task. Two kinds:

- **Reused** (official/community, as-is): `shadcn` (shadcn-first UI, semantic tokens over raw colors), `agent-browser` (drives the running app headless to verify UI in en/es × light/dark), `find-docs`/ctx7 (current library docs before using an API).
- **Custom** (written when a pattern of mine repeated): `git-flow` (one branch/phase, one commit/subphase, PR to `develop`, never commits directly to `main`/`develop`), `create-module` (builds the full vertical slice from a spec, shared → API → web, mirroring existing modules), `db-change` (safe Drizzle workflow: numeric for money, `date` columns, soft delete, never edit an applied migration), `spec-author` (interviews and writes a feature's spec — designs, doesn't implement).

**Agents** (`.claude/agents/`) — isolated subagents with their own context:

- `spec-guardian` — read-only drift auditor; runs before each PR, reports spec/code mismatches with `file:line`, never rewrites application code.
- `test-author` — writes meaningful tests from the spec's "done-when" + edge cases; real DB for DB code, no brittle mocks.

## Build log

### Phase 0 — Scaffold & tooling (`chore/phase-0-scaffold`, PR #2)
First the AI's operating context (`CLAUDE.md`, `specs/`, the `git-flow` skill), then the Nx + pnpm monorepo: three projects (`shared`, `api`, `web`), PostgreSQL via docker-compose (host port 5433), Vitest/ESLint/Prettier wired. Rules before code, so every session opens with them loaded.

### Phase 1 — `packages/shared` (`feat/phase-1-shared-package`, PR #3)
The headless core, smallest dependency first:
- **Domain types** → **error codes + envelope** (`{ error: { code, message } }`, owned by shared) → **UTC-safe date helpers** (never `new Date(str)`, avoids the timezone bug) → **Zod schemas** (hours `[0.25, 24]` in 0.25 increments, no future dates) → **`calculateWeeklyPay()`** → clean **public API**.
- The pay calculation (the graded requirement) is unit-tested on edge cases: exactly 40h, 40.25h, 0h, 60h, the sketch case (45.5h @ $22.50/h → $1,085.63), half-up rounding.
- **Why shared first:** API and web consume the same package, so neither layer diverges from the contract; and the spec forces the client to call `calculateWeeklyPay()` itself.

### Phase 2 — `apps/api` (Hono + Drizzle) (`feat/phase-2-api`, PR #4)
- **3 Drizzle tables**: money/hours as `numeric`, dates as `date`, soft delete via `deactivatedAt`, unique `(employee_id, week_start)`.
- **Common layer**: `AppError`, the error envelope, robust `Accept-Language` parsing with en/es messages, `zValidator`.
- **Modules** for employees, time-entries, and weekly-summary. The lock check + the write run in **one transaction** (atomic, race-safe). The weekly-summary returns raw aggregates; the client computes pay.
- **Integration test** of the approval-locking flow against a real, isolated test DB. **Bonus:** OpenAPI 3.1 + Swagger UI.

### Phase 3 — `apps/web` (Next.js 16) (`feat/phase-3-web`, PR #6)
- Tailwind v4 + shadcn/ui, axios with an envelope→`ApiError` interceptor, next-intl with `[locale]` routing (migrated from react-i18next, spec-first).
- The weekly-summary screen **visibly calls `calculateWeeklyPay()`** from shared and formats money per locale, with optimistic approve/reject.
- Built **functional but basic** first; then a **dedicated cleanup/redesign pass** to hi-fi from a Claude Design `.dc.html` handoff (tokens → shadcn variables, dark mode, global shell).
- After that: server-side pagination + searchable employee filter.

### Phase 4 — Bonus, tests & delivery (PRs #7–#11)
Playwright E2E across the three screens, README verified from a clean clone, and the Mermaid diagrams committed to `docs/diagrams/`. (Spec sync isn't a phase — `spec-guardian` audits drift before every PR, within each phase.)

---

## What the AI did vs. what I did

**Claude Code built** all the TypeScript across the three packages, the Drizzle schemas and migrations, every test (Vitest + Playwright), the Mermaid diagrams, the en/es error and i18n messages, the OpenAPI/Swagger wiring, and this document.

**I (the human)** was the architect: the AI wrote the code, but the architecture decisions, the good practices, and the patterns came from my knowledge. I didn't let it improvise the structure — I guided it, and pinned recurring corrections down as rules in `CLAUDE.md` and the agent's memory so it would respect them every following session. I also defined the acceptance criteria and domain rules, approved or rejected each phase PR (no merge without review), redirected when it drifted, wrote `WRITEUP.md` (human voice only), and verified the README on a clean environment.

---

## Artifacts in this repo (Part 3 deliverables)

| Artifact | Path | Purpose |
|---|---|---|
| Project constitution | `CLAUDE.md` | The AI's operating context: hard, domain, and architecture rules |
| Build plan | `specs/PLAN.md` | Phase-by-phase chronology with "Done when" criteria |
| Specs | `specs/overview.md`, `specs/foundations/`, `specs/features/` | Domain model, locked decisions, and per-feature contracts |
| Custom skills | `.claude/skills/` | git-flow, create-module, db-change, spec-author (+ reused: shadcn, agent-browser, find-docs) |
| Custom agents | `.claude/agents/` | spec-guardian (drift auditor), test-author (meaningful tests) |
| Design handoff | `docs/design/` | Claude Design hi-fi `.dc.html` prototype + brief and tokens |
| Diagrams | `docs/diagrams/` | Mermaid architecture, ER, approval state machine |

All committed as-is, not cleaned up — these are the real working artifacts.
