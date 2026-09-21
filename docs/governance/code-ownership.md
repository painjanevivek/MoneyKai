# MoneyKai Code Ownership and Approval Boundaries

## Purpose

This policy identifies who is accountable for each MoneyKai change surface and which
review dimensions must approve a change before merge. `.github/CODEOWNERS` implements
path-based routing; this document defines decision authority and cannot be bypassed merely
because GitHub permits a merge.

## Current Accountability Model

`@painjanevivek` is the founder, product owner, repository administrator, and interim
accountable owner for every surface. This is transparent single-maintainer governance,
not a claim of independent review. Until delegated owners are appointed:

- every change uses a pull request and required CI;
- the founder records the required approval dimensions in the pull request or linked
  evidence, even when author and approver are the same person;
- financial, authentication, authorization, privacy, destructive-lifecycle, billing,
  signing, and production-rollout changes require explicit risk and rollback notes; and
- a milestone cannot claim independent review when none occurred.

M18 cannot close until critical production and incident responsibilities have named
backups and separation adequate for on-call and continuity.

## Ownership Matrix

| Surface | Primary paths | Accountable role | Required approval dimensions |
|---|---|---|---|
| Mobile | `apps/MoneyKai-mobile/` | Mobile owner | Product/UI; domain for money rules; security/privacy for identity, storage, permissions, telemetry, export, or deletion; release for native config |
| Flutter reference | `apps/MoneyKai-flutter/` | Mobile owner | Product/UI and release; architecture approval before reusing behaviour in the canonical mobile app |
| Web | `apps/MoneyKai-web/`, root/web `vercel.json` | Web owner | Product/UI; API/domain for contract or financial behaviour; security/privacy for identity, storage, telemetry, or lifecycle |
| Financial domain | `packages/domain/` | Financial correctness owner | Financial correctness and architecture; security when authorization or sensitive classification changes |
| API contracts/client | `contracts/`, `packages/api-client/` | API contract owner | API/architecture plus every affected consumer; security/privacy for protected data or operations |
| API implementation | `api/` | Backend/API owner | API/architecture; domain for financial behaviour; security/privacy for identity, billing, authorization, export, or deletion |
| Firebase/data policy | `firebase.json`, `firestore*`, `supabase/` | Data/security owner | Security, privacy, backend authority, migration/recovery when schema or access changes |
| Release and supply chain | `.github/workflows/`, `.github/dependabot.yml`, package manifests/locks, `scripts/`, `config/security/`, app/EAS config | Release owner | Release and security; mobile/web/backend owner for the affected artifact |
| Operations and evidence | `docs/operations/`, security/privacy/Play runbooks | Operations owner | Operations plus the technical owner whose gate or runbook is represented |
| Governance | constitution, `specs/`, `docs/governance/`, `CODEOWNERS` | Founder/product owner | Founder plus every materially affected dimension; constitutional amendment rules apply |

## Approval Dimensions

Approval is about the risk being accepted, not only the folder being edited.

| Dimension | Must verify |
|---|---|
| Product/UI | Intended user outcome, progressive disclosure, accessibility, honest copy, and no regression to primary tasks |
| Financial correctness | Deterministic amount/date rules, invariants, reconciliation, migrations, and traceability |
| Architecture/API | One canonical authority, typed contracts, dependency direction, compatibility, and bounded failure semantics |
| Security | Authentication, authorization, abuse, secrets, dependencies, logging, negative tests, and threat implications |
| Privacy | Collection purpose, consent, permissions, retention, sharing, export, deletion, policy, and Data Safety consistency |
| Release | Reproducibility, signing, permissions, target API/policy, rollout, telemetry, rollback, and artifact identity |
| Operations | SLO/alert ownership, runbooks, support, incident response, recovery evidence, and durable audit trail |

## Change Classes

### Standard

A standard change does not alter money rules, protected data, identity, authorization,
destructive lifecycle, billing, release authority, or governance. It requires the affected
path owner, passing required CI, focused regression checks, and evidence proportional to
impact.

### Sensitive

A change is sensitive if it affects any of the following:

- balances, transactions, imports, splits, settlements, budgets, reconciliation, or migration;
- authentication, authorization, Firebase rules, tokens, secrets, billing, abuse controls, or audit events;
- permissions, analytics/SDKs, retention, export, deletion, privacy policy, or Data Safety;
- canonical API/data authority, idempotency, offline conflict handling, backup/restore, or disaster recovery;
- app identifiers, native manifests, signing, CI requirements, deployment, Play policy, staged rollout, or rollback; or
- the constitution, production gates, ownership, risk acceptance, or evidence requirements.

Sensitive changes require every relevant approval dimension in the matrix, explicit failure
and rollback analysis, negative/recovery tests, and no unresolved critical/high finding.
Where independent reviewers exist, at least one eligible owner other than the author must
approve. A single-maintainer exception must be declared; it never substitutes for required
tests or make an independent-review claim.

## Merge, Exception, and Emergency Rules

- `main` changes arrive through pull requests after required checks pass and conversations
  are resolved. Administrators do not bypass failed gates.
- CODEOWNERS changes require governance approval and proof that critical paths remain owned.
- Risk acceptance follows the ratified constitution and M00 templates: named owner,
  approver, scope, mitigation, expiry, removal condition, and linked evidence.
- Financial corruption, cross-account exposure, credential exposure, material privacy
  deception, signing/package mismatch, and inability to recover or roll back are not
  acceptable risks.
- Emergency production containment may use the narrowest safe change after founder approval.
  It must preserve evidence, receive retrospective review within one business day, and add
  regression coverage before normal delivery resumes.

## Delegating Ownership

Adding or replacing an owner requires a governance pull request that records scope,
capability, backup coverage, effective date, and access changes. Remove stale owners
immediately. Review this matrix at every milestone gate and at least quarterly after launch.
