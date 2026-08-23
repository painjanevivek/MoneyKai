# Phase 0 — Immediate Containment Evidence

**Scope:** MoneyKai web and FastAPI backend
**Mobile:** Deferred and unchanged
**Evidence gate:** `EG-0`
**Implementation owner:** MoneyKai engineering

## Release decision

The known destructive and misleading paths are contained in code. Public AI attachment and financial-document processing now fail closed whenever the backend is running on Vercel or outside a local/test environment. These capabilities must remain disabled until Phase 1 provides durable encrypted object storage and distributed operational controls.

## Controls delivered

| Risk | Containment control | Evidence |
|---|---|---|
| `AF-001` destructive Zerodha replacement | Reject an empty holdings response before persistence; preserve existing transactions because the provider adapter does not yet reconcile transaction history; classify successful Zerodha sync as `partial`. | Backend provider-sync regression tests |
| `AF-002`, `AF-009` competing mutation authorities | Keep browser-local fallback for read-only portfolio queries only. All durable portfolio mutations now require a successful backend response. | Web service regression tests |
| `AF-003` instance-local sensitive files | Allow local attachment/document storage only in development and test. Vercel and production-like environments return an explicit `503` capability-unavailable response. | Storage-policy unit and router-boundary tests |
| `AF-005` unsafe restore expectation | Label restore as a protected replacement operation, advise a separate export, and warn against blind retries after interruption. | Settings confirmation copy and web typecheck |

## Production configuration record

- `VERCEL=1` is treated as serverless production regardless of the application environment label.
- AI attachment upload returns `AI_ATTACHMENT_STORAGE_UNAVAILABLE` with HTTP `503` when durable storage is unavailable.
- Financial-document parse, Gmail queueing, password submission, and AI summary paths return `FINANCIAL_DOCUMENT_STORAGE_UNAVAILABLE` with HTTP `503` when durable storage is unavailable.
- Zerodha sync never writes an empty holdings result and never replaces transaction history without provider transaction evidence.
- Portfolio mutation requests do not report browser-local persistence as cloud success.

## Data-repair assessment

The repository does not contain production audit data sufficient to identify accounts affected before containment. Before Zerodha write enablement is broadened, operations must compare per-account holding and transaction counts around historical sync timestamps, flag unexpected transitions to zero, and restore from the latest verified backup where evidence shows loss. Until that assessment and Phase 2 reconciliation are complete, provider sync remains a guarded partial workflow.

## Deployment gate

Before deploying this phase, the operator must capture a current production database backup/export and record its restore location and retention. Deployment is not considered verified until the pushed commit is live and the following smoke checks pass:

1. A production/serverless AI attachment attempt returns the explicit storage-unavailable response.
2. A production/serverless financial-document processing attempt returns the explicit storage-unavailable response.
3. A failed backend portfolio mutation surfaces as an error and creates no browser-local success.
4. Zerodha empty holdings leave prior holdings and transactions unchanged.
5. Protected restore displays the replacement and recovery warning before confirmation.

## Rollback

Revert the Phase 0 web and backend commits independently if a regression is found. Do not restore the former destructive provider replacement or silent local-mutation fallback. If rollback would reopen either path, freeze that capability at the deployment layer instead. Sensitive uploads must remain disabled until a durable storage adapter is available.

## Residual risks carried into Phase 1

- Durable encrypted object storage (`TASK-P0-03`) is not implemented; sensitive workflows are intentionally unavailable in production.
- Distributed quotas and idempotency (`TASK-P0-04`) are not implemented; affected paid/provider workflows remain gated.
- Backend-confirmed mutation receipts and client pending/conflict states are Phase 1 work; Phase 0 guarantees only that failed durable mutations cannot masquerade as local success.
- Historical provider data repair requires production-safe operational evidence not available in the source repositories.

## Automated evidence

The release commit must be accompanied by passing results for:

- Backend targeted containment suite: **41 passed**.
- Backend full unit/integration suite: **142 passed**; Python compile check passed.
- Web portfolio API regression suite: **3 passed**; complete unit suite: **71 passed**.
- Web TypeScript check passed; lint completed with zero errors and one pre-existing import-style warning in `EmptyState.tsx`.
- Expo production export, SEO audit, and OWASP deployment-input checks passed.
- `git diff --check` passed in both repositories.
