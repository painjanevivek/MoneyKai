# Tasks: MoneyKai Production-to-MNC Program

Every file-changing task must be validated, committed, and pushed before the next file-changing task begins. Every milestone gate updates status/evidence and receives a separate completion commit; never create an empty marker commit.

## M00 — Governance Foundation

**Depends on**: roadmap merge

- [x] M00.1 Ratify the engineering/product constitution with security, financial correctness, privacy, evidence, and amendment rules. ([evidence](../../docs/operations/roadmap/M00/M00.1-constitution.md))
- [ ] M00.2 Add code ownership/approval boundaries for mobile, web, domain, API, Firebase, release, and operations.
- [ ] M00.3 Add ADR, risk-register, evidence-record, and time-bounded risk-acceptance templates.
- [ ] M00.4 Define repository-wide definition of done, dependency policy, owners, and target windows for M01-M19.
- [ ] M00.GATE Record evidence and push `feat(milestone-00) : complete governance foundation`.

## M01 — Product Definition

**Depends on**: M00

- [ ] M01.1 Approve target users, financial jobs, trust promise, and competitive differentiation.
- [ ] M01.2 Freeze Android V1 launch capabilities and explicit non-goals.
- [ ] M01.3 Define activation, retention, task success, trust, support, and guardrail metrics.
- [ ] M01.4 Map primary journeys to owners, analytics events, and success conditions.
- [ ] M01.GATE Pass `PROD-01`; push `feat(milestone-01) : complete product definition`.

## M02 — Design System and Progressive Disclosure

**Depends on**: M01

- [ ] M02.1 Inventory screens/states, duplicate styles, accessibility defects, and raw visual constants.
- [ ] M02.2 Establish solid color, type, spacing, shape, elevation, icon, and motion tokens with no gradient/dark path.
- [ ] M02.3 Build reusable navigation, field, button, card, sheet, disclosure, feedback, and state components.
- [ ] M02.4 Apply progressive disclosure to onboarding, dashboard, transactions, budgets, groups, account, Trust Center, and settings.
- [ ] M02.5 Validate WCAG AA, screen readers, focus, 200% text, reduced motion, touch targets, and glass legibility.
- [ ] M02.GATE Pass all design/accessibility/UX gates; push `feat(milestone-02) : complete design system and progressive disclosure`.

## M03 — Modular Application Architecture

**Depends on**: M02

- [ ] M03.1 Document dependency direction across apps, domain, API client, storage, auth, UI, and platform adapters.
- [ ] M03.2 Move duplicated financial/validation rules to `packages/domain` with contract tests.
- [ ] M03.3 Enforce canonical OpenAPI/API-client boundaries and remove unauthorized parallel data paths.
- [ ] M03.4 Isolate Firebase, persistence, network, analytics, and native integrations behind typed interfaces.
- [ ] M03.5 Add CI checks for forbidden imports, contract drift, and platform leakage.
- [ ] M03.GATE Pass architecture and `API-01`; push `feat(milestone-03) : complete modular application architecture`.

## M04 — Financial Correctness

**Depends on**: M03

- [ ] M04.1 Define amount representation, currency precision, rounding, time-zone, and boundary rules.
- [ ] M04.2 Specify transaction, transfer, split, settlement, budget, and reconciliation invariants.
- [ ] M04.3 Add property/fixture tests for currency, rounding, date, migration, and retry cases.
- [ ] M04.4 Make every displayed balance traceable to source records and calculation rules.
- [ ] M04.GATE Pass `FIN-01`-`FIN-03` and `TRUST-01`; push `feat(milestone-04) : complete financial correctness`.

## M05 — Identity and Authentication

**Depends on**: M03, M04

- [ ] M05.1 Document one Firebase identity/signing/redirect matrix for web, debug, preview, and Play.
- [ ] M05.2 Complete Google sign-in, provider linking/collision recovery, restoration, logout, revocation, and recovery.
- [ ] M05.3 Store session material only in approved secure storage and redact authentication telemetry.
- [ ] M05.4 Gate demo login to visibly labelled non-production builds.
- [ ] M05.5 Test disabled, deleted, expired, offline, cancelled, and linking-failure cases.
- [ ] M05.GATE Pass `SEC-04`; push `feat(milestone-05) : complete identity and authentication`.

## M06 — Privacy and User Trust

**Depends on**: M05

- [ ] M06.1 Implement a Trust Center for data authority, sync, permissions, security, support, export, and deletion.
- [ ] M06.2 Create a data/SDK inventory covering purpose, retention, sharing, and deletion.
- [ ] M06.3 Request sensitive permissions contextually with denial recovery.
- [ ] M06.4 Implement/test portable export and resumable deletion with support escalation.
- [ ] M06.5 Align policy, in-app copy, Data Safety, permissions, SDK inventory, and observed behavior.
- [ ] M06.GATE Pass `TRUST-03`, `TRUST-04`, and `PRIV-01`; push `feat(milestone-06) : complete privacy and user trust`.

