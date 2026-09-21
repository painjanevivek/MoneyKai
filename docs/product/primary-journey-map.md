# MoneyKai Android V1 Primary Journey Map

**Version:** 1.0.0  
**Status:** Approved journey contract; final adoption occurs when the M01 pull request merges  
**Owner:** Founder / product owner (`@painjanevivek`)  
**Measurement contract:** [KPI Framework](./kpi-framework.md)  
**Scope contract:** [Android V1 Launch Scope](./android-v1-scope.md)

## Journey Contract

A journey is owned end to end, not handed off at a screen boundary. The accountable owner verifies
the user outcome, state transitions, recovery, event evidence, and mapped gate. Required co-review
dimensions remain responsible for their risk even when one interim founder currently fills all roles.

For every journey:

- the primary action and current material state remain visible;
- advanced or infrequent detail may be progressively disclosed from the relevant context;
- amount, balance consequence, data authority, sync state, privacy choice, destructive consequence,
  recovery, and support are never hidden to simplify the interface;
- cancellation is not failure unless the app lost or changed data unexpectedly; and
- client analytics can describe the journey, but canonical records and backend operation evidence
  prove financial and lifecycle outcomes.

## Journey Summary

| ID | User outcome | Accountable owner | Required co-review | Primary KPI/gates |
|---|---|---|---|---|
| `J01` | Enter with a real identity and understand the product/data promise | Identity owner | Product/UI, security, privacy, support | `KPI-A7`, `KPI-JS`; `SEC-04`, `PRIV-01` |
| `J02` | Record/correct money and see an explainable monthly result | Product/mobile owner | Financial correctness, API, accessibility | `KPI-A7`, `KPI-JS`; `FIN-01`-`FIN-03`, `TRUST-01` |
| `J03` | Review a supported file before importing exactly once | Financial correctness owner | Mobile, API, security/privacy | `KPI-A7`, `KPI-JS`; `FIN-01`, `FIN-02`, `API-01` |
| `J04` | Set a budget and understand progress from source records | Product/mobile owner | Financial correctness, accessibility | `KPI-W4`, `KPI-JS`; `FIN-01`, `TRUST-01` |
| `J05` | Record and explain a shared expense and settlement position | Product/mobile owner | Financial correctness, authorization, privacy | `KPI-W4`, `KPI-JS`; `API-03`, `TRUST-01` |
| `J06` | Act offline and reach one correct synchronized state after reconnect | Backend/reliability owner | Mobile, financial correctness, operations | `KPI-JS`; `FIN-02`, `TRUST-02`, `REL-04` |
| `J07` | Reinstall, restore, and reconcile the same records/balances | Data/recovery owner | Identity, financial correctness, support | `KPI-JS`; `REL-04`, `GOLDEN-01` |
| `J08` | Export understandable, portable data under user control | Privacy/trust owner | Mobile, backend, support, security | `KPI-JS`; `TRUST-03`, `PRIV-01` |
| `J09` | Delete the account with explicit consequences and terminal state | Privacy/trust owner | Identity, backend, operations, support | `KPI-JS`; `TRUST-03`, `PRIV-01` |
| `J10` | Understand trust boundaries or obtain support from any recoverable state | Support owner | Product, privacy, security, operations | Trust/support measures; `OPS-01`, `PRIV-01` |

## J01 — Install, Authenticate, and Orient

**Entry:** A clean install or signed-out session.  
**Primary path:** Product/data promise → Google sign-in (email/password alternative) → provider
link/collision recovery if needed → session established → optional setup skipped or completed → Home.

**Always visible:** Current auth action, provider, loading/cancel/error state, privacy/terms link,
support/recovery, and whether demo access is non-production. Optional explanation of data storage,
permissions, and advanced setup is disclosed from “How MoneyKai works.”

**Success:** Verified Firebase identity is bound to the canonical account, no credential/token is
logged, Home loads the correct account, and the user can state the basic data promise. Disabled,
deleted, expired, cancelled, offline, and collision cases end in bounded recovery.

**Events:** `auth_attempt_started` → `auth_attempt_completed`; `onboarding_completed` after the
actual flow. Owner: identity emits server result, mobile emits user-flow result, analytics steward
validates schema. Raw UID/email is prohibited.

## J02 — Record, Review, and Correct a Transaction

