# Phase 5D Diagnostics

Last reviewed: 2026-06-11

## Current status

MoneyKai now has a diagnostics layer for JavaScript and native-capture failures. It records recent diagnostic events in memory, redacts sensitive SMS/notification content fields, and uploads warning/error/fatal events to the authenticated backend diagnostics endpoint when `EXPO_PUBLIC_BACKEND_BASE_URL` and a Firebase user session are available.

This is still not a native crash SDK rollout. The backend endpoint covers JavaScript/native-module diagnostic events emitted by the app. A service such as Sentry, Bugsnag, or Firebase Crashlytics is still recommended later for true native crash stack traces.

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
- Warning/error/fatal events are uploaded to `POST /v1/diagnostics/events` when backend auth is available.

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

The in-memory buffer keeps the latest 50 events for the current process only. It is useful for local testing and debugging, but it does not survive process death.

## Backend reporting

The mobile app installs `diagnosticsUploadService` during root layout startup. That service:

- uploads only `warning`, `error`, and `fatal` events;
- drops uploads when the backend is not configured;
- caps concurrent uploads at two;
- relies on the existing Firebase bearer token path in `backendApi`;
- never blocks app startup or native capture.

The backend endpoint is `POST /v1/diagnostics/events`. It requires Firebase auth, re-applies sensitive metadata redaction server-side, and stores events under the authenticated user.

## Remote crash SDK handoff

Before enabling a native crash SDK provider in preview or production:

- Configure the provider/project DSN or endpoint outside source control.
- Confirm events are visible to the release/testing team.
- Confirm redaction still removes raw SMS and notification content.
- Confirm privacy policy and Data Safety copy mention the selected diagnostics provider if required.
- Confirm diagnostics upload failure never blocks app startup or native capture.

## Remaining follow-up

Backend diagnostics are active for app-emitted events. Native crash SDK coverage remains a later hardening task if the team wants crash stack traces for process-level native crashes.