## M07 — Security Baseline

**Depends on**: M05, M06

- [ ] M07.1 Threat-model identity, financial data, groups, imports, sync, deletion, and release supply chain.
- [ ] M07.2 Prove deny-by-default Firebase rules and cross-account/group isolation.
- [ ] M07.3 Enforce secret, dependency, lockfile, mobile, web, and backend security checks in CI.
- [ ] M07.4 Add abuse controls, rate limits, replay resistance, and audit events for sensitive operations.
- [ ] M07.5 Design request-bound, server-verified Play Integrity tiers/remediation.
- [ ] M07.6 Remediate critical/high findings and assign medium owners/dates.
- [ ] M07.GATE Pass `SEC-01`-`SEC-05`; push `feat(milestone-07) : complete security baseline`.

## M08 — Reliable and Scalable Backend

**Depends on**: M03, M04, M07

- [ ] M08.1 Confirm canonical API/data authority and deny unintended direct writes.
- [ ] M08.2 Add idempotency, validation, authorization, timeout, retry, cancellation, and conflict contracts.
- [ ] M08.3 Add cursor pagination, indexes, query budgets, caching, backpressure, and rate limits.
- [ ] M08.4 Implement explicit offline/sync transitions with deterministic reconciliation/recovery.
- [ ] M08.5 Add redacted telemetry, correlation IDs, dashboards, alerts, backup/restore, and DR exercises.
- [ ] M08.GATE Pass `REL-04`, `PERF-03`, and affected security/correctness gates; push `feat(milestone-08) : complete reliable and scalable backend`.

## M09 — Bruno API Assurance

**Depends on**: M08

- [ ] M09.1 Pin Bruno CLI and add `api-tests/` with safe local, staging, and production-read-only placeholders.
- [ ] M09.2 Add health/auth suites including expired, revoked, missing, and cross-account negatives.
- [ ] M09.3 Add transactions, budgets, groups, sync, export, and deletion happy/error paths.
- [ ] M09.4 Add idempotency, retry, pagination, schema, latency, and authorization assertions.
- [ ] M09.5 Add deterministic golden-journey setup/teardown with unique test identities.
- [ ] M09.6 Add four root scripts, CI execution, JUnit publication, secret/test-data documentation, and production safeguards.
- [ ] M09.GATE Pass `API-01`-`API-03`; push `feat(milestone-09) : complete Bruno API assurance`.

## M10 — Core Experience Certification

**Depends on**: M02, M04-M09

- [ ] M10.1 Certify onboarding/login with logo placement, progressive disclosure, trust copy, and recovery.
- [ ] M10.2 Certify dashboard, transactions, record/import, budgets, accounts, and portfolio.
- [ ] M10.3 Certify groups/shared ledger, explainable settlement, and ownership without implying unavailable collaboration.
- [ ] M10.4 Certify sync, offline/conflict, reinstall, export, deletion, and Trust Center.
- [ ] M10.5 Verify compact glass tabs, transitions, reduced motion, icon consistency, and physical ergonomics.
- [ ] M10.GATE Pass launch-journey product/design/trust/correctness gates; push `feat(milestone-10) : complete core experience certification`.

## M11 — Automated Quality Matrix

**Depends on**: M10

- [ ] M11.1 Establish domain/store/service/validation/migration/retry unit and property coverage.
- [ ] M11.2 Add shared-UI component and accessibility tests for primary states.
- [ ] M11.3 Add auth, API, Firebase, storage, sync, export, and deletion integration tests.
- [ ] M11.4 Add app E2E plus deployed Bruno suites.
- [ ] M11.5 Add offline, reconnect, process-death, reinstall, upgrade, low-storage, and weak-network cases.
- [ ] M11.6 Benchmark startup, interaction, memory, bundle, network, battery, and low-end devices; approve/tighten budgets.
- [ ] M11.7 Run supported Android emulator and physical-device matrix.
- [ ] M11.GATE Publish passing immutable reports; push `feat(milestone-11) : complete automated quality matrix`.

## M12 — Release Engineering and Play Readiness

**Depends on**: M07, M11

- [ ] M12.1 Reconcile React Native/Expo 56 configuration, package ID, native ownership, versions, and profiles.
- [ ] M12.2 Produce reproducible signed AABs with Play App Signing, protected credentials, SBOM, provenance, and metadata.
- [ ] M12.3 Audit merged manifest, SDKs, permissions, target API, certificate, and production flags.
- [ ] M12.4 Complete listing, screenshots, icon, privacy URL, Data Safety, rating, support, testers, and review notes.
- [ ] M12.5 Test install/upgrade, links, notifications, auth, integrity remediation, rollback, and symbols.
- [ ] M12.6 Re-check active Play policies/target API within seven days of submission.
- [ ] M12.GATE Pass all Play, privacy, and release security gates; push `feat(milestone-12) : complete release engineering and Play readiness`.

## M13 — Golden Journey Gate

