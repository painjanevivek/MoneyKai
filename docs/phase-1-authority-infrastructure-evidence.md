# Phase 1: Authority and Durable Infrastructure Evidence

Date: 2026-08-24

## Implemented evidence

- Web durable writes route through authenticated backend clients; a source scan finds no direct Firestore write primitives under `apps/MoneyKai-web/src`.
- Backend requests carry correlation IDs; web mutations also carry idempotency keys.
- A typed mutation receipt contract and retry-safe coordination service are covered by replay, conflict, concurrency, and failed-command retry tests.
- Financial documents and AI attachments use an object-store abstraction with local and private Firebase Storage adapters.
- Cross-instance fixtures prove upload, read, and delete through separate storage instances.
- Atomic Firestore transaction fixtures prove the configured global quota cannot be exceeded by concurrent store instances.
- `/v1/capabilities` resolves sensitive features on the server and fails closed when durable dependencies are unavailable.
- Portfolio UI uses progressive loading, restricted, unavailable, and degraded states instead of blank or false-success surfaces.
- `scripts/reconcile_authority_snapshots.py` compares entity counts, signed transaction totals, and canonical hashes without printing record payloads.
- `firestore.backend-authority.rules` is the reviewed target policy; `npm run web:authority-rules:check` verifies all migrated client-write surfaces are denied.

## Evidence gate EG-1 fixture

The deterministic migration fixture must report:

```text
status=reconciled
unexplainedDifferenceCount=0
transactionTotals.matches=true
```

Any non-zero difference exits the reconciler with code 2 and requires review. No automatic merge or destructive winner selection exists.

## Production actions still required

These are external release gates, not application-code substitutes:

1. Link the backend repository to its production Vercel project and correct the configured public backend alias. At capture time, `https://money-kai-backend.vercel.app/health` returns Vercel 404.
2. Capture a production backup and production-safe pre/post count-total-hash reports using approved credentials.
3. Configure `FIREBASE_STORAGE_BUCKET`, Firebase Admin credentials, object lifecycle retention, and Firestore TTL for coordination records in production/staging.
4. Run the cross-instance and reconciliation suites against staging infrastructure.
5. Keep current `firestore.rules` deployed while mobile is deferred. Deploy `firestore.backend-authority.rules` only after an explicit mobile compatibility decision; deploying it now would intentionally block existing mobile writes.

## Rollback proof

The web can retain legacy Firestore reads for a bounded compatibility window while all new web writes stay backend-only. Rollback may restore a previous read/UI bundle, disable a capability, or pause ingestion. It must not restore client writes, local-success fallbacks, destructive provider replacement, or public object access.
