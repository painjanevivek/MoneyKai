# Roadmap Execution Quickstart

## Start a Milestone

From a clean checkout after the roadmap is merged:

```powershell
git fetch origin
git switch -c codex/m00-governance-foundation origin/main
git status --short
```

Use one short-lived branch per milestone. Parallel branches require recorded independent ownership and non-overlapping files.

## Complete One Task

1. Select the next unchecked task whose dependencies are complete.
2. Record expected files and focused validation before editing.
3. Implement only that outcome.
4. Run focused checks plus affected regressions.
5. Confirm no unrelated work or secrets entered the diff.
6. Mark the task complete and link evidence.
7. Commit and push before the next file-changing task.

Useful existing checks:

```powershell
npm run lint
npm run typecheck
npm run api-client:check
npm run backend:test
npm run security:check
npm run security:audit-dependencies
npm run backup-restore:gate
npm run mobile:verify:release-profile
git diff --check
git status --short
```

Choose the smallest relevant subset per task; run the full milestone suite at its gate.

## Commit a Completed Task

```text
feat(<scope>) : <completed user or engineering outcome>

- Describe the customer-visible or operational outcome.
- Describe the architecture, security, privacy, correctness, or reliability constraint preserved.
- List the focused validation and result.
```

For defects, use:

```text
fix(<scope>) : <corrected behavior>

- Describe the defect and affected journey.
- Describe the root cause and bounded correction.
- List regression checks and result.
```

Push the exact branch:

```powershell
git push -u origin HEAD
```

Do not make an empty commit for validation-only work. Attach its report to the milestone evidence/status update.

## Close a Milestone

Before closure, all tasks and prerequisites are complete, required gates pass, evidence identifies revision/build and environment, and no prohibited risk acceptance remains.

```text
feat(milestone-<number>) : complete <milestone name>

- Complete every milestone subtask and acceptance criterion.
- Record links to test, security, device, performance, and operational evidence.
- Confirm that no blocking findings or unapproved risks remain.
```

Push the completion commit and merge only after required CI and review pass.

## Bruno Commands Introduced in M09

These planned interfaces are not expected to work before M09 completes:

```powershell
npm run api:test:local
npm run api:test:staging
npm run api:test:smoke
npm run api:test:ci
```

- `local`: complete safe collection against local services.
- `staging`: required suite using approved secret injection.
- `smoke`: read-only health/contract checks suitable for production.
- `ci`: required staging suite plus machine-readable reports.

Never commit tokens, passwords, private keys, or production values in Bruno environments.

## Validate This Roadmap-Only Change

```powershell
git diff --check
git status --short
git diff --name-only origin/main...HEAD
rg -n "NEEDS CLARIFICATION|\[FEATURE\]|\[###-feature-name\]" specs/002-production-grade-roadmap
```

Pass when every changed path is under this specification directory, no placeholder remains, local links resolve, and no runtime/package/lockfile/secret changed.

## First Roadmap Commit

```text
feat(roadmap) : define MoneyKai production-to-MNC milestone program

- Add the dependency-ordered product, engineering, trust, release, growth, and operational milestones.
- Add Bruno API collections and CI assurance as a mandatory production-readiness milestone.
- Define progressive disclosure, modularity, robustness, scalability, efficiency, accessibility, and visual-quality standards.
- Establish measurable milestone gates, validation evidence, and staged Play Store rollout requirements.
- Add the atomic subtask and milestone completion commit-and-push protocol.
```
