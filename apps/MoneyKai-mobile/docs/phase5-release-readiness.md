# Phase 5 Release Readiness

Last reviewed: 2026-06-25

## Current artifact status

- June 25 handoff baseline is `main` / `origin/main` at `2238e81` (`2238e81446b319949c44dc745af43344301500a6`). The user-supplied `da75e57` reference is present in history and is an ancestor of the current baseline.
- Expo v56 docs were checked before mobile build work: `https://docs.expo.dev/versions/v56.0.0/`. SDK 56 lines up with React Native `0.85`, React `19.2.3`, minimum Node `22.13.x`, Android compile SDK `36`, and Android target SDK `36`; the current mobile package/build config matches those release expectations.
- No fresh Play Console upload AAB was produced on June 25. EAS CLI is not logged in in this shell (`npx.cmd eas-cli@latest whoami` -> `Not logged in`; `build:list` requires an Expo account or `EXPO_TOKEN`).
- Local upload signing credentials exist under `credentials/play-upload`, and `npm.cmd run android:verify:production-signing -- --mode local-release` passes when that local env file is loaded. A direct `:app:bundleRelease` retry then hung in React Native release bundling (`node node_modules\react-native\cli.js bundle ... --minify false --verbose`) after `:app:createBundleReleaseJsAndAssets`; no `android/app/build/outputs/bundle/release/app-release.aab` was emitted.
- The June 25 exact Play upload artifact is therefore **pending**. Do not upload historical Phase 5A artifacts.
- Debug APK built locally from the current workspace and copied to `artifacts/phase5a/moneykai-phase5-debug.apk`.
- Release APK built locally in production mode, without dev-client autolinking, copied to `artifacts/phase5a/moneykai-phase5-release-no-devclient-arm64.apk`.
- Release AAB built locally in production mode, without dev-client autolinking, copied to `artifacts/phase5a/moneykai-phase5-release-no-devclient-arm64.aab`.
- Local SMS Research APK profile added as `sms-research-local`; this build is for direct/local testing only and includes restricted SMS permissions/receiver.
- Release APK SHA-256: `42158627EE2918DF3FC5BC419F5ECFF13ABBB56DFA8220A177692A9FFD022AE3`.
- Historical release AAB SHA-256 rechecked on June 25: `928EF76BF3829288C3BCFAAB4A19A94FB347709E8A8BAD0907DD64024D0387EC`.
- Historical release AAB signer rechecked on June 25: `CN=Android Debug, OU=Android, O=Unknown, L=Unknown, ST=Unknown, C=US`; certificate SHA-256 `FA:C6:17:45:DC:09:03:78:6F:B9:ED:E6:2A:96:2B:39:9F:73:48:F0:BB:6F:89:9B:83:32:66:75:91:03:3B:9C`. This confirms it is not a Play upload candidate.
- Local SMS Research APK: `artifacts/phase5a/moneykai-phase5-sms-research-local-arm64.apk`.
- Local SMS Research APK SHA-256: `50522083D712E91C4067A7D7701E611AFC5B63221726480CBC5C85D70FEB1804`.
- The local release APK installed successfully over ADB and launched `com.moneykai.mobile/.MainActivity`.
- Current `eas.json` profiles cover:
  development -> internal debug/dev-client validation
  preview -> internal APK
  production -> Android App Bundle for store submission
- App display name is `MoneyKai`.
- Android launcher/adaptive icon assets are generated from `assets/images/moneykai-app-logo-source.jpeg`.
- Preview and production enable no-permission manual SMS research through `EXPO_PUBLIC_SMS_RESEARCH_BUILD=true`.
- Preview and production keep native SMS permissions/receiver disabled through `EXPO_PUBLIC_NATIVE_SMS_RESEARCH_BUILD=false`.
- Preview and production disable the dev-client launch metadata path through `EXPO_PUBLIC_DEV_CLIENT_BUILD=false`.
- Historical Phase 5A local release artifacts were signed by the generated debug keystore. They prove the old build path only and must not be used as Play upload artifacts.
- Current repo guard: `npm run android:verify:production-signing` checks the production EAS profile and Gradle release signing policy.
- Current local release guard: `npm run android:assemble:release` and `npm run android:bundle:release` fail before Gradle unless `MONEYKAI_UPLOAD_STORE_FILE`, `MONEYKAI_UPLOAD_STORE_PASSWORD`, `MONEYKAI_UPLOAD_KEY_ALIAS`, and `MONEYKAI_UPLOAD_KEY_PASSWORD` are set to a non-debug upload keystore.

## Build commands

Run these from `apps/MoneyKai-mobile`.

