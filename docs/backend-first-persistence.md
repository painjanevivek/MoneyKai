# Backend-first persistence

MoneyKai should treat the backend API as the canonical persistence boundary for production data.
Firebase client SDK usage remains acceptable for authentication and for transitional reads/writes
while legacy direct-client data paths are migrated.

## Decision

- The backend owns validation, authorization, audit logging, provider secrets, Gmail/OAuth data,
  parsed financial documents, AI attachments, portfolio provider state, and reconciliation state.
- Expo apps call typed backend API clients for all durable mutations.
- Local stores keep UI state, optimistic state, and offline drafts. They should not contain
  Firestore path knowledge or provider-specific persistence logic.
- Firestore is an implementation detail behind backend repositories for backend-owned data.

## Transitional client-owned collections

The current Expo apps still write these user-owned collections directly:

- `transactions`
- `notes`
- `savings`
- `badges`
- `notifications`
- `groups` and `groups/{groupId}/expenses`
- `settings/app`
- `budgets/current`
- `backups`

Firestore rules allow only these collections during the migration. New features should not add
new client-owned Firestore collections.

## Backend-owned collections

Clients must not read or write these collections directly:

- `provider_connections`
- `provider_secrets`
- `portfolio_holdings`
- `portfolio_transactions`
- `wealth_snapshots`
- `reconciliation_reviews`
- `audit_events`
- `diagnostics`
- `gmail_connections`
- `financial_emails`
- `financial_documents`
- `pdf_password_profiles`
- `parsed_statement_reviews`
- root OAuth state collections such as `gmail_oauth_states` and `provider_oauth_states`

Firebase Admin SDK bypasses Firestore security rules, so backend services can continue to use
these collections through repositories.

## Migration checklist for each domain

1. Add typed backend request and response schemas.
2. Add a domain API client module in the Expo app.
3. Move validation/business rules out of Zustand stores and into domain services.
4. Route writes through the backend API and queue offline operations as API commands.
5. Keep local optimistic updates, but reconcile from backend snapshots.
6. Remove direct Firestore helpers for that domain.
7. Tighten Firestore rules by removing the migrated collection from the client allowlist.
