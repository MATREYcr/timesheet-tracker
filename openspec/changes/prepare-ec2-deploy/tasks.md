# Tasks

## 1. Auth URL under a path prefix

- [x] 1.1 Build the auth endpoint as `<NEXT_PUBLIC_API_URL>/api/auth` in `apps/web/src/lib/auth-client.ts` and as `<BETTER_AUTH_URL>/api/auth` in `apps/api/src/auth.ts`; verify `pnpm test`, `pnpm lint` and `pnpm verify:auth` (local, no prefix) still pass

## 2. Swagger under a path prefix

- [ ] 2.1 Serve Swagger UI with a relative document URL (`./openapi`) in `apps/api/src/app.ts`; verify `/docs` still lists the endpoints locally

## 3. Server configuration

- [ ] 3.1 Add `deploy/ec2/nginx.conf` (web at `/`, API at `/backend/` with the prefix stripped, `X-Forwarded-For`/`-Proto`/`Host`); verify `nginx -t` accepts it
- [ ] 3.2 Add `deploy/ec2/timesheet-api.service` and `deploy/ec2/timesheet-web.service` (unprivileged user, working directories, `Restart=on-failure`, `NODE_ENV=production`); verify with `systemd-analyze verify` if available or by review against the guide

## 4. Local rehearsal without Docker

- [ ] 4.1 Run the production builds with the systemd commands behind Homebrew nginx on `:8080` (env pointing to `http://localhost:8080/backend`); verify `BASE_URL=http://localhost:8080 API_URL=http://localhost:8080/backend pnpm verify:auth` passes all steps and `/backend/docs` lists the endpoints
- [ ] 4.2 Verify the API records the forwarded client IP on the session (not only `127.0.0.1` from nginx)

## 5. Guide

- [ ] 5.1 Write `deploy/ec2/README.md` (instance, security group, Elastic IP, DNS, apt packages, PostgreSQL user/db, env files, build, migrations, seed, systemd, nginx, certbot, `pnpm verify:auth`, update procedure, troubleshooting) from what the rehearsal proved; link it from README and fix the earlier sub-domain advice

## 6. Close-out

- [ ] 6.1 Run `pnpm typecheck`, `pnpm lint`, `pnpm test` and `openspec validate --all --strict`; verify all pass
