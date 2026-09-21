# MoneyKai Android V1 KPI Framework

**Version:** 1.0.0  
**Status:** Approved measurement contract; targets marked provisional require M14/M15 baseline review  
**Owner:** Product owner; product analytics is measurement steward  
**Effective:** 2026-09-21  
**Decision cadence:** Weekly during dogfood/beta; daily during staged rollout; monthly after stability

## Measurement Decision

MoneyKai will judge V1 by whether users reach understandable value, return to perform a real money
job, and complete critical journeys correctly. Screen views, downloads, registrations, and raw
transaction counts are diagnostics—not success by themselves.

The framework has three primary KPIs, supporting trust/support measures, and non-negotiable
guardrails. A primary KPI cannot be declared healthy when a guardrail is breached.

No production baseline exists at M01. Product targets below are reasoned provisional targets, not
measured facts. M14 establishes internal baselines; M15 approves or tightens targets from cohort
evidence. Relaxation requires an ADR, product/data/risk approval, and cannot relax constitutional
correctness, privacy, security, or golden-journey requirements.

## Metric Grammar

- **User:** one verified Firebase account, represented analytically by an approved pseudonymous key.
- **New user:** first successful production authentication in the measurement window.
- **Eligible user:** supported app/version/locale with no confirmed test/bot/reviewer identity or
  documented upstream outage for the affected service.
- **Core value action:** committed manual/reviewed-import transaction, budget review/update, group
  expense review/update, balance explanation, completed synchronization, restore, export, or deletion.
- **Attempt:** one generated `attempt_id` from user initiation to success, recoverable failure, cancel,
  or timeout. Retries remain related but do not overwrite the original attempt.
- **Success:** documented terminal state reached with reconciled data and no unhandled error.
- **Time:** server-normalized UTC for analysis; the user's reporting timezone remains a separate
  financial-calculation field and is never inferred from telemetry.

## Primary KPIs

| KPI | Exact definition | Provisional target | Decision it informs | Owner |
|---|---|---|---|---|
| `KPI-A7` Seven-day value activation | Eligible new users who, within 7×24 hours of first auth, complete onboarding, commit at least two valid transactions through manual entry or reviewed import, see a refreshed Home summary, and reach synchronized/reconciled terminal state ÷ eligible new users | ≥45% in closed beta; establish confidence interval and segment by auth method/device tier | Whether onboarding and first-value scope are understandable and worth continuing | Product |
| `KPI-W4` Week-four value retention | `KPI-A7` users with at least one core value action during days 22-35 after activation ÷ activated users old enough to observe the full window | ≥30% in closed beta; no cohort reported before full maturity | Whether MoneyKai becomes a useful monthly habit instead of a one-session setup | Product/growth |
| `KPI-JS` Core journey success | Successful attempts ÷ eligible started attempts, reported separately for auth, manual record, import, budget, group expense, sync, restore, export, and deletion; aggregate is attempt-weighted but cannot hide a failing journey | ≥95% overall and ≥90% for every journey in beta; auth and sync each ≥99.5%; golden/export/deletion certification cases 100% | Which journey blocks release, requires redesign, or needs reliability work | Journey owner |

`KPI-A7` intentionally requires the Home result after data entry so implementation cannot inflate
activation by logging taps or account creation. `KPI-W4` uses a value action rather than any app
open. `KPI-JS` must always be shown by journey and result class before its aggregate.

## Diagnostic Drivers

| Driver | Definition | Use |
|---|---|---|
| Time to first value | p50/p75 from first successful auth to first reconciled Home summary after a committed record | Find onboarding or entry friction; initial p75 objective ≤5 minutes |
| Manual record completion | Successful manual transaction attempts ÷ started attempts, with p75 completion time | Diagnose core capture usability; objective ≥97% and p75 ≤45 seconds |
| Import review conversion | Imports committed after preview ÷ valid previews, with invalid/duplicate/cancel result classes | Diagnose schema clarity and review burden; never optimize by auto-committing |
| Budget adoption | Activated users who set/review a budget within 14 days ÷ activated users | Explain retention and monthly-review value; not a required activation step |
| Explanation use and resolution | Balance-explanation opens followed by no correction/support event in 24 hours, reported with user research | Identify confusing calculations; never interpret lack of opening as trust |
| Recovery success | Successful reinstall/restore attempts with exact reconciliation ÷ eligible attempts | Diagnose continuity; gate remains 100% in certification |

## Trust Measures

Trust is measured through comprehension and observed control, not a generic “do you trust us?” score.

| Measure | Method | Target / stop rule |
|---|---|---|
| Balance comprehension | Moderated/unmoderated task: identify source records and explain the displayed result | ≥85% correct without facilitator rescue; any unexplained variance stops certification |
| Sync-state comprehension | User distinguishes local, pending, synchronized, failed, conflicted, and recovered examples | ≥85% correct; dangerous misunderstanding requires copy/interaction change |
| Deletion consequence comprehension | Before confirmation, user can state what is deleted, what may remain, and support/recovery boundary | ≥90% correct; certification cases require 100% terminal-state accuracy |
| Data-control confidence | Post-task 5-point response to “I know what MoneyKai stored and what I can do with it” | ≥80% top-two-box with sample and wording reported |
| Unexpected-data report rate | Support/privacy reports of collection or sharing the user did not expect ÷ monthly active users | 0 confirmed material mismatches; any confirmed mismatch stops rollout and opens incident response |

Research results record script/version, sample, recruitment, device, task outcome, confidence, and
verbatim issues without storing financial content. Small samples are qualitative evidence and are
never presented as population estimates.

