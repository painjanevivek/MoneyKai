# Roadmap Data Model

This model defines milestone state and evidence. It is a documentation/automation contract, not a runtime financial schema.

## Program

| Field | Rule |
|---|---|
| `id` | Stable value `moneykai-production-mnc` |
| `version` | Semantic version; increment when gates or scope materially change |
| `owner` | One accountable team/role |
| `status` | `planned`, `active`, `paused`, `complete`, or `blocked` |
| `currentMilestone` | References M00-M19 |

## Milestone

| Field | Rule |
|---|---|
| `id` | M00-M19 |
| `dependsOn` | All dependencies complete before activation |
| `owner` | Exactly one accountable owner |
| `status` | `planned`, `active`, `complete`, `blocked`, or `risk-accepted` |
| `tasks` | Every task belongs to exactly one milestone |
| `requiredGates` | Every gate passes or has permitted, approved risk acceptance |
| `evidence` | Validation appropriate to milestone risk |
| `completionCommit` | Required Git SHA when complete |
| `completedAt` | Required ISO-8601 timestamp when complete |

## Task

| Field | Rule |
|---|---|
| `id` | `<milestone>.<sequence>`, for example M09.3 |
| `outcome` | One independently verifiable result |
| `status` | `todo`, `active`, `complete`, or `blocked` |
| `changedFiles` | Only files owned by this task |
| `validation` | Completed before a file-changing task is committed |
| `commit` | Required SHA when completion changed files |
| `pushRef` | Required branch ref with `commit` |

## Gate

| Field | Rule |
|---|---|
| `id` | Stable identifier from `contracts/production-gates.md` |
| `kind` | Product, design, correctness, security, reliability, release, operations, or growth |
| `threshold` | Objective pass condition |
| `result` | `not-run`, `pass`, `fail`, or `accepted-risk` |
| `measuredAt` | Required timestamp after execution |
| `environment` | Local, CI, Firebase test, staging, Play track, or production |
| `evidence` | At least one item for pass/accepted-risk |

## Evidence

Evidence records contain a stable ID, type, location, producer, immutable revision/build ID, timestamp, and expiry when time-sensitive. Allowed types are test report, security report, device result, screenshot, metric, runbook, approval, and risk acceptance.

## Risk Acceptance

A risk acceptance identifies the exact gate, reason, impact, temporary mitigation, owner, independent approver, and mandatory expiry. Critical financial correctness, data-loss, exploitable security, privacy-declaration, and Play-policy gates cannot be accepted for M12, M16, or M18.

## State Transitions

```text
Milestone: planned -> active -> complete
                   \-> blocked -> active
                   \-> risk-accepted -> active/complete

Task:      todo -> active -> complete
              \-> blocked -> active

Gate:      not-run -> pass
                  \-> fail -> pass
                  \-> fail -> accepted-risk -> pass
```

- A milestone cannot complete while a task is incomplete.
- Reopening a milestone clears its completion timestamp until it passes again.
- Corrections use a new commit; published history is never rewritten to conceal failure.
