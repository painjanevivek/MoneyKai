# ADR-006: Reviewed-Data Planning System

- Status: Accepted for implementation; production enablement remains gated by `EG-5`
- Date: 2026-08-24
- Scope: MoneyKai web and backend only; mobile synchronization remains deferred

## Context

Dashboard, Budgets, Savings, and Reports previously calculated overlapping facts with different period boundaries and filters. Reports summarized all history while calling the result monthly, Savings read all-time category totals, and analytics compared filtered current data with differently filtered prior data. Client-inferred recurring expenses also reduced safe-to-spend before the user had confirmed that the pattern was real.

These differences could make individually plausible screens disagree for the same reviewed transaction history. They also blurred estimates and canonical facts, which is unacceptable for a financial planning surface.

## Decision

Use one web finance core for period construction, validation, filtering, transaction summaries, category totals, and period progress. Calendar periods are date-only, half-open intervals: `startDate <= transaction_date < endDateExclusive`. Transaction amounts remain in MoneyKai's canonical INR storage unit; currency conversion is presentation-only. Invalid dates, non-finite amounts, and non-positive amounts never contribute to financial totals.

Dashboard, Budgets, Savings, and Reports consume this core. The selected reporting month is shared by the planning surfaces. Reports keep unimported statement drafts separate from finalized transaction facts, and exports use the same active filters as their visible records.

Savings projections are simulations over reviewed monthly expense categories and the active monthly allowance. They are labeled as budget-buffer projections, accept explicit period timing, and do not mutate caller-owned reduction inputs. Historical periods use their complete duration; future periods safely produce finite empty projections.

## Recurring obligations

Recurring patterns inferred from reviewed history are candidates, not facts. Candidate IDs are stable 64-bit hashes of normalized type, category, and description identity. A candidate contains its source transaction IDs, amount, next expected date, and an explicit `estimated` confidence label.

Only a backend-confirmed recurring obligation may affect:

- upcoming commitments;
- safe-to-spend;
- projected timeline events;
- forecast net flow.

A dismissed candidate remains recorded so it does not immediately reappear. Decisions require an authenticated user, a stable idempotency key, an expected revision, a signed and filter-scoped list cursor, and a correlation ID. Obligation identity fields are immutable after the first decision; a stale revision or altered candidate returns a conflict. Firestore sync events update an already-active planning store, while an unopened surface loads a bounded, paginated decision history on demand.

## Progressive disclosure and truthful states

The recurring-obligation panel initially shows at most three candidates and three confirmed facts. Users may expand the list. Loading, empty, list failure, decision failure, pending mutation, confirmed, and dismissed outcomes remain distinct. While a decision is pending, parallel decisions are disabled to keep operation feedback unambiguous.

Planning surfaces cross-link to the relevant budget, savings, and monthly report context. No planning action moves money, approves an imported transaction, or writes a canonical transaction.

## Data lifecycle and operations

Recurring obligations participate in user deletion, backup, restore, and incremental sync. Restore rewrites the public `userId` owner field to the authenticated restore owner. Filtered Firestore queries have a composite `status ASC, updatedAt DESC` index. Query budgets bound the list endpoint, and the web client stops after five pages rather than scanning unbounded history.

Operational logs must not record labels, amounts, categories, source transaction IDs, or request payloads. Existing correlation and mutation-receipt infrastructure remains the support boundary.

## Rejected alternatives

- Treating inferred recurrence as a commitment: a false positive would silently reduce safe-to-spend.
- Keeping screen-local totals: duplicated period and validation rules had already diverged.
- Mixing statement drafts into finalized reports: unreviewed rows are not canonical facts.
- Recalculating stored amounts into display currency: rounding and currency preference changes would alter business facts.
- Loading all planning history during bootstrap: recurring decisions are needed only by planning surfaces and can be progressively fetched within a fixed safety limit.

## Rollout and rollback

Deploy the backend and Firestore index before the web surface. Verify backup/restore, filter-scoped pagination, idempotent decision replay, stale-revision conflicts, and cross-session sync before production enablement.

The web can roll back the review panel and shared selectors without deleting confirmed obligation records. The backend contract and index may remain deployed because they are additive. Do not remove the sync resource or index while a deployed web client can emit or consume planning decisions.

## Evidence still required for `EG-5`

- golden fixtures across all planning consumers in every supported timezone and display currency;
- deployed Firestore pagination and composite-index verification;
- keyboard and screen-reader checks for confirmation, dismissal, retry, and expansion;
- two-session conflict and incremental-sync drills;
- production-like backup/restore and account-deletion verification;
- staged latency, read-budget, conflict, and decision-retry metrics.
