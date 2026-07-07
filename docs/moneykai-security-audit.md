# MoneyKai Security Audit

Date: 2026-07-08

## Scope

Reviewed the MoneyKai web app, public pages, API routes, auth flows, billing/webhook helpers, AI attachment analysis, deployment headers, privacy/support surfaces, and production security gate.

## Current security posture

MoneyKai is already cautious in several important areas:

- Public and API responses use security headers, including CSP, HSTS, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, Cross-Origin-Resource-Policy, and clickjacking protections.
- OAuth uses PKCE, signed state, nonce checks, HTTPS-only production callbacks, trusted return-path handling, Google ID token validation, and exchange replay protection.
- Firebase bearer authentication is required before protected API work such as AI attachment analysis.
- Billing webhook handling uses Stripe signature verification with timestamp tolerance and timing-safe comparison.
- High-cost API routes use rate limiting and server-side body limits.
- Analytics and diagnostics are consent gated.

## Fixed risks

| Area | Attack name | Risk | Prevention added |
| --- | --- | --- | --- |
| API unsafe methods | Cross-Site Request Forgery (CSRF), cross-site form POST | A browser could attempt a state-changing request from an untrusted origin. | `requireMethod` now enforces a trusted `Origin`/`Referer` check for `POST`, `PUT`, `PATCH`, and `DELETE` when those browser headers are present. Trusted app origins are sourced from production env vars, Vercel URLs, and local dev origins. |
| AI inline image analysis | Unrestricted File Upload, MIME spoofing, content-type confusion, SVG script payloads | A client could label arbitrary or scriptable data as an image before it is sent to the AI provider. | Inline images are now restricted to JPEG, PNG, WebP, and GIF; base64 is validated; decoded size is capped; and image magic bytes must match the declared MIME type. |
| Security gate | Regression of CSRF/upload controls | Future changes could accidentally remove these controls. | `npm run security:check` now verifies the trusted-origin guard and server-side image validation primitives. |
| Privacy page | Privacy disclosure drift | Browser storage and optional telemetry behavior were not explicit enough for the security gate. | Privacy copy now documents cookies/local storage and optional diagnostics/performance telemetry behavior. |
| Contact page | Missing security feedback path | Users needed an obvious support and bug-report channel. | The contact page now exposes the support email, bug report mail action, GitHub issue path, and a warning not to include secrets or sensitive document contents. |

## Existing protections reviewed

- Cross-site scripting: React-rendered UI avoids raw HTML rendering in the reviewed surfaces, and Vercel/API CSP restricts executable sources.
- Clickjacking: global headers use `frame-ancestors 'none'` and `X-Frame-Options`; Firebase auth helper routes are scoped to same-origin framing where required.
- Open redirect: OAuth return paths are sanitized, app callback origins are allowlisted, and production web redirects require HTTPS.
- Authentication bypass: protected API routes verify Firebase bearer tokens before sensitive work.
- Resource exhaustion: JSON/raw body limits, upload size limits, cooldowns, and rate limits exist on high-cost routes.
- SSRF: no general user-controlled URL fetcher was identified in the reviewed API surface; provider redirect URLs are validated before use.
- Secret exposure: server secret patterns remain outside client environment checks in the security gate.

## Residual risk

`npm audit --omit=dev` still reports 26 transitive dependency advisories: 23 moderate and 3 high. The high chain is through `@react-native-community/cli` -> `@react-native-community/cli-hermes` -> `ip`, reported as SSRF improper categorization in `ip.isPublic`.

The available automatic remediation rewrites broad dependency metadata and points toward React Native/Expo CLI dependency changes. That should be handled through the supported Expo SDK 56 / React Native upgrade path or a validated override, not a forced lockfile rewrite during this security hardening pass.

## Verification

Passed:

- `node --check api/_lib/http.js`
- `node --check api/_lib/ai-runtime.js`
- `npm run security:check`
- `npm --prefix apps/MoneyKai-web run typecheck`
- `npm --prefix apps/MoneyKai-web run lint`
- `npm run api:test`

Outstanding:

- Track the remaining npm audit advisories as dependency maintenance work and validate any override against the Expo SDK 56 toolchain before applying it.
