# Phase 7: Controlled Integrations Evidence

Date: 2026-08-24

## Selected pilots

- Internal sensitive-data pilot: reviewed bank-statement PDF import.
- External provider pilot: Gmail metadata-only manual sync.
- Deferred: Account Aggregator, Zerodha/broker expansion, scheduled Gmail sync, Gmail watch, and all mobile synchronization.

## Local evidence implemented

- Consent timestamps require timezone-aware ISO-8601 values across Gmail metadata, attachment download, document parsing, password submission, and AI document summary flows.
- OAuth completion verifies Google actually granted `gmail.readonly`; requested scopes are no longer treated as granted evidence.
- Refresh tokens remain encrypted and are removed locally only after provider revocation succeeds or the token is already invalid.
- Failed revocation persists a truthful, retryable `revocationPending` state; the web shows a repair action.
- Gmail runs are bounded by selected time range, maximum results, page ceiling, and distributed per-user quotas.
- Gmail metadata uses stable message IDs. Partial runs preserve stored records and expose scanned/stored counts for support and retry.
- Financial-document imports use a durable operation journal and stable row IDs. Terminal import/ignore deletes the encrypted raw object and records `rawDeletedAt`.
- OpenAPI v1 compatibility automation rejects removed routes, removed success responses/media types/properties, type/reference changes, enum narrowing, and newly required fields or inputs.
- Web consumer-contract tests cover Gmail consent payloads, disconnect response truthfulness, endpoint paths, and idempotency headers.
- The web source contains no direct Firestore write primitives; staged authority rules deny all ten migrated write surfaces.

## Local verification commands

```text
Backend: python scripts/openapi_contract.py
Backend: python -m pytest tests
Backend: python -m compileall app tests
Web: npm run web:api-mirrors:check
Web: npm run web:authority-rules:check
Web: npm run web:typecheck
Web: npm --prefix apps/MoneyKai-web run test:unit
Web: npm run web:build
```

## External gates still required

- Google restricted-scope verification and privacy/legal approval.
- Staging OAuth credentials and exact deployed redirect verification.
- Deployed two-instance Firestore coordination and private-object lifecycle evidence.
- Internal-cohort connect/sync/partial-retry/revocation/import/cleanup drill.
- Accessibility and support rehearsal.
- Production-safe reconciliation and residue reports.

Until these pass, `EG-7` is locally ready but not production-approved. Capability flags remain the rollout boundary.
