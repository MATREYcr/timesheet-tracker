---
name: git-flow
description: >
  Git workflow conventions for the Mini Timesheets assessment (solo, GitHub, no Jira/Vercel).
  Use ALWAYS when the user mentions: starting a phase, creating a branch, committing,
  pushing, opening a PR, or any git operation. This skill defines a phase-based flow:
  one branch per phase, one commit per subphase, push, then a PR back to develop with the
  link returned to the user. Mandatory before any git operation touching main or develop.
---

# Git Flow — Mini Timesheets (project workflow)

Adapted from the personal git-flow skill, trimmed for this assessment: **no Jira, no
Vercel, no release/hotfix branches, no team-review checklists.** Solo developer, GitHub.

## Golden rules

1. **Claude never merges to `main` and never approves PRs.** It can open PRs, push
   branches, and report status — but merging/approval is the human's call. No
   `gh pr merge` to main and no `gh pr review --approve` without an explicit human ok.
2. **Never commit directly on `develop` or `main`.** All work happens on a phase branch.
3. Before any push/PR to `develop` or `main`, state what you're about to do and proceed
   only with the work for the current phase.

---

## Branch model

```
main          ← final deliverable. Receives ONE release PR from develop at the very end.
develop       ← integration. Phase PRs merge here.
<type>/phase-N-<slug>   ← one branch PER PHASE, cut from develop, PR'd back to develop.
```

Phase branches (per `specs/PLAN.md`):

| Phase | Branch                        |
| ----- | ----------------------------- |
| 0     | `chore/phase-0-scaffold`      |
| 1     | `feat/phase-1-shared-package` |
| 2     | `feat/phase-2-api`            |
| 3     | `feat/phase-3-web`            |
| 4     | `docs/phase-4-delivery`       |

---

## The phase workflow (follow this exactly)

### ▶ When a PHASE starts — create the branch

```bash
git checkout develop
git pull origin develop
git checkout -b <type>/phase-N-<slug>
```

### ● For EACH subphase — commit on that branch

One conventional commit per completed subphase (the `[ ]` items in `PLAN.md`):

```bash
git add <files>
git commit -m "feat(scope): describe the subphase in imperative"
```

Tick the matching checkbox in `specs/PLAN.md` in the same commit when it makes sense.

### ⬆ Push

Push the branch (after each subphase, or at minimum before opening the PR):

```bash
git push -u origin <type>/phase-N-<slug>
```

### ✔ When the PHASE finishes — open the PR and return the link

```bash
gh pr create --base develop --head <type>/phase-N-<slug> \
  --title "<type>(phase-N): <phase summary>" \
  --body-file <(...)   # use the template in references/pr-template.md
```

Then **report the PR URL back to the user** (the `gh pr create` output). Do not merge it
— that's the user's decision.

### 🏁 At the very end (Phase 4 done)

Open the final release PR `develop → main` and return the link. Do not merge to `main`.

---

## Branch naming

`<type>/phase-N-<short-slug>` — lowercase, words separated by `-`, no spaces/underscores/camelCase.

For non-phase work (a quick fix mid-phase), use `fix/<slug>` or `chore/<slug>`.

| type       | when                         |
| ---------- | ---------------------------- |
| `feat`     | new functionality            |
| `fix`      | bug fix                      |
| `chore`    | setup, tooling, dependencies |
| `refactor` | behavior-preserving cleanup  |
| `docs`     | documentation                |
| `test`     | tests                        |

---

## Conventional commits

`type(scope): description in imperative` — same type list as above.

Scope = the area touched (`shared`, `api`, `web`, `db`, `i18n`, `repo`…).

Examples:

```
chore(repo): scaffold nx workspace with pnpm
feat(shared): add calculateWeeklyPay with overtime rules
feat(api): add employees CRUD with soft delete
feat(web): build weekly summary screen with approve/reject
test(shared): cover overtime edge cases
docs(repo): write fresh-clone setup in README
```

Sign-off footer for AI-authored commits:

```
Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
```

---

## Pre-PR quick checklist (solo version)

Before opening a phase PR to `develop`:

- [ ] Branch is `<type>/phase-N-<slug>`, cut from `develop`.
- [ ] Commits are conventional and scoped to this phase.
- [ ] Phase subphases ticked in `specs/PLAN.md`.
- [ ] `pnpm test` and `pnpm lint` pass (once tooling exists).
- [ ] No debug leftovers, no committed secrets / `.env`.
- [ ] Branch pushed to origin.

See `references/pr-template.md` for the PR body.
