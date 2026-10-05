# Spec Delta

## MODIFIED Requirements

### Requirement: Canonical error codes

The package SHALL export the stable `ERROR_CODES` union (`VALIDATION_ERROR`, `UNAUTHORIZED`,
`NOT_FOUND`, `EMPLOYEE_INACTIVE`, `WEEK_LOCKED`, `INTERNAL_ERROR`) and the `ApiErrorBody`
envelope type. New codes are added to this union; localized messages live in the API (see
`error-envelope-i18n`).

#### Scenario: New error code

- **WHEN** a feature needs a new error code
- **THEN** it is added to `ERROR_CODES` and given en/es messages and an HTTP status in the API

#### Scenario: Unauthorized is canonical

- **WHEN** the web client receives a 401 envelope
- **THEN** its `code` is `UNAUTHORIZED`, a member of `ERROR_CODES`

## ADDED Requirements

### Requirement: Auth form schemas

The package SHALL export the sign-in schema (`email`, `password` required) and the sign-up schema
(`name` trimmed 1–100, `email` valid, `password` 8–128) used by the web auth forms, with types
derived from them.

#### Scenario: Short password rejected

- **WHEN** the sign-up schema parses a 7-character password
- **THEN** parsing fails on `password`

#### Scenario: Email normalized

- **WHEN** the sign-in schema parses `"  Ana@Example.com "`
- **THEN** the parsed email is `"ana@example.com"`
