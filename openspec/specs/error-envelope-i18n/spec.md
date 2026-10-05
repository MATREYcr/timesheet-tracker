# Error Envelope and i18n Specification

## Purpose

A consistent, localized error contract for every API error: a stable machine-readable `code`, a
safe user-facing `message` in English or Spanish chosen by `Accept-Language`, and an appropriate
HTTP status.

## Requirements

### Requirement: Error envelope

Every API error response MUST have the shape
`{ "error": { "code": "STABLE_CODE", "message": "safe user-facing text" } }` with the HTTP status
mapped from the code. A central `onError` handler SHALL turn any thrown `AppError` into this
envelope.

#### Scenario: Domain error

- **WHEN** a service throws `AppError('WEEK_LOCKED')`
- **THEN** the response is 409 with `{ "error": { "code": "WEEK_LOCKED", "message": "This week is
  approved and locked." } }`

### Requirement: Status mapping

Each code SHALL map to a fixed HTTP status: `VALIDATION_ERROR` → 400, `NOT_FOUND` → 404,
`EMPLOYEE_INACTIVE` → 409, `WEEK_LOCKED` → 409, `INTERNAL_ERROR` → 500.

#### Scenario: Schema validation failure

- **WHEN** a request body fails the shared Zod schema
- **THEN** the response is 400 with `VALIDATION_ERROR`

### Requirement: No internal leakage

The `message` MUST NOT expose internals, SQL, or stack traces. Unexpected errors SHALL be returned
as `INTERNAL_ERROR` with a generic message.

#### Scenario: Unexpected exception

- **WHEN** an unhandled exception occurs (e.g. a database driver error)
- **THEN** the response is 500 with `INTERNAL_ERROR` and the message "Something went wrong."

### Requirement: Localized messages

Each code SHALL map to `{ en, es }` messages in the API. The locale is resolved once per request
by a locale middleware from `Accept-Language` and defaults to English.

#### Scenario: Spanish

- **WHEN** a request with `Accept-Language: es` hits a locked week
- **THEN** the message is "Esta semana está aprobada y bloqueada."

#### Scenario: Default English

- **WHEN** a request has no `Accept-Language` header
- **THEN** messages are in English

### Requirement: Robust Accept-Language parsing

The parser SHALL accept `en`, `es`, regional tags (`en-US`, `es-ES`) and weighted lists
(`es,en;q=0.8`), match on the primary subtag, pick the highest-weighted supported language, and
fall back to `en`.

#### Scenario: Regional tag

- **WHEN** the header is `es-ES`
- **THEN** the locale resolves to `es`

#### Scenario: Weighted list

- **WHEN** the header is `fr;q=1, es;q=0.8, en;q=0.5`
- **THEN** the locale resolves to `es`

#### Scenario: Unsupported language

- **WHEN** the header is `fr-FR`
- **THEN** the locale resolves to `en`

### Requirement: Web client follows the UI locale

The web transport SHALL send `Accept-Language` matching the active UI locale and SHALL turn the
envelope into a typed `ApiError` (`code` + `status`) so screens can show the localized message.

#### Scenario: Error shown in Spanish UI

- **WHEN** the UI is in Spanish and a mutation fails with `EMPLOYEE_INACTIVE`
- **THEN** the user sees the Spanish message
