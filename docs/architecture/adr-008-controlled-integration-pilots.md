# ADR-008: Controlled Integration Pilots

- Status: Accepted for bounded internal rollout
- Date: 2026-08-24
- Scope: Web and backend only; mobile remains deferred

## Decision

MoneyKai will validate controlled integrations through two deliberately bounded lanes:

1. The internal data-handling pilot is one supported bank-statement PDF flow: explicit parsing consent, encrypted private-object storage, review before import, stable row identities, durable import checkpoints, bounded password attempts, and raw-payload deletion after import or ignore.
2. The only external-provider pilot is Gmail metadata sync using `gmail.readonly`, manual user-triggered runs, selected financial categories, bounded pages/results, and a separate consent before any attachment download.

Account Aggregator and broker pilots remain disabled. They add provider reconciliation and canonical portfolio risk before the lower-risk metadata pilot has operational evidence.

## Non-negotiable invariants

- Provider responses never delete or replace canonical MoneyKai transactions, holdings, or review decisions.
- Gmail tokens remain encrypted at rest and never enter public response models, logs, audit evidence, or support output.
- OAuth completion stores the scopes Google actually granted and rejects a connection without `gmail.readonly`.
- Disconnect is truthful: local token deletion happens only after provider revocation succeeds or Google confirms the token is already invalid. Transient failure becomes visible `revocationPending` state and is retried through the same action.
- Gmail retries upsert by stable Gmail message ID. Document imports upsert by stable document/row identity and resume through the operation journal.
- Partial Gmail results stay visible with scanned/stored counts. A retry does not remove those records.
- Terminal document import and ignore remove the encrypted raw object and retain only reviewed structured output and deletion evidence.
- Distributed coordination enforces Gmail scan and attachment-queue quotas in production; unavailable coordination fails closed.

## Progressive disclosure

The web first shows provider state, consent, and the smallest safe action. Category controls, sync-range choices, classified metadata, attachment queueing, document parsing, and final import are disclosed in that order. Partial sync and pending revocation are shown as repairable states rather than generic errors or false success.

## Rollout gates

Local implementation and deterministic fixtures are necessary but not sufficient for public enablement. Gmail remains feature-flagged off until Google restricted-scope verification, privacy/legal review, production OAuth configuration, distributed coordination, private object lifecycle configuration, accessibility verification, support rehearsal, and a bounded internal rollout pass.

`EG-7` passes only after the internal cohort completes connect, sync, partial-retry, attachment consent, review/import, raw cleanup, disconnect, and revocation-retry drills with no unexplained divergence or deletion residue.

## Consequences

- The pilot maximizes useful signal while minimizing provider write access and destructive reconciliation risk.
- Support can distinguish connected, partial sync, failed sync, revocation pending, and revoked states without viewing sensitive payloads.
- Future mobile work consumes a versioned `/v1` contract protected by compatibility automation; it is not part of this decision.
