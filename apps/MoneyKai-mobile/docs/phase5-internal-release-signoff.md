# Phase 5H Internal Release Signoff

Last reviewed: 2026-06-25

## Release decision

Target: **Play Console internal testing**, not closed testing or public production launch.

This signoff package is refreshed against the current repo baseline after the June 23-25 auth, backup, security, SEO, and build-readiness work. It is ready to use for the next internal testing handoff once the exact Play upload artifact is rebuilt, hashed, and smoke-checked from the current baseline.

## Repo baseline

| Field | Value |
| --- | --- |
| Current commit | `2238e81` (`2238e81446b319949c44dc745af43344301500a6`) |
| Branch | `main` / `origin/main` |
| User-supplied reference | `da75e57` is present in history and is behind current `main` |
| Mobile app package version | `1.0.1` |
| Android version name | `1.0.1` |
| Android version code | `2` |
| App display name | `MoneyKai` |
| Android package | `com.moneykai.mobile` |
| Target SDK | `36` |
| Expo v56 docs check | Read `https://docs.expo.dev/versions/v56.0.0/` before mobile build validation; SDK 56 expects React Native `0.85`, React `19.2.3`, Node `22.13.x`, Android compile SDK `36`, and target SDK `36` |
| Tester group | Internal testers |
| Readiness source | `apps/MoneyKai-mobile/docs/phase5-release-readiness.md` |
| Security source | `docs/prelaunch-security-checklist.md` |

## June 23-25 changes included

| Commit | Release relevance |
| --- | --- |
| `06a623c` | Stabilized web auth behavior and added the mobile APK placeholder path for web handoff. |
| `19c6604` | Added launch-readiness checks for Firebase web auth domain/proxy/hydration behavior. |
| `24684d5` | Hardened launch security with OWASP-style web headers, API no-store responses, rate limits, privacy copy, and shared launch/security checks. |
| `1a30824` | Prevented public web source map exposure after Sentry upload unless explicitly kept for a private diagnostic build. |
| `9d7a119` | Added launch-safe app rating fallback and environment coverage. |
| `b9687f8` | Added latest-backup preview before restore on mobile and web. |
| `da75e57` | Added Android production signing guardrails for release builds. |
| `588c929` | Added IndexNow submission support. |
| `2238e81` | Statically exported dynamic marketing routes for SEO/web handoff. |

## Build split

- **MoneyKai**: Play Store-safe internal testing build. Must not contain restricted SMS permissions or the SMS receiver.
- **Original MoneyKai**: local/internal APK for full native SMS Research Mode. Must not be uploaded to Play.

## Artifact status

| Field | Current handoff value |
| --- | --- |
| Play-safe internal APK/AAB | Pending fresh Play upload artifact from `2238e81`; no June 25 AAB is approved for upload |
| Required signing | EAS production AAB uses EAS-managed Android credentials; local Gradle release/original tasks require non-debug `MONEYKAI_UPLOAD_STORE_FILE`, `MONEYKAI_UPLOAD_STORE_PASSWORD`, `MONEYKAI_UPLOAD_KEY_ALIAS`, and `MONEYKAI_UPLOAD_KEY_PASSWORD`. Local play-upload credentials exist and pass the signing preflight when loaded, but the release bundle did not complete. |
| Permission gate | Run `npm.cmd --prefix apps\MoneyKai-mobile run android:verify:release-permissions -- --aab <handoff-aab>` against the exact AAB before Play upload |
| Last documented Phase 5A APK | `artifacts/phase5a/moneykai-phase5-release-no-devclient-arm64.apk` |
| Last documented Phase 5A AAB | `artifacts/phase5a/moneykai-phase5-release-no-devclient-arm64.aab` |
| Last documented Original MoneyKai APK | `artifacts/phase5a/moneykai-phase5-sms-research-local-arm64.apk` |

The Phase 5A artifacts listed in the readiness doc are historical local validation artifacts. Do not use them for the June 25 handoff. The next Play-internal artifact should be a fresh EAS production AAB from `2238e81` or later, signed by EAS-managed Android credentials or a verified non-debug local upload key, re-hashed, and re-verified.

June 25 artifact verification found that `artifacts/phase5a/moneykai-phase5-release-no-devclient-arm64.aab` is not a Play upload candidate: it is signed by `CN=Android Debug` with certificate SHA-256 `FA:C6:17:45:DC:09:03:78:6F:B9:ED:E6:2A:96:2B:39:9F:73:48:F0:BB:6F:89:9B:83:32:66:75:91:03:3B:9C`. Its file SHA-256 is `928EF76BF3829288C3BCFAAB4A19A94FB347709E8A8BAD0907DD64024D0387EC`, and the release permission verifier found no restricted SMS permissions. Treat it as historical evidence only.

EAS could not be used from this shell on June 25 because `npx.cmd eas-cli@latest whoami` returned `Not logged in`, and `npx.cmd eas-cli@latest build:list --platform android --limit 5 --json` failed with the Expo account/`EXPO_TOKEN` requirement.

The local upload-signed AAB flow was partially validated on June 25: the preflight passed with `credentials/play-upload/.env.play-upload.local`, but direct `:app:bundleRelease --stacktrace --console=plain --no-daemon --max-workers=2` hung in React Native's release bundle step and emitted no `android/app/build/outputs/bundle/release/app-release.aab`. Retry only after clearing the orphaned release `jest-worker` processes or restarting the machine.

## Signoff checklist

