# ADR-001: Canonical Data Authority

- Status: Accepted for web/backend; mobile migration deferred
- Date: 2026-08-24
- Owners: Product and platform

## Context

MoneyKai historically allowed the web client to write owner-scoped Firestore documents directly while FastAPI exposed overlapping mutation routes. A network or configuration failure could therefore produce competing histories, bypass backend validation, and make support unable to distinguish local acceptance from durable confirmation.

## Decision

FastAPI is the only durable mutation authority for the web product. Firestore remains the canonical operational datastore, but browser code reaches it directly only for temporary compatibility reads. Backend Admin SDK writes bypass client rules and must enforce authentication, user scoping, validation, idempotency, and audit/receipt contracts.

| Entity or concern | Canonical owner | Web write path | Compatibility read | Notes |
|---|---|---|---|---|
| User profile | FastAPI / Firestore | Backend settings/account commands | Firestore during migration | Client account deletion is denied |
| App and budget settings | FastAPI / Firestore | `/v1/settings/*` | Firestore during migration | Backend validates typed updates |
| Transactions, notes, badges, notifications | FastAPI / Firestore | `/v1/resources/*` during transition | Firestore during migration | Generic finance commands are deprecated by ADR-003 follow-up |
| Savings/challenges | FastAPI / Firestore | `/v1/challenges/*` | Firestore during migration | Stable IDs preserve upsert semantics |
| Groups and expenses | FastAPI / Firestore | `/v1/groups/*` | Firestore during migration | Owner/member checks remain server-side |
| Linked-account display projection | FastAPI / Firestore | `/v1/linked-accounts/{id}` | Firestore during migration | Provider secrets never enter this projection |
| Backups and restore | FastAPI / Firestore | `/v1/backups/*` | Legacy backup reads only | No client-side backup creation fallback |
| Portfolio, provider connections, documents, reconciliation | FastAPI / Firestore | Typed backend commands | Backend only | Client rules remain closed |
| Sensitive files | FastAPI / encrypted object store | Internal object-store adapter | None | No public object URL |
| Quotas and idempotency | FastAPI / Firestore coordination store | Internal coordination adapter | None | Not a financial ledger |
| UI preferences and drafts | Browser storage | Local, explicitly non-durable | Local | Cannot be shown as confirmed finance data |

## Migration and reconciliation

1. Freeze destructive provider and silent fallback paths.
2. Capture production-safe client and backend snapshots without logging payloads.
3. Run the count, signed-total, and canonical-hash reconciler.
4. Quarantine every unexplained difference; never choose a winner automatically.
5. Cut web mutations to backend routes entity by entity.
6. Keep read-only compatibility during a measured rollback window.
7. Deploy `firestore.backend-authority.rules` only after production reconciliation and an explicit mobile migration decision.
8. Remove legacy reads after rollback expiry and a second residue scan.

## Rollback

Rollback may restore the previous web release or retain direct Firestore reads. It must not reopen direct client writes or re-enable local-success fallbacks. Failed mutations remain visible and retryable through the backend contract.

## Consequences

- Support can trace a web intent to a backend response and correlation identifier.
- Backend outages become visible degradation instead of divergent durable state.
- The current mobile clients continue operating until their separately approved migration, so the staged rules file must not be deployed yet.
