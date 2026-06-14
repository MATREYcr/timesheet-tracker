# Pull Request template — Mini Timesheets

## Title
`<type>(phase-N): short imperative summary`

Example: `feat(phase-1): shared package — types, schemas, pay calculation`

---

## What this PR does
<!-- 2-4 sentences describing the phase's changes. -->

## Phase
<!-- Which phase from specs/PLAN.md, and which subphases are completed. -->
- Phase: N — <name>
- Subphases done: <e.g. 1.1–1.6>

## How it was verified
<!-- Tests run, manual checks, fresh-clone notes if relevant. -->
- [ ] `pnpm test` passes
- [ ] `pnpm lint` passes
- [ ] Manual check (describe)

---

## Checklist
- [ ] Branch cut from `develop`, named `<type>/phase-N-<slug>`
- [ ] Conventional, scoped commits
- [ ] `specs/PLAN.md` checkboxes updated
- [ ] No debug code, no committed secrets / `.env`
- [ ] Relevant specs updated if requirements changed

## Notes for reviewer
<!-- Technical decisions, deviations from the spec, areas to look at. -->
