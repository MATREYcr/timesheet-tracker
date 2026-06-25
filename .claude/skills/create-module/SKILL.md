---
name: create-module
description: >
  Implement a feature as a full vertical slice across the stack, in the exact order and file
  layout this project uses. Use AFTER a feature spec exists (write one with `spec-author` first),
  when you're ready to BUILD: a new API module, a new shared domain, a new web screen, or all
  three. Triggers on: "implement <feature>", "add a module", "create the endpoint/route", "build
  the screen", "scaffold <feature>", "add a domain to shared". Follow it step by step — do not
  improvise the structure.
---

# create-module — build a feature as a vertical slice

## When to use

After the feature's spec exists (`specs/features/<slug>.md`). If it doesn't, stop and run
`spec-author` first — never build without a spec. This skill turns that spec into code following
the project's exact module shape, in the right order, without re-deriving the structure each time.

## The one rule that makes this deterministic

**Mirror an existing slice — don't invent the shape.** Before writing any file, open the closest
existing module and copy its structure, naming, and wiring:

- API → mirror `apps/api/src/modules/employees/` (`*.routes.ts`, `*.service.ts`, `*.mapper.ts`,
  `*.openapi.ts`).
- Web → mirror `apps/web/src/features/employees/` (`api.ts`, `hooks.ts`, `components/`).
- Shared → mirror `packages/shared/src/employee/employee.ts`.

The live code is the template. The **why** behind each layer lives in `specs/foundations/`
(`shared-package`, `api-platform`, `web-platform`) and `CLAUDE.md` — read them once if unsure;
this skill is the **procedure**, those are the **rationale**. Do not duplicate their content here.

## Build order (always shared → api → web)

Skip a whole phase only for a partial slice (e.g. an extra endpoint = phase B only; a pure UI
tweak = phase C only). Within a phase, do the steps in order — later steps depend on earlier ones.

### Phase A — `packages/shared` (the contract, first)

1. **Domain schema + types** — `packages/shared/src/<domain>/<domain>.ts`: define the Zod
   schema(s); **derive** the types from them (`z.infer`), don't hand-write parallel types. Mirror
   `employee.ts`.
2. **Export** the new symbols from `packages/shared/src/index.ts`.
3. **Error codes** — if the feature introduces new failure modes, add the code(s) to the shared
   `ErrorCode` union (`src/utils/errors.ts`) **and** the en/es message in
   `apps/api/src/common/errors/messages.ts`. No new envelope shape — reuse `{ error: { code, message } }`.

### Phase B — `apps/api` (the endpoints)

4. **DB schema** — `apps/api/src/db/schema/<entity>.ts`: Drizzle table (numeric money/hours,
   date-only where applicable, FKs, indexes/uniques per the spec). Export it from
   `db/schema/index.ts`. Then generate + apply the migration (`drizzle-kit`).
5. **OpenAPI contract** — `modules/<name>/<name>.openapi.ts`: the route definitions (method, path,
   query/body/response schemas pulled from `@timesheet/shared`). Mirror `employees.openapi.ts`.
6. **Service** — `modules/<name>/<name>.service.ts`: the logic (Drizzle queries + domain rules;
   throw `AppError` with a shared code; explicit return types). Mutations that must be atomic run
   in a transaction. No business logic in routes.
7. **Mapper** — `modules/<name>/<name>.mapper.ts` only if the DB row shape differs from the API
   shape; otherwise skip.
8. **Routes** — `modules/<name>/<name>.routes.ts`: wire the OpenAPI contract to the service via
   `createModuleApp()`. Mirror `employees.routes.ts`.
9. **Register the router** — add the sub-router to `apps/api/src/routes/index.ts`. ← the step most
   often forgotten; without it the routes don't exist.
10. **Integration test** — cover the feature's key rule (the `Verification / Done when` in its
    spec). Mirror the approval-locking test.

### Phase C — `apps/web` (the screen)

11. **API client** — `features/<name>/api.ts`: typed endpoint functions using the shared `http`
    instance and `@timesheet/shared` types. Mirror `employees/api.ts`.
12. **Hooks** — `features/<name>/hooks.ts`: TanStack Query hooks (`useX`, `useCreateX`, …) wrapping
    `api.ts`. Use `placeholderData: keepPreviousData` for paginated lists and optimistic
    update/rollback for mutations where the spec calls for it.
13. **Components** — `features/<name>/components/`: table / dialog / form. Forms use
    `react-hook-form` + the **shared** Zod schema (Standard Schema resolver) — never a duplicated
    schema. Use shadcn primitives + semantic tokens (`bg-primary`, `text-muted-foreground`), not
    raw colors.
14. **i18n strings** — add the en/es keys to the message files (next-intl). No hardcoded
    user-facing text.
15. **Page** — `app/[locale]/<name>/page.tsx`: a thin route that renders the feature. Routing only.
16. **States** — every async view has loading (skeleton/spinner), error (envelope `ApiError` +
    retry), and empty (shadcn `Empty`) states.

## Verify each phase before moving on

- Shared: `pnpm nx test shared` + typecheck.
- API: `pnpm nx typecheck api` + the integration test green; hit the route once (curl/Swagger).
- Web: `pnpm nx typecheck web` + lint; the screen renders with all three states.

Run the `/subphase` gate (typecheck + lint + test) and tick the matching `specs/PLAN.md`
"Done when" as each step passes. If a decision changed while building, update the feature spec
**first** (record it under `## Notes / deviations`), then the code.

## Final wiring checklist (the easy-to-forget bits)

- [ ] New types/schemas exported from `packages/shared/src/index.ts`.
- [ ] New `ErrorCode` added to the union **and** mapped to en/es in `messages.ts`.
- [ ] DB migration generated **and** applied; table exported from `db/schema/index.ts`.
- [ ] Sub-router registered in `apps/api/src/routes/index.ts`.
- [ ] Forms use the shared Zod schema (no duplicate validation).
- [ ] i18n keys added in en **and** es; nothing hardcoded.
- [ ] Loading / error / empty states present on every async view.
- [ ] The spec's `Verification / Done when` is actually green.
