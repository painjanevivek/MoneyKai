# Dependency and Update Policy

## Objectives

Dependencies must be necessary, supported, reproducible, legally usable, and no more
privileged than their purpose requires. The canonical root `package-lock.json` governs npm
workspaces. Runtime behaviour never depends on an untracked local install or floating CI
version.

## Admission

Before adding or materially expanding a dependency, the owning pull request records:

- the user/engineering need and why existing platform or repository capability is insufficient;
- runtime/build/dev scope, platforms, transitive footprint, permissions, network/data access,
  native code, maintenance health, provenance, license, and viable replacement/removal path;
- security advisories and whether the package handles identity, financial, personal, signing,
  release, or production data;
- compatibility with canonical Node and Expo/React Native versions plus low-end Android;
- focused tests, bundle/build/performance impact where relevant, and a rollback version.

Packages that duplicate canonical domain/API behaviour, require unjustified sensitive
permissions, expose unsupported licenses, embed secrets, or lack a safe maintenance path
are rejected. New production dependencies touching sensitive data require security/privacy
approval.

## Version and Lock Rules

- Use the repository-supported Node floor (`>=22.13.0`) and the version selected by CI.
- Expo work MUST consult the exact SDK 56 documentation before implementation and use
  compatible package versions. Expo SDK upgrades require a dedicated ADR and migration gate.
- Commit the canonical root lockfile with manifest changes. Nested npm lockfiles are
  prohibited unless an ADR establishes a truly independent artifact.
- CI and automation use the committed lock and reproducible install commands. Never edit
  installed dependency output or depend on globally installed tooling.
- Security/release tools that define evidence formats or behaviour use exact versions.
  Bruno CLI is planned at exact `4.1.0`; any compatibility downgrade requires an ADR,
  security review, and explicit pin.
- Floating `latest`, unbounded git references, mutable artifact URLs, and unverified binary
  downloads are prohibited in CI/release paths.

## Update Classes and Service Targets

| Class | Target response | Required handling |
|---|---:|---|
| Actively exploited or reachable critical | Contain within 24 hours; remediate before affected production use | Disable/isolate if immediate patch is unsafe; security owner and incident process active |
| Reachable high | Triage within 1 business day; remediate within 7 calendar days | Affected gates blocked unless a permitted, approved, unexpired acceptance exists |
| Medium | Triage within 5 business days; remediate within 30 calendar days | Named owner/date and regression coverage |
| Low | Review in monthly maintenance; remediate within 90 calendar days or next compatible release | Keep visible until fixed/closed with evidence |
| Routine supported update | Weekly grouped review | Focused compatibility/regression checks; avoid unrelated major upgrades |
| Major/framework/native update | Planned milestone only | ADR, migration/rollback plan, full affected matrix and release evidence |

Vendor severity is an input, not the decision. Reachability, privilege, data sensitivity,
exploitability, affected artifact, and compensating controls determine priority. Dismissal
without evidence is prohibited.

## Continuous Controls

- Dependabot/security updates remain enabled and grouped into reviewable, bounded changes.
- Required CI checks lockfile drift, secrets, vulnerabilities, licenses/provenance where
  supported, build compatibility, tests, and canonical API/release boundaries.
- `npm run security:audit-dependencies`, the dependency manifest, GitHub alerts, Expo/native
  compatibility checks, and backend inventories are reconciled rather than reported as one
  interchangeable number.
- SBOM/provenance and signed-artifact evidence become mandatory at M12 and remain current.
- Dependency exceptions use the risk-acceptance template with affected versions, reachability,
  compensating controls, owner, expiry, removal condition, and evidence. Expiry blocks the
  affected gate.

## Current Security Lane

On 2026-09-21 GitHub reported 64 default-branch Dependabot alerts (39 high, 21 moderate,
4 low), while the root local audit previously reported zero vulnerabilities for its assessed
graph. These observations are not equivalent proof and must be reconciled. The interim
security/dependency owner is `@painjanevivek`; triage begins immediately under M07.3/M07.6,
with reachable critical/high findings subject to the service targets above. No milestone or
release may describe the dependency baseline as clean until the inventories and reachability
are evidenced at the same revision.

## Ownership and Review

The release owner maintains tooling and lock policy; the security owner owns advisory
triage; each surface owner owns compatibility and regression proof. Review this policy at
every milestone gate, after a supply-chain incident, and at least quarterly in production.
