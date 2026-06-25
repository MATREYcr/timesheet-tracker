---
name: db-change
description: >
  Change the database safely: add/alter a Drizzle table or column, generate and apply a migration,
  reset, or (re)seed. Use whenever the schema changes or you need to run/inspect the database.
  Triggers on: "add a table/column", "change the schema", "migration", "drizzle", "seed the db",
  "reset the db", "the db is out of sync". Follow the order and review the generated SQL before
  applying — never edit a migration that's already been applied.
---

# db-change — safe database & migration workflow

## When to use

Any time the schema (`apps/api/src/db/schema/`) changes, or you need to generate/apply a migration,
seed, or reset the DB. The **rationale** for the data model lives in
`specs/foundations/api-platform.md` and the feature specs; this skill is the **procedure**.

## Setup facts (know these before running anything)

- **Postgres runs via docker-compose.** It must be up (`docker compose up -d`) and Docker Desktop
  running, or every command fails to connect.
- **Host port is `5433`, not 5432** — remapped to avoid clashing with a local Postgres on 5432.
  `DATABASE_URL` in the **root `.env`** points at `5433`. `drizzle.config.ts` and the seed load
  that root `.env`. Never commit `.env`.
- **Scripts live in `apps/api`** (run from there, or `pnpm --filter @timesheet/api <script>`):
  | Script | Does |
  | --- | --- |
  | `db:generate` | `drizzle-kit generate` — diff schema → write a new SQL migration |
  | `db:migrate` | `drizzle-kit migrate` — apply pending migrations |
  | `db:push` | `drizzle-kit push` — push schema straight to the DB (dev throwaway only) |
  | `db:studio` | open Drizzle Studio to inspect |
  | `db:seed` | `tsx src/db/seed.ts` — idempotent seed |

## Schema conventions (match the existing tables)

Mirror `apps/api/src/db/schema/employees.ts` etc. — don't invent column styles.

- **Money & hours → `numeric`**, never float. **Date-only → `date`** (no timezone), never
  `timestamp`. **Real timestamps** (`created_at`, `updated_at`, `deactivated_at`) → `timestamp`.
- **Soft delete**, never a hard `DELETE` column/flow — use a nullable `deactivated_at`.
- **`camelCase` in TS ↔ `snake_case` in the DB** (Drizzle maps it).
- **Status columns use `pgEnum`** built from the shared constants (`EMPLOYEE_STATUS` /
  `APPROVAL_STATUS` from `@timesheet/shared`) — no bare string literals.
- **`updated_at` via Drizzle `$onUpdate`** (not set manually).
- Add **FKs**, **indexes** (e.g. `(employee_id, date)`), and **unique** constraints (e.g.
  `(employee_id, week_start)`) per the feature spec. Export every new table from
  `db/schema/index.ts`.

## The migration workflow (do it in this order)

1. **Edit the schema** in `apps/api/src/db/schema/<entity>.ts`; export it from `schema/index.ts`.
2. **Generate** the migration: `db:generate`. This writes a new SQL file under the migrations dir.
3. **Review the generated SQL** before applying — read it. Confirm it does what you intend
   (no accidental `DROP`/data loss, the right columns/constraints). Drizzle can't infer renames;
   a rename may show up as drop+add — fix the migration if so.
4. **Apply** it: `db:migrate`. (Use `db:push` only for a throwaway local spike — migrations are the
   source of truth and what CI/fresh-clone runs.)
5. **Verify** the change landed (`db:studio`, or a quick query). Run `pnpm nx typecheck api`.
6. **Re-seed if the shape changed** (see below).

**Hard rule:** never edit a migration that's already been applied or committed — it desyncs
everyone's DB and CI. Always add a **new** migration to correct course.

## Seeding — when and how

- **When:** right after a fresh setup (`up` → `migrate` → `seed`), and again any time you change
  data shape or want the demo data back.
- **How:** `db:seed`. The seed (`apps/api/src/db/seed.ts`) is **idempotent** — it **clears then
  inserts**, so it's safe to re-run; it won't pile up duplicates.
- **What:** a sketch-matching dataset (a few employees incl. an inactive one with history, a 45.5h
  overtime week, a pre-approved week to demo locking). Keep it representative so lists paginate and
  the approval/locking states are all visible.
- Update the seed when you add a table/column so the demo stays coherent.

## Fresh-clone / reset sequence

```
docker compose up -d                 # start Postgres (host port 5433)
pnpm --filter @timesheet/api db:migrate   # apply all migrations
pnpm --filter @timesheet/api db:seed      # load demo data
```

To wipe and start over: `docker compose down -v` (drops the volume) → `up -d` → `migrate` → `seed`.

## Checklist

- [ ] Docker up and Postgres reachable on `5433`.
- [ ] Schema edited **and** exported from `db/schema/index.ts`.
- [ ] Migration **generated** and its **SQL reviewed** (no unintended drops/renames).
- [ ] Migration **applied** (`db:migrate`), not just `push`.
- [ ] `numeric` money/hours · `date` for date-only · `pgEnum` from shared constants · soft delete.
- [ ] Seed updated if the shape changed; re-seeded and still idempotent.
- [ ] `pnpm nx typecheck api` green; no `.env` committed.
