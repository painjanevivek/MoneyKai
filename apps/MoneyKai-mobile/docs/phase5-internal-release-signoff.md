# Phase 5H Internal Release Signoff

Last reviewed: 2026-06-28

## Release decision

Target: **Play Console internal testing**, not closed testing or public production launch.

This signoff has been rebuilt around the current `main` baseline. The repo is ready for the next handoff workflow, but the Play upload remains blocked until a fresh production AAB is built from the current baseline, hashed, permission-verified, smoke-checked, and recorded below.

## Repo baseline

| Field | Value |
| --- | --- |
| Current commit | `1bae4b5` (`1bae4b5e9b2caec9d3abf0d0993dc8af20021721`) |
| Branch | `main` / `origin/main` |
| Stale reference reconciliation | `6b58289` and `b9687f8` are ancestors of `main`, not the handoff baseline. `b9687f8` added latest-backup preview before restore and is included in the current baseline. |
| Mobile app package version | `1.0.1` |
| Android version name | `1.0.1` |
| Android version code | `2` locally; production EAS profile uses remote auto-increment |
| App display name | `MoneyKai` |
| Android package | `com.moneykai.mobile` |
| Target SDK | `36` |
| Expo v56 docs check | Read `https://docs.expo.dev/versions/v56.0.0/` before release updates on 2026-06-28 |
| Tester group | Internal testers |
| Readiness source | `apps/MoneyKai-mobile/docs/phase5-release-readiness.md` |
| Security source | `docs/prelaunch-security-checklist.md` |

## Current main release chain

| Commit | Release relevance |
| --- | --- |
| `b9687f8` | Added latest-backup preview before restore on mobile and web. Ancestor only; no longer the baseline. |
| `dd780a8` | Refreshed the earlier Phase 5 signoff package. |
| `d809b9a` | Covered the signed-in backup/restore launch-readiness path. |
| `da75e57` | Added Android production signing guardrails for release builds. |
| `2238e81` | Statically exported dynamic marketing routes for SEO/web handoff. |
| `df150ff` | Required auth for AI attachment analysis. |
| `6b58289` | Added the previous internal-testing handoff bundle, tester report bundle, cookie/privacy updates, and release doc updates. |
| `c49c449` | Added the Vercel Speed Insights package to the web workspace. |
| `1bae4b5` | Current handoff baseline; wired consent-gated Vercel Speed Insights into the web root and updated optional telemetry privacy copy. |

## Build split

- **MoneyKai**: Play Store-safe internal testing build. Must not contain restricted SMS permissions or the SMS receiver.
- **Original MoneyKai**: local/internal APK for full native SMS Research Mode. Must not be uploaded to Play.

## Artifact status

| Field | Current handoff value |
| --- | --- |
| Play-safe internal AAB | Pending fresh production AAB from `1bae4b5` or later |
| Required signing | EAS-managed Android credentials for production AAB, or a verified non-debug local upload key if intentionally using local Gradle bundle |
| Permission gate | Run `npm run mobile:release:android:verify -- --aab <handoff-aab>` against the exact AAB before Play upload |
| Handoff capture gate | Run `npm run mobile:release:android:capture -- --aab <handoff-aab> --build-id <id> --eas-url <url>` and paste output into this doc. The command records SHA-256, signer certificate details, and permission-verifier output, and rejects Android debug signing by default. |
| Last historical Phase 5A AAB | `artifacts/phase5a/moneykai-phase5-release-no-devclient-arm64.aab` |
| Historical AAB SHA-256 | `928EF76BF3829288C3BCFAAB4A19A94FB347709E8A8BAD0907DD64024D0387EC` |
| Historical AAB signer | `CN=Android Debug`; not uploadable |

The Phase 5A artifacts are historical local validation artifacts. The historical AAB is restricted-SMS clean but debug-signed, so it must not be uploaded to Play.

## Fresh handoff checks

Run or record these before sending the next build to internal testers:

- `npm run launch:check`
- `npm run release:handoff-baseline`
- `npm run security:check`
- `npm run mobile:typecheck`
- `npm run mobile:lint`
- `npm run mobile:test:capture`
- `npm --prefix apps/MoneyKai-mobile run android:verify:production-signing`
- `npx.cmd expo-modules-autolinking verify --platform android` from `apps/MoneyKai-mobile` if native autolinking changed.
- Build production AAB with authenticated EAS: `npx eas build --platform android --profile production`.
- Verify the exact downloaded AAB: `npm run mobile:release:android:verify -- --aab <handoff-aab>`.
- Capture hash/signoff metadata: `npm run mobile:release:android:capture -- --aab <handoff-aab> --build-id <id> --eas-url <url>`.
- From the signed app, open **More > Settings and sync > Internal testing > Testing report bundle**, tap **Refresh**, then copy or share the sanitized report into tester notes.