**Depends on**: M12

- [ ] M13.1 Publish the signed candidate to Play internal testing and record build identity.
- [ ] M13.2 Install from Play and complete Firebase Google sign-in on the reference phone.
- [ ] M13.3 Record/import, sync, and reconcile all balances.
- [ ] M13.4 Reinstall, restore the account, and reconcile records/balances.
- [ ] M13.5 Export/validate data, delete the account, and observe terminal state.
- [ ] M13.6 Repeat the clean-account journey 10 consecutive times.
- [ ] M13.GATE Pass `GOLDEN-01`; push `feat(milestone-13) : complete golden journey gate`.

## M14 — Internal Dogfood

**Depends on**: M13

- [ ] M14.1 Enrol internal cohort with consent, device coverage, feedback, and support ownership.
- [ ] M14.2 Run seven days while monitoring crash, ANR, auth, sync, latency, battery, and support.
- [ ] M14.3 Resolve blockers/priority defects with reproduction and regression coverage.
- [ ] M14.4 Re-run golden, backup/restore, security, and release smoke gates.
- [ ] M14.GATE Meet thresholds with no blocker; push `feat(milestone-14) : complete internal dogfood`.

## M15 — Closed Beta

**Depends on**: M14

- [ ] M15.1 Define cohort, eligibility, device mix, exposure, consent, feedback, and exit criteria.
- [ ] M15.2 Measure onboarding, task success, trust, auth/sync reliability, retention, and support satisfaction.
- [ ] M15.3 Resolve blockers and assign lower-severity owners/dates.
- [ ] M15.4 Verify support, incidents, privacy requests, rollback communication, and cross-functional go/no-go.
- [ ] M15.GATE Pass beta gates; push `feat(milestone-15) : complete closed beta`.

## M16 — Production Launch

**Depends on**: M15

- [ ] M16.1 Refresh policy, security, dependency, Data Safety, signing, artifact, rollback, dashboard, and on-call evidence.
- [ ] M16.2 Release to 5%, observe 24 hours, and record decision.
- [ ] M16.3 Release to 20%, observe 48 hours, and record decision.
- [ ] M16.4 Release to 50%, observe 72 hours, and record decision.
- [ ] M16.5 Release to 100% only while every stop condition remains clear.
- [ ] M16.6 Publish launch health, known issues, support routing, and review.
- [ ] M16.GATE Pass all production gates; push `feat(milestone-16) : complete production launch`.

## M17 — Product-Market Fit

**Depends on**: M16

- [ ] M17.1 Establish activation, retention, task, support, and review baselines.
- [ ] M17.2 Improve onboarding/first value without weakening disclosure, consent, or data control.
- [ ] M17.3 Run governed retention, ASO, referral, and re-engagement experiments.
- [ ] M17.4 Segment qualitative/operational data and remove experiments that fail value/trust criteria.
- [ ] M17.GATE Demonstrate approved PMF trend; push `feat(milestone-17) : complete product-market-fit validation`.

## M18 — MNC-Grade Operations

**Depends on**: M16; M17 may run in parallel after stability

- [ ] M18.1 Establish service ownership, SLO/error budgets, on-call, severity, incident, and postmortem process.
- [ ] M18.2 Add audit/access governance, environment separation, vendor assessment, and compliance ownership.
- [ ] M18.3 Establish localization, currency/time-zone, accessibility, and support governance.
- [ ] M18.4 Run capacity/cost planning against approved growth scenarios.
- [ ] M18.5 Exercise restore, provider outage, account compromise, security incident, and service recovery.
- [ ] M18.6 Sustain 99.9% crash-free sessions and approved SLOs through the evidence window.
- [ ] M18.GATE Pass all operations gates; push `feat(milestone-18) : complete MNC-grade operations`.

## M19 — Category Leadership

**Depends on**: M17, M18

- [ ] M19.1 Validate demand/threat models for real-time collaboration and verified invitations.
- [ ] M19.2 Add server-enforced membership, settlement/activity history, conflicts, and ownership transfer.
- [ ] M19.3 Add partner integrations only with reviewed scopes, revocation, reconciliation, and observability.
- [ ] M19.4 Scale customer operations, education, abuse handling, privacy, and security response.
- [ ] M19.5 Govern recommendation/AI with consent, explainability, bounded authority, evaluation, and rollback.
- [ ] M19.6 Publish annual trust, reliability, accessibility, and product-value review.
- [ ] M19.GATE Pass collaboration/integration production gates; push `feat(milestone-19) : complete category leadership foundation`.

## Commit and Push Protocol

```text
feat(<scope>) : <completed outcome>

- State the customer-visible or operational result.
- State the architecture, security, privacy, correctness, or reliability constraint preserved.
- State the focused validation and result.
```

Use `fix(<scope>) : ...` for defects. Stage only files owned by the task, push immediately, and record the SHA. If authentication, CI, or an external service blocks a push, keep the focused commit, record the blocker, and never combine it with the next task.
