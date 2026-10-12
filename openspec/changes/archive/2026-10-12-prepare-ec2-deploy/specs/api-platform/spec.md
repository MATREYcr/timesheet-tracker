# Spec Delta

## MODIFIED Requirements

### Requirement: OpenAPI documentation

The API SHALL generate an OpenAPI 3.1 document from the same Zod schemas and serve Swagger UI
(localized via `Accept-Language`). Swagger UI MUST load the document by a relative URL so it
works when the API is served under a path prefix.

#### Scenario: Docs available

- **WHEN** the API is running
- **THEN** Swagger UI is served under `/docs`

#### Scenario: Docs under a path prefix

- **WHEN** the API is served under `/backend` and a browser opens `/backend/docs`
- **THEN** Swagger UI loads the document from `/backend/openapi` and lists the endpoints
