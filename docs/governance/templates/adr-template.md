# ADR-<number>: <decision title>

| Field | Value |
|---|---|
| Status | Proposed / Accepted / Rejected / Superseded |
| Decision date | YYYY-MM-DD |
| Effective date | YYYY-MM-DD |
| Owner | <accountable role and named owner> |
| Reviewers | <affected approval dimensions and reviewers> |
| Risk class | Standard / Sensitive |
| Scope | <systems, journeys, data, and environments> |
| Related work | <roadmap tasks, issues, pull requests, incidents> |
| Supersedes / superseded by | <ADR links or None> |

## Context

Describe the problem, current behaviour, constraints, evidence, and why a decision is needed
now. Distinguish verified facts from assumptions and unknowns.

## Decision Drivers

- <user or business outcome>
- <financial correctness, privacy, security, reliability, accessibility, or scale constraint>
- <operational, migration, cost, or schedule constraint>

## Considered Options

### Option A — <name>

- Benefits: <measurable benefits>
- Costs/risks: <failure modes and trade-offs>
- Evidence: <benchmarks, prototypes, tests, standards, or source links>

### Option B — <name>

- Benefits: <measurable benefits>
- Costs/risks: <failure modes and trade-offs>
- Evidence: <benchmarks, prototypes, tests, standards, or source links>

## Decision

State the selected option and its enforceable boundaries. Identify the canonical authority,
typed contracts, dependency direction, data ownership, and explicitly excluded behaviour.

## Consequences

### Positive

- <expected benefit>

### Negative and residual risk

- <known cost or residual risk, owner, and treatment>

## Required Impact Review

| Dimension | Impact and required control |
|---|---|
| User trust / product | <copy, progressive disclosure, support, non-goals> |
| Financial correctness | <amount/date rules, invariants, reconciliation, or Not affected> |
| Security | <authn/authz, abuse, secrets, logging, negative tests, or Not affected> |
| Privacy | <data purpose, retention, sharing, export/deletion, declarations, or Not affected> |
| Reliability / scale | <timeouts, retries, idempotency, conflicts, capacity, recovery> |
| Accessibility / design | <WCAG, motion, tokens, or Not affected> |
| Release / operations | <migration, telemetry, alerts, rollout, rollback, support> |

## Implementation and Migration

1. <bounded step with owner and target date>
2. <compatibility or data-migration step>
3. <cleanup and removal condition>

## Validation and Evidence

- <test/gate command and expected result>
- <durable evidence path tied to revision/build/environment>
- <negative, recovery, performance, device, or operational proof>

## Rollout and Rollback

- Rollout stages: <environments, cohorts, percentages, observation windows>
- Stop conditions: <measurable conditions>
- Rollback: <tested procedure and data compatibility>
- Owner during rollout: <name/role>

## Revisit and Supersession

Review on <date/event>. Superseding this ADR requires a new ADR that links here, explains
migration, and preserves historical evidence. Do not edit an accepted decision to hide its
former rationale or outcome.
