# Financial AI, Reconciliation, and Security Checklist

This checklist covers the Phase 10-12 production gates for Gmail, PDF, portfolio, reconciliation, and AI-assisted wealth monitoring.

## Feature Flags

- Keep `EXPO_PUBLIC_FINANCIAL_AI_ENABLED=false` until the backend `FINANCIAL_AI_ENABLED` flag, model access, monitoring, and rate limits are configured.
- Keep `EXPO_PUBLIC_GMAIL_SYNC_ENABLED`, `EXPO_PUBLIC_PDF_STATEMENT_PARSING_ENABLED`, and `EXPO_PUBLIC_WEALTH_TAB_ENABLED` disabled in public builds until OAuth verification, consent copy, and backend retention controls are validated.
- Confirm the mobile app never receives `OPENAI_API_KEY` or broker/API secrets.

## AI Safety

- Send only redacted, bounded metadata to financial AI endpoints.
- Treat AI output as review-required product assistance, not financial advice.
- Verify backend rate limiting, request character limits, and audit logging before enabling financial AI for real users.
- Maintain deterministic fallbacks for wealth insights when AI is disabled or unavailable.

## Reconciliation

- Reconcile parsed statement rows before creating or enriching transactions.
- Confirm duplicate, enrichment, conflict, and new-transaction statuses are visible in the mobile review queue.
- Approve only user-reviewed candidates into transaction history.
- Preserve source fingerprints and canonical keys for auditability.

## Retention And Deletion

- Keep raw document retention at `0` days unless an explicit product and legal basis exists.
- Confirm `RAW_DOCUMENT_RETENTION_DAYS`, `SECURITY_AUDIT_RETENTION_DAYS`, and deletion controls match the published privacy policy.
- Validate that deleting financial data clears Gmail metadata, documents, password profiles, parsed reviews, portfolio data, wealth snapshots, and reconciliation reviews.
- Confirm audit events remain available for security-relevant actions where retention is required.

## Release Verification

- Run backend unit tests before release.
- Run mobile typecheck and focused tests for wealth, capture, and financial import surfaces.
- Smoke test Settings financial imports, reconciliation approvals, security hardening status, delete confirmation, and Wealth AI insights on a build with staging backend credentials.
- Re-check privacy policy, terms, and in-app consent copy before enabling financial flags.
