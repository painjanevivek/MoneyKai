# Architecture remediation ledger

This ledger converts the 24 August 2026 architecture review into verifiable work. “Implemented” means the repository control exists; “closed” requires its stated runtime evidence.

| Finding | Current disposition | Closure evidence |
|---|---|---|
| F-01 canonical API ownership | Closed in repository | FastAPI owns `/v1`; deployable duplicate OAuth handlers and client fallback routing are removed; the boundary CI guard passes. The narrow billing edge is explicitly non-product-API infrastructure and has no competing FastAPI implementation. |
| F-02 durable async work | Repository complete; live evidence pending | Private operation journals carry allow-listed resume data, optimistic worker claims, bounded retries, dead-letter state, and queue-age metrics. Document import, provider sync, and deletion resume idempotently. A deployed scheduler/worker delivery check remains in the staging evidence gate. |
| F-03 domain persistence ownership | Closed in repository | Resource routes resolve domain-bound repositories; linked accounts have a dedicated repository; financial writes establish validated lineage and immutable metadata-only audit events in the same Firestore transaction. |
| F-04 observability | Repository complete; live evidence pending | Correlation plus W3C trace context, redacted structured events, route-template golden signals, a protected Prometheus endpoint, SLOs, and alert runbooks exist. External collector retention, synthetic trace continuity, and alert delivery still require staging evidence. |
| F-05 AI control plane | Repository complete; live evidence pending | Public AI requests require explicit versioned session consent; the central gateway retains allow lists, quotas, redaction, provider isolation, evaluations, metadata-only policy audits, and kill switches. Provider/DPA approval and production-like model/kill-switch drills remain external release gates. |
| F-06 supported clients | Closed in repository | Web is active; Expo mobile remains deliberately deferred; experiments are unsupported. The active web client consumes the generated `@moneykai/api-client` contract. |
| F-07 cache ownership | Closed in repository | Redis is non-authoritative, namespaced, TTL-bounded, and covered by cache/key/fail-closed coordination tests. Canonical financial writes never depend on cache state. |
| F-08 recovery objectives | Repository complete; live evidence pending | Initial RPO/RTO, desired-state lifecycle/TTL controls, synthetic two-instance durability, and a guarded staging restore drill exist. Real IAM, scheduler, TTL deletion, alert routing, and restore evidence require account-holder credentials/approval. |
| F-09 API product boundary | Closed in repository | OpenAPI v1 is versioned and compatibility-gated; a pinned generator publishes immutable runtime-free TypeScript types; CI rejects drift; FastAPI errors and web error parsing preserve stable code/request ID plus the legacy detail field. |
| F-10 financial lineage | Closed in repository | Canonical source/import/adjustment/reconciliation models, revision-linked integrity hashes, transactional summary updates, and immutable create/adjust/void audit events have invariant tests. |

## Remaining release evidence

No unresolved repository implementation blocker remains from F-01 through F-10. The following are deliberately not marked as live-complete because a commit cannot prove them:

1. Apply and verify staging IAM, Firestore TTL/index policy, object lifecycle, and scheduler configuration through PR-EG2.
2. Capture a real restore drill, cross-instance recovery, synthetic distributed trace, retained metrics, and delivered alert evidence.
3. Obtain AI provider/privacy approval and record staging evaluation plus kill-switch results before enabling AI for real users.
