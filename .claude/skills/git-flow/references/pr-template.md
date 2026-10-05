# Pull Request template — Mini Timesheets

## Title

`<type>(<scope>): short imperative summary`

Example: `feat(weekly-summary): snapshot hourly rate on approval`

---

## What this PR does

<!-- 2-4 sentences describing the change. -->

## OpenSpec change

<!-- The change id and the capabilities whose specs it modifies. -->

- Change: `openspec/changes/archive/<date>-<change-id>/`
- Capabilities touched: <e.g. weekly-summary, approval-flow>

## How it was verified

<!-- Tests run, manual checks, fresh-clone notes if relevant. -->

- [ ] `pnpm test` passes
- [ ] `pnpm lint` passes
- [ ] Manual check (describe)

---

## Checklist

- [ ] Branch cut from `develop`, named `<type>/<change-id>`
- [ ] Conventional, scoped commits
- [ ] `tasks.md` fully ticked and change archived
- [ ] `openspec validate --all --strict` passes
- [ ] No debug code, no committed secrets / `.env`
- [ ] Delta specs updated if requirements changed during implementation

## Notes for reviewer

<!-- Technical decisions, deviations from the spec, areas to look at. -->
