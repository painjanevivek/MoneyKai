# MoneyKai Sentry Monitoring Runbook

MoneyKai's current web app is Expo Router, not Next.js. The Sentry setup therefore uses the React browser SDK for the Expo web surface and a small Vercel API relay for monitoring envelopes. If MoneyKai later migrates to Next.js, replace this with `@sentry/nextjs`, `instrumentation-client.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`, and `withSentryConfig()`.

## Runtime Coverage

### Web

- Browser errors and unhandled promise rejections
- React root error boundary captures with component stack context
- Performance tracing for page load, navigations, web vitals, long tasks, and billing API calls
- Privacy-first Session Replay with text/input masking and media blocking
- Structured warning/error console logs
- Release tags from `EXPO_PUBLIC_SENTRY_RELEASE`, `SENTRY_RELEASE`, or `VERCEL_GIT_COMMIT_SHA`
- Same-origin `/api/monitoring` tunnel to reduce ad-blocker loss

### Mobile

- JavaScript errors, native crashes, release health, and session tracking through `@sentry/react-native`
- React Native performance tracing for app navigation, user interactions, backend API calls, and slow requests
- Hermes profiling and native frame tracking where supported by the production build
- Privacy-first mobile Session Replay with text, image, and vector masking enabled by default
- Structured warning/error logs and sanitized breadcrumbs for auth state, backend requests, and cached fallbacks
- User context limited to the internal user id and auth provider; email and financial payloads are not sent
- Release tags from `EXPO_PUBLIC_SENTRY_RELEASE`, `SENTRY_RELEASE`, or the mobile package version

## Required Environment

### Web

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

### Mobile

```bash
EXPO_PUBLIC_SENTRY_DSN=
EXPO_PUBLIC_SENTRY_ENABLED=true
EXPO_PUBLIC_SENTRY_ENVIRONMENT=production
EXPO_PUBLIC_SENTRY_RELEASE=moneykai-mobile@1.0.1
EXPO_PUBLIC_SENTRY_DIST=
EXPO_PUBLIC_SENTRY_ERROR_SAMPLE_RATE=1
EXPO_PUBLIC_SENTRY_TRACES_SAMPLE_RATE=0.15
EXPO_PUBLIC_SENTRY_PROFILES_SAMPLE_RATE=0.1
EXPO_PUBLIC_SENTRY_REPLAY_SESSION_SAMPLE_RATE=0.03
EXPO_PUBLIC_SENTRY_REPLAY_ERROR_SAMPLE_RATE=1

SENTRY_AUTH_TOKEN=
SENTRY_ORG=
SENTRY_PROJECT=
SENTRY_RELEASE=moneykai-mobile@1.0.1
SENTRY_DIST=
```

Use `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, and `SENTRY_PROJECT` only in CI/EAS or a secure release shell. Never commit the auth token or bake it into the mobile bundle.

## Source Maps

### Web

`npm run build` in `apps/MoneyKai-web` now runs the Expo web export and then `scripts/sentry-upload-sourcemaps.mjs`. The upload script:

1. Skips safely when Sentry CI env vars are absent.
2. Creates/finalizes the release.
3. Injects debug IDs.
4. Uploads source maps from `apps/MoneyKai-web/dist`.
5. Deletes public `.map` files after a successful upload unless `SENTRY_DELETE_SOURCE_MAPS_AFTER_UPLOAD=false`.

### Mobile

`apps/MoneyKai-mobile` uses the Sentry Metro wrapper so production bundles receive debug IDs. The Expo config plugin is added when `SENTRY_ORG` and `SENTRY_PROJECT` are present; local builds with no auth token keep auto-upload disabled.

For EAS builds, set `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_RELEASE`, and `SENTRY_DIST` in the secure build environment. The `eas-build-on-complete` hook runs `sentry-eas-build-on-complete` after native builds.

For React Native CLI release builds, regenerate or update native projects with Sentry's native build steps before shipping so Android source maps, ProGuard mappings, iOS source maps, and dSYMs upload with the same release/dist values used by the app.

## Recommended Alerts

Create these in Sentry once the project exists:

- **Critical production issue:** first seen or regression, `level >= error`, environment `production`, notify issue owners immediately.
- **Billing flow failure:** tag `feature:billing` or transaction containing `/api/billing`, frequency `>= 3` in `15min`, notify product/engineering.
- **High user impact:** unique users `>= 5` in `1hr`, environment `production`, notify engineering.
- **Performance degradation:** transaction duration p95 above target for `/pricing`, `/api/billing/checkout`, and dashboard routes.
- **Replay-backed frontend error:** issue has replay and level `error`, route includes auth, pricing, or dashboard.
- **Mobile crash regression:** issue category crash, environment `production`, app surface `mobile`, regression or crash-free sessions below 99.5%.
- **Mobile backend instability:** tag `feature:backend_api` and status `>=500`, frequency `>= 5` in `15min`, notify mobile and backend owners.
- **Mobile startup or navigation latency:** p95 above target for app start, tab navigation, onboarding, dashboard, pricing, and settings transactions.
- **Mobile replay-backed error:** issue has replay and app surface `mobile`, prioritize auth, onboarding, checkout, settings, and financial document flows.

The Sentry workflow API requires an org auth token with `alerts:write`; create live alert workflows only from a secure operator shell or CI secret context.