### Local validation

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run test:capture
npx.cmd expo-modules-autolinking verify --platform android
npm.cmd run android:verify:production-signing
npm.cmd run android:verify:release-permissions -- --aab artifacts\phase5a\moneykai-phase5-release-no-devclient-arm64.aab
```

### Local debug APK

```powershell
$env:EXPO_PUBLIC_SMS_RESEARCH_BUILD='false'
$env:EXPO_PUBLIC_DEV_CLIENT_BUILD='false'
npx.cmd expo prebuild --platform android --clean --no-install
Set-Location android
.\gradlew.bat :app:assembleDebug --console=plain --no-daemon --stacktrace --max-workers=2
```

Output:
`android/app/build/outputs/apk/debug/app-debug.apk`

### Local release APK

```powershell
$env:NODE_ENV='production'
$env:MONEYKAI_UPLOAD_STORE_FILE='C:\path\to\upload-keystore.jks'
$env:MONEYKAI_UPLOAD_STORE_PASSWORD='<store-password>'
$env:MONEYKAI_UPLOAD_KEY_ALIAS='<upload-key-alias>'
$env:MONEYKAI_UPLOAD_KEY_PASSWORD='<key-password>'
npm.cmd run android:assemble:release -- --console=plain --no-daemon --stacktrace --max-workers=2 -PreactNativeArchitectures=arm64-v8a
```

Expected output:
`android/app/build/outputs/apk/release/app-release.apk`

### Local release AAB

```powershell
$env:NODE_ENV='production'
$env:MONEYKAI_UPLOAD_STORE_FILE='C:\path\to\upload-keystore.jks'
$env:MONEYKAI_UPLOAD_STORE_PASSWORD='<store-password>'
$env:MONEYKAI_UPLOAD_KEY_ALIAS='<upload-key-alias>'
$env:MONEYKAI_UPLOAD_KEY_PASSWORD='<key-password>'
npm.cmd run android:bundle:release -- --console=plain --no-daemon --stacktrace --max-workers=2 -PreactNativeArchitectures=arm64-v8a
npm.cmd run android:verify:release-permissions -- --aab android\app\build\outputs\bundle\release\app-release.aab
```

Expected output:
`android/app/build/outputs/bundle/release/app-release.aab`

The release permission verifier inspects the compiled `base/manifest/AndroidManifest.xml` inside the AAB and fails the release if any restricted SMS permissions are present: `READ_SMS`, `RECEIVE_MMS`, `RECEIVE_SMS`, `RECEIVE_WAP_PUSH`, `SEND_SMS`, or `WRITE_SMS`.

### EAS preview APK

```powershell
npx eas build --platform android --profile preview
```

### EAS/local SMS Research APK

This APK is not Play Store-safe. Use it only for direct local/internal SMS research validation.

```powershell
npx eas build --platform android --profile sms-research-local
```

For a local Gradle build:

```powershell
$env:EXPO_PUBLIC_SMS_RESEARCH_BUILD='true'
$env:EXPO_PUBLIC_NATIVE_SMS_RESEARCH_BUILD='true'
$env:EXPO_PUBLIC_DEV_CLIENT_BUILD='false'
$env:EAS_BUILD_PROFILE='sms-research-local'
npx.cmd expo prebuild --platform android --clean --no-install
Set-Location android
$env:NODE_ENV='production'
.\gradlew.bat :app:assembleRelease --console=plain --no-daemon --stacktrace --max-workers=2 -PreactNativeArchitectures=arm64-v8a
```

### EAS production AAB

Use this path for the next Play Console internal testing AAB. The production EAS profile builds an Android App Bundle and relies on EAS-managed Android credentials unless the profile is intentionally changed to local credentials.

```powershell
npm.cmd run android:verify:production-signing
npx eas build --platform android --profile production
npm.cmd run android:verify:release-permissions -- --aab path\to\downloaded-production.aab
Get-FileHash path\to\downloaded-production.aab -Algorithm SHA256
```

Record the EAS build URL/build ID, commit, artifact path, SHA-256, and permission verifier result in the internal signoff doc before submitting.

### EAS submit to Play internal track

```powershell
npx eas submit --platform android --profile production
```

## Release checks already confirmed

- App id: `com.moneykai.mobile`
- Version: `1.0.1`
- App name: `MoneyKai`
- App icon: `assets/images/icon.png`
- Adaptive icon foreground/background/monochrome configured in `app.json`
- Splash image configured in `app.json`
- Manual SMS Research Mode is available in preview and production without SMS permissions
- Native SMS research permissions/receiver are excluded from preview and production app config
- Native SMS research permissions/receiver are available only in the separate `sms-research-local` internal APK profile
- Dev-client launch metadata moved behind the development-only config flag
- Release autolinking excludes `expo-dev-client`, `expo-dev-launcher`, and `expo-dev-menu` outside development builds
- Production-safe Android prebuild no longer includes the SMS receiver in the generated manifest
- Installed release package has no dev-client/dev-menu components, no SMS receiver, and no restricted SMS permissions
- `npm.cmd run android:verify:release-permissions -- --aab artifacts\phase5a\moneykai-phase5-release-no-devclient-arm64.aab` passed on June 25 against the historical local AAB and reported no restricted SMS permissions. Detected permissions were `ACCESS_NETWORK_STATE`, `ACCESS_WIFI_STATE`, `BIND_JOB_SERVICE`, `BIND_NOTIFICATION_LISTENER_SERVICE`, `CAMERA`, `DUMP`, `INTERNET`, `POST_NOTIFICATIONS`, `READ_APP_BADGE`, `READ_CONTACTS`, `READ_EXTERNAL_STORAGE`, `RECEIVE_BOOT_COMPLETED`, `USE_BIOMETRIC`, `USE_FINGERPRINT`, `VIBRATE`, `WAKE_LOCK`, and `WRITE_EXTERNAL_STORAGE`.
- `npm.cmd run android:verify:production-signing` passes against the current production EAS config and Gradle signing policy
- `npm.cmd run android:verify:production-signing -- --mode local-release` passes when `credentials/play-upload/.env.play-upload.local` is loaded
- Local release APK/AAB package scripts now fail before Gradle if upload signing env vars are absent or point to debug signing defaults
- June 25 automated checks passed: `npm run security:check`, `npm run mobile:typecheck`, `npm run mobile:lint`, `npm run mobile:test:capture` (12 files / 131 tests), `npm run web:typecheck`, `npm run web:lint`, `npm run web:build`, and `npx.cmd expo-modules-autolinking verify --platform android`.
- `npm run launch:check` exited successfully on June 25, with optional launch gaps still printed for `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`, `EXPO_PUBLIC_APP_STORE_URL`, and `EXPO_PUBLIC_PLAY_STORE_URL`.
- Release APK installed and launched on the connected Android device via ADB
- Local SMS Research APK installed and launched on the connected Android device via ADB
- Local SMS Research package inspection confirms `MoneyKaiSmsReceiver`, `READ_SMS`, and `RECEIVE_SMS`
- Local SMS Research package accepted Android SMS permission grants for `READ_SMS` and `RECEIVE_SMS`
- Phase 5B one-device validation is documented in `docs/phase5-device-validation.md`
- Phase 5C Auto Capture onboarding is completed in the first-login tour, Settings explainer, and Auto Capture setup card
- Phase 5D diagnostics hooks are implemented and documented in `docs/phase5-diagnostics.md`
- Phase 5E disclosure package is documented in `docs/phase5-play-store-disclosures.md`
- Phase 5F mobile regression checklist is documented in `docs/phase5-mobile-regression.md`
- Phase 5G web regression checklist is documented in `docs/phase5-web-regression.md`
- Phase 5H internal signoff checklist is documented in `docs/phase5-internal-release-signoff.md`
- JS render failures and native capture failures are recorded through `diagnosticsService` with SMS/notification content redaction
- Warning/error/fatal diagnostics upload to the authenticated backend endpoint `POST /v1/diagnostics/events` when backend auth is available
- `npm.cmd run mobile:typecheck`, `npm.cmd run mobile:lint`, `npm.cmd run mobile:test:capture`, and `npx.cmd expo-modules-autolinking verify --platform android` pass

## Remaining release blockers

- A Play-ready June 25 production upload AAB is still missing. Complete either an authenticated EAS production build (`EXPO_TOKEN`/`eas login`) or a local upload-signed Gradle bundle run that completes past the React Native release bundle hang.
- The local direct `:app:bundleRelease` attempt with play-upload credentials hung in the React Native `createBundleReleaseJsAndAssets` bundle step and left orphaned `jest-worker` child processes that this shell could not terminate (`Access denied`). Restarting the shell or machine may be needed before retrying a local release bundle.
- Multi-device Android validation is still incomplete and accepted only as a documented risk for internal testing.
- Backend diagnostics are configured for app-emitted events. A native crash SDK such as Sentry/Bugsnag/Crashlytics is still recommended later for process-level native crash stack traces.
- Store screenshots, reviewer notes, and final Data Safety copy still need to be assembled.

## Internal release checklist

- Build ID:
- Commit hash:
- App version:
- Android package:
- Build profile:
- Tester group:
- Known issues:
- Devices validated:
- Notification access tested:
- Auto Capture draft review tested:
- Backup and restore tested:
- Privacy copy reviewed:
- Local diagnostics active:
- Remote crash reporting active:
