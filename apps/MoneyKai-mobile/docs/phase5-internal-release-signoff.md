# Phase 5H Internal Release Signoff

Last reviewed: 2026-06-24

## Release decision

Target: **Play Console internal testing**, not closed testing or public production launch.

This signoff package is refreshed against the current repo baseline after the June 23-24 auth, backup, and security hardening work. It is ready to use for the next internal testing handoff once the exact handoff artifact is rebuilt, hashed, and smoke-checked from the current baseline.

## Repo baseline

| Field | Value |
| --- | --- |
| Current commit | `b9687f8` |
| Branch | `main` / `origin/main` |
| Mobile app package version | `1.0.1` |
| Android version name | `1.0.1` |
| Android version code | `2` |
| App display name | `MoneyKai` |
| Android package | `com.moneykai.mobile` |
| Target SDK | `36` |
| Tester group | Internal testers |
| Readiness source | `apps/MoneyKai-mobile/docs/phase5-release-readiness.md` |
| Security source | `docs/prelaunch-security-checklist.md` |

## June 23-24 changes included

| Commit | Release relevance |
| --- | --- |
| `06a623c` | Stabilized web auth behavior and added the mobile APK placeholder path for web handoff. |
| `19c6604` | Added launch-readiness checks for Firebase web auth domain/proxy/hydration behavior. |
| `24684d5` | Hardened launch security with OWASP-style web headers, API no-store responses, rate limits, privacy copy, and shared launch/security checks. |
| `1a30824` | Prevented public web source map exposure after Sentry upload unless explicitly kept for a private diagnostic build. |
| `9d7a119` | Added launch-safe app rating fallback and environment coverage. |
| `b9687f8` | Added latest-backup preview before restore on mobile and web. |

## Build split

- **MoneyKai**: Play Store-safe internal testing build. Must not contain restricted SMS permissions or the SMS receiver.
- **Original MoneyKai**: local/internal APK for full native SMS Research Mode. Must not be uploaded to Play.

## Artifact status

| Field | Current handoff value |
| --- | --- |
| Play-safe internal APK/AAB | Pending fresh rebuild from `b9687f8` or later |
| Required signing | EAS production AAB uses EAS-managed Android credentials; local Gradle release/original tasks require non-debug `MONEYKAI_UPLOAD_STORE_FILE`, `MONEYKAI_UPLOAD_STORE_PASSWORD`, `MONEYKAI_UPLOAD_KEY_ALIAS`, and `MONEYKAI_UPLOAD_KEY_PASSWORD` |
| Permission gate | Run `npm.cmd --prefix apps\MoneyKai-mobile run android:verify:release-permissions -- --aab <handoff-aab>` against the exact AAB before Play upload |
| Last documented Phase 5A APK | `artifacts/phase5a/moneykai-phase5-release-no-devclient-arm64.apk` |
| Last documented Phase 5A AAB | `artifacts/phase5a/moneykai-phase5-release-no-devclient-arm64.aab` |
| Last documented Original MoneyKai APK | `artifacts/phase5a/moneykai-phase5-sms-research-local-arm64.apk` |

The Phase 5A artifacts listed in the readiness doc are historical local validation artifacts. Do not use them for the next June 24 handoff. The next Play-internal artifact should be a fresh EAS production AAB from `b9687f8` or later, signed by EAS-managed Android credentials, downloaded from the EAS build, re-hashed, and re-verified.

## Signoff checklist

| Gate | Status |
| --- | --- |
| Phase 1 native notification capture baseline | Complete |
| Phase 2 parser/fixture hardening | Complete |
| Phase 3 consent/privacy controls | Complete |
| Phase 4 SMS decision | Complete: Play-safe manual SMS only; Original MoneyKai local native SMS only |
| Phase 5A build profiles/artifacts | Needs fresh signed handoff artifact after current hardening work |
| Phase 5B one-device validation | Partial, accepted for internal testing with documented device/OEM gaps |
| Phase 5C onboarding | Complete |
| Phase 5D diagnostics | Complete for app-emitted backend diagnostics; Sentry is present and still needs release-environment event visibility confirmation |
| Phase 5E disclosure package | Ready for internal testing materials; final Play Console Data Safety entry/review remains pending before closed or production release |
| Phase 5F mobile regression | Pending fresh run from `b9687f8` or later |
| Phase 5G web regression | Pending fresh run after auth/source-map/security changes |
| Launch/security hardening | Repository controls added; production env, console, and deployed-header checks still required |
| Backup/restore hardening | Latest-backup preview implemented; run one signed-in backup/restore smoke before tester handoff |

## Fresh handoff checks

Run or record these before sending the next build to internal testers:

- `npm run launch:check`
- `npm run security:check`
- `npm run mobile:typecheck`
- `npm run mobile:lint`
- `npm run mobile:test:capture`
- `npm --prefix apps/MoneyKai-mobile run android:verify:production-signing`
- `npm run web:typecheck`
- `npm run web:lint`
- `npm run web:build`
- Rebuild the Play-safe AAB from `b9687f8` or later with `npx eas build --platform android --profile production`.
- Verify the exact Play-safe AAB has no restricted SMS permissions.
- Record artifact paths, SHA-256 hashes, device smoke result, and Sentry/backend diagnostics visibility.

## Known issues for internal testers

- A current Play-ready upload artifact is pending rebuild and hash capture after the June 23-24 changes.
- Local release/original builds now fail without non-debug upload signing credentials; do not hand off unsigned, debug-signed, preview, or SMS Research APK artifacts as Play candidates.
- Multi-device/OEM validation is incomplete.
- Notification capture behavior with real bank/payment apps needs more live-source evidence.
- Original MoneyKai SMS validation needs real incoming carrier/bank SMS and remains local/internal only.
- Sentry is integrated for mobile and web, but release-environment DSN/project setup, source-map/native-symbol upload, and event visibility must be confirmed for the handoff build.
- Production Firebase Auth providers, authorized domains, OAuth redirects, Firestore rules, Stripe/Sentry secrets, and deployed web headers still require console/live-environment verification.

## Tester feedback fields

Collect the following for every tester report:

- Build artifact, version, version code, commit, and SHA-256.
- Device model, Android version, OEM skin, and battery mode.
- Whether notification access was granted, denied, revoked, or left disabled.
- Whether a capture draft appeared, whether it was accurate, and whether confirming it updated budget totals.
- Whether latest-backup preview matched the expected signed-in account before restore.
- Any confusion around SMS Research Mode, notification access, privacy copy, manual SMS paste, Sentry/error prompts, or backup/restore copy.
- Crash, freeze, failed navigation, failed auth, or failed backup/restore details with approximate timestamp.

## Handoff fill-ins

| Field | Value |
| --- | --- |
| Build ID | |
| Commit hash | `b9687f8` or newer |
| App version | `1.0.1` |
| Android package | `com.moneykai.mobile` |
| Version code | `2` |
| Build profile | |
| Artifact path | |
| Artifact SHA-256 | |
| Tester group | Internal testers |
| Devices validated | |
| Notification access tested | |
| Auto Capture draft review tested | |
| Backup preview/restore tested | |
| Privacy/disclosure copy reviewed | |
| Release permission verifier result | |
| Sentry/backend diagnostics visible | |

## Final signoff state

Internal release signoff is document-ready for the next handoff. Build handoff remains pending the fresh signed artifact rebuild, artifact hash capture, permission verifier pass, latest automated runs, and available-device smoke checks from `b9687f8` or later.
