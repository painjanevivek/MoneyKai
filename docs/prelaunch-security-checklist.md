# MoneyKai pre-launch security checklist

Last updated: 2026-06-26

This checklist tracks the launch-readiness items from the security pass. It focuses on controls that live in this repository, plus the manual checks that must happen in deployment consoles or live accounts.

## Covered in this repository

- Privacy policy pages exist for web and mobile.
- Web and mobile privacy copy covers local/cloud storage, capture flows, Gmail and statements, Financial AI, deletion, audits, and support contact.
- Public and in-app feedback paths mention `support@moneykai.app` and include a dedicated bug report option.
- Data ownership is documented in `docs/backend-first-persistence.md`, including transitional client-owned Firestore collections and backend-owned financial/provider collections.
- Web deployment security headers are configured in `vercel.json`: HSTS, CSP, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy, Cross-Origin-Opener-Policy, Cross-Origin-Resource-Policy, Origin-Agent-Cluster, X-DNS-Prefetch-Control, and X-Permitted-Cross-Domain-Policies.
- CSP blocks object embedding, framing, non-self defaults, non-self form posts, and insecure subresources. Inline script/style allowances remain for Expo compatibility and should be revisited with a dedicated nonce/hash pass.
- API JSON responses use `Cache-Control: no-store` and baseline security headers through `api/_lib/http.js`.
- Billable or provider-touching API routes have a shared rate-limit guard for Stripe checkout, Stripe portal/status, and AI attachment analysis.
- Email/password sign-in, sign-up, password reset, and Google sign-in requests pass through rate-limited backend auth gateway routes before Firebase session creation.
- OpenRouter, Stripe, Gmail OAuth, Sentry auth, Firebase Admin, and broker/provider keys are server-side environment variables only.
- Expo client runtime config reads public `EXPO_PUBLIC_*` values only. Build-time Sentry upload secrets stay in EAS/CI or local shell environment.
- Web source maps are removed from production exports by default after optional Sentry upload. Only set `MONEYKAI_KEEP_PUBLIC_SOURCE_MAPS=true` for a temporary private diagnostic build.
- Request body limits are enforced for JSON and inline AI image payloads.
- Firebase ID tokens are verified server-side before billing routes access Stripe customer data.
- Disabled provider routes return bounded static payloads until the backend secrets and storage are configured.

## Manual verification required before launch

- Confirm real production `.env` files and deployment variables contain no placeholder values.
- Confirm Firebase Authentication providers, authorized domains, and OAuth redirect URIs in Firebase/Google Cloud consoles.
- Confirm backend auth gateway environment variables are present: `FIREBASE_WEB_API_KEY` or `FIREBASE_API_KEY`, plus `FIREBASE_SERVICE_ACCOUNT_JSON` or `FIREBASE_CLIENT_EMAIL` and `FIREBASE_PRIVATE_KEY`.
- Confirm backend Google OAuth environment variables are present: `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`, `GOOGLE_OAUTH_REDIRECT_URI`, and `GOOGLE_OAUTH_STATE_SECRET`.
- Run one production-like email sign-in, email sign-up, and password reset through the deployed backend, then confirm repeated bad-password attempts return a clear rate-limit response.
- Run one web Google sign-in and one mobile Google sign-in through the deployed backend, then confirm direct client Google Firebase sign-in is not present in the bundle.
- Confirm Firestore rules are deployed and deny direct client access to backend-owned collections.
- Confirm Stripe webhook endpoint uses the production `STRIPE_WEBHOOK_SECRET` and restricted API key permissions.
- Confirm Vercel production response headers with `curl -I https://<production-host>`.
- Run one signed-in backup and restore test with a real account.
- Run one checkout, billing portal, and webhook round trip in Stripe test mode before live mode.
- Run one AI attachment analysis with the production backend key and inspect logs for redacted, non-sensitive errors only.
- Run one mobile release build and confirm no restricted SMS permissions are present unless using an approved non-production research profile.
- Review Sentry events for accidental tokens, raw notification bodies, statement rows, or PDF passwords before enabling broad sampling.
- Confirm `npm run web:build` does not leave `.map` files or `sourceMappingURL` comments in `apps/MoneyKai-web/dist`.

## Repeatable commands

```bash
npm run launch:check
npm run security:check
npm run typecheck
npm run web:lint
npm run mobile:typecheck
```
