# Design

## Context

See `proposal.md`. Locally the API is `http://localhost:3333` and the web
`http://localhost:3000`; both are configured by URL env vars (`NEXT_PUBLIC_API_URL`,
`BETTER_AUTH_URL`, `CORS_ORIGIN`). Better Auth derives the auth endpoint with `withPath(url,
basePath)`, which appends `/api/auth` **only when the URL has no path** — so
`https://example.com/backend` would be used as-is and the client would call
`/backend/sign-in/email` instead of `/backend/api/auth/sign-in/email`.

## Goals / Non-Goals

**Goals:** the same build works locally and behind the proxy, changed by env vars only; the
proxy layout is rehearsed on the developer's machine before touching AWS.

**Non-Goals:** containers, multiple hosts, infrastructure as code (later practices).

## Decisions

### 1. One origin, API under `/backend` with the prefix stripped

nginx: `location /backend/ { proxy_pass http://127.0.0.1:3333/; }` (trailing slash strips the
prefix) and `location / { proxy_pass http://127.0.0.1:3000; }`.

- *Why:* the session cookie is first-party to the web's domain, so `proxy.ts` sees it; no CORS
  in the browser; no API route changes.
- *Rejected:* `api.` sub-domain (the cookie would be host-only for the API and invisible to the
  web unless `crossSubDomainCookies` is configured); API routes under `/api` in code (collides
  with Better Auth's `/api/auth` and changes every route).

### 2. Build the full auth URL explicitly

Web: `createAuthClient({ baseURL: \`${NEXT_PUBLIC_API_URL}/api/auth\` })`. API:
`baseURL: \`${BETTER_AUTH_URL}/api/auth\``. A URL with a path is used as-is by Better Auth, so
this is correct with and without a prefix. `BETTER_AUTH_URL` keeps meaning "public URL of the
API".

### 3. Relative Swagger document URL

`swaggerUI({ url: './openapi' })`: resolves to `/openapi` at `/docs` and to `/backend/openapi`
at `/backend/docs`.

### 4. systemd units

`timesheet-api.service`: `WorkingDirectory=<repo>/apps/api` (so `dotenv` finds `.env`),
`ExecStart=node dist/main.js`, `Restart=on-failure`, `Environment=NODE_ENV=production`.
`timesheet-web.service`: `WorkingDirectory=<repo>/apps/web`, `ExecStart=pnpm exec next start
-p 3000`. Both run as an unprivileged `timesheet` user.

### 5. Local rehearsal without Docker

Homebrew nginx with the same `server` block, listening on `:8080` locally (the EC2 one uses
`:80`/`:443`). Production builds run with the same commands as the systemd units. The dev
Postgres is reused — the rehearsal targets the proxy and the app layer, not the DB install.
Production cookies are `Secure`, which browsers refuse over plain HTTP except on `localhost`;
the check runs against `http://localhost:8080`, which Chromium treats as a secure context.

### 6. nginx overwrites `X-Forwarded-For`

Better Auth trusts `X-Forwarded-For` only when it holds a single IP (without `trustedProxies`
the leftmost entry is spoofable). nginx is the edge, so it sets `X-Forwarded-For $remote_addr`
instead of appending (`$proxy_add_x_forwarded_for`): a client-supplied header can neither
inject a fake IP nor blank it out to dodge the per-IP rate limit. With a load balancer in front
(later practices) this changes to Better Auth `trustedProxies`.

### 7. Optional `HOST` for the API

`serve({ hostname: env.HOST })`; unset keeps listening on all interfaces (local dev), the
systemd unit sets `127.0.0.1` so only nginx can reach the API — defense in depth on top of the
security group.

## Risks / Trade-offs

- [Rate limiting sees only the proxy IP] → nginx sets `X-Forwarded-For`; verified by the IP
  stored on the session in the rehearsal.
- [`next build` runs out of memory on small instances] → the guide recommends `t4g.small` or
  adding swap.
- [Single host is a single point of failure] → accepted for this practice; ECS comes later.
