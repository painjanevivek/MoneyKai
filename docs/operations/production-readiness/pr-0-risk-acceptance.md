# PR-0 backend branch-protection risk acceptance

**Accepted:** 2026-08-24  
**Decision owner:** MoneyKai founder/account holder  
**Repository:** Private `painjanevivek/MoneyKai-backend`  
**Review by:** 2026-09-24, or immediately after a GitHub plan change

## Accepted limitation

GitHub returns HTTP 403 when branch protection or repository rulesets are configured
for the private backend repository on the current account plan. The founder explicitly
decided that the backend must remain private and accepted a temporary exception so the
production-readiness program can continue without technically enforced backend branch
protection.

This acceptance does not waive CI, review evidence, security gates, or the requirement
to keep the repository private. It accepts only the residual risk that an administrator
could bypass the documented workflow until GitHub supports enforcement for this private
repository.

## Compensating controls

- All planned backend changes use `codex/*` branches and pull requests into `main`.
- `Backend checks` must complete successfully before any merge.
- The execution evidence records PR URLs, head hashes, check conclusions, and merge hashes.
- Direct backend pushes are prohibited during this program except a documented emergency
  rollback; any emergency push must be reconciled through a follow-up PR.
- Force pushes and history rewrites are prohibited.
- The public web repository retains enforceable administrator branch protection and
  mandatory checks.
- Sensitive capabilities remain disabled until their independent evidence gates pass.

## Removal condition

Remove this exception and enable private-repository branch protection/rulesets when the
account plan supports it. Rejection of public backend visibility is permanent unless the
founder makes a separate, explicit disclosure decision.
