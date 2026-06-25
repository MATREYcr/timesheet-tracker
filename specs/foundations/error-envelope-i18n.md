# Foundation — Error envelope & i18n

A consistent, localized error contract for every API error. Cross-cutting: every feature's error
responses go through this.

---

## Envelope

Every error response:

```json
{
  "error": {
    "code": "WEEK_LOCKED",
    "message": "This week is approved and locked."
  }
}
```

- `code`: stable, machine-readable, from the shared `ErrorCode` union (`packages/shared`). Each
  feature reuses these codes; new codes are added to the union.
- `message`: safe user-facing text, localized en/es by `Accept-Language` (default en). Never leak
  internals or stack traces.
- HTTP status is mapped per code (validation → 400, not found → 404, conflict/locked → 409, etc.).

## Accept-Language parsing

Parse robustly: accept `en`, `es`, `en-US`, `es-ES`, and weighted lists (`es,en;q=0.8`). Match on
the primary subtag; default to `en`. Resolved once by a locale middleware onto the request
context; the web client keeps it in sync with the active UI locale.

## Error code → message map (en/es)

Maintained in the API, keyed by the shared `ErrorCode`. Examples:

| code                | status | en                                        | es                                                      |
| ------------------- | ------ | ----------------------------------------- | ------------------------------------------------------- |
| `VALIDATION_ERROR`  | 400    | Invalid request data.                     | Datos de solicitud inválidos.                           |
| `EMPLOYEE_INACTIVE` | 409    | Cannot log time for an inactive employee. | No se puede registrar tiempo para un empleado inactivo. |
| `WEEK_LOCKED`       | 409    | This week is approved and locked.         | Esta semana está aprobada y bloqueada.                  |
| `NOT_FOUND`         | 404    | Resource not found.                       | Recurso no encontrado.                                  |

The central error handler (`on-error`) turns any thrown `AppError` into this envelope; a
`zValidator` wrapper maps validation failures to `VALIDATION_ERROR`.

## Web consumption

The web transport (`lib/http.ts`) turns the envelope back into a typed `ApiError` (`code` +
`status`); UI strings are rendered from the active locale. See
[`foundations/web-platform`](web-platform.md).
