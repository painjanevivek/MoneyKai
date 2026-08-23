# ADR-007: Guarded Guided Intelligence

- Status: Accepted for implementation; production enablement remains gated by `EG-6`
- Date: 2026-08-24
- Scope: MoneyKai web and backend only; mobile synchronization remains deferred

## Context

MoneyKai previously mixed locally generated advice-like cards with optional model output. Some rules implied causes that were not present in the underlying data, model cards could invent metrics, arbitrary client context entered the prompt and cache key, and explanations did not have a consistent provenance or caveat contract. Provider availability could also make an optional explanation feel like a dependency of the core dashboard.

For a financial product, a plausible sentence is not sufficient evidence. The product must separate reviewed facts, deterministic calculations, model-written explanations, uncertainty, and user actions.

## Decision

The product renders versioned deterministic insights first. `insight.v1` cards contain a stable rule ID, tone, title, body, caveat, typed provenance, allowlisted internal actions, and an explicit `generatedBy` value. Deterministic metrics may be displayed because MoneyKai calculates them from reviewed records and user-authored planning settings.

AI is an optional, explicit explanation step. It does not run automatically when a dashboard opens. The backend sends only allowlisted aggregates, excludes arbitrary client `context` from prompts and cache identity, validates model JSON with `extra="forbid"`, and maps evidence/action identifiers through server-owned allowlists. AI-authored cards cannot provide display metrics. Unsupported, unsourced, stale-contract, unsafe-link, or incomplete cards do not render.

Disabling `AI_FEATURE_ENABLED` leaves every chart, budget, report, savings simulation, and deterministic signal functional. Provider failure falls back to deterministic cards. Neither deterministic nor AI cards approve review items, alter budgets, create transactions, move money, or write canonical financial data.

## Provenance and review boundaries

Provenance identifies the supporting reviewed transactions, budget settings, submitted aggregate, or deterministic calendar rule, along with period, record count when relevant, evidence code, and rule version. Caveats state material limitations without hiding the useful observation.

Financial-document summaries are stored on the document workflow record with `reviewRequired=true`; they never import statement rows. Summarization preserves an already imported or ignored document status and otherwise routes the document to `review_required`. The summary, warnings, detected fields, model, and generation time remain visibly separate from the deterministic parsed statement rows.

Output audit records contain task, request ID, source, output count, contract version, and model only. They never retain prompt text, response bodies, financial amounts, category labels, document text, or attachment contents. Audit persistence failure is observable but does not turn a valid, already-generated read-only response into a user-facing mutation failure.

## Cost, storage, and operational controls

Production AI requires a distributed coordination backend and durable sensitive-object storage. Per-minute and per-day quotas are enforced before provider calls. Temporary encrypted attachments have a fixed TTL and authenticated scheduled cleanup. Prompt/response/conversation/payload logging stays disabled by default.

The redacted evaluation set is versioned with deterministic rule-recall, contract-compliance, and unsafe-action thresholds. Model evaluation must additionally pass in staging against the configured provider/model before enablement. A kill-switch drill must prove that disabling AI rejects provider calls while deterministic web insights remain available.

## Rejected alternatives

- Automatically invoking AI on every dashboard render: creates uncontrolled cost and makes provider health part of the core experience.
- Letting the model emit amounts or navigation URLs: structured JSON alone does not make unsupported values trustworthy.
- Forwarding free-form client context: it weakens prompt-injection boundaries and makes cache behavior user-instruction dependent.
- Treating AI document summaries as imported facts: summaries are explanations over review material, not canonical records.
- Hiding provenance behind a details page: the limitation and evidence source are part of the claim and must travel with it.

## Rollout and rollback

Ship the additive backend contract before relying on AI explanations in the web client. Keep `AI_FEATURE_ENABLED=false` until the staging evaluation, distributed quota, durable storage, cleanup, redaction, audit, accessibility, and kill-switch evidence package is approved.

Rollback sets `AI_FEATURE_ENABLED=false`. The web continues to render deterministic `insight.v1` cards and suppresses model actions. Persisted document summaries remain review-only historical metadata and may be deleted with their owning document or account lifecycle.

## Evidence status for `EG-6`

Local automated evidence covers versioned deterministic rules, fallback behavior, prompt-context exclusion, strict output schemas, provenance/caveats, action allowlists, metric-smuggling rejection, metadata-only audit, cross-instance quota coordination, redaction, and attachment cleanup. Provider/model quality, deployed multi-instance coordination, scheduled lifecycle execution, user-facing accessibility, and the production-like kill-switch drill remain staging gates.
