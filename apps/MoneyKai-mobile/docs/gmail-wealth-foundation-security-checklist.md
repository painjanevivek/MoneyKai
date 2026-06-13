# Gmail and Wealth Foundation Security Checklist

Date: 2026-06-13

## Release Stance

Gmail sync and financial document parsing are internal/research-only until Google OAuth verification, restricted-scope review, privacy policy updates, and token/document retention controls are complete.

## Phase 1 Controls

- Gmail sync, PDF statement parsing, and Wealth are behind explicit build flags.
- Gmail metadata scan requires in-app affirmative consent before OAuth start or manual sync.
- Attachment download and PDF parsing are not part of the metadata sync path.
- Salary slips are treated as extra-sensitive and are not enabled by default.
- Backend stores provider metadata separately from secrets.
- Portfolio provider metadata rejects token, secret, and password-like fields.

## Phase 2 Controls

- Gmail OAuth is backend-managed.
- Mobile never receives Google refresh tokens or OAuth client secrets.
- Refresh tokens are encrypted before backend persistence.
- Disconnect revokes the refresh token best-effort and marks the connection revoked.
- Manual metadata sync uses filtered Gmail queries and bounded result limits.

## Phase 3 Controls

- Deterministic classification runs before any AI fallback is considered.
- Stored email data is limited to sender, subject, date, safe snippet, attachment metadata count, category, confidence, and reason.
- Raw full email bodies and attachment bytes are not persisted in Phases 1-3.
- Promotional or disabled-category messages are marked ignored.
- Review UI shows why each message was classified or ignored.

## Before Public Release

- Complete Google OAuth verification for restricted scopes.
- Add public privacy policy language covering Google Workspace Limited Use requirements.
- Add user data deletion paths for Gmail metadata and provider records.
- Add monitoring that avoids raw Gmail, PDF, token, and password data.
- Complete security review for encrypted token storage and key management.

## Phase 4-6 Controls

- Gmail attachment download requires separate attachment consent.
- Only classified financial messages can queue attachments.
- Unsupported attachments are ignored safely.
- Raw PDFs are encrypted in backend storage and paths are never returned to mobile.
- PDF parsing requires separate statement parsing consent.
- Password-protected PDFs are marked `needs_password`.
- Password attempts are bounded by backend configuration.
- The backend tries only the user-submitted password for a document.
- Saved provider passwords are optional and encrypted.
- Parsed rows are shown for review and are not imported automatically.
