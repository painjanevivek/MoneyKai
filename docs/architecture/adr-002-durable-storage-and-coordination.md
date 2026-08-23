# ADR-002: Durable Storage and Distributed Coordination

- Status: Accepted
- Date: 2026-08-24
- Owners: Platform and security

## Context

Vercel instances do not provide durable shared local files, process memory, or SQLite. AI attachments, financial documents, quotas, and idempotency reservations must survive instance changes and concurrent requests.

## Decision

- Use private Firebase Storage objects under a dedicated `moneykai-sensitive` prefix for encrypted attachment/document bytes.
- Encrypt content in the application before upload; set `no-store`; expose no public or signed browser URL.
- Use hashed user ownership segments where already supported, scoped namespaces, bounded metadata, and explicit delete/exists verification.
- Use Firestore transactions for atomic minute/day quota counters and idempotency claims.
- Attach TTL timestamps to coordination records and object metadata; TTL cleanup is a retention backstop, not proof of immediate deletion.
- Fail sensitive capabilities closed when production credentials, the bucket, or coordination store are unavailable.
- Retain local object storage and SQLite/in-memory coordination only for development and tests.

## Rejected alternatives

- Instance-local encrypted files: encryption does not provide durability or cross-instance access.
- Process-memory quotas: concurrent instances can exceed global limits.
- Public object URLs: unnecessary exposure for backend-only processing.
- Coordination records as the ledger: quotas and locks are ephemeral control data, not canonical finance data.

## Security and privacy

Firebase credentials and encryption keys remain backend-only. Object metadata cannot contain document content, provider secrets, passwords, or raw financial rows. Idempotency records store hashes and bounded references. Configuration endpoints return stable reason codes, never secret values.

## Operations and cost

Storage cost scales with retained encrypted bytes and lifecycle duration. Firestore cost scales with quota/idempotency transactions. Alerts should cover denied capabilities, storage failures, quota rejection rates, and cleanup residue. Production must configure bucket lifecycle/Firestore TTL policies outside the repository and retain deployment evidence.

## Rollback

Disable the affected capability through the server capability resolver. Preserve encrypted objects and coordination evidence until a verified cleanup is complete. Never fall back to instance-local persistence in production.
