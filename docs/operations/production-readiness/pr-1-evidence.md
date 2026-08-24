# PR-1 dependency and supply-chain closure evidence

**Captured:** 2026-08-24 10:13 IST  
**Gate:** `PR-EG1`  
**Result:** Pass with one documented, time-bounded, non-runtime exception

## Gate decision

| Requirement | Result | Evidence |
|---|---|---|
| Zero reachable unresolved critical/high alerts | Pass | Backend runtime and development `pip-audit` scans report zero known vulnerabilities. npm reports zero critical findings; all four high package rows are one Expo/Metro build-chain advisory covered by one non-runtime exception. |
| No undocumented dismissal or acceptance | Pass | No GitHub alerts were dismissed. The remaining exception is recorded in `pr-1-dependency-exceptions.md`, owned by the founder, and expires for review on 2026-09-24. |
| Production build and existing gates pass | Pass | Web export, typecheck, tests, SEO/CSP/OWASP checks, backend tests, and production browser smoke passed. Mandatory CI passed on every merged batch. |
| Dependency/license manifests are reproducible | Pass | Root npm lock drift and 1,436-package manifest checks pass. Backend universal hashed locks and the 84-package canonical Linux manifest pass. No license is unknown. |

## Inventory and disposition

- The open GitHub inventory fell from 54 alerts to 23 without dismissing any alert.
- Nineteen remaining GitHub alerts belong exclusively to the explicitly deferred mobile lockfile. Mobile source, manifests, and its nested lockfile were not changed.
- Four remaining GitHub alerts belong to the canonical root lock. `npm audit` reports 0 critical, 4 high, 23 moderate, and 1 low finding with 0 policy violations; the high package rows all map to the documented Expo/Metro build-chain exception.
- Backend runtime and development locks each report zero known vulnerabilities.
- The obsolete nested web lockfile was removed so GitHub, CI, and Vercel assess the same canonical workspace lock.
- Routine Dependabot version PRs are maintenance-windowed. Security updates stay enabled and are grouped into one reviewable branch. Superseded bot PRs were closed and their remote branches deleted.
- The first grouped security PR safely upgraded `shell-quote` to 1.10.0, retired its exception, and proved that stale exceptions fail CI closed.

## Runtime and deployment proof

- Web production deployment `dpl_5geUfgs9BuTYt2bwuY6xNgxjTVNm` reached Ready.
- Backend production deployment `dpl_A6cLUJaGcRcFaZobzDzGnShmY4gm` reached Ready and serves the private repository's reviewed code at `https://money-kai-backend.vercel.app`.
- Browser smoke against `https://moneykai.com` passed for `/`, `/features`, and `/api/health`, with meaningful rendered content and no console errors.
- Backend tests now total 263. The lock drift verifier has explicit CRLF/LF regression coverage and passes on Windows as well as Linux CI.

## Accepted controls and residual risk

The backend repository remains private. The founder accepted the temporary branch-protection limitation recorded in `pr-0-risk-acceptance.md`; this does not waive pull requests, mandatory `Backend checks`, audit evidence, or reviewed deployments. The exception must be reviewed by 2026-09-24 or when the GitHub plan changes.

Vercel preview checks for the final configuration-only closure PRs were account-rate-limited after successful production deployments had already established the runtime baseline. Mandatory GitHub checks passed, and the affected closure PRs changed no runtime application source. This auxiliary preview limitation is recorded rather than represented as a successful preview.

## Merged change sets

| Repository | Pull request | Merged commit |
|---|---|---|
| Web/root | [#19](https://github.com/painjanevivek/MoneyKai/pull/19) | `2d1b615bcb0e3b8136997beabfe27ed50f672b64` |
| Web/root | [#32](https://github.com/painjanevivek/MoneyKai/pull/32) | `e7bda66f492101d0ceee8256d3fcb9bbb9044748` |
| Web/root | [#40](https://github.com/painjanevivek/MoneyKai/pull/40) | `b094975162cdfcba963ebc2dca6bc01b28ba5da4` |
| Backend | [#2](https://github.com/painjanevivek/MoneyKai-backend/pull/2) | `572c67767c4a7434602bf82ad9b3d9fe514736fc` |
| Backend | [#3](https://github.com/painjanevivek/MoneyKai-backend/pull/3) | `6cc3c2e140b24993766f40165bbf15b4fde82617` |
| Backend | [#4](https://github.com/painjanevivek/MoneyKai-backend/pull/4) | `87fc6d075bc27cdc9c1c9251994caadf79cdbae2` |
| Backend | [#9](https://github.com/painjanevivek/MoneyKai-backend/pull/9) | `1ba3d69a7085bec61d7d0f57a73cb2081f47dc90` |
| Backend | [#10](https://github.com/painjanevivek/MoneyKai-backend/pull/10) | `084d79ebb12d45fb8e2fdd781d61fff0f25a64a4` |

Machine-readable detail is available in `pr-1-evidence.json`.
