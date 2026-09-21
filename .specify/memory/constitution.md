# MoneyKai Product and Engineering Constitution

This constitution is the highest repository-level product and engineering policy for
MoneyKai. It applies to mobile, web, backend, shared packages, Firebase, infrastructure,
release operations, support tooling, experiments, and documentation. When another
document conflicts with this constitution, this constitution wins unless a ratified
amendment explicitly replaces the conflicting rule.

## I. User Trust and Honest Product Behaviour

- MoneyKai MUST explain who controls data, where it is stored, whether a change is local,
  pending, synchronized, failed, conflicted, or recovered, and what a destructive action
  will do before the user confirms it.
- Balances, transaction consequences, privacy choices, synchronization status, fees,
  limitations, and irreversible actions MUST remain visible and understandable.
  Progressive disclosure MAY simplify secondary detail but MUST NOT conceal material
  financial, privacy, security, or recovery information.
- Product copy, screenshots, store declarations, support guidance, analytics, and observed
  behaviour MUST agree. Unavailable capabilities MUST NOT be implied.
- Trust-sensitive failures MUST provide a meaningful recovery path or a clearly owned
  support escalation.

## II. Financial Correctness Is Non-Negotiable

- Monetary values MUST use deterministic representations. Currency precision, rounding,
  time-zone boundaries, transfers, splits, settlements, budgets, and reconciliation rules
  MUST be documented in one canonical domain layer.
- Every certified balance MUST be traceable to source records and calculation rules, with
  zero unexplained variance.
- Retries, reconnects, imports, migrations, and offline synchronization MUST NOT create
  duplicate or silently lost financial records. Financial writes MUST be validated,
  authorized, idempotent where replay is possible, and auditable.
- A release MUST stop on unexplained balance variance, corruption, duplicate writes, or
  unrecoverable data loss. Such findings cannot be waived for schedule or growth reasons.

## III. Privacy and User Control by Design

- Collect, retain, process, and share only data needed for a documented user or operational
  purpose. Each sensitive permission and third-party SDK MUST have an owner, purpose,
  retention rule, sharing boundary, and deletion behaviour.
- Sensitive permissions MUST be requested contextually from a user-initiated dependent
  flow, with plain-language purpose and denial recovery.
- Users MUST be able to obtain a portable export and complete account deletion through
  understandable, recoverable flows. Policy, consent, Data Safety declarations, runtime
  behaviour, retention, export, and deletion MUST remain consistent.
- Credentials, tokens, private keys, signing material, production user data, and sensitive
  payloads MUST NOT be committed or placed in logs, analytics, screenshots, or test
  artifacts.

## IV. Security and Authorization by Default

- Access MUST be denied by default and granted through explicit, testable identity,
  ownership, membership, role, and environment boundaries.
- Authentication, authorization, Firebase rules, canonical API boundaries, storage,
  release supply chain, and sensitive lifecycle operations MUST receive threat-driven
  negative testing proportional to risk.
- Production authentication bypasses and silent duplicate identities are prohibited.
  Demo access MUST be visibly labelled and technically excluded from production builds.
- Critical and high findings block affected production milestones and rollout. Medium
  findings require a named owner and due date. Any permitted risk acceptance MUST be
  scoped, approved, mitigated, time-bounded, and automatically expire.

## V. One Authority, Modular Boundaries

- Business rules, API contracts, and data authority MUST each have one canonical source.
  Parallel implementations that can disagree are prohibited.
- Domain, API client, storage, authentication, UI, analytics, and platform integrations
  MUST expose typed boundaries with documented dependency direction. Platform-specific
  code MUST remain behind adapters.
- Modules MUST be cohesive, dependencies one-directional, and changes no broader than the
  verified outcome. Complexity requires a recorded justification; speculative frameworks
  and duplicate abstractions are rejected.
- Expo implementation MUST use the exact SDK 56 documentation. Bruno is a versioned
  black-box API assurance layer, never a runtime dependency or source of API truth.

