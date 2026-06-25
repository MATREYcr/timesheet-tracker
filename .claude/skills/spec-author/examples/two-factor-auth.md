# Feature — Two-factor authentication (TOTP)

Let users protect their account with a time-based one-time code (authenticator app).

> Illustrative example for the `spec-author` skill — a generic feature, unrelated to any
> specific project. It shows the template's shape, voice, and the level of detail to aim for.

## Context / Why
Password-only login is a single point of failure; a leaked password = full account takeover.
TOTP adds a second factor the attacker doesn't have. For users who handle sensitive data, this
is table stakes. Audience: any account owner who opts in (and, later, admins who can require it).

## Scope
- **In:** enroll via authenticator app (QR + secret), verify a 6-digit code at login, backup
  recovery codes, disable from settings.
- **Out:** SMS/email codes, WebAuthn/passkeys, org-wide "require 2FA" policy (a later feature),
  remembering trusted devices.

## Decisions
| Decision | Choice | Why | Rejected |
| --- | --- | --- | --- |
| Second factor | TOTP (RFC 6238) | offline, standard, no SMS cost or SIM-swap risk | SMS codes (phishable, carrier cost) |
| Recovery | 10 one-time backup codes shown once | survives a lost device without support tickets | email reset only (defeats the second factor) |
| Secret storage | encrypted at rest, never returned after enrollment | the secret is the credential | storing/displaying it in plaintext |
| Enrollment confirm | require one valid code before enabling | proves the app is set up correctly | enabling on QR scan alone (locks users out) |

## Domain rules & invariants
- A code is valid for its 30s window ± 1 step (clock-skew tolerance); reject anything outside.
- A used code (or backup code) can't be replayed within its window.
- 2FA is `disabled` until enrollment is confirmed by a valid code; only then `enabled`.
- Disabling 2FA invalidates all outstanding backup codes.

## Contracts
- **Types:** `TwoFactorStatus = 'disabled' | 'pending' | 'enabled'`; `BackupCode`.
- **Validation:** `code` is exactly 6 digits; `backupCode` matches the issued format.
- **Endpoints:**
  - `POST /2fa/enroll` → `{ secret, otpauthUri }` (status → `pending`)
  - `POST /2fa/verify` `{ code }` → confirms enrollment (status → `enabled`) + returns backup codes
  - `POST /2fa/disable` `{ code }` → status → `disabled`
  - `POST /auth/login` now returns `requires2fa: true` when the user is `enabled`
- **Error cases:** `INVALID_CODE` (401), `CODE_REPLAYED` (409), `2FA_NOT_ENROLLED` (409),
  `RATE_LIMITED` (429).

## Edge cases
- Code entered one step late (clock skew) → accepted within ±1 window.
- Same valid code submitted twice → second attempt `CODE_REPLAYED`.
- 5 wrong codes in a row → `RATE_LIMITED`, lock attempts for N minutes.
- Lost device, uses a backup code → succeeds, that code is burned.
- Disable then re-enroll → fresh secret, old backup codes already void.
- User `pending` (enrolled but never verified) tries to log in → treated as no 2FA.

## Known limitations
- No "trusted device" memory: every login asks for a code. Acceptable for v1; revisit if
  users complain about friction.
- Backup codes shown only once; losing them with the device means support recovery.

## Verification / Done when
- Unit tests: code validation accepts ±1 window, rejects outside; replay is blocked; backup
  code burns on use.
- Integration test: enroll → verify → login requires code → wrong code rejected → backup code
  works once.
- `enabled` users cannot complete login without a valid factor.
