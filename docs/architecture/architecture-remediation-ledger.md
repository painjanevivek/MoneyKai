# Architecture remediation ledger

This ledger converts the 24 August 2026 architecture review into verifiable work. “Implemented” means the repository control exists; “closed” requires its stated runtime evidence.

| Finding | Current disposition | Closure evidence |
|---|---|---|
| F-01 canonical API ownership | In progress | FastAPI accepted as canonical; web OAuth implementation removed; direct single-origin client and CI boundary guard added. Billing adapter migration remains separate. |
| F-02 durable async work | Partial | Durable operation journals and recovery exist; generic worker lease/retry/dead-letter execution remains. |
| F-03 domain persistence ownership | Partial | User resource repository exists; domain-specific repository contracts remain. |
| F-04 observability | Partial | Correlation IDs and redacted events exist; durable metrics/traces, SLO checks, live alerts, and incident evidence remain. |
| F-05 AI control plane | Partial | Central gateway, allow lists, quotas, redaction helpers, audits, and kill switches exist; consent/policy-version and complete evaluation evidence remain. |
| F-06 supported clients | Implemented | Web active; Expo mobile deferred; experimental Flutter/Android surfaces unsupported. Contract enforcement remains linked to F-09. |
| F-07 cache ownership | Implemented | Redis declared non-authoritative with prohibited data classes and fail-closed coordination rules. Automated misuse checks remain part of final validation. |
| F-08 recovery objectives | Partial | Initial RPO/RTO and drill policy defined; live staging restore evidence remains blocked by PR‑2 account-holder setup. |
| F-09 API product boundary | Partial | Versioned OpenAPI and compatibility CI exist; generated client and standard cross-domain error envelope remain. |
| F-10 financial lineage | Partial | Transaction validation and reconciliation hashing exist; canonical source/adjustment/version lineage remains. |
