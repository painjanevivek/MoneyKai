# MoneyKai Sentry Monitoring Runbook

MoneyKai's current web app is Expo Router, not Next.js. The Sentry setup therefore uses the React browser SDK for the Expo web surface and a small Vercel API relay for monitoring envelopes. If MoneyKai later migrates to Next.js, replace this with `@sentry/nextjs`, `instrumentation-client.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`, and `withSentryConfig()`.

## Runtime Coverage

- Browser errors and unhandled promise rejections
- React root error boundary captures with component stack context
- Performance tracing for page load, navigations, web vitals, long tasks, and billing API calls
- Privacy-first Session Replay with text/input masking and media blocking
- Structured warning/error console logs
- Release tags from `EXPO_PUBLIC_SENTRY_RELEASE`, `SENTRY_RELEASE`, or `VERCEL_GIT_COMMIT_SHA`
- Same-origin `/api/monitoring` tunnel to reduce ad-blocker loss

## Required Environment

```bash
EXPO_PUBLIC_SENTRY_DSN=
EXPO_PUBLIC_SENTRY_ENVIRONMENT=production
EXPO_PUBLIC_SENTRY_RELEASE=
EXPO_PUBLIC_SENTRY_TRACES_SAMPLE_RATE=0.1
EXPO_PUBLIC_SENTRY_REPLAY_SESSION_SAMPLE_RATE=0.05
EXPO_PUBLIC_SENTRY_REPLAY_ERROR_SAMPLE_RATE=1

SENTRY_DSN=
SENTRY_AUTH_TOKEN=
SENTRY_ORG=
SENTRY_PROJECT=
SENTRY_RELEASE=
SENTRY_DELETE_SOURCE_MAPS_AFTER_UPLOAD=true
```

Use a Sentry auth token with source-map upload permissions, and keep it in CI/Vercel secrets only.

## Source Maps

`npm run build` in `apps/MoneyKai-web` now runs the Expo web export and then `scripts/sentry-upload-sourcemaps.mjs`. The upload script:

1. Skips safely when Sentry CI env vars are absent.
2. Creates/finalizes the release.
3. Injects debug IDs.
4. Uploads source maps from `apps/MoneyKai-web/dist`.
5. Deletes public `.map` files after a successful upload unless `SENTRY_DELETE_SOURCE_MAPS_AFTER_UPLOAD=false`.

## Recommended Alerts

Create these in Sentry once the project exists:

- **Critical production issue:** first seen or regression, `level >= error`, environment `production`, notify issue owners immediately.
- **Billing flow failure:** tag `feature:billing` or transaction containing `/api/billing`, frequency `>= 3` in `15min`, notify product/engineering.
- **High user impact:** unique users `>= 5` in `1hr`, environment `production`, notify engineering.
- **Performance degradation:** transaction duration p95 above target for `/pricing`, `/api/billing/checkout`, and dashboard routes.
- **Replay-backed frontend error:** issue has replay and level `error`, route includes auth, pricing, or dashboard.

The Sentry workflow API requires an org auth token with `alerts:write`; create live alert workflows only from a secure operator shell or CI secret context.