## Support Measures

| Measure | Definition | Initial objective |
|---|---|---|
| Contact resolution | Support cases resolved without reopen within 7 days ÷ resolved cases | ≥85% in beta |
| First-response service | Cases receiving a human response within one business day ÷ eligible cases | ≥90%; P0 security/data-loss acknowledgement ≤15 minutes once M18 on-call is active |
| Support satisfaction | Positive response on the case-resolution prompt ÷ valid responses | ≥80%, reported with response rate |
| Contact rate by journey | Unique support cases tagged to journey ÷ users completing/attempting that journey | Diagnostic only; a lower rate is not “better” if support became harder to reach |

Support volume, response, and satisfaction are reported together so deflection cannot masquerade as
quality. Security/privacy/data-loss cases follow incident procedures rather than ordinary SLA only.

## Non-Negotiable Guardrails

| Guardrail | Required threshold |
|---|---|
| Financial correctness | Zero unexplained balance variance; zero duplicate records under retry/reconnect; migrations preserve balances and counts |
| Identity and isolation | Auth success ≥99.5% excluding confirmed upstream outage; zero cross-account/group exposure |
| Synchronization | Sync success ≥99.5% excluding confirmed upstream outage; every non-success has visible recoverable state |
| Reliability | Crash-free sessions ≥99.8% before M16; user-perceived ANR ≤0.1% |
| Lifecycle | Export and deletion pass 100% of certification cases and reach the documented terminal state |
| Privacy | Zero committed secrets; zero undeclared SDK/data-purpose/permission mismatch; zero raw financial/user text in analytics |
| Accessibility | Certified screens pass WCAG 2.2 AA, screen reader, focus, 200% text, reduced motion, and 44×44 targets |
| Security | Zero unresolved critical/high findings at M12, M16, and M18 |
| Support access | Trust/lifecycle help remains reachable even when authentication or sync fails |

Any guardrail breach suspends optimization and triggers the corresponding roadmap stop condition.

## Event Contract

### Required events

| Event | Required terminal/result properties | Metric use |
|---|---|---|
| `auth_attempt_started` / `auth_attempt_completed` | `attempt_id`, `method`, `result`, `error_class`, `duration_bucket` | Auth success, first auth |
| `onboarding_completed` | `flow_version`, `optional_steps_skipped` | Activation |
| `transaction_attempt_completed` | `attempt_id`, `operation`, `entry_method`, `result`, `duration_bucket` | Activation, journey success |
| `import_preview_completed` | `attempt_id`, `result`, `valid_count_bucket`, `invalid_count_bucket`, `duplicate_count_bucket` | Import diagnostic |
| `import_commit_completed` | `attempt_id`, `result`, `committed_count_bucket` | Activation, journey success |
| `home_summary_viewed` | `summary_version`, `sync_state`, `has_records` | Activation result proof |
| `budget_attempt_completed` | `attempt_id`, `operation`, `result` | Budget adoption/success |
| `group_expense_attempt_completed` | `attempt_id`, `operation`, `split_method`, `result` | Group journey success |
| `balance_explanation_opened` | `surface`, `calculation_version` | Trust diagnostic |
| `sync_transition_recorded` | `operation_id`, `from_state`, `to_state`, `result`, `duration_bucket` | Sync reliability/state |
| `restore_attempt_completed` | `attempt_id`, `result`, `reconciliation_result` | Recovery success |
| `export_attempt_completed` | `attempt_id`, `format`, `result` | Lifecycle success |
| `deletion_transition_recorded` | `operation_id`, `from_state`, `to_state`, `result` | Lifecycle success |
| `support_request_started` / `support_request_resolved` | `case_key`, `journey`, `severity`, `resolution_class` | Support measures |

Event names and enum values are versioned contracts. A screen view alone never establishes task
success. Backend operation evidence and client events are joined by an opaque attempt/operation key;
financial truth is reconciled from canonical records, never reconstructed from analytics.

### Allowed common properties

`app_version`, `build_channel`, `platform`, `device_tier`, `flow_version`, opaque `attempt_id` or
`operation_id`, enumerated result/state/method/error class, boolean flags, count buckets, and
duration buckets.

### Prohibited analytics content

Raw amount, balance, merchant/category/note text, email, name, Firebase UID, transaction/group/member
ID, filename/path, imported row, export content, support message, token, IP stored as an event
property, or any free-form error/stack text is prohibited. User/account linkage uses the M06-approved
pseudonymous method and retention. Consent/legal basis and SDK declaration must pass `PRIV-01`
before production collection; optional analytics remains off until that decision.

## Data Quality and Reporting Contract

- Event schema validation passes ≥99.5%; invalid events are counted and rejected, not silently coerced.
- Client/server duplicates are removed by event ID; metric SQL/query version and revision are recorded.
- Reports identify environment, app versions, cohort dates, timezone, window maturity, exclusions,
  numerator, denominator, confidence interval where suitable, and data freshness.
- Test, demo, reviewer, employee/dogfood, and production cohorts are labelled and never blended.
- Missing events, consent-driven coverage, late delivery, reinstall identity, and upstream outage
  exclusions are disclosed beside the metric.
- Every target change records baseline, reason, expected decision impact, owner, approval, and date.

## Operating Review

Weekly M14/M15 review shows the three primary KPIs, every guardrail, journey-level result classes,
trust research, support outcomes, and open data-quality findings. Staged M16 review is daily and
compares the candidate cohort with the prior stable build. M17 may run experiments only after
`GROWTH-01` and may not trade away guardrails.
