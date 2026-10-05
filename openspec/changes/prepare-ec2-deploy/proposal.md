# Proposal

## Why

The app will be deployed by hand to a single EC2 instance as AWS practice, without Docker:
native Node, PostgreSQL and nginx, processes under systemd, HTTPS with certbot. With web and
API behind one nginx on one domain (web at `/`, API at `/backend/`), two things break today:
the auth client and server build the auth endpoint URL wrongly when the API URL has a path,
and Swagger UI loads its document from an absolute `/openapi`. Neither shows up locally, where
the API has no path prefix.

## What Changes

- Auth endpoint URL (web client and API) is always built as `<API URL>/api/auth`, so login works
  whether the API is at `http://localhost:3333` or `https://example.com/backend`.
- Swagger UI loads the OpenAPI document by a relative URL so `/docs` works under a prefix.
- Reference server config in `deploy/ec2/`: `nginx.conf` (web at `/`, API at `/backend/` with the
  prefix stripped, `X-Forwarded-*` headers) and systemd units for the API and the web.
- A local rehearsal without Docker for the app layer: production builds run with `node` /
  `next start` behind a native (Homebrew) nginx using the same config, verified with
  `pnpm verify:auth`. The rehearsal uses the existing development database.
- `deploy/ec2/README.md`: step-by-step manual EC2 guide (instance, security group, Elastic IP,
  DNS, apt packages, PostgreSQL, env files, build, migrations, systemd, nginx, certbot,
  verification, troubleshooting).

Out of scope: Docker images, ECS, Terraform/CDK, CI/CD, RDS, multiple instances.

## Capabilities

### New Capabilities

- `deployment`: how the app is served in production on a single host — one origin with the API
  under a path prefix, forwarded client IPs, process management, and the documented, verified
  manual procedure.

### Modified Capabilities

- `api-platform`: the OpenAPI documentation requirement must also hold when the API is served
  under a path prefix.

## Impact

- **Code**: `apps/web/src/lib/auth-client.ts`, `apps/api/src/auth.ts`, `apps/api/src/app.ts`.
- **New files**: `deploy/ec2/nginx.conf`, `deploy/ec2/timesheet-api.service`,
  `deploy/ec2/timesheet-web.service`, `deploy/ec2/README.md`.
- **Docs**: README (pointer to the EC2 guide; correct the earlier sub-domain advice), CLAUDE.md
  commands if new scripts are added.
- **No** database, dependency or API contract changes.
