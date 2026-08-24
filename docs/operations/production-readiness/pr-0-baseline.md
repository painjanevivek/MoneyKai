# PR-0 release-control baseline

**Captured:** 2026-08-24T08:32:06+05:30  
**Status:** Passed with time-bounded backend branch-protection exception  
**Scope:** MoneyKai web and FastAPI backend; mobile/Android unchanged

## Immutable targets

| Target | Immutable identifier | Owner | Source/alias |
|---|---|---|---|
| GitHub web repository | `R_kgDOS277AA` | `painjanevivek` (`MDQ6VXNlcjM0MDM0MjM4`) | `painjanevivek/MoneyKai`, `main` |
| GitHub backend repository | `R_kgDOS3Rg8w` | `painjanevivek` (`MDQ6VXNlcjM0MDM0MjM4`) | `painjanevivek/MoneyKai-backend`, `main` |
| Vercel web project | `prj_i7uKxFmYfNMvNYRg5YUdzkxghn81` | `team_T6n0nmNCWSHbEuffGz4abBV2` | `moneykai-web`, `moneykai.com`, `www.moneykai.com` |
| Vercel backend project | `prj_vhX2oHe8ZCirdh0eHAjxQY5jpV85` | `team_T6n0nmNCWSHbEuffGz4abBV2` | `money-kai-backend`, `money-kai-backend.vercel.app` |
| Firebase production project | `moneykai` | Account-holder controlled | Auth domain `moneykai.firebaseapp.com`; bucket `moneykai.firebasestorage.app` |

Firebase CLI authentication is not available on this workstation. Firebase ownership,
TTL, bucket policy, and staging isolation therefore remain PR-2 evidence items.

## Source and deployment baseline

| Surface | Intended source | Remote match | Deployed artifact/source | Health |
|---|---|---|---|---|
| Web | `80f1a630a09f6ca8622ebeb01817e985506c7da9` | Yes | `dpl_57FTXm9EtEGcDqKVXxnLczQEUweG`, source `80f1a63` | `moneykai.com` and `/api/health` return 200 |
| Backend | `13036e98a1efed5459ec51a5f4cf861d99c050af` | Yes | Production `dpl_8bEUHfSqarysYjzEpg4NSZkS94pE`, source `1275d6d` | Production alias returns 404; artifact contains no function |
| Backend corrected preview | PR-0 working tree | Not committed | `dpl_58Cm6xRracUaGTVVYL3DsuVDomtA` | Protected preview `/` and `/health` pass through authenticated Vercel curl |

The backend Vercel project framework preset was corrected from `Other` to `FastAPI`.
The previous value (`null`) is the configuration rollback. The latest working preview is
the deployment rollback candidate until a reviewed commit is deployed.

## Capability and infrastructure state

- Gmail, PDF parsing, general AI, and financial AI default disabled in backend code.
- Tracked web examples now default Gmail, PDF parsing, financial AI, and linked-account
  demo flags to disabled.
- The production Vercel variable inventory contains Firebase credential variable names,
  but encrypted values are not copied into evidence.
- Web OAuth secret-name presence exists in the web project; backend OAuth secret-name
  presence is not established.
- Sentry deployment variables are absent; production source-map upload was skipped.
- The backend project uses the Hobby plan. A ten-minute recovery cron is rejected by the
  platform, so the fail-closed baseline uses a daily 03:10 UTC recovery schedule. PR-2
  must prove the final recovery objective or obtain paid scheduler approval.
- Production canonical data counts/hashes were not queried because no bounded,
  non-payload production reconciliation identity is available yet. PR-2/PR-4 must
  collect those values through the sanitized reconciliation surface.

## Dependency and build baseline

- GitHub reports 36 high and 18 medium open Dependabot alerts for the web repository.
- The production web build separately reported 11 high, 23 moderate, and 1 low npm
  findings from its deployed dependency graph; PR-1 will reconcile the inventories.
- Dependabot alerts are disabled for the private backend repository.
- Web `main` CI passed both `App checks` and the PR quality workflows at the baseline hash.
- Backend `main` CI passed `Backend checks` at the baseline hash.

## Release-control state

- Web `main` now requires a pull request, strict `App checks`, linear history,
  conversation resolution, and enforcement for administrators. Zero approval reviews
  are required because the repository currently has one accountable maintainer; CI is
  still mandatory and direct pushes are blocked.
- Backend `main` cannot enable branch protection or repository rulesets while the private
  repository is on the current GitHub plan. GitHub returns HTTP 403 with two supported
  remedies: upgrade the account plan or make the repository public.
- Making the backend public changes its disclosure boundary and is not an automatic
  action. The founder rejected public visibility and accepted the temporary exception
  recorded in `pr-0-risk-acceptance.md`.

## PR-EG0 evaluation

| Requirement | Result |
|---|---|
| Immutable repository/project identifiers and owners | Pass |
| No secret values in evidence | Pass |
| Tested rollback reference for web and backend | Pass: web production artifact and authenticated working backend preview recorded |
| Required CI checks enforceable before merge | Web pass; backend accepted exception with mandatory manual PR/check evidence |

`PR-EG0` passes with the founder-owned, time-bounded backend exception. Both repositories
must still merge PR-0 through pull requests after their required checks pass.

## Rollback

- Web: promote `dpl_57FTXm9EtEGcDqKVXxnLczQEUweG` and reset feature variables to the
  recorded disabled profile.
- Backend framework setting: change Vercel project framework from `fastapi` back to
  `null` only if the new runtime cannot build; this recreates the known 404 state and is
  therefore an emergency configuration rollback, not a healthy application rollback.
- Backend application: after PR-0 is reviewed, retain the last passing FastAPI preview
  deployment ID before production promotion.
