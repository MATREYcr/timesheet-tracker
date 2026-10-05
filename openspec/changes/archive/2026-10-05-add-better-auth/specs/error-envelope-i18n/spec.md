# Spec Delta

## MODIFIED Requirements

### Requirement: Error envelope

Every error response from the business API (everything except the auth endpoints under
`/api/auth/*`) MUST have the shape
`{ "error": { "code": "STABLE_CODE", "message": "safe user-facing text" } }` with the HTTP status
mapped from the code. A central `onError` handler SHALL turn any thrown `AppError` into this
envelope. Auth endpoints keep the auth library's `{ code, message }` body, which the web client
maps to localized UI messages by code.

#### Scenario: Domain error

- **WHEN** a service throws `AppError('WEEK_LOCKED')`
- **THEN** the response is 409 with `{ "error": { "code": "WEEK_LOCKED", "message": "This week is
approved and locked." } }`

#### Scenario: Auth endpoint error

- **WHEN** a sign-in request uses wrong credentials
- **THEN** the auth endpoint answers with its own error body and the web client shows the
  localized "invalid email or password" message

### Requirement: Status mapping

Each code SHALL map to a fixed HTTP status: `VALIDATION_ERROR` → 400, `UNAUTHORIZED` → 401,
`NOT_FOUND` → 404, `EMPLOYEE_INACTIVE` → 409, `WEEK_LOCKED` → 409, `INTERNAL_ERROR` → 500.

#### Scenario: Schema validation failure

- **WHEN** a request body fails the shared Zod schema
- **THEN** the response is 400 with `VALIDATION_ERROR`

#### Scenario: Missing session

- **WHEN** a business endpoint is called without a valid session
- **THEN** the response is 401 with `UNAUTHORIZED`

## ADDED Requirements

### Requirement: Unauthorized message

`UNAUTHORIZED` SHALL have the messages en "You need to sign in to continue." and es "Debes
iniciar sesión para continuar."

#### Scenario: Spanish unauthorized

- **WHEN** a request with `Accept-Language: es` has no session
- **THEN** the message is "Debes iniciar sesión para continuar."
