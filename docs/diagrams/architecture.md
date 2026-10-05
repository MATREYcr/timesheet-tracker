# Architecture

Monorepo dependency + runtime view. `packages/shared` is **headless**: both apps consume it, it
depends on neither — so all arrows point *into* it. The web client computes pay by calling the
shared `calculateWeeklyPay`; the API never computes pay for the weekly summary.

```mermaid
flowchart TD
    subgraph web["apps/web — Next.js 16 (App Router)"]
        P["proxy.ts — session-cookie gate + next-intl"]
        W["Screens · TanStack Query · react-hook-form"]
    end
    subgraph api["apps/api — Hono"]
        AU["Better Auth · /api/auth/*"]
        G["Session guard (401 UNAUTHORIZED)"]
        A["Routes → Services (Drizzle + domain rules)"]
    end
    subgraph shared["packages/shared — headless TS"]
        S["Types · Zod schemas · calculateWeeklyPay · dates · ErrorCode"]
    end
    DB[("PostgreSQL")]

    P --> W
    W -->|"sign-up / sign-in / sign-out"| AU
    W -->|"HTTP + session cookie + Accept-Language"| G
    G --> A
    AU -->|"Drizzle adapter"| DB
    A -->|"Drizzle ORM"| DB
    W -.->|"consumes (types · Zod · pay calc)"| S
    A -.->|"consumes (types · Zod · error codes)"| S

    classDef headless fill:#ede9fe,stroke:#7c3aed,color:#4c1d95;
    class shared headless;
```

- **Solid arrows** = runtime calls. **Dashed arrows** = build-time dependency on `shared`.
- `shared` has no outgoing arrows — it imports no framework/platform code (no React, `window`,
  `process`). This is the graded "headless + genuinely consumed" rule, made visual.
- Validation uses the **same** shared Zod schemas on both sides; errors flow back as the envelope
  `{ error: { code, message } }`, localized en/es by `Accept-Language`.

See [`openspec/specs/`](../../openspec/specs/) for the current requirements, and
[`specs/overview.md`](../../specs/overview.md) for the original rationale.
