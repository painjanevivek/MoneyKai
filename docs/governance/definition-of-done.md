# Repository-wide Definition of Done

MoneyKai work is done only when the outcome is usable, safe, reviewable, and evidenced at
the revision where it is claimed. “Code complete,” “works on my machine,” a screenshot, or
an unchecked follow-up does not satisfy this definition.

## Every Task

- [ ] The outcome is bounded to one roadmap task, issue, or incident objective with explicit
  in-scope paths and no unrelated user changes.
- [ ] Acceptance conditions are falsifiable and the implementation matches the canonical
  product, domain, API, data, design, and platform authorities.
- [ ] Types, module boundaries, naming, errors, recovery states, and comments are clear;
  duplicate rules and unauthorized parallel paths were not introduced.
- [ ] The smallest relevant tests pass, affected regressions pass, and failure/edge cases
  proportional to risk are covered.
- [ ] Security and privacy impact is assessed. Authentication, authorization, secrets,
  permissions, telemetry, retention, export/deletion, dependencies, and logs are validated
  where affected.
- [ ] Financial changes prove deterministic amounts/dates, invariants, retries, migrations,
  traceability, and reconciliation where affected.
- [ ] User-facing changes cover accessibility, loading, empty, validation, offline, error,
  conflict, success, and retry states as applicable. Progressive disclosure never hides
  material consequences.
- [ ] Performance, reliability, compatibility, migration, monitoring, support, rollout, and
  rollback impacts are measured or explicitly not applicable with rationale.
- [ ] No credential, token, private key, signing material, production payload, or sensitive
  artifact entered Git, logs, screenshots, analytics, or test output.
- [ ] A durable evidence record identifies procedure, environment, full revision/build,
  timestamp, result, artifacts, findings, and approved exceptions.
- [ ] The roadmap/task ledger links the evidence, only owned files are staged, the focused
  commit follows the approved message format, and the branch is pushed.
- [ ] Required CODEOWNERS and approval dimensions reviewed the change; required CI passes
  and review conversations are resolved before merge.

## Additional Proof by Change Type

| Change type | Minimum additional proof |
|---|---|
| Financial/domain | Unit/property fixtures, retry/duplicate cases, migrations if applicable, record-count/balance reconciliation, source traceability |
| API/backend | Contract generation/check, authentication and negative authorization, validation, idempotency, timeout/retry/cancellation, pagination, redacted telemetry |
| Firebase/data rules | Emulator/rule tests proving deny-by-default, ownership/membership boundaries, cross-account denial, index/migration and recovery impact |
| Authentication | Provider/collision/recovery, restoration, logout/revocation, disabled/deleted/expired/cancelled/offline cases, secure storage and redacted telemetry |
| Privacy/lifecycle | Data/SDK inventory update, permission purpose/denial, retention, consent, portable export, resumable deletion, policy/Data Safety consistency |
| UI/mobile/web | Token use, WCAG 2.2 AA, screen reader/focus, 200% text, touch targets, reduced motion, responsive/device states, visual evidence |
| Dependency/supply chain | Lockfile consistency, vulnerability/license/provenance review, compatibility tests, SBOM/manifest update where required, rollback version |
| Release/operations | Reproducible signed artifact, manifest/permission/policy checks, staged rollout and stop criteria, telemetry/alerts, tested rollback and runbook |
| Documentation/governance | Link/placeholder/whitespace checks, current owner/dates, consistency with constitution and gates, no unsupported pass claim |

## Milestone Done

A milestone is done only when all prerequisite milestones and checklist tasks are complete,
its required production gates pass, evidence is durable and tied to immutable identities,
and no blocking finding or prohibited/expired risk remains. The milestone-completion commit
updates the ledger and evidence after—not before—the gate decision, then passes CI/review
and merges through the protected workflow.

## Release Done

A release is done only after the signed Play artifact and store declarations are truthful,
the required device/golden journeys pass, health and support owners are active, staged
observation windows complete without a stop condition, and rollback remains possible.
Play approval and fame are external outcomes; MoneyKai never labels them guaranteed.
