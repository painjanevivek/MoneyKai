# ADR-003: Resumable destructive operations

- Status: Accepted
- Date: 2026-08-24
- Scope: MoneyKai web and backend; mobile remains deferred

## Context

Restore, account deletion, provider synchronization, and financial-document import cross multiple durable systems. A serverless request can terminate between any two writes. Treating the HTTP response as the operation boundary can therefore leave partial state, repeat an import, erase data after an incomplete provider response, or remove authentication before deletion verification finishes.

## Decision

The backend owns a durable operation record with optimistic versioning and the state sequence `requested → validating → ready → applying → verifying → completed`. Rejected inputs finish as `rejected`; interrupted work becomes `retryable` with an explicit recovery action. A completed operation always carries bounded verification evidence.

Every protected command accepts an idempotency key. Reusing a key with the same request returns the existing operation; request drift is rejected. Operation steps record only bounded metadata, counts, identifiers, and hashes—never raw statements, credentials, attachment contents, or backup payloads.

Provider observations are persisted as batches with completeness and reconciliation status. Empty and partial batches can merge observed stable identities but cannot delete canonical records. Destructive provider reconciliation remains disabled until a separate user-reviewed decision exists.

Account deletion creates a manifest, purges objects, coordination records, database documents, credentials, OAuth state, and executable operation residue, independently scans for residue, deletes authentication last, and returns a certificate. A cron-protected recovery worker can finish an account deletion after request termination, including the post-authentication-removal crash window.

Web clients expose pending, retryable, rejected, and preserved-for-review outcomes. They apply a restored snapshot locally or clear a deleted session only after verified backend completion.

## Consequences

- Protected mutations have additional Firestore writes for their journal and verification evidence.
- Operation records require retention and TTL policy; deletion certificates retain pseudonymous evidence without a recoverable owner identifier.
- Direct payload restores still require the client to retry with the original snapshot and idempotency key. The worker only auto-resumes operations with sufficient server-side recovery context.
- Mobile contracts are not changed in this phase.

## Rollback

Disable the affected capability first. Preserve operation records and provider batches for diagnosis. Revert command routing only after confirming that no operation remains in `applying`, `verifying`, or `retryable`; never re-enable destructive provider replacement.
