# Production Gate Contract

## Semantics

- **Required** gates must pass before the mapped milestone closes.
- **Stop conditions** immediately prevent rollout progression and start triage/rollback.
- Risk acceptance is allowed only where stated, with owner, approver, mitigation, and expiry.
- These are initial baselines. M11 may tighten them; relaxation requires an ADR and approval.

## Product, Trust, and Design

| ID | Pass condition |
|---|---|
| `PROD-01` | Primary users, jobs, V1 launch scope/non-goals, and success metrics are approved and versioned. |
| `TRUST-01` | Every certified balance links to contributing records/rules with zero unexplained variance. |
| `TRUST-02` | Offline, pending, synchronized, failed, conflicted, and recovered states are distinguishable. |
| `TRUST-03` | Export/deletion pass all cases with understandable status and support escalation. |
| `TRUST-04` | Sensitive permissions are requested only from a user-initiated dependent flow with purpose. |
| `DESIGN-01` | Production visual constants come from approved token layers. |
| `DESIGN-02` | No gradient/dark-mode path exists; glass surfaces retain WCAG AA contrast. |
| `DESIGN-03` | Primary tasks/status are visible; material risk/consequence is never concealed. |
| `A11Y-01` | WCAG 2.2 AA contrast, names/focus, 200% text, reduced motion, and 44x44 targets pass. |
| `UX-01` | Loading, empty, validation, offline, error, conflict, success, and retry states are tested. |
| `GROWTH-01` | Experiments define hypothesis, metric, guardrail, sample, stop rule, and removal date. |

## Correctness, API, Security, and Privacy

| ID | Pass condition |
|---|---|
| `FIN-01` | Currency, rounding, time-zone, and reconciliation fixtures have zero unexplained variance. |
| `FIN-02` | Forced retry, timeout, and reconnect create zero duplicate financial records. |
| `FIN-03` | Supported migrations preserve balances and record counts. |
| `API-01` | OpenAPI generation/check passes and consumers compile against the contract. |
| `API-02` | Required Bruno domain, negative, idempotency, and golden-journey suites pass in CI. |
| `API-03` | Cross-account/group tests deny access and expose no protected payload. |
| `SEC-01` | Zero unresolved critical/high findings at M12, M16, and M18. |
| `SEC-02` | Secret scan passes; artifacts contain no credentials, tokens, or signing material. |
| `SEC-03` | Firebase tests prove deny-by-default and authorized ownership/membership behavior. |
| `SEC-04` | Linking, collision recovery, restoration, revocation, disabled/deleted-account cases pass. |
| `SEC-05` | High-value Android actions verify request-bound Play Integrity server-side with tiered remediation. |
| `PRIV-01` | In-app copy, privacy policy, retention, Data Safety, permissions, SDK inventory, export, and deletion agree. |

## Reliability, Performance, Release, and Operations

| ID | Pass condition |
|---|---|
| `REL-01` | Closed-beta sync success is at least 99.5%, excluding confirmed upstream outages. |
| `REL-02` | Crash-free sessions are at least 99.8% before M16 and 99.9% before M18. |
| `REL-03` | User-perceived ANR is at most 0.1%. |
| `REL-04` | Backup/restore meets approved RPO/RTO and reconciles records/balances. |
| `PERF-01` | Release cold-start p75 is at most 2.5 seconds on the named low-end device. |
| `PERF-02` | Local navigation/primary feedback p95 is at most 150 ms. |
| `PERF-03` | Staging p95 is at most 500 ms for primary reads and 750 ms for writes under approved load. |
| `PLAY-01` | Signed AAB is reproducible from the tagged revision and passes package/signature/version checks. |
| `PLAY-02` | Target API and Play policies are re-verified within seven days of submission. |
| `PLAY-03` | Production requests only approved permissions; research-only sensitive capabilities are absent. |
| `PLAY-04` | Listing, screenshots, privacy URL, Data Safety, rating, support, and tester instructions are truthful/complete. |
| `OPS-01` | Primary journeys have redacted telemetry, dashboards, alert ownership, and runbooks. |
| `OPS-02` | On-call, severity, communication, rollback, and post-incident processes pass an exercise. |
| `OPS-03` | Restore, account-compromise, and service-recovery exercises meet objectives. |
| `OPS-04` | Vendor review, compliance ownership, retention, localization, and accessibility governance are current. |

## Golden Journey

`GOLDEN-01` passes after 10 consecutive clean-account Play-internal runs:

1. Install the Play-delivered build.
2. Sign in with Google through Firebase.
3. Record a manual transaction.
4. Import the supported fixture.
5. Synchronize and explain every balance.
6. Reinstall on the supported physical device.
7. Restore the account and reconcile data.
8. Export and validate user data.
9. Delete the account and observe the documented terminal state.

## Rollout

| Stage | Minimum observation | Advance condition |
|---|---|---|
| Internal | 7 days plus golden journey | Required M13 gates pass. |
| Closed beta | 14 days or approved cohort exposure | M15 health, trust, and support gates pass. |
| 5% | 24 hours | No stop condition; named owner reviews telemetry/support. |
| 20% | 48 hours | No material regression beyond approved guardrails. |
| 50% | 72 hours | No stop condition; rollback remains tested. |
| 100% | Continuous | Production SLOs and incident response stay active. |

Immediate stop/rollback conditions:

- financial corruption, unexplained variance, duplicate writes, or unrecoverable data loss;
- auth lockout or cross-account/group exposure;
- exploitable critical/high security issue or secret exposure;
- privacy declaration materially disagrees with observed behavior;
- crash-free sessions below 99.5%, user-perceived ANR above 0.47%, or material unapproved regression;
- Play policy warning, signing/package mismatch, or inability to roll back;
- production export/deletion failure without bounded recovery.

## Milestone Mapping

- M00-M01: governance evidence and `PROD-01`.
- M02: all design/accessibility/UX gates.
- M03-M04: `API-01`, all financial gates, and `TRUST-01`.
- M05-M07: all security/privacy gates plus `TRUST-03` and `TRUST-04`.
- M08-M09: all API gates, `REL-04`, and `PERF-03`.
- M10-M13: all journey-relevant gates and `GOLDEN-01`.
- M14-M15: reliability, observability, trust comprehension, and support evidence.
- M16: every required production gate and rollout advance condition.
- M17: `GROWTH-01` plus production guardrails.
- M18: 99.9% crash-free and all operations gates.
- M19: production gates plus collaboration/integration-specific threat, correctness, and scale gates.
