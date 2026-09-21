# MoneyKai Program Risk Register

**Owner:** `@painjanevivek` (interim founder/security/program owner)

**Review cadence:** Daily through 2026-09-24; weekly thereafter; every milestone gate

**Last reviewed:** 2026-09-21

**Next review:** 2026-09-22

## Rating Method

Likelihood and impact use `1` (lowest) through `5` (highest); score is likelihood × impact.
`20–25` is Critical, `12–19` High, `6–11` Medium, and `1–5` Low. Constitutional stop
conditions remain blockers regardless of numerical score.

## Open Risks

| ID | Risk / cause / consequence | Category | Inherent | Controls and evidence | Residual | Treatment | Owner | Due / review | Trigger / indicator | Status / affected gate | Acceptance |
|---|---|---|---:|---|---:|---|---|---|---|---|---|
| R-001 | GitHub and the repository policy audit assess different dependency inventories, so an alert could be incorrectly described as resolved or unreachable. | Security / supply chain | 4×4=16 High | GitHub alerts remain open; root lock and custom policy audit; no dismissal; exact revisions required in evidence; [dependency policy](./dependency-policy.md) | 4×4=16 High | Reconcile package, workspace, advisory, reachability, and deployed-artifact inventories under M07.3/M07.6. | Interim security owner (`@painjanevivek`) | Daily; first reconciliation 2026-09-24 | Inventory/count changes, reachable runtime finding, or policy audit disagreement | Open; blocks M07/M12/M16 security claims, not governance adoption | None |
| R-002 | Seven high Expo/Metro/OpenAPI build-tool package rows are reported locally and eight on clean Linux CI, all under exceptions expiring 2026-09-24; unsafe remediation could break Expo 56 while expiry could block delivery. | Security / release | 4×4=16 High | Repository-controlled build inputs; packages assessed as build tooling; committed lock; PR audit/export/tests; policy fails stale/expired/escalated exceptions and permits absence only for the named cross-environment `@expo/xcpretty` variance; [current exception record](../operations/production-readiness/pr-1-dependency-exceptions.md) | 3×3=9 Medium | Re-evaluate reachability and patched Expo 56-compatible paths; remediate or approve newly complete, narrow records before expiry. | Security and release owner (`@painjanevivek`) | 2026-09-24 | Upstream patch, exploitability change, user-controlled build input, severity escalation, environment-count drift, or expiry | Open; expiry blocks affected builds/releases | Current records valid only through 2026-09-24 |
| R-003 | Private backend branch protection cannot be technically enforced on the current GitHub plan, allowing an administrator to bypass the documented merge workflow. | Security / governance | 3×4=12 High | Private repository; PR-only policy; mandatory manual check evidence; no force pushes; [approved acceptance](../operations/production-readiness/pr-0-risk-acceptance.md) | 2×4=8 Medium | Enable private-repository protection when plan supports it; do not make backend public without explicit disclosure decision. | Founder/repository owner (`@painjanevivek`) | 2026-09-24 or plan change | Direct push, failed/missing check, owner/access change, or acceptance expiry | Open; expiry blocks affected backend release claims | Approved through 2026-09-24 |
| R-004 | Staging is not isolated from production, so destructive lifecycle and write-capable Bruno tests could affect real identities or data. | Privacy / reliability / API | 3×5=15 High | Destructive Bruno tests prohibited; production smoke remains public/read-only; synthetic identities required; roadmap dependency makes staging an M08 prerequisite for M09. | 3×4=12 High | Create dedicated staging backend, Firebase resources, marker, secrets boundary, and synthetic-data reset/cleanup before M09. | Backend/infrastructure owner (`@painjanevivek`) | M08 gate, target 2026-11-30 | Any write-capable automated test points at non-isolated infrastructure | Open; blocks M09 and destructive automation | None; risk is avoided by prohibition |
| R-005 | One person currently holds founder, product, admin, security, release, and operations authority, creating continuity and independent-review gaps. | Governance / operations | 4×4=16 High | Protected PR flow for this repository; required CI; CODEOWNERS; explicit self-review disclosure; durable evidence; sensitive-change sign-off; [ownership policy](./code-ownership.md) | 3×4=12 High | Delegate competent primary/backup owners and establish on-call separation before M18. | Founder (`@painjanevivek`) | M18 gate, target 2027-05-03 | Unavailability, access loss, incident, critical self-authored change, or missed review | Open; blocks M18 if backup coverage is absent | None |
| R-006 | The prior 74-file mobile redesign is valuable reference work but merging it wholesale could reintroduce unreviewed architecture or overwrite clean milestone work. | Product / delivery | 3×3=9 Medium | Original dirty worktree preserved; SHA-256 recovery archive and manifest; roadmap/M00 use isolated clean worktrees; no reset/merge performed. | 1×3=3 Low | Inventory and selectively rebuild approved behaviour during M02/M10 with tests and design gates. | Mobile/product owner (`@painjanevivek`) | M02 inventory, target 2026-10-12 | Direct merge, archive verification failure, or overlapping edits | Open; monitored | None |

## Closed Risks

No program risk has yet met its verified closure condition. Risks are closed—not deleted—
after immutable evidence records final disposition, revision/environment, owner, and date.

## Operating Decision

M00 may close because these risks are identified, owned, bounded, and assigned to explicit
future gates; none invalidates the governance controls being adopted. M00 closure is not a
security, staging, independent-review, or production-release pass. R-001 through R-005 must
remain visible, and their affected milestones stop when the stated condition or expiry is met.
