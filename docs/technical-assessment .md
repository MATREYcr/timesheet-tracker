# Technical Assessment — Software Engineer L2

---

## About OCMI Workers Comp

OCMI Workers Comp is a US company specializing in workers’ compensation insurance and payroll services for small and mid-sized businesses. We combine insurance, HR, and payroll into a single offering, and we build our own technology in-house to run it.

### The products you would work on

**Janus Payroll (JP)** is our multi-tenant payroll platform: a TypeScript backend that handles employee management, timesheets, pay periods, payroll runs, tax calculations, general ledger, payments, and tax filings. It exposes a REST API (OpenAPI, with a generated TypeScript SDK) and a GraphQL API, and powers both our internal back-office dashboard and our client-facing products.

**GoatPayroll (Goat)** is our client-facing payroll brand built on top of JP: a Next.js web app and an Expo (React Native) mobile app where business owners run payroll, manage employees, review timesheets, and handle onboarding — in English and Spanish.

Everything lives in a single Nx monorepo. Business logic that is shared between the web and mobile apps is extracted into headless TypeScript packages (types, Zustand stores, React Query hooks) so each platform only implements UI on top.

### Our stack at a glance

We are TypeScript end to end: a Node.js backend (Hono + Drizzle + PostgreSQL), a Next.js web app, and an Expo (React Native) mobile app, all living in an Nx monorepo with shared packages between platforms. Everything ships in English and Spanish, and AI-assisted, spec-driven development is part of our daily workflow.

You don’t need prior experience with every specific library. The assessment is designed to show us how you work with a stack like ours.

---

## Assessment overview

The assessment has three parts, plus a short follow-up call if you pass:

| Part | What | AI usage |
| --- | --- | --- |
| 1 | Build challenge (fullstack mini-app — web **or** mobile client, your choice) | **Encouraged** — and documented in Part 3 |
| 2 | Written communication | **Not allowed** — must be your own writing |
| 3 | AI workflow (artifacts + short writeup) | You’re describing your real workflow |

**Time budget:** Parts 1–3 are a take-home. You have **7 calendar days** from receiving this document.

**Deliverables:** a private GitHub repository (invite us as collaborators) containing the code, a `README.md`, a `WRITEUP.md` (Part 2), and an `AI_WORKFLOW.md` plus supporting artifacts (Part 3).

---

## Part 1 — Build challenge: “Mini Timesheets”

Build a small timesheet tracker — a deliberately simplified slice of what we do every day — as a **monorepo** with three deliverables: an API, a shared package, and **one client app of your choice**:

- **Web** — anything in the React ecosystem: Next.js, TanStack Start, Vite + TanStack Router, Remix… your call.
- **Mobile** — a React Native app (Expo preferred). **This is a plus:** we need mobile expertise on this team, so a solid React Native client counts in your favor.

Pick the platform where you’re strongest — a well-built web app beats a shaky mobile one, so don’t reach for React Native just for the bonus. Building both is **not** worth extra points if it costs depth.

### The domain, in plain words

A timesheet is the record of hours an employee worked. In US payroll, hourly employees log their hours day by day; at the end of each week someone reviews the week and approves it, and that approved week is what payroll gets calculated from. The one wrinkle that matters here: hours beyond 40 in a single week are **overtime**, paid at 1.5× the employee’s hourly rate.

So the app you’re building has three jobs:

1. Keep a roster of hourly employees (name + hourly rate).
2. Let someone log time entries for them (date + hours).
3. Show a weekly summary per employee — regular hours, overtime hours, total pay — and let a reviewer approve or reject each employee’s week. Once approved, that week’s entries are locked.

### What the app should look like

You own the design — these are low-fidelity sketches to align on scope, not pixel specs. Three screens, whichever platform you choose:

**Screen 1 — Employees** (list + create/edit form, modal or separate page)

```
┌──────────────────────────────────────────────────┐
│  Employees                        [+ Add employee]│
│  ☐ Show inactive                                  │
├──────────────────────────────────────────────────┤
│  Jane Doe        $22.50/h   Active    [Edit] [Deactivate]
│  John Smith      $18.00/h   Active    [Edit] [Deactivate]
│  Ana García      $25.00/h   Inactive  [Reactivate]
└──────────────────────────────────────────────────┘
```

