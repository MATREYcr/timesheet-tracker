---
name: git-flow
description: >
  Git workflow conventions for the Mini Timesheets assessment (solo, GitHub, no Jira/Vercel).
  Use ALWAYS when the user mentions: starting a change, creating a branch, committing,
  pushing, opening a PR, or any git operation. This skill defines a change-based flow:
  one branch per OpenSpec change, one commit per task group, push, then a PR back to develop
  with the link returned to the user. Mandatory before any git operation touching main or develop.
---

# Git Flow — Mini Timesheets (project workflow)

Adapted from the personal git-flow skill, trimmed for this assessment: **no Jira, no
Vercel, no release/hotfix branches, no team-review checklists.** Solo developer, GitHub.

## Golden rules

1. **Claude never merges to `main` and never approves PRs.** It can open PRs, push
   branches, and report status — but merging/approval is the human's call. No
   `gh pr merge` to main and no `gh pr review --approve` without an explicit human ok.
2. **Never commit directly on `develop` or `main`.** All work happens on a change (or chore/fix) branch.
3. Before any push/PR to `develop` or `main`, state what you're about to do and proceed
   only with the work for the current change.

---

## Branch model

```
main          ← deliverable. Receives release PRs from develop.
develop       ← integration. Change PRs merge here.
<type>/<change-id>   ← one branch PER OpenSpec change, cut from develop, PR'd back to develop.
```

`<change-id>` is the folder name under `openspec/changes/` (kebab-case, e.g.
`feat/add-rate-snapshot`). The original assessment was built in phases
(`chore/phase-0-scaffold` … `docs/phase-4-delivery`, logged in `specs/PLAN.md`); that log is
historical — new work follows the change flow below.

---

## The change workflow (follow this exactly)

### ▶ When a CHANGE starts — create the branch

```bash
git checkout develop
git pull origin develop
git checkout -b <type>/<change-id>
```

Commit the proposal artifacts (`/opsx:propose` output) first:
`docs(openspec): propose <change-id>`.

### ● For EACH task group — commit on that branch

One conventional commit per completed task group (the `## N.` sections in the change's
`tasks.md`), ticking its `[ ]` items in the same commit:

```bash
git add <files>
git commit -m "feat(scope): describe the task group in imperative"
```

### ⬆ Push

Push the branch (after each task group, or at minimum before opening the PR):

```bash
git push -u origin <type>/<change-id>
```

### ✔ When the CHANGE is implemented — archive, open the PR and return the link

Run `/opsx:archive` (merges delta specs into `openspec/specs/`) and commit it as
`docs(openspec): archive <change-id>`, then:

```bash
gh pr create --base develop --head <type>/<change-id> \
  --title "<type>(<scope>): <change summary>" \
  --body-file <(...)   # use the template in references/pr-template.md
```

Then **report the PR URL back to the user** (the `gh pr create` output). Do not merge it
— that's the user's decision.

### 🏁 Releases

When the user asks for a release, open the PR `develop → main` and return the link. Do not
merge to `main`.

---

## Branch naming

`<type>/<change-id>` — lowercase, words separated by `-`, no spaces/underscores/camelCase.

For work that doesn't warrant an OpenSpec change (tooling, a trivial fix), use `fix/<slug>`
or `chore/<slug>`.

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
Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
```

---

## Pre-PR quick checklist (solo version)

Before opening a change PR to `develop`:

- [ ] Branch is `<type>/<change-id>`, cut from `develop`.
- [ ] Commits are conventional and scoped to this change.
- [ ] All tasks ticked in the change's `tasks.md`; change archived (`/opsx:archive`).
- [ ] `openspec validate --all --strict` passes.
- [ ] `pnpm test` and `pnpm lint` pass (once tooling exists).
- [ ] No debug leftovers, no committed secrets / `.env`.
- [ ] `pnpm-lock.yaml` committed whenever a dependency changed (CI installs with
      `--frozen-lockfile` and fails if the lockfile is out of sync).
- [ ] Branch pushed to origin.

See `references/pr-template.md` for the PR body.