## VI. Evidence Before Claims

- A task is complete only when its bounded outcome, focused checks, affected regressions,
  evidence record, checklist status, focused commit, and pushed revision are present.
- Evidence MUST identify the command or procedure, environment, immutable revision/build,
  timestamp, result, and any approved exception. Screenshots alone are insufficient for
  correctness, security, or release claims when machine-verifiable evidence is possible.
- A milestone MUST NOT close until its prerequisites and measurable gates pass and no
  blocking finding or expired/unapproved risk remains. Empty marker commits are forbidden.
- Tests MUST be proportional to risk and include negative, recovery, migration, offline,
  accessibility, performance, and physical-device coverage where the affected behaviour
  requires them. Bruno supplements rather than replaces those layers.

## VII. Accessible, Calm, and Purposeful Experience

- Primary financial jobs and status MUST be immediately discoverable. Advanced or
  infrequent controls SHOULD be disclosed progressively without increasing decision risk.
- Production UI MUST use centralized tokens, the approved solid palette, no gradients,
  no dark-mode path, and restrained glass treatment only where contrast and legibility
  remain compliant.
- Supported journeys MUST meet WCAG 2.2 AA expectations for contrast, semantics, focus,
  screen readers, reduced motion, 200% text, and minimum touch targets.
- Motion MUST clarify continuity and state; it MUST respect reduced-motion preferences and
  MUST NOT delay primary actions.

## VIII. Reliability, Release Safety, and Operations

- Networked writes MUST define validation, authorization, idempotency, timeout, bounded
  retry/backoff, cancellation, conflict resolution, and recovery behaviour.
- Releases MUST be reproducible, signed, reviewable, observable, reversible, and promoted
  through the approved staged rollout. APKs are for bounded device QA; Google Play release
  distribution uses signed AABs.
- Backups and restores MUST have approved recovery objectives and reconciliation checks.
  Primary journeys MUST have redacted telemetry, alert ownership, runbooks, and rollback
  criteria before production exposure.
- Financial corruption, cross-account exposure, material privacy mismatch, Play policy or
  signing failure, and inability to recover or roll back are immediate stop conditions.

## Delivery and Review Rules

- Work MUST use short-lived `codex/` branches, pull requests, required CI, focused commits,
  and explicit review according to the ownership boundaries ratified in M00.2.
- Unrelated user changes MUST be preserved. A task MUST stage only its owned paths and MUST
  not reset, overwrite, or silently absorb another worktree's changes.
- Secrets and production data MUST remain outside Git. Test environments use synthetic
  identities and data unless a separately approved, sanitized production procedure exists.
- The production-gate contract in
  `specs/002-production-grade-roadmap/contracts/production-gates.md` defines the minimum
  measurable acceptance thresholds. A milestone MAY tighten a threshold; relaxing one
  requires an amendment or ADR plus approved risk treatment.

## Governance and Amendments

- The MoneyKai founder/product owner is the constitution steward. The steward ratifies
  amendments after affected technical, security, privacy, financial, release, and product
  owners have reviewed the change under the ownership policy.
- Amendments MUST include motivation, affected principles/gates, migration work, evidence,
  approvers, effective date, and rollback or supersession plan.
- Versioning follows semantic policy rules:
  - **MAJOR**: removes or weakens a principle, user right, mandatory gate, or stop condition.
  - **MINOR**: adds a principle or materially expands mandatory governance.
  - **PATCH**: clarifies wording without changing obligations.
- No amendment may retroactively make failed evidence pass. Emergency exceptions MUST be
  narrower than the rule, time-bounded, founder-approved, and followed by a documented
  review. Financial corruption, cross-account exposure, credential exposure, and material
  privacy deception are never acceptable risks.
- Compliance is reviewed at every milestone gate and at least quarterly after production
  launch. Violations create owned remediation work and block the affected gate.

**Version**: 1.0.0 | **Ratified**: 2026-09-21 | **Last Amended**: 2026-09-21
