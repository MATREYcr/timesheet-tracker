# Feature spec template

Copy this shape into `specs/features/<slug>.md`. Keep a terse voice: decision tables with a
*why*, declared limitations, no filler. Drop a section only when it genuinely doesn't apply
(say so in one line rather than padding it). Cross-link sibling specs and the overview instead
of repeating their content.

---

```markdown
# Feature — <Name>

<One line: what this capability does, in plain words.>

## Context / Why
<The problem or need. What scenario this serves and who uses it. 2–4 lines.>

## Scope
- **In:** <what this feature covers>
- **Out:** <what is explicitly excluded — name it, don't leave it implicit>

## Decisions
| Decision | Choice | Why | Rejected |
| --- | --- | --- | --- |
| <axis> | <what we picked> | <reason> | <the alternative and why not> |

## Domain rules & invariants
- <Feature-specific rules and gotchas. Reference shared rules in the overview rather than
  restating them.>

## Contracts
- **Types:** <new/affected types or enums; reuse shared ones>
- **Validation:** <the validation rule/schema used here, from the shared layer if one exists>
- **Endpoints / interfaces:**
  - `<METHOD> /<path>` (or function signature) — <input → output, notes>
- **Error cases:** `<CODE>` (<status>) — <when it happens; where it's mapped>
- **Transactions / atomicity:** <only if relevant>

## Edge cases
- <Explicit list: boundaries, states, locales, dates, empty/error paths.>

## Known limitations
- <Deliberate trade-offs left out of scope, with the reason. Omit the section if none.>

## Notes / deviations
- <Real mid-build changes, assumptions that shifted, known debt. Omit if there were none —
  the asymmetry is honest. Cross-link the PLAN subphases where it happened.>

## Verification / Done when
- <Concrete checks: the tests that must pass, the command that goes green. Mirror the
  PLAN "Done when" entries.>
```

---

## Notes on filling it

- **The Decisions table is the heart.** A decision without a *why* and a *rejected alternative*
  is just an assertion.
- **Contracts reuse the shared layer.** Never invent a parallel type or validation rule — point
  at the shared definition. If a new one is needed, the spec flags that it must be added there
  (it does not write it).
- **Edge cases must be enumerated, not summarized.** "Handles invalid input" is not an edge
  case; a concrete input → outcome is.
- **"Done when" is verifiable.** A command that passes or an assertion, never "implement X".
- **Length follows the feature.** A dense capability earns a long spec; a thin one stays short.
  Don't inflate to match.
