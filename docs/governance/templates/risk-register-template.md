# <scope> Risk Register

**Owner:** <named accountable owner>

**Review cadence:** <weekly / milestone gate / monthly>

**Last reviewed:** YYYY-MM-DD

**Next review:** YYYY-MM-DD

## Rating Method

- Likelihood: `1` rare, `2` unlikely, `3` possible, `4` likely, `5` almost certain.
- Impact: `1` negligible, `2` minor, `3` material, `4` major, `5` severe.
- Inherent and residual score: likelihood × impact.
- Priority: `Critical` 20–25, `High` 12–19, `Medium` 6–11, `Low` 1–5.
- Financial corruption, cross-account exposure, credential exposure, material privacy
  deception, and inability to recover/roll back remain blockers regardless of score.

## Open Risks

| ID | Risk / cause / consequence | Assets and journeys | Category | Inherent L×I | Controls and evidence | Residual L×I | Treatment | Owner | Due / review | Trigger / indicator | Status | Acceptance |
|---|---|---|---|---:|---|---:|---|---|---|---|---|---|
| R-001 | <If cause occurs, event may happen, causing consequence> | <data/system/user journey> | Product / Financial / Security / Privacy / Reliability / Release / Operations / Vendor | 0 | <preventive/detective controls and links> | 0 | Avoid / Mitigate / Transfer / Accept | <named owner> | YYYY-MM-DD | <measurable early warning or threshold> | Open | None / <approved risk-acceptance link> |

## Closed Risks

Move a risk here only after the removal or treatment condition is verified. Preserve the
original rating, closure evidence, decision owner, and date.

| ID | Final disposition | Closure evidence | Closed by | Closed at |
|---|---|---|---|---|
| R-000 | <removed / mitigated / superseded> | <immutable evidence link> | <name/role> | YYYY-MM-DD |

## Operating Rules

- Each risk has one named owner, a review/due date, a measurable trigger, and linked evidence.
- Critical/high risks are reviewed at least weekly and at every affected milestone gate.
- Medium risks require an owner and target date; low risks remain visible until closure.
- Acceptance requires the approved time-bounded template. A register row alone is not approval.
- Expired acceptance changes the risk to `Open — acceptance expired` and blocks the affected gate.
- Update scores when controls, exposure, dependencies, incidents, or rollout stages change.
- Never delete a risk to improve reporting; close or supersede it with evidence.
