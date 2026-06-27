# Phase 5 Release Readiness

Last reviewed: 2026-06-28

## Current baseline

- Current handoff baseline is `main` / `origin/main` at `1bae4b5` (`1bae4b5e9b2caec9d3abf0d0993dc8af20021721`).
- The stale `6b58289` and older `b9687f8` references are no longer the handoff baseline. They remain ancestors of `main`; the current release package must be built from `1bae4b5` or later.
- Expo v56 docs were checked before mobile release updates on 2026-06-28: `https://docs.expo.dev/versions/v56.0.0/`. The current mobile baseline matches the expected Expo/RN generation used by this repo: React Native `0.85.3`, React `19.2.3`, Node `>=22.13.0`, Android compile SDK `36`, target SDK `36`.
- App display name: `MoneyKai`.
- Android package: `com.moneykai.mobile`.
- App version: `1.0.1`.
- Android version code: `2` in the local Gradle project; EAS production builds also use remote `autoIncrement`.

## Artifact status

- No fresh Play Console upload AAB is approved in the repo as of this review.
- Historical Phase 5A artifacts under `artifacts/phase5a/` are validation evidence only. Do not upload them to Play.
- Historical local release AAB: `artifacts/phase5a/moneykai-phase5-release-no-devclient-arm64.aab`.
- Historical local release AAB SHA-256: `928EF76BF3829288C3BCFAAB4A19A94FB347709E8A8BAD0907DD64024D0387EC`.
- Historical local release AAB signer: `CN=Android Debug`, certificate SHA-256 `FA:C6:17:45:DC:09:03:78:6F:B9:ED:E6:2A:96:2B:39:9F:73:48:F0:BB:6F:89:9B:83:32:66:75:91:03:3B:9C`.
- That historical AAB passed the restricted-SMS permission verifier, but it is debug-signed and is not a Play upload candidate.
- EAS authentication must be verified before the next production build/submit. A local `npx.cmd eas-cli@latest whoami` probe on 2026-06-26 did not return before it was stopped.

## Build profiles

- `development`: internal debug/dev-client validation.
- `preview`: internal APK, Play-unsafe for store upload because it is a direct-install artifact.
- `sms-research-local`: local/internal APK with native SMS research enabled. Never upload this profile to Play unless SMS policy approval and release signoff are completed.
- `production`: Play-internal AAB candidate. Builds `android.buildType=app-bundle`, uses `autoIncrement`, disables dev-client metadata, disables native SMS research, and is intended for EAS-managed Android credentials unless intentionally changed.

## Required handoff commands

Run from repo root unless noted.

```powershell
npm run launch:check
npm run release:handoff-baseline
npm run security:check
npm run mobile:typecheck
npm run mobile:lint
npm run mobile:test:capture
npm --prefix apps\MoneyKai-mobile run android:verify:production-signing
```

Build the Play candidate with authenticated EAS:

```powershell
cd apps\MoneyKai-mobile
npx eas build --platform android --profile production
```

After downloading the exact AAB that will be uploaded to Play internal testing:

```powershell
npm run mobile:release:android:verify -- --aab apps\MoneyKai-mobile\path\to\production.aab
npm run mobile:release:android:capture -- --aab apps\MoneyKai-mobile\path\to\production.aab --build-id <eas-build-id> --eas-url <eas-build-url>
```

Paste the capture output into `docs/phase5-internal-release-signoff.md` before submit. The capture command computes SHA-256, records the current commit, captures the artifact signer certificate, rejects Android debug signing by default, runs the restricted-SMS permission verifier against the exact artifact, and prints the handoff table.

`npm run release:handoff-baseline` fails if this document or the signoff document still points at an older handoff commit than the checked-out `HEAD`. Keep it green before starting the next Play-internal production AAB build.

Submit only after the signoff table is complete:

```powershell
cd apps\MoneyKai-mobile
npx eas submit --platform android --profile production
```

## Signing expectations

- Production EAS AABs should use EAS-managed Android credentials for Play upload signing.
- Local Gradle release/original builds must use a verified non-debug upload key through `MONEYKAI_UPLOAD_STORE_FILE`, `MONEYKAI_UPLOAD_STORE_PASSWORD`, `MONEYKAI_UPLOAD_KEY_ALIAS`, and `MONEYKAI_UPLOAD_KEY_PASSWORD`.
- `npm --prefix apps\MoneyKai-mobile run android:verify:production-signing` rejects production profile settings that would create a direct-install/internal artifact, debug Gradle command, missing credentials, or Gradle release signing fallback to debug.
- `npm --prefix apps\MoneyKai-mobile run android:verify:production-signing -- --mode local-release` additionally rejects missing local upload signing env vars, debug keystore paths, `androiddebugkey`, and default debug passwords.
- `npm run mobile:release:android:capture` rejects artifacts signed by `CN=Android Debug` unless `--allow-debug-signing` is supplied for historical/testing-only inspection.

## Permission expectations

- Play-safe production builds must not include `READ_SMS`, `RECEIVE_MMS`, `RECEIVE_SMS`, `RECEIVE_WAP_PUSH`, `SEND_SMS`, or `WRITE_SMS`.
- The release permission verifier inspects the compiled manifest inside the exact AAB/APK, not source config alone.
- Production and preview keep native SMS research disabled with `EXPO_PUBLIC_NATIVE_SMS_RESEARCH_BUILD=false`.
- Manual SMS Research Mode in Play-safe builds is user-paste only and does not request SMS inbox access.
- Notification listener access remains optional and is used only to create reviewable transaction drafts.

## Remaining blockers before Play internal handoff

- Produce a fresh production AAB from `1bae4b5` or later.
- Verify EAS login/token access and Play Console submit credentials before build/submit.
- Run permission verification and handoff capture against the exact downloaded AAB.
- Record artifact path, SHA-256, EAS build URL/build ID, signing expectation, device smoke result, tester group, and Sentry/backend diagnostics visibility.
- Smoke the signed artifact on a physical Android device, including launch, notification-access controls, Auto Capture draft review, backup preview/restore copy, and the in-app testing report bundle.
- Complete final Play Console Data Safety/reviewer-note review before moving beyond internal testing.

## Feedback loop

- Support/contact email: `support@moneykai.app`.
- In-app path: **Settings > Help & Support**.
- Bug reports: use the **Bug report** option on the contact page or email `support@moneykai.app` with subject `MoneyKai Bug Report`.
- Tester defects should include the sanitized testing report bundle from the signed app, device/OS details, build ID, artifact SHA-256, and clear reproduction steps.
- Product feedback, launch questions, privacy/security questions, and support requests should use the matching contact page option so triage is unambiguous.