| Gate | Status |
| --- | --- |
| Phase 1 native notification capture baseline | Complete |
| Phase 2 parser/fixture hardening | Complete |
| Phase 3 consent/privacy controls | Complete |
| Phase 4 SMS decision | Complete: Play-safe manual SMS only; Original MoneyKai local native SMS only |
| Phase 5A build profiles/artifacts | Production profile/signing/permission gates validated; fresh signed Play upload artifact still blocked/pending |
| Phase 5B one-device validation | Partial, accepted for internal testing with documented device/OEM gaps |
| Phase 5C onboarding | Complete |
| Phase 5D diagnostics | Complete for app-emitted backend diagnostics; Sentry is present and still needs release-environment event visibility confirmation |
| Phase 5E disclosure package | Ready for internal testing materials; final Play Console Data Safety entry/review remains pending before closed or production release |
| Phase 5F mobile regression | Automated mobile checks passed on June 25 from `2238e81`; physical-device smoke remains pending for the final artifact |
| Phase 5G web regression | Web typecheck/lint/build passed on June 25 after auth/source-map/security/SEO changes |
| Launch/security hardening | Repository controls added; production env, console, and deployed-header checks still required |
| Backup/restore hardening | Latest-backup preview implemented; run one signed-in backup/restore smoke before tester handoff |

## Fresh handoff checks

Run or record these before sending the next build to internal testers:

- `npm run launch:check` - passed process exit on June 25; still printed optional gaps for `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`, `EXPO_PUBLIC_APP_STORE_URL`, and `EXPO_PUBLIC_PLAY_STORE_URL`.
- `npm run security:check` - passed on June 25.
- `npm run mobile:typecheck` - passed on June 25.
- `npm run mobile:lint` - passed on June 25.
- `npm run mobile:test:capture` - passed on June 25: 12 files, 131 tests.
- `npm --prefix apps/MoneyKai-mobile run android:verify:production-signing` - passed on June 25.
- `npx.cmd expo-modules-autolinking verify --platform android` - passed on June 25.
- `npm run web:typecheck` - passed on June 25.
- `npm run web:lint` - passed on June 25.
- `npm run web:build` - passed on June 25; Sentry source-map upload skipped because Sentry env vars were absent, then public source maps were deleted.
- Rebuild the Play-safe AAB from `2238e81` or later with authenticated EAS (`npx eas build --platform android --profile production`) or a successful local upload-signed bundle.
- Verify the exact Play-safe AAB has no restricted SMS permissions.
- Record artifact paths, SHA-256 hashes, device smoke result, and Sentry/backend diagnostics visibility.
- From the signed app, open **More > Settings and sync > Internal testing > Testing report bundle**, tap **Refresh**, then copy or share the sanitized report into the handoff notes.

## Known issues for internal testers

- A current Play-ready upload artifact is pending rebuild and hash capture after the June 23-25 changes.
- Local release/original builds now fail without non-debug upload signing credentials; when local play-upload credentials are loaded, the signing preflight passes but the June 25 release bundle attempt hung in React Native bundling and produced no AAB.
- Historical `phase5a` AAB is debug-signed and must not be uploaded to Play, even though it is SMS-permission clean.
- Multi-device/OEM validation is incomplete.
- Notification capture behavior with real bank/payment apps needs more live-source evidence.
- Original MoneyKai SMS validation needs real incoming carrier/bank SMS and remains local/internal only.
- Sentry is integrated for mobile and web, but release-environment DSN/project setup, source-map/native-symbol upload, and event visibility must be confirmed for the handoff build.
- Production Firebase Auth providers, authorized domains, OAuth redirects, Firestore rules, Stripe/Sentry secrets, and deployed web headers still require console/live-environment verification.
- The in-app testing report bundle is sanitized and does not include account name, email, raw SMS bodies, raw notification payloads, backup contents, or diagnostic stacks. Ask testers to attach it when reporting build, notification-access, backup/restore, or capture issues.

## Tester feedback fields

Collect the following for every tester report:

- Build artifact, version, version code, commit, and SHA-256.
- In-app testing report bundle copied from More > Settings and sync.
- Device model, Android version, OEM skin, and battery mode.
- Whether notification access was granted, denied, revoked, or left disabled.
- Whether a capture draft appeared, whether it was accurate, and whether confirming it updated budget totals.
- Whether latest-backup preview matched the expected signed-in account before restore.
- Any confusion around SMS Research Mode, notification access, privacy copy, manual SMS paste, Sentry/error prompts, or backup/restore copy.
- Crash, freeze, failed navigation, failed auth, or failed backup/restore details with approximate timestamp.

## Handoff fill-ins

| Field | Value |
| --- | --- |
| Build ID | Pending authenticated EAS/local successful bundle |
| Commit hash | `2238e81` / `2238e81446b319949c44dc745af43344301500a6` |
| App version | `1.0.1` |
| Android package | `com.moneykai.mobile` |
| Version code | `2` |
| Build profile | `production` intended; no approved June 25 upload artifact |
| Artifact path | Pending; historical debug-signed AAB remains `apps/MoneyKai-mobile/artifacts/phase5a/moneykai-phase5-release-no-devclient-arm64.aab` and is not uploadable |
| Artifact SHA-256 | Pending for upload artifact; historical AAB recheck `928EF76BF3829288C3BCFAAB4A19A94FB347709E8A8BAD0907DD64024D0387EC` |
| Tester group | Internal testers |
| Devices validated | |
| Notification access tested | |
| Auto Capture draft review tested | |
| Backup preview/restore tested | |
| Privacy/disclosure copy reviewed | |
| Release permission verifier result | Pending for upload artifact; historical AAB passed with no restricted SMS permissions |
| Sentry/backend diagnostics visible | Pending final artifact/runtime check |

## Final signoff state

Internal release signoff is current for June 25, 2026. Automated repo/mobile/web checks and artifact guardrails are documented, but the Play Console handoff remains blocked until a fresh signed upload AAB from `2238e81` or later is produced, hashed, permission-verified, and smoke-checked on device.
