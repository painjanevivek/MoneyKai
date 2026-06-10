# Phase 5 Release Readiness

Last reviewed: 2026-06-11

## Current artifact status

- Debug APK built locally from the current workspace and copied to `artifacts/phase5a/moneykai-phase5-debug.apk`.
- Release APK built locally in production mode, without dev-client autolinking, copied to `artifacts/phase5a/moneykai-phase5-release-no-devclient-arm64.apk`.
- Release AAB built locally in production mode, without dev-client autolinking, copied to `artifacts/phase5a/moneykai-phase5-release-no-devclient-arm64.aab`.
- Local SMS Research APK profile added as `sms-research-local`; this build is for direct/local testing only and includes restricted SMS permissions/receiver.
- Release APK SHA-256: `4FB9D32FB7348AB84F69A7076BDD45195AF6DC87807717D8CFAC93B848A187D5`.
- Release AAB SHA-256: `58FEB852CFE4EC424D22DB6920A641E87B8EFACF6D557FBF1A20492D3266009A`.
- Local SMS Research APK: `artifacts/phase5a/moneykai-phase5-sms-research-local-arm64.apk`.
- Local SMS Research APK SHA-256: `10463DDB9D94B92727958915E3D43FD497DDEFE248AEBFF06380DCD57C8DC6AB`.
- The local release APK installed successfully over ADB and launched `com.moneykai.mobile/.MainActivity`.
- Current `eas.json` profiles cover:
  development -> internal debug/dev-client validation
  preview -> internal APK
  production -> Android App Bundle for store submission
- Preview and production enable no-permission manual SMS research through `EXPO_PUBLIC_SMS_RESEARCH_BUILD=true`.
- Preview and production keep native SMS permissions/receiver disabled through `EXPO_PUBLIC_NATIVE_SMS_RESEARCH_BUILD=false`.
- Preview and production disable the dev-client launch metadata path through `EXPO_PUBLIC_DEV_CLIENT_BUILD=false`.
- Local release artifacts are still signed by the generated debug keystore. They prove the build path and are usable for local/internal validation, but they are not final Play upload artifacts.

## Build commands

Run these from `apps/MoneyKai-mobile`.

### Local validation

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run test:capture
npx.cmd expo-modules-autolinking verify --platform android
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
Set-Location android
$env:NODE_ENV='production'
.\gradlew.bat :app:assembleRelease --console=plain --no-daemon --stacktrace --max-workers=2 -PreactNativeArchitectures=arm64-v8a
```

Expected output:
`android/app/build/outputs/apk/release/app-release.apk`

### Local release AAB

```powershell
Set-Location android
$env:NODE_ENV='production'
.\gradlew.bat :app:bundleRelease --console=plain --no-daemon --stacktrace --max-workers=2 -PreactNativeArchitectures=arm64-v8a
```

Expected output:
`android/app/build/outputs/bundle/release/app-release.aab`

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

```powershell
npx eas build --platform android --profile production
```

### EAS submit to Play internal track

```powershell
npx eas submit --platform android --profile production
```

## Release checks already confirmed

- App id: `com.moneykai.mobile`
- Version: `1.0.0`
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
- Release APK installed and launched on the connected Android device via ADB
- Local SMS Research APK installed and launched on the connected Android device via ADB
- Local SMS Research package inspection confirms `MoneyKaiSmsReceiver`, `READ_SMS`, and `RECEIVE_SMS`
- Local SMS Research package accepted Android SMS permission grants for `READ_SMS` and `RECEIVE_SMS`
- Phase 5B one-device validation is documented in `docs/phase5-device-validation.md`
- Phase 5C Auto Capture onboarding is completed in the first-login tour, Settings explainer, and Auto Capture setup card
- Phase 5D local diagnostics hooks are implemented and documented in `docs/phase5-diagnostics.md`
- JS render failures and native capture failures are recorded through `diagnosticsService` with SMS/notification content redaction
- `npm.cmd run mobile:typecheck`, `npm.cmd run mobile:lint`, `npm.cmd run mobile:test:capture`, and `npx.cmd expo-modules-autolinking verify --platform android` pass

## Remaining release blockers

- Local Gradle release signing still uses the debug keystore in the generated Android project, so the locally built release APK/AAB is not equivalent to a real Play upload artifact.
- A Play-ready production upload still requires EAS-managed Android credentials or a project upload keystore wired into the release build.
- Multi-device Android validation is still incomplete.
- Remote/team-visible crash reporting is still not configured. Local diagnostics hooks exist, but a Sentry/Bugsnag/Crashlytics/backend sink must be selected and verified before Phase 5D is complete.
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