**Screen 2 — Time entries** (for a selected employee or all, with a create/edit form)

```
┌──────────────────────────────────────────────────┐
│  Time entries          Employee: [Jane Doe ▾]     │
│                                   [+ Log time]    │
├──────────────────────────────────────────────────┤
│  Mon Jun 08    8.0 h                 [Edit] [Delete]
│  Tue Jun 09    7.5 h                 [Edit] [Delete]
│  Wed Jun 10   10.0 h                 [Edit] [Delete]
├──────────────────────────────────────────────────┤
│  Log time:  Date [____]  Hours [____]   [Save]    │
└──────────────────────────────────────────────────┘
```

**Screen 3 — Weekly summary** (the core screen — pick a week, see totals, approve/reject)

```
┌──────────────────────────────────────────────────┐
│  Week of  ◀  Jun 08 – Jun 14  ▶                   │
├──────────────────────────────────────────────────┤
│  Jane Doe                            ⏳ Pending    │
│    Regular 40.0h · Overtime 5.5h                  │
│    Pay: $900.00 + $185.63 = $1,085.63             │
│                            [Approve]  [Reject]    │
├──────────────────────────────────────────────────┤
│  John Smith                          ✅ Approved   │
│    Regular 32.0h · Overtime 0h                    │
│    Pay: $576.00                       (locked)    │
└──────────────────────────────────────────────────┘
```

If you choose mobile, the same three screens live behind a tab bar or simple stack navigation — adapt the layouts to the platform (lists, full-screen forms, native pickers) rather than copying a web layout.

### Functional requirements

1. **Employees**
    - CRUD for employees: first name, last name, hourly rate, status (`active` / `inactive`).
    - Deactivating an employee is a **soft delete** (a `deactivatedAt` timestamp, not a row deletion). Inactive employees are hidden from default lists but their historical time entries remain visible.
2. **Time entries**
    - Create/edit/delete time entries for an employee: date, hours worked (decimal, e.g. `7.5`).
    - Validation: no entries for inactive employees, hours between `0.25` and `24`, no future dates.
3. **Weekly summary**
    - For a given week, show per-employee: total hours, **regular vs overtime hours** (overtime = hours beyond 40 in the week), and total pay (`regular × rate + overtime × rate × 1.5`).
    - The overtime/pay calculation must live in the **shared package** (see architecture below) and be covered by unit tests — it must not be inlined in the client or the API routes.
4. **Approval flow**
    - A weekly summary per employee can be `pending` → `approved` or `rejected`. Approved weeks lock their time entries from editing.

### Architecture requirements

```
repo/
├── apps/
│   ├── api/        Hono + Drizzle + Zod (PostgreSQL via docker-compose, or SQLite if you prefer)
│   └── web/ or mobile/   Your chosen client (see options below)
└── packages/
    └── shared/     Headless package: types, Zod schemas, calculation logic, composed hooks
```

- **Monorepo**: pnpm workspaces required; Nx or Turborepo is a plus, not a requirement.
- **API**: Hono preferred (Express/Fastify acceptable if you justify it in the writeup). Drizzle preferred for the ORM. Typed, consistent **error envelope** for all API errors (a stable `code`, an HTTP status, and a safe user-facing message).
- **i18n**: user-facing error messages from the API must support **English and Spanish** (an `Accept-Language` header is enough). UI i18n is a bonus, not required.
- **Shared package**: the client must consume its types, validation schemas, and the overtime/pay calculation from `packages/shared`. Keep it **headless and platform-agnostic** — no React Native imports, no `window`, no framework code.
- **If you choose web**: any React-ecosystem framework (Next.js, TanStack Start, Vite + TanStack Router, Remix…). React Query (or equivalent) for server state, form validation through the shared Zod schemas, Tailwind or your preferred styling.
- **If you choose mobile**: React Native, Expo preferred; must run in Expo Go or a dev client. Same three screens, form validation through the shared Zod schemas. It does not need to be beautiful; it needs to be correct, navigable, and handle loading/error states.
- **Tests**: we don’t want exhaustive coverage. We want **meaningful** tests:
    - Unit tests for the overtime/pay calculation (edge cases: exactly 40h, crossing weeks, decimal hours).
    - At least one API integration test (the approval flow locking entries is a good candidate).
    - At least one frontend test (hook or component) is a bonus.

