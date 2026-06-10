# Phase 5D Diagnostics

Last reviewed: 2026-06-11

## Current status

MoneyKai now has a local diagnostics layer for JavaScript and native-capture failures. It records recent diagnostic events in memory, redacts sensitive SMS/notification content fields, and allows a remote reporting sink to be attached later.

This is not a complete crash-reporting rollout yet. A team-visible service such as Sentry, Bugsnag, Firebase Crashlytics, or a backend diagnostics endpoint still needs to be configured before Phase 5D can be closed.

## What is captured

- Fatal React render errors from the root app error boundary.
- Session hydration failures.
- Native capture status failures.
- Android SMS research permission request/check failures in native research builds.
- Native SMS account discovery and inbox import failures in native research builds.
- Notification listener settings open failures.
- Native capture queue clear failures.
- Native capture source state changes.
- Native listener add/start/remove/stop failures.
- Native signal handler failures.

## Privacy rules

Diagnostics must not store raw SMS or notification content. `diagnosticsService` redacts these metadata keys recursively:

- `body`
- `content`
- `notificationBody`
- `notificationTitle`
- `rawBody`
- `rawBodyStored`
- `rawPayload`
- `sender`
- `smsBody`
- `smsText`
- `text`
- `title`

Native capture code should pass only operational metadata, such as source type, status, counts, booleans, package/source app names, and response lengths. Do not pass raw notification bodies, SMS bodies, full sender IDs, or raw native payload objects into diagnostics metadata.

## Local inspection during internal testing

In a development build, diagnostics are written to the JavaScript console with the `[MoneyKai diagnostics]` prefix.

For runtime inspection from app code or a temporary debug UI, use:

```ts
import { getRecentDiagnosticEvents } from '@/services/diagnosticsService';

const events = getRecentDiagnosticEvents();
```

The in-memory buffer keeps the latest 50 events for the current process only. It is useful for local testing and debugging, but it does not survive process death and does not send data to the team.

## Remote reporting handoff

Attach a remote reporter by calling `setDiagnosticEventSink` once during app startup:

```ts
import { setDiagnosticEventSink } from '@/services/diagnosticsService';

setDiagnosticEventSink(async (event) => {
  // Send `event` to the approved crash/error reporting backend.
});
```

Before enabling a provider in preview or production:

- Configure the provider/project DSN or endpoint outside source control.
- Confirm events are visible to the release/testing team.
- Confirm redaction still removes raw SMS and notification content.
- Confirm privacy policy and Data Safety copy mention the selected diagnostics provider if required.
- Confirm diagnostics upload failure never blocks app startup or native capture.

## Remaining blocker

Phase 5D remains open until a remote crash/error reporting provider is selected, configured, and verified on an internal Android build.
