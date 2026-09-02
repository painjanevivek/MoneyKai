# Recovery objectives and evidence policy

## Initial objectives

| Capability | RPO | RTO | Required evidence |
|---|---:|---:|---|
| Canonical user financial records | 24 hours | 4 hours | Encrypted backup plus staging restore and reconciliation |
| Authentication configuration and secrets | Configuration-as-code; no data-loss tolerance for committed config | 4 hours | Provider export/runbook plus rotation drill |
| Sensitive temporary objects | Not restored after acknowledged deletion or retention expiry | 4 hours to resume cleanup | Lifecycle configuration and zero-residue deletion test |
| Optional AI/Gmail processing | Reconstruct from canonical state or surface failure | 24 hours | Idempotent retry/disable proof |

These are launch objectives, not a claim of achieved recovery. The live PR‑2 staging gate must prove restore, rollback, deletion residue, scheduler delivery, and alert routing before the objectives are marked operational.

## Rules

- Restore never overwrites production without an account-holder go/no-go and a pre-restore reconciliation baseline.
- Every drill records source commit, backup identifier, timestamps, counts/totals/hashes, elapsed recovery time, and rollback result without raw financial payloads.
- Failed drills create a tracked incident and block release expansion.
- Restore drills run monthly; deletion-residue drills run quarterly after launch.
- Service regions and legal residency remain explicit account-holder/legal decisions and must be recorded before public launch.
