# Risk Acceptance <ID>: <short title>

## Decision Record

| Field | Value |
|---|---|
| Status | Proposed / Approved / Expired / Revoked / Closed |
| Risk register ID | <R-NNN> |
| Requested at | <ISO-8601 timestamp> |
| Effective at | <ISO-8601 timestamp; only after approval> |
| Expires at | <ISO-8601 timestamp; mandatory and time-bounded> |
| Risk owner | <named person and role> |
| Approver | <founder and required approval dimensions; must have authority> |
| Scope | <exact systems, versions, environments, users, and operations> |
| Related evidence | <finding, task, ADR, test, incident, pull request> |

## Risk Being Accepted

Describe the condition, cause, exposed assets/users, credible failure or abuse path,
likelihood, impact, inherent rating, and current residual rating. Separate verified facts
from assumptions. Explain why remediation cannot be completed before the stated need.

## Explicit Boundary

This acceptance permits only: <narrow exception>.

It does **not** waive: authentication/authorization, CI, evidence, incident reporting,
monitoring, user rights, or any unrelated production gate. It cannot accept financial
corruption, cross-account exposure, credential exposure, material privacy deception,
signing/package mismatch, or inability to recover/roll back.

## Alternatives Considered

| Alternative | Why not selected now | Reconsider trigger |
|---|---|---|
| <remediate / disable / defer launch / isolate / transfer> | <evidence-backed reason> | <date/event> |

## Compensating Controls

| Control | Owner | Validation / evidence | Monitoring signal | Failure response |
|---|---|---|---|---|
| <preventive or detective control> | <named owner> | <test/artifact> | <metric/alert> | <containment/rollback> |

## Review and Automatic Expiry

- Review cadence: <at least weekly for critical/high, otherwise risk-based>.
- Immediate review triggers: <incident, control failure, dependency/environment change,
  scope growth, exploitability change, policy warning, or owner change>.
- Removal condition: <measurable condition that eliminates the exception>.
- Remediation task and due date: <task, owner, YYYY-MM-DD>.
- At `Expires at`, this acceptance automatically becomes **Expired**. The affected gate or
  rollout is blocked until the risk is remediated or a newly reviewed acceptance is approved.
  Silence, an open pull request, or an edited expiry date is not renewal.

## Approval

| Approval dimension | Approver | Decision | Timestamp | Notes |
|---|---|---|---|---|
| Risk owner | <name/role> | Accept / Reject | <ISO-8601> | <reason> |
| Founder/product owner | <name> | Accept / Reject | <ISO-8601> | <business necessity and user impact> |
| Security/privacy/financial/release as applicable | <name/role> | Accept / Reject | <ISO-8601> | <control sufficiency> |

## Closure

When remediated or revoked, record the final revision/build/environment, validation evidence,
closure approver, and timestamp. Preserve this record; do not delete or rewrite the original
accepted scope, controls, or expiry.