**Entry:** Home/Add or Transactions.  
**Primary path:** Choose income/expense → enter amount/date/category/payment method/note → review
material balance effect → save → see terminal sync state and refreshed Home/Transactions result.

**Always visible:** Type, amount, date, save state, validation, and resulting balance/budget impact.
Optional note, payment method, category details, filters, and calculation breakdown are contextual.

**Success:** One valid record is committed exactly once; source list, Home, and budget reconcile.
Edit/delete applies one explainable change and supports cancel/retry without duplicate or loss.

**Events:** `transaction_attempt_completed` with operation and entry method; `home_summary_viewed`
after the recalculated result; `balance_explanation_opened` when requested. Canonical record/version
and reconciliation evidence, not analytics, prove the amount.

## J03 — Import Through Review

**Entry:** Transactions → Import.  
**Primary path:** Explain supported MoneyKai CSV → user selects file → validate locally/server-side as
approved → show valid/invalid/duplicate rows → edit/exclude → explicit commit → reconcile.

**Always visible:** File purpose, format link, row status/count, duplicates, commit consequence,
progress, cancel, and recovery. Raw rows and file path never enter analytics.

**Success:** Unsupported/invalid input changes no financial state. Approved rows commit once under
one idempotency key; repeated submit/reconnect creates no duplicate; balances/counts reconcile.

**Events:** `import_preview_completed` → `import_commit_completed` → `home_summary_viewed`. The import
owner records schema and fixture version in test evidence, not as user content in telemetry.

## J04 — Set Budget and Review the Month

**Entry:** Budget tab or Home budget attention card.  
**Primary path:** Choose reporting month → set/revise total and optional category limits → save →
review spent/remaining/over and contributing records.

**Always visible:** Month, currency, budget, spent, remaining/over, update consequence, and sync
state. Category detail, historical comparison, and calculation rules are disclosed on request.

**Success:** Budget setting persists/synchronizes once; only supported expense records contribute;
edit/delete/import changes progress deterministically with zero unexplained variance.

**Events:** `budget_attempt_completed`; `balance_explanation_opened` for budget sources;
`home_summary_viewed` for the result. Financial fixtures remain the truth source.

## J05 — Record and Explain a Shared Expense

**Entry:** More → Groups, or an existing group.  
**Primary path:** Create/select group → verify member identity/membership → enter payer, amount,
participants, split rule → review positions → save → view immutable change/settlement history.

**Always visible:** Group/member authority, payer, participants, amount, split method, rounding,
resulting positions, sync state, and “MoneyKai does not move money.” Member management, archive,
and calculation detail are disclosed contextually.

**Success:** Authorized members only; shares sum exactly to the expense under the certified rule;
cross-user/group access is denied without payload; retry cannot duplicate; settlement history is
explainable and does not claim payment execution or unrestricted real-time collaboration.

**Events:** `group_expense_attempt_completed`; `balance_explanation_opened`; relevant
`sync_transition_recorded`. Analytics receives no group/member identifiers or names.

## J06 — Work Offline, Reconnect, and Synchronize

**Entry:** Network unavailable or interrupted during a supported action.  
**Primary path:** Show offline/local state → accept supported local action with operation key → show
pending → reconnect → bounded retry/backoff → synchronized, failed-recoverable, or conflicted state.

**Always visible:** Offline/pending/synchronized/failed/conflicted/recovered status, last known
update, safe retry/cancel where applicable, and support. Diagnostics/correlation detail is secondary.

**Success:** User input is not silently lost; every operation reaches an observable state; repeated
delivery is idempotent; conflicts follow deterministic policy; final records/balances reconcile.

**Events:** `sync_transition_recorded` for each state transition, joined to canonical operation and
redacted server telemetry. Impossible/regressive transitions are data-quality failures.

## J07 — Reinstall, Restore, and Reconcile

**Entry:** App removed/reinstalled or new supported device with the same account.  
**Primary path:** Install from Play → authenticate → explain available recovery → restore/bootstrap →
show progress/result → compare record counts and financial totals → Home.

**Always visible:** Account identity, recovery source/time, scope, progress, network requirement,
failure recovery, and reconciliation result. Backup metadata detail is secondary but accessible.

**Success:** Supported records/settings return exactly once; no other account's data appears;
record counts and balances match; interrupted restore resumes or safely restarts. M13 proves ten
consecutive clean-account runs.

