# PR-2 durable infrastructure and lifecycle evidence

**Captured:** 2026-08-24 11:14 IST  
**Gate:** `PR-EG2`  
**Result:** Automated implementation merged; live staging exit gate blocked at the account-holder boundary

## Gate decision

| Requirement | Result | Evidence |
|---|---|---|
| Durable two-instance application behavior | Pass in deterministic fixtures | Cross-instance storage, distributed quota, idempotency replay/conflict, concurrent cleanup, interrupted-operation recovery, canonical backup/restore, and zero-residue deletion fixtures pass. |
| Production-safe infrastructure contract | Pass | Environment-specific Firebase, storage, coordination, TTL, lifecycle, scheduler, and monitoring contracts validate in CI. Runtime preflight fails closed when durable dependencies are absent or mixed across environments. |
| Private storage and least-privilege controls | Implemented; live proof pending | Desired state requires public-access prevention, uniform bucket-level access, no public principals, encryption, bounded retention, and environment-scoped prefixes. Applying and verifying it requires account-holder billing approval and staging credentials. |
| TTL, scheduler delivery, and monitoring routing | Implemented; live proof pending | TTL fields, lifecycle cleanup, success records, failure telemetry, and a daily scheduler contract are implemented. Live activation and alert delivery cannot be asserted without the staging cloud project and monitoring destination. |
| Staging secret rotation drill | Implemented; live proof pending | New writes use the primary key and reads accept up to three bounded previous keys. The live drill requires protected staging keys entered by the account holder; no secret may be pasted into repository evidence or chat. |
| Canonical backup/restore and account deletion rollback | Pass in deterministic fixtures; live proof pending | Fixtures restore canonical financial data and resume an interrupted deletion on a second instance with zero database, object, coordination, and operation residue. Live staging evidence is still required by `PR-EG2`. |

## Implemented controls

- Staging and production use explicit, non-interchangeable environment, deployment, Firebase, bucket, object-prefix, coordination-collection, and monitoring identities.
- Firebase Admin, sensitive object storage, and distributed coordination fail closed outside local development.
- Sensitive objects use a private durable backend contract; local storage remains development-only.
- Firestore-backed quota and idempotency controls are atomic across instances and include TTL-compatible `expiresAt` fields.
- AI attachments, encrypted temporary financial documents, coordination records, lifecycle run records, and operation journals have bounded cleanup paths.
- Cleanup work is batch-limited, idempotent, race-safe, observable, and scheduled through an authenticated cron boundary.
- Completed account deletion removes user ownership identifiers from operation journals and verifies zero operation residue.
- The staging gate refuses production targets, requires exact project confirmation plus explicit write approval, uses two Firebase client instances, records no secrets, and performs best-effort fixture cleanup.
- The backend repository remains private under the accepted temporary branch-protection exception. Pull requests, `Backend checks`, Vercel review deployment, and audit evidence were still required.

## Validation completed

- `291` backend tests passed locally.
- Backend dependency locks and the canonical Linux dependency/license manifest match their sources.
- Runtime and development Python locks report zero known vulnerabilities.
- Durable infrastructure desired-state validation passed for staging and production.
- OpenAPI v1 compatibility passed.
- Synthetic durability groups passed: storage, coordination, cleanup, interruption recovery, and canonical data.
- Backend PR [#11](https://github.com/painjanevivek/MoneyKai-backend/pull/11) passed `Backend checks`, Vercel, and Vercel Preview Comments before merge.
- Backend merge commit: `908cc95bc4f8f37636bc262683e8f962640f9a9d`.

## Account-holder gate

The live gate deliberately stopped before mutating a production-oriented local configuration. Its secret-safe preflight reported:

- `production_target_refused`
- `staging_bucket_required`
- `staging_coordination_required`
- `staging_environment_required`
- `staging_project_confirmation_missing`
- `staging_write_approval_missing`

To resume `PR-EG2`, the account holder must:

1. Make a staging Firebase/Google Cloud identity available through the protected deployment environment, not chat or Git.
2. Approve the billing-affecting staging configuration for Firestore TTL, private object storage, lifecycle retention, scheduler execution, and monitoring/alert delivery.
3. Enter or rotate the staging `CRON_SECRET` and token-encryption keys in the hosting provider's protected secret store.
4. Confirm the exact staging project by setting the two approval variables documented in the private backend runbook.

After those actions, rerun the staging gate from the reviewed backend `main` commit. PR-2 is not represented as complete until the generated artifact proves two-instance behavior, cloud-policy enforcement, successful cleanup recording, failure-alert delivery, canonical restore, and zero residue.

Machine-readable detail is available in `pr-2-evidence.json`.
