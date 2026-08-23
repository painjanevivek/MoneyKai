# ADR-004: Bounded bootstrap, incremental synchronization, and query budgets

- Status: Accepted for web/backend implementation; production migration evidence pending
- Date: 2026-08-24
- Scope: MoneyKai web and FastAPI backend
- Mobile impact: None; mobile parity remains deferred

## Context

The web startup path read every backend-owned collection directly from Firestore and then issued one additional expense query per group. Cost and time therefore grew with lifetime history and group count. The backend bootstrap repeated the same unbounded pattern, while support telemetry could not show query/read budgets for a reported request.

## Decision

1. FastAPI owns initial workspace reads. The initial payload is capped at 125 records across eight resource pages and renders immediately.
2. Every continuation uses a signed, user-bound, filter-bound Firestore document cursor. Offset pagination is forbidden.
3. Remaining pages hydrate in the background with a concurrency cap of three. A signed sync token and TTL-backed append-only change events close mutations that occur during or after hydration.
4. Group expenses have a flat per-user read index. Nested copies remain temporarily for compatibility, but startup never performs per-group reads.
5. Lifetime transaction totals and portfolio totals are read from explicit read models/snapshots. Full scans are isolated to backup, restore, migration, and snapshot commands.
6. Every request propagates a correlation ID and emits a redacted structured event containing latency, query count, estimated document reads, configured budgets, and breach flags. Long operations emit state-transition events under the same correlation ID.
7. A workspace-reset event invalidates incremental state after restore. Expired sync tokens also fail closed into a new bounded bootstrap.

## Rejected alternatives

- Offset pagination: later pages still scan skipped rows and cost grows with page depth.
- One live listener per collection: increases browser complexity and does not solve first-load cost or deterministic recovery.
- Keeping nested group-expense reads: preserves the N+1 query shape.
- Returning only recent data without continuations: fast but silently incomplete.
- In-memory server metrics: unreliable across Vercel instances; structured logs are the durable integration boundary for dashboards and alerts.

## Security and privacy

- Cursor and sync tokens are HMAC signed and bound to a hashed owner scope.
- Sync events contain authenticated backend-owned workspace records only; credentials, attachments, document bodies, and provider payloads are excluded.
- Sync events carry a Firestore timestamp TTL and account deletion removes the collection recursively.
- Observability fields are allow-listed and never contain financial payloads or identity attributes.

## Rollout and rollback

1. Deploy indexes and TTL configuration.
2. Dry-run then apply the Phase 3 read-model migration.
3. Deploy backend before web.
4. Verify count parity and performance budgets before marking `EG-3` complete.
5. Roll back the web first if needed. The backend may continue dual-writing the group-expense index and sync events without affecting the older client.

## Consequences

- Initial render cost is independent of lifetime history.
- Persisted web state usually refreshes from one bounded change-event query.
- Fresh workspaces progressively become complete; screens must tolerate data arriving after first paint.
- Backup and recovery remain full-history commands by design and retain separate operational budgets.
