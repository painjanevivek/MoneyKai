# MoneyKai non-secret environment matrix

Captured for `PR-EG0` on 2026-08-24. Values in this document are public identifiers,
safe defaults, or presence states. Secret values are intentionally excluded.

## Environment ownership

| Environment | Web | API | Firebase/data | Intended data |
|---|---|---|---|---|
| Local | Expo web dev server | FastAPI/Uvicorn | Developer-selected project; local credential path permitted | Synthetic/developer |
| Test/CI | GitHub-hosted runner | In-process FastAPI tests | Synthetic identifiers and fakes | Synthetic only |
| Staging | Vercel preview deployment | Protected Vercel preview | Dedicated staging project is required in PR-2 | Synthetic/redacted only |
| Production | Vercel `moneykai-web` | Vercel `money-kai-backend` | Firebase project `moneykai` | Canonical user data |

Staging is not yet isolated from production by an immutable Firebase project identifier.
PR-2 must close that gap before provider or destructive lifecycle evidence is collected.

## Web contract

| Variable group | Local | CI | Staging | Production | Classification |
|---|---|---|---|---|---|
| `EXPO_PUBLIC_FIREBASE_*` | Required | Synthetic | Required, staging-specific | Required, production-specific | Public identifiers/config |
| `EXPO_PUBLIC_BACKEND_BASE_URL` | `http://localhost:8000` | Synthetic HTTPS | Protected preview API | `https://money-kai-backend.vercel.app` | Public URL |
| `EXPO_PUBLIC_GMAIL_SYNC_ENABLED` | `false` default | `false` | `false` until PR-EG3/4/7 | `false` until approved | Sensitive flag |
| `EXPO_PUBLIC_PDF_STATEMENT_PARSING_ENABLED` | `false` default | `false` | Gate-controlled | Gate-controlled | Sensitive flag |
| `EXPO_PUBLIC_FINANCIAL_AI_ENABLED` | `false` default | `false` | `false` until PR-EG5 | `false` until approved | Sensitive flag |
| `EXPO_PUBLIC_LINKED_ACCOUNT_DEMO_ENABLED` | `false` default | `false` | Explicit cohort only | `false` | Sensitive flag |
| `EXPO_PUBLIC_WEALTH_TAB_ENABLED` | `true` default | `true` | Capability-service constrained | Capability-service constrained | Public presentation flag |
| `EXPO_PUBLIC_SENTRY_*` | Optional | Disabled | Required before PR-EG6 | Required before launch | Browser-safe telemetry config |

## Backend contract

| Variable group | Local | CI | Staging | Production | Rule |
|---|---|---|---|---|---|
| `ENVIRONMENT` | `development` | `production` contract fixture | `staging` | `production` | Exact environment identity |
| `FIREBASE_PROJECT_ID` / `FIREBASE_STORAGE_BUCKET` | Optional for isolated tests | Synthetic | Required and staging-specific | Required | Non-secret immutable IDs |
| `FIREBASE_SERVICE_ACCOUNT_PATH` | Allowed | Empty | Forbidden | Forbidden | Local-only credential source |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Optional | Shape-only fixture | Secret manager | Secret manager | Inline JSON; never logged |
| `SENSITIVE_OBJECT_STORAGE_BACKEND` | `auto`/local | `firebase` contract fixture | `firebase` | `firebase` | Fails closed outside durable storage |
| `DISTRIBUTED_COORDINATION_BACKEND` | `auto`/memory | `firestore` contract fixture | `firestore` | `firestore` | Distributed quotas/idempotency |
| `GMAIL_FEATURE_ENABLED` | `false` | `false` | `false` until PR-EG3/4 | `false` until approved | Sensitive flag |
| `PDF_STATEMENT_PARSING_ENABLED` | `false` | `false` | Gate-controlled | Gate-controlled | Sensitive flag |
| `AI_FEATURE_ENABLED` / `FINANCIAL_AI_ENABLED` | `false` | `false` | `false` until PR-EG5 | `false` until approved | Sensitive flags |
| `GOOGLE_OAUTH_*`, `AUTH_STATE_SECRET`, `TOKEN_ENCRYPTION_KEY` | Approved local secret store | Not required | Staging secret store | Production secret store | Backend-only secrets |
| `OPENROUTER_API_KEY`, `CRON_SECRET` | Approved local secret store | Not required | Staging secret store | Production secret store | Backend-only secrets |

## Configuration invariants

- Public clients receive only `EXPO_PUBLIC_*` values.
- Firebase Admin uses exactly one credential source.
- Production rejects filesystem credential paths, local storage, in-memory coordination,
  wildcard CORS, and local/non-HTTPS application URLs.
- Tracked examples and CI fixtures keep sensitive capabilities disabled.
- Deployment preflight reports variable names and issue codes only; it never echoes values.