## Known issues for internal testers

- Current Play-ready upload artifact is pending rebuild and hash capture.
- EAS login/token and Play submit credentials must be verified before build/submit.
- Historical `phase5a` AAB is debug-signed and must not be uploaded to Play, even though it is SMS-permission clean.
- Multi-device/OEM validation is incomplete and accepted only as controlled internal-testing risk.
- Notification capture behavior with real bank/payment apps needs more live-source evidence.
- Original MoneyKai SMS validation needs real incoming carrier/bank SMS and remains local/internal only.
- Sentry is integrated for mobile and web, but release-environment DSN/project setup, source-map/native-symbol upload, and event visibility must be confirmed for the handoff build.
- Production Firebase Auth providers, authorized domains, OAuth redirects, Firestore rules, Stripe/Sentry secrets, and deployed web headers still require console/live-environment verification.
- The in-app testing report bundle is sanitized and does not include account name, email, raw SMS bodies, raw notification payloads, backup contents, or diagnostic stacks. Ask testers to attach it when reporting build, notification-access, backup/restore, or capture issues.

## Feedback loop

- Support/contact email: `support@moneykai.app`.
- In-app route: **Settings > Help & Support** opens the contact page.
- Bug reports: choose **Bug report** on the contact page or email `support@moneykai.app` with subject `MoneyKai Bug Report`.
- Product feedback and launch questions: choose **Feedback** or **Support** on the contact page.
- Privacy or security questions: choose **Privacy and security** on the contact page.
- For crashes, freezes, failed auth, failed navigation, notification-capture issues, backup/restore issues, or incorrect totals, testers should include the in-app testing report bundle plus the fields below.

## Tester feedback fields

Collect the following for every tester report:

- Feedback type: Support, bug report, product feedback, privacy/security, or release-handoff note.
- Contact path used: Settings > Help & Support, direct email to `support@moneykai.app`, or another internal channel.
- Build artifact, version, version code, commit, and SHA-256.
- In-app testing report bundle copied from More > Settings and sync.
- Device model, Android version, OEM skin, and battery mode.
- Whether notification access was granted, denied, revoked, or left disabled.
- Whether a capture draft appeared, whether it was accurate, and whether confirming it updated budget totals.
- Whether latest-backup preview matched the expected signed-in account before restore.
- Any confusion around SMS Research Mode, notification access, privacy copy, manual SMS paste, Sentry/error prompts, or backup/restore copy.
- Crash, freeze, failed navigation, failed auth, or failed backup/restore details with approximate timestamp.

## Handoff fill-ins

Replace this table with the output from `npm run mobile:release:android:capture -- --aab <handoff-aab> --build-id <id> --eas-url <url>` after the production AAB is available.

| Field | Value |
| --- | --- |
| Build ID | Pending authenticated EAS/local successful bundle |
| EAS build URL | Pending |
| Commit hash | `1bae4b5` / `1bae4b5e9b2caec9d3abf0d0993dc8af20021721` |
| Branch | `main` |
| App version | `1.0.1` |
| Android package | `com.moneykai.mobile` |
| Version code | Pending final EAS build value |
| Build profile | `production` |
| Signing expectation | EAS-managed Android credentials or verified non-debug upload key |
| Artifact signer | Pending |
| Artifact signer SHA-256 | Pending |
| Artifact signature algorithm | Pending |
| Artifact path | Pending |
| Artifact SHA-256 | Pending |
| Tester group | Internal testers |
| Release permission verifier result | Pending exact artifact verification |
| Devices validated | Pending |
| Notification access tested | Pending |
| Auto Capture draft review tested | Pending |
| Backup preview/restore tested | Pending |
| Privacy/disclosure copy reviewed | Pending |
| Sentry/backend diagnostics visible | Pending |

## Final signoff state

Internal release signoff is current for 2026-06-28 repo state. Automated repo/mobile checks, artifact hash capture, permission verification, handoff-baseline drift detection, and signing expectations are documented, but Play Console handoff remains blocked until a fresh signed production AAB from `1bae4b5` or later is produced, hashed, permission-verified, and smoke-checked on device.
