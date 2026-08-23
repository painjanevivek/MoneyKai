# ADR-005: Canonical Daily Review Loop

- Status: Accepted for implementation; production enablement remains gated by `EG-4`
- Date: 2026-08-24
- Scope: MoneyKai web and backend only

## Context

MoneyKai already produced reconciliation candidates, but exposed them through a bounded compatibility endpoint and a separate AI-oriented screen. The dashboard's “review” surface summarized already-canonical transactions instead of presenting unresolved evidence. This made review hard to repeat, left action semantics fragmented, and could send users to unrelated screens without preserving the reason for the action.

## Decision

Introduce one backend-owned `ReviewItem` contract and make `/review` the authenticated web entry route. The first adapter maps transaction-reconciliation candidates without discarding the original normalized event, provenance, reason signals, match, confidence, or revision. Future review sources must implement the same contract rather than adding a parallel queue.

The list API uses signed document cursors, stable `createdAt DESC` ordering, an enforced page size of 1–100, and server-side status/source filters. Firestore composites cover status, source, and combined filters. The compatibility reconciliation list is bounded as well.

Review actions use a single endpoint and support `approve`, `edit`, `ignore`, and `defer`. Every request requires:

- an authenticated user scope;
- an `Idempotency-Key` bound to the request fingerprint;
- an expected review revision;
- a correlation ID propagated into the mutation receipt.

Production coordination is Firestore-backed and TTL-cleaned. A replay returns the confirmed current review outcome. A reused key with a different payload or a stale revision returns a conflict. A pending claim returns a retryable conflict instead of starting a second command.

Approving a new reconciliation candidate writes a deterministic transaction document ID derived from the review ID. This makes the canonical transaction effect idempotent even if two different request keys race or a process stops between the transaction and review-status writes. The confirmed canonical transaction is returned to the web client and merged into the local store without issuing a second backend mutation.

## UX and progressive disclosure

The web workspace renders:

1. Bounded queue and filter context.
2. Selected item's evidence, provenance, confidence, and explanation.
3. Allowed actions only after selection.
4. Edit fields only after the user chooses Edit.

Loading, empty, error, partial-action, confirmed, replayed, and revision-conflict states remain explicit. Queue selection and filters are encoded in the URL so dashboard next actions preserve context. On narrow screens, the queue and detail stack; on desktop they use a two-column workspace.

## Deterministic next actions

Dashboard actions are resolved in this order:

1. Unresolved review items, ordered by the backend queue.
2. Missing or pressured budget state.
3. Missing canonical transaction history.
4. Monthly digest when no intervention is needed.

Every action includes a reason and a deep link. AI is not required and cannot approve review items.

## Rejected alternatives

- Reusing the AI Review screen: it couples a core control loop to an optional capability and does not provide a canonical queue contract.
- Client-side aggregation: it would reintroduce unbounded scans and competing business rules.
- Offset pagination: Firestore still reads skipped documents and produces unstable pages under concurrent inserts.
- Optimistic canonical approval: financial totals must change only after a confirmed backend command.

## Privacy and observability

List and action payloads contain user-owned financial evidence and are authenticated. Operational logs retain only route, correlation, query/read budgets, operation status, and safe identifiers; they do not log descriptions, amounts, source records, or evidence. UI errors surface correlation IDs when available through the shared API error path.

## Rollout and rollback

Deploy Firestore indexes and coordination TTL before enabling `/review` as the authenticated entry route. Deploy backend before web. The old reconciliation routes remain bounded for compatibility but are not the web authority.

Rollback the web entry route and navigation first if needed. The review API and deterministic transaction IDs are backward-compatible and may remain deployed. Do not remove indexes or TTL while sync/review clients are active.

## Evidence still required for `EG-4`

- keyboard and screen-reader verification at 320, 768, 1024, and 1440 widths;
- approve/edit/ignore/defer recovery checks against deployed Firestore coordination;
- concurrent different-key approval reconciliation;
- canonical dashboard/report total reconciliation after approval;
- staged metrics for queue completion, conflicts, retries, latency, and read-budget breaches.
