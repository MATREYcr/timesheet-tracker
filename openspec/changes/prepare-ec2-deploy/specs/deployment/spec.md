# Spec Delta

## Purpose

How the application is served in production on a single host: one public origin with the web at
the root and the API under a path prefix, behind a reverse proxy, with the procedure documented
and verifiable.

## ADDED Requirements

### Requirement: Single origin behind a reverse proxy

In production the web SHALL be served at the root of one domain and the API under the `/backend`
path prefix of the same domain, with the reverse proxy removing the prefix before the request
reaches the API. The API's own routes do not change.

#### Scenario: Business route through the proxy

- **WHEN** a signed-in browser calls `https://example.com/backend/employees`
- **THEN** the API handles it as `/employees` and responds 200

#### Scenario: Health check through the proxy

- **WHEN** `GET https://example.com/backend/health` is called
- **THEN** it responds 200 with `{ "status": "ok" }`

### Requirement: Authentication works under the path prefix

Sign-up, sign-in, sign-out and session checks SHALL work when the API is served under a path
prefix, and the session cookie MUST be first-party to the web's domain so route protection on
the web sees it.

#### Scenario: Full auth flow under the prefix

- **WHEN** the real-flow check runs with `BASE_URL=https://example.com` and
  `API_URL=https://example.com/backend`
- **THEN** every step passes

#### Scenario: Local development unchanged

- **WHEN** the API runs at `http://localhost:3333` with no prefix
- **THEN** authentication behaves exactly as before

### Requirement: Client IP forwarded to the API

The reverse proxy SHALL forward the client IP and protocol (`X-Forwarded-For`,
`X-Forwarded-Proto`, `Host`) so per-client protections such as auth rate limiting see each
visitor's real address, not the proxy's.

#### Scenario: Distinct clients

- **WHEN** two visitors from different IPs sign in through the proxy
- **THEN** the API records each visitor's own IP on their session

### Requirement: Managed processes

The API and the web SHALL run as system services that start on boot, restart on failure and stop
gracefully, each loading its own environment file.

#### Scenario: Crash recovery

- **WHEN** the API process exits unexpectedly
- **THEN** the service manager restarts it

### Requirement: Documented and rehearsed manual deployment

The repository SHALL include a step-by-step guide for deploying to one EC2 instance without
containers, and the proxy configuration it uses MUST be rehearsed locally (production builds
behind the same proxy config) before any cloud resource is created.

#### Scenario: Local rehearsal

- **WHEN** the production builds run locally behind the reference nginx config
- **THEN** the real-flow check passes against the proxy's local address