### Must-have vs nice-to-have

| Must-have (graded heavily) | Nice-to-have (only if you have time left) |
| --- | --- |
| Shared package headless and genuinely consumed by the client | UI i18n (en/es) |
| Overtime calculation correct + tested | Optimistic updates |
| Soft-delete semantics correct | Nx/Turborepo task graph, generated API client |
| Consistent error envelope + en/es API errors | Dark mode, animations |
| API + client run from a fresh clone following the README | Storybook, E2E tests |

---

## Part 2 — Written communication (no AI)

Create a `WRITEUP.md` with two sections. **This document must be written entirely by you — no AI assistance, no AI editing or rewriting.** We read a lot of AI-generated text; we are evaluating *your* voice, reasoning, and clarity here, and it may come up in the follow-up call. Imperfect-but-human beats polished-but-generated.

1. **Why you, why us** (max 500 words)
Why are you a strong fit for this role? What are your real strengths, and what’s an honest weakness or gap given our stack? Reference concrete things you’ve built.
2. **Decisions and trade-offs** (max 700 words)
Pick the three most interesting technical decisions you made in Part 1. For each: what you chose, what you rejected, and why. Close with what you would do differently if this were a production system with a team behind it.

If English is not your first language, that’s fine — we care about structure and reasoning, not native polish.

---

## Part 2.1 — Questions (answer in `WRITEUP.md`)

Add a short section in your `WRITEUP.md` answering:

1. **How many years of experience do you have with mobile development, specifically React Native?**
    - Please include any professional, freelance, open-source, or personal projects you consider relevant.
2. **What development environment will you be using for the assessment?**
    - Please include your operating system, processor, and RAM specifications.

---

## Part 3 — AI workflow

We use AI agents (Claude Code) every day, driven by spec files, project instruction files, and custom skills. Using AI heavily in Part 1 is encouraged — we just want to see *how* you work with it.

Two things:

1. **Leave your artifacts in the repo.** Whatever you actually used while building Part 1: spec or plan files, instruction files (`CLAUDE.md`, `AGENTS.md`, `.cursorrules`…), custom skills or commands. Don’t clean them up or polish them — committed as-is is exactly what we want.
2. **A short `AI_WORKFLOW.md`** describing your day-to-day workflow: which tools you use, how you typically drive them (specs, plans, prompts), and how AI fit into building this project.

If you didn’t use AI for Part 1, just say so — but be aware that AI-assisted development is a core part of how this team works.

## Submission & delivery

---

Submit the assessment by Monday, June 22, 2026, 11:59 PM (America/Bogotá, UTC-5).

Please provide either:

1. A public GitHub repository containing the complete submission, or
2. A private GitHub repository with [https://github.com/santigp258](https://github.com/santigp258) invited as a collaborator.

### Contact & questions

If anything is unclear, ask early. Questions during the assessment are welcome and are treated as a positive signal.

Primary contact: [santiago@ocmiworkerscomp.com](mailto:santiago@ocmiworkerscomp.com)

When you submit, send an email to [santiago@ocmiworkerscomp.com](mailto:santiago@ocmiworkerscomp.com) with:

1. GitHub repository link (or confirmation that collaborator access was granted).
2. Whether the repo is public or private.
3. Any setup caveats we should know before running it.

### After submission

If your submission passes review, we’ll schedule a short video call (~20 minutes) to walk through your solution and AI workflow and answer questions in both directions. Nothing special to prepare — just know your own code.

## Submission checklist

- [ ]  Publish public Github repository. Or invite [https://github.com/santigp258](https://github.com/santigp258) to a private repository
- [ ]  `README.md` with setup instructions that work from a fresh clone
- [ ]  Part 1: api + shared package + your chosen client app, with the listed tests
- [ ]  Part 2: `WRITEUP.md` (human-written)
- [ ]  Part 3: `AI_WORKFLOW.md` + spec/instruction artifacts committed
- [ ]  Email us when done: `santiago@ocmiworkerscomp.com`

Questions during the assessment are welcome — asking good questions early is a signal, not a weakness.