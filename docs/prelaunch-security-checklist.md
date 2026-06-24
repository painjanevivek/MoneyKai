# MoneyKai pre-launch security checklist

Last updated: 2026-06-24

This checklist tracks the launch-readiness items from the security pass. It focuses on controls that live in this repository, plus the manual checks that must happen in deployment consoles or live accounts.

## Covered in this repository

- Privacy policy pages exist for web and mobile.
- Web and mobile privacy copy covers local/cloud storage, capture flows, Gmail and statements, Financial AI, deletion, audits, and support contact.
- Data ownership is documented in `docs/backend-first-persistence.md`, including transitional client-owned Firestore collections and backend-owned financial/provider collections.
- Web deployment security headers are configured in `vercel.json`: HSTS, CSP, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy, Cross-Origin-Opener-Policy, Cross-Origin-Resource-Policy, Origin-Agent-Cluster, X-DNS-Prefetch-Control, and X-Permitted-Cross-Domain-Policies.
- CSP blocks object embedding, framing, non-self defaults, non-self form posts, and insecure subresources. Inline script/style allowances remain for Expo compatibility and should be revisited with a dedicated nonce/hash pass.
- API JSON responses use `Cache-Control: no-store` and baseline security headers through `api/_lib/http.js`.
- Billable or provider-touching API routes have a shared rate-limit guard for Stripe checkout, Stripe portal/status, and AI attachment analysis.
- OpenRouter, Stripe, Gmail OAuth, Sentry auth, Firebase Admin, and broker/provider keys are server-side environment variables only.
- Expo client runtime config reads public `EXPO_PUBLIC_*` values only. Build-time Sentry upload secrets stay in EAS/CI or local shell environment.
- Request body limits are enforced for JSON and inline AI image payloads.
- Firebase ID tokens are verified server-side before billing routes access Stripe customer data.
- Disabled provider routes return bounded static payloads until the backend secrets and storage are configured.

## Manual verification required before launch

- Confirm real production `.env` files and deployment variables contain no placeholder values.
- Confirm Firebase Authentication providers, authorized domains, and OAuth redirect URIs in Firebase/Google Cloud consoles.
- Confirm Firestore rules are deployed and deny direct client access to backend-owned collections.
- Confirm Stripe webhook endpoint uses the production `STRIPE_WEBHOOK_SECRET` and restricted API key permissions.
- Confirm Vercel production response headers with `curl -I https://<production-host>`.
- Run one signed-in backup and restore test with a real account.
- Run one checkout, billing portal, and webhook round trip in Stripe test mode before live mode.
- Run one AI attachment analysis with the production backend key and inspect logs for redacted, non-sensitive errors only.
- Run one mobile release build and confirm no restricted SMS permissions are present unless using an approved non-production research profile.
- Review Sentry events for accidental tokens, raw notification bodies, statement rows, or PDF passwords before enabling broad sampling.

## Repeatable commands

```bash
npm run launch:check
npm run security:check
npm run typecheck
npm run web:lint
npm run mobile:typecheck
```