**Events:** `restore_attempt_completed` with `reconciliation_result`; sync transitions during
bootstrap; `home_summary_viewed` after successful reconciliation.

## J08 — Export Portable Data

**Entry:** More → Trust Center → Export.  
**Primary path:** Explain contents/format/destination risk → authenticate again when policy requires →
generate → user saves/shares through a user-controlled destination → validate manifest/summary.

**Always visible:** Included/excluded data, format, freshness, plaintext/encryption status,
destination responsibility, progress, expiry/cleanup, error recovery, and support.

**Success:** Export is complete, structurally valid, readable, attributable to the requesting user,
and contains no other account's data. Failed/cancelled generation leaves no unintended residue.

**Events:** `export_attempt_completed` with format/result only. Export content, filename, path, and
destination are prohibited analytics fields; backend audit evidence is access-controlled.

## J09 — Delete Account and Reach Terminal State

**Entry:** More → Trust Center → Delete account.  
**Primary path:** Explain scope/retention/export option/support → reauthenticate → explicit destructive
confirmation → resumable deletion operation → progress → terminal certificate/state → local logout.

**Always visible:** Permanent consequence, included/excluded data, retention exception if any,
operation state, inability to undo after the boundary, support, and export-before-delete option.
Confirmation is never hidden inside a generic disclosure.

**Success:** Authorized account only; retry/resume is safe; data is removed under the published
contract; credentials/session are revoked; terminal state is observable; user cannot silently fall
back into a partially deleted account. Every certification case passes.

**Events:** `deletion_transition_recorded` across requested/confirmed/running/completed/failed states.
No user ID or deleted content remains in product analytics; approved pseudonymous operational proof
must not permit account reconstruction.

## J10 — Understand Trust or Obtain Help

**Entry:** Login, any error/recovery state, or More → Trust Center/Support.  
**Primary path:** Select question/problem → see plain-language data, calculation, sync, permission,
security, export/deletion, or support guidance → contact support with a privacy-safe diagnostic key.

**Always visible:** Support access, response expectations, urgent security/data-loss route, privacy
contact, diagnostic contents/consent, and self-service recovery. Legal/technical depth is secondary.

**Success:** Help remains reachable without a healthy sync session; diagnostic preview excludes raw
financial/auth content; case is classified, acknowledged, resolved/escalated, and linked to a journey
without placing the support message in analytics.

**Events:** `support_request_started` → `support_request_resolved`; Trust Center research measures
comprehension. The support platform owns message content under its retention policy; analytics keeps
only the approved opaque case key, journey, severity, and resolution class.

## Event and Evidence Ownership

| Responsibility | Accountable role | Required output |
|---|---|---|
| Client attempt lifecycle and visible state | Mobile owner | Typed event call, UI/state test, no raw financial/user content |
| Canonical operation/result and authorization | Backend/API owner | Idempotent operation evidence, authorization negatives, correlation key |
| Financial result and reconciliation | Financial correctness owner | Invariants, fixtures, source-record trace, zero unexplained variance |
| Event schema, metric query, cohort/exclusions | Product analytics steward | Versioned schema/query, quality report, denominator and freshness |
| Collection purpose, consent, retention, SDK/declaration | Privacy owner | `PRIV-01` evidence before production collection |
| Alerts, runbook, support escalation | Operations/support owner | Named responder, thresholds, recovery and incident evidence |

## Failure and Escalation Rules

- Financial variance, duplicate write, cross-account/group exposure, secret exposure, or material
  privacy mismatch immediately stops the affected milestone and rollout.
- Auth, sync, restore, export, or deletion without a visible recovery/support path fails the journey.
- An analytics event without canonical proof cannot close a correctness, security, lifecycle, or recovery gate.
- An unavailable non-goal is omitted or honestly labelled; no dead production control is accepted.
- Owner changes follow the governance delegation process. Until delegation, evidence must disclose
  founder self-review and never imply independent review.

## Change Control

Adding/removing a primary journey, changing its success condition, or renaming a required event
requires coordinated version updates to this map, the V1 scope, KPI framework, affected test plan,
privacy inventory, and production gate evidence. Event-compatible copy/layout changes may increment
the patch version; semantic changes require minor/major version and product-owner approval.
