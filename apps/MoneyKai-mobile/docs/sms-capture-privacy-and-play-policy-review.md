# SMS Capture Privacy And Play Policy Review

Last reviewed: 2026-06-17

## Sources Reviewed

- Expo SDK 56 documentation: https://docs.expo.dev/versions/v56.0.0/
- Google Play SMS and Call Log permissions policy: https://support.google.com/googleplay/android-developer/answer/10208820
- Google Play User Data policy: https://support.google.com/googleplay/android-developer/answer/10144311
- Google Play Permissions and APIs that access sensitive information: https://support.google.com/googleplay/android-developer/answer/16558241
- Google Play Data safety form guidance: https://support.google.com/googleplay/android-developer/answer/10787469
- Google Play prepare app for review guidance: https://support.google.com/googleplay/android-developer/answer/9859455

## Current Release Decision

Native SMS inbox import and live SMS receiver access remain internal research-only. Production Play builds must not declare restricted SMS permissions unless a separate Play Console declaration, privacy/legal review, and release signoff approve that path.

Production-safe paths:

- Notification capture where users explicitly enable notification access.
- Manual SMS paste/import without requesting `READ_SMS` or `RECEIVE_SMS`.
- Future structured import paths such as bank exports or regulated account integrations.

## Play Policy Review

Google Play treats SMS and Call Log permission groups as restricted/high-risk. Apps that do not qualify or do not receive approval must remove those permissions from the manifest. The policy includes possible exceptions for financial transaction management, but approval is not automatic and is evaluated by Google Play during review.

MoneyKai release gate:

- Do not request `READ_SMS`, `RECEIVE_SMS`, `SEND_SMS`, `RECEIVE_MMS`, or `RECEIVE_WAP_PUSH` in production unless Play review approves the exact production SMS use case.
- Keep native SMS code behind research build flags.
- Inspect the production AAB before upload to verify restricted SMS permissions are absent.
- If production SMS is later pursued, submit Play Console permission declarations, reviewer notes, in-app disclosure screenshots, privacy policy updates, and Data Safety answers together.

## Privacy Review

Current controls:

- SMS import is gated by explicit research flags and user consent.
- Parser outputs reviewable drafts; no SMS transaction is auto-confirmed.
- Discovery samples are redacted before display.
- OTPs, masked account numbers, UPI IDs, references, and long numeric identifiers are redacted.
- Capture backup excludes raw SMS bodies and capture inbox state.
- Diagnostics redact sensitive text and do not upload raw SMS.
- AI SMS Assist uses redacted text, server-side auth, rate limits, schema validation, and review-only results.
- Mobile app does not call OpenAI directly.

Required before production SMS permission reconsideration:

- Update public privacy policy to name SMS access, purpose, local processing, retention, deletion, backup exclusion, and AI handling if enabled.
- Add prominent in-app disclosure before requesting SMS permissions.
- Complete Data Safety form answers for SMS-derived financial data, diagnostics, and optional AI processing.
- Confirm raw SMS text is not logged by native, JS, backend, crash reporting, analytics, backups, or support exports.
- Confirm user can disable SMS capture and revoke permission without losing confirmed transactions.

## Formal Signoff Checklist

| Gate | Owner | Status | Evidence |
| --- | --- | --- | --- |
| Production APK manifest has no restricted SMS permission | Engineering | Passed for local ignored APK artifact | `aapt dump permissions apps/MoneyKai-mobile/android/app/build/outputs/apk/release/app-release.apk` reported no `READ_SMS`, `RECEIVE_SMS`, `SEND_SMS`, `RECEIVE_MMS`, `RECEIVE_WAP_PUSH`, or `WRITE_SMS` |
| Production AAB manifest has no restricted SMS permission | Engineering | Passed for current local AAB artifact | `npm.cmd run android:verify:release-permissions -- --aab artifacts\phase5a\moneykai-phase5-release-no-devclient-arm64.aab` inspected the compiled AAB manifest and reported no `READ_SMS`, `RECEIVE_MMS`, `RECEIVE_SMS`, `RECEIVE_WAP_PUSH`, `SEND_SMS`, or `WRITE_SMS` |
| Research APK declares restricted SMS permission only for research use | Engineering | Passed for installed device build | Fresh local debug research APK `com.moneykai.mobile` `versionCode=1`, `versionName=1.0.0` requested `READ_SMS` and `RECEIVE_SMS`, and both were granted on the physical Android 16 device; treat as internal research-only evidence, not production release evidence |
| Real-device QA matrix complete | QA | In progress | `docs/sms-capture-real-device-qa.md` has one Android 16 source-matched debug run; range controls and native discovery are verified, while approval/unselect/resume/retry matrix completion remains pending |
| Privacy policy reviewed for SMS and AI handling | Privacy/legal | Pending | |
| Play Console SMS declaration drafted, if production SMS is pursued | Release owner | Pending | |
| Data Safety form reviewed for SMS-derived data | Release owner | Pending | |
| Backend logs reviewed for raw SMS exclusion | Engineering | Pending | |
| Diagnostics and backup raw SMS exclusion verified | Engineering | Partially passed | Automated mobile capture suite passed, including diagnostics and backup privacy tests; formal production logging review remains pending |
| AI provider data handling reviewed, if AI Assist is enabled | Privacy/legal | Pending | |

## Artifact Inspection - 2026-06-13

The generated `android/` directory is ignored by Git, so local build outputs are not treated as source of truth. Still, the local release APK was inspected as a concrete release-safety sample.

Observed local APK permissions:

- No restricted SMS permissions were present in the release APK.
- Present non-SMS permissions included contacts, notifications, network, biometric, foreground service, exact alarm, and storage permissions with Android SDK caps where applicable.
- The installed physical-device debug build was intentionally different from the local release APK: it was an internal/research SMS-enabled build with `READ_SMS` and `RECEIVE_SMS` granted.

Known limitation:

- The local manifest-merger text report still contains restricted SMS permission lines, but the actual APK manifest inspected with `aapt` does not. Treat the text report as stale or not representative until a fresh production build is generated and inspected.
- The AAB remains the production upload artifact. Run `npm.cmd run android:verify:release-permissions -- --aab path\to\production.aab` against the exact EAS-downloaded upload candidate before Play Console upload.
- The installed research build should not be used as Play policy evidence except to validate internal SMS behavior, permission gating, redaction, and source-matched QA behavior.

## Release Rule

If any signoff row remains pending, ship production without native SMS permissions. Keep SMS import as no-permission manual paste or internal research only.
