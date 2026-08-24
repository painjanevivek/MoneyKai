# PR-0 release-control baseline

**Captured:** 2026-08-24T08:53:58+05:30
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
| Web | `aeeb72b7d7f1f408e17e7dfb1e39b6d4ddd57579` | Yes | `dpl_32wk2g27hd4cWMkYkHVmWr3b8YQ9` | `moneykai.com` rendered HTML and `/api/health` return 200 |
| Backend | `dc1ca6b1c473f461ad6b2fdb611d912883f6069b` | Yes | `dpl_8xJmzF1t8SsNbSdEXcvoqrXBmaRQ` | `/`, `/health`, and `/openapi.json` return 200 |
| Backend rollback preview | `8a9cf9bcae6292bb2c1ae64f0906f34e1e8a76c1` | Yes | `dpl_58Cm6xRracUaGTVVYL3DsuVDomtA` | Protected preview `/` and `/health` passed through authenticated Vercel curl |

The backend Vercel project framework preset was corrected from `Other` to `FastAPI`.
The previous value (`null`) is not a healthy rollback because it creates an empty 404
artifact. The passing FastAPI preview above remains the tested application rollback.

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
- Web PR #17 passed `App checks`, `Static analysis and security baseline`,
  `API and mobile behaviour tests`, and Vercel preview checks before squash merge.
- Backend PR #1 passed `Backend checks` and Vercel preview checks before squash merge.

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

`PR-EG0` passes with the founder-owned, time-bounded backend exception. Web PR #17 and
backend PR #1 were merged at `2026-08-24T03:19:45Z` after all hosted checks passed, and
both resulting production artifacts passed canonical smoke tests.

## Rollback

- Web: promote `dpl_57FTXm9EtEGcDqKVXxnLczQEUweG` and reset feature variables to the
  recorded disabled profile.
- Backend: promote the tested FastAPI artifact `dpl_58Cm6xRracUaGTVVYL3DsuVDomtA`.
- Do not set the backend framework to `null`; that setting is recorded only as the
  diagnosed cause of the former empty 404 production artifact.
