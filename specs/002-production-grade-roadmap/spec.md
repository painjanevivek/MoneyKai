# Feature Specification: MoneyKai Production-to-MNC Program

**Feature Branch**: `codex/production-roadmap`

**Created**: 2026-09-21
**Status**: Draft for execution

## Product Promise

MoneyKai helps people understand and manage personal and shared money without making financial administration feel like work. Every balance, transaction, permission, synchronization state, and destructive action must be explainable when a user needs to trust it.

## Users and Outcomes

- **Individual money manager**: can sign in, record or import transactions, understand current financial status, use budgets, recover data after reinstall, export it, and delete the account.
- **Shared-expense participant**: can understand who paid, who owes, how a balance was calculated, what changed, and whether collaboration is actually active.
- **MoneyKai release team**: can prove correctness, privacy, security, reliability, store compliance, and rollback readiness with durable evidence.

## Trust Principles

1. Explain every displayed amount from its source records and rules.
2. Distinguish offline, pending, synchronized, failed, conflicted, and recovered states.
3. Disclose sharing, import, deletion, settlement, and account-linking consequences before confirmation.
4. Request permissions and personal data only when the user invokes the dependent capability.
5. Make export and account deletion first-class, tested journeys.
6. Ensure retry, reinstall, migration, and conflict recovery cannot silently duplicate or lose financial records.
7. Close no milestone without reproducible evidence or an approved, time-bounded risk acceptance.

## Scope

### In scope

- Android mobile application and Google Play delivery.
- MoneyKai web parity where identity, data authority, privacy, and shared contracts intersect.
- Firebase Authentication and Firestore policy boundaries.
- Canonical backend/OpenAPI contracts, synchronization, observability, backup, and recovery.
- Product design system, progressive disclosure, accessibility, and interaction quality.
- Bruno API collections and CI reporting.
- Security, release engineering, store compliance, staged rollout, support, growth, and MNC-grade operations.

### Out of scope for the first production launch

- iOS App Store release. Architecture preserves portability, but Android is the M16 launch platform.
- Claims of bank-grade certification, guaranteed Play Protect approval, or guaranteed popularity.
- Real-money custody, money transmission, lending, investment execution, or regulated financial advice.
- Production demo credentials or authentication bypasses.

## Functional Requirements

- **FR-001**: Define M00-M19 in dependency order with independently completable tasks and objective exit gates.
- **FR-002**: End every file-changing task with a focused `feat(scope) : ...` or `fix(scope) : ...` commit after relevant checks pass, then push its milestone branch.
- **FR-003**: Record durable evidence and a separate completion commit for every milestone; prohibit empty commits.
- **FR-004**: Use centralized tokens, the approved solid palette, no gradients, no dark mode, and restrained glass only where contrast remains compliant.
- **FR-005**: Keep primary actions and material financial state visible while progressively disclosing advanced or infrequent controls.
- **FR-006**: Never hide balances, fees, consequences, privacy choices, destructive actions, synchronization state, or recovery information.
- **FR-007**: Use strict typed contracts, cohesive modules, one-directional dependencies, and isolated platform integrations.
- **FR-008**: Use deterministic money representation and documented currency, rounding, time-zone, reconciliation, and migration rules.
- **FR-009**: Support Firebase Google sign-in, safe provider linking, session restoration, logout/revocation, recovery, and non-production-only demo access.
- **FR-010**: Provide an in-product Trust Center, contextual permissions, portable export, and resumable account deletion.
- **FR-011**: Cover threat modelling, Firebase rules, authorization, secrets, dependencies, abuse controls, and mobile/web attack surfaces.
- **FR-012**: Define idempotency, timeouts, bounded retry/backoff, cancellation, conflict handling, and observable recovery for remote writes.
- **FR-013**: Add Git-tracked Bruno suites for health, auth, transactions, budgets, groups, sync, export/deletion, authorization, idempotency, and the golden journey.
- **FR-014**: Commit only safe Bruno placeholders; inject credentials through approved local or CI secret stores.
- **FR-015**: Publish machine-readable Bruno results in CI and block merges on required failures.
- **FR-016**: Cover unit, integration, component, accessibility, API, end-to-end, offline, migration, performance, reinstall, and physical-device tests.
- **FR-017**: Ship a signed AAB using Play App Signing, current target API, accurate Data Safety, audited permissions, and a tested rollback.
- **FR-018**: Use APKs only for local/physical-device QA; use AAB for Play production.
- **FR-019**: Prove install, Google sign-in, record/import, sync, reinstall/recovery, export, and deletion through Play internal testing.
- **FR-020**: Advance Play rollout through 5%, 20%, 50%, and 100% only while health gates pass.
- **FR-021**: Establish SLOs, on-call, audit logging, vendor review, accessibility governance, capacity planning, localization readiness, and tested disaster recovery.

## Success Criteria

- **SC-001**: The golden journey passes 10 consecutive clean-account runs without manual repair or unexplained state.
- **SC-002**: Forced retry/reconnect creates zero duplicate financial records.
- **SC-003**: Reconciliation has zero unexplained balance variance for supported currency/rounding modes.
- **SC-004**: Auth and sync success are each at least 99.5% in closed beta, excluding confirmed upstream outages.
- **SC-005**: Crash-free sessions are at least 99.8% before production and 99.9% before M18; user-perceived ANR is at most 0.1%.
- **SC-006**: Supported screens meet WCAG 2.2 AA, 200% text scaling, screen-reader, and reduced-motion requirements.
- **SC-007**: Export and deletion pass every certification case and reach the published terminal state.
- **SC-008**: M12, M16, and M18 have zero unresolved critical/high security findings.
- **SC-009**: Every milestone has an owner, evidence, gate decision, and pushed completion commit.
- **SC-010**: Production reaches 100% without breaching a stop condition.

## Program Boundary

Production grade is achieved at M16. M17 validates sustainable product-market fit, M18 establishes MNC-grade operations, and M19 represents category-leadership capabilities. Popularity depends on value, distribution, timing, and execution; engineering cannot guarantee it.
