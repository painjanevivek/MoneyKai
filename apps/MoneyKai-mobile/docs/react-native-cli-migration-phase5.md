# React Native CLI Migration - Phase 5

Date: 2026-06-12

## Scope

Phase 5 completed the Expo removal and release-readiness pass for `apps/MoneyKai-mobile` as a React Native CLI app. No MoneyKai backend files were changed in this phase, so no backend commit or push was required.

## What Changed

- Replaced remaining Expo imports with CLI-safe packages:
  - `expo-network` -> `@react-native-community/netinfo`
  - `expo-local-authentication` -> `react-native-biometrics`
  - `@expo/ui` date picker -> `@react-native-community/datetimepicker`
  - `expo-router` button fallbacks -> no-op callbacks supplied by React Navigation screens
  - `@expo/vector-icons` -> `react-native-vector-icons/MaterialCommunityIcons`
- Converted `modules/moneykai-native-capture` from an Expo module to a plain React Native Android package.
- Registered `MoneyKaiNativeCapturePackage` manually in `android/app/src/main/java/com/moneykai/mobile/MainApplication.kt`.
- Added the native module to Gradle through `android/settings.gradle` and `android/app/build.gradle`.
- Removed Expo Router app routes and mobile-hosted marketing pages. The website remains separate.
- Replaced the old Expo/EAS SMS policy test with native Android manifest and CLI package assertions.
- Added explicit Metro monorepo resolver paths so Android release bundling can resolve root workspace packages.
- Added `@babel/runtime` as a direct mobile runtime dependency for release bundling.
- Added `@eslint/js` and `typescript-eslint` for CLI-safe linting after removing `eslint-config-expo`.

## Removed Expo Surface

Removed:

- `app.config.js`
- `eas.json`
- `expo-env.d.ts`
- `.expo/`
- `.easignore`
- Expo LAN/device log files
- `src/app/**` Expo Router routes
- `src/components/marketing/**`
- `plugins/withMoneyKaiReleaseAutolinking.js`
- `plugins/withMoneyKaiSmsResearch.js`
- `modules/moneykai-native-capture/expo-module.config.json`
- `scripts/reset-project.js`
- Expo/template assets: `assets/expo.icon/**`, `expo-badge*.png`, `expo-logo.png`, React starter logos, `tutorial-web.png`

Temporarily kept:

- `app.json`, but it is now React Native CLI-shaped: `name` and `displayName` only.
- Historical migration docs that mention Expo, for traceability only.

## Dependencies

Added or kept for CLI:

- `@react-navigation/native`
- `@react-navigation/native-stack`
- `@react-navigation/bottom-tabs`
- `react-native-screens`
- `react-native-safe-area-context`
- `react-native-gesture-handler`
- `@react-native-firebase/app`
- `@react-native-firebase/auth`
- `@react-native-firebase/firestore`
- `@react-native-google-signin/google-signin`
- `@react-native-community/netinfo`
- `@react-native-community/datetimepicker`
- `react-native-biometrics`
- `react-native-vector-icons`
- `@babel/runtime`

Removed from the mobile app dependency surface:

- `expo`
- `expo-router`
- `@expo/vector-icons`
- `@expo/ui`
- `expo-auth-session`
- `expo-constants`
- `expo-contacts`
- `expo-crypto`
- `expo-dev-client`
- `expo-device`
- `expo-font`
- `expo-glass-effect`
- `expo-haptics`
- `expo-image`
- `expo-image-picker`
- `expo-linear-gradient`
- `expo-linking`
- `expo-local-authentication`
- `expo-network`
- `expo-notifications`
- `expo-secure-store`
- `expo-splash-screen`
- `expo-sqlite`
- `expo-status-bar`
- `expo-symbols`
- `expo-system-ui`
- `expo-web-browser`
- `eslint-config-expo`
- Web-only direct deps: `firebase`, `react-dom`, `react-native-web`

Note: `firebase` can still appear as a transitive package-lock dependency of `@react-native-firebase/app`; it is not imported or declared as the web Firebase SDK by the mobile app.

## Firebase

`google-services.json` location:

```powershell
D:\Work\Project\MoneyKai\apps\MoneyKai-mobile\android\app\google-services.json
```

The file is present locally and Gradle processed it for release and debug builds.

How to get SHA-1 and SHA-256:

```powershell
cd D:\Work\Project\MoneyKai\apps\MoneyKai-mobile\android
.\gradlew.bat signingReport
```

For the debug keystore directly:

```powershell
keytool -list -v -alias androiddebugkey -keystore "$env:USERPROFILE\.android\debug.keystore" -storepass android -keypass android
```

For the Play upload/release keystore:

```powershell
keytool -list -v -keystore "<path-to-upload-keystore.jks>" -alias "<upload-key-alias>"
```

Where to add SHA fingerprints:

- Firebase Console -> Project settings -> General -> Your apps -> Android app `com.moneykai.mobile`
- Add both SHA-1 and SHA-256.
- Download the refreshed `google-services.json` and place it at `android/app/google-services.json`.

## Android Studio Manual Steps

Use Android Studio for:

- SDK Platform 36, Build Tools, Platform Tools, Emulator, and command-line tools setup.
- Accepting Android SDK licenses.
- Creating/running an emulator or connecting a physical Android device.
- Native Android debugging if Gradle, manifest merge, signing, or device install issues appear.
- Creating and protecting the final Play upload keystore.
- Verifying Play Console release signing and uploading the final `.aab`.

Do not use Android Studio to edit app business logic unless native debugging requires it.

## Commands

Install/cleanup:

```powershell
cd D:\Work\Project\MoneyKai\apps\MoneyKai-mobile
npm install
npm prune
```

Metro:

```powershell
cd D:\Work\Project\MoneyKai\apps\MoneyKai-mobile
npm run start -- --reset-cache
```

Run on Android:

```powershell
cd D:\Work\Project\MoneyKai\apps\MoneyKai-mobile
npm run android
```

Gradle clean:

```powershell
cd D:\Work\Project\MoneyKai\apps\MoneyKai-mobile
npm run android:clean
```

Debug APK:

```powershell
cd D:\Work\Project\MoneyKai\apps\MoneyKai-mobile
npm run android:assemble:debug
```

Debug artifact:

```text
D:\Work\Project\MoneyKai\apps\MoneyKai-mobile\android\app\build\outputs\apk\debug\app-debug.apk
```

Release APK:

```powershell
cd D:\Work\Project\MoneyKai\apps\MoneyKai-mobile
npm run android:assemble:release
```

Release APK artifact:

```text
D:\Work\Project\MoneyKai\apps\MoneyKai-mobile\android\app\build\outputs\apk\release\app-release.apk
```

Release AAB:

```powershell
cd D:\Work\Project\MoneyKai\apps\MoneyKai-mobile
npm run android:bundle:release
```

Release AAB artifact:

```text
D:\Work\Project\MoneyKai\apps\MoneyKai-mobile\android\app\build\outputs\bundle\release\app-release.aab
```

Play-ready signing:

```powershell
$env:MONEYKAI_UPLOAD_STORE_FILE="C:\path\to\upload-keystore.jks"
$env:MONEYKAI_UPLOAD_STORE_PASSWORD="<store-password>"
$env:MONEYKAI_UPLOAD_KEY_ALIAS="<key-alias>"
$env:MONEYKAI_UPLOAD_KEY_PASSWORD="<key-password>"
npm run android:bundle:release
```

Without those `MONEYKAI_UPLOAD_*` values, release builds fall back to the debug keystore and are not Play-upload-ready.

## Verification

Passed:

- `npm run typecheck`
- `npm run test:capture` - 7 files, 90 tests
- `npm run lint` - passes with two existing unused-variable warnings
- `npm run android:clean`
- `npm run android:assemble:debug`
- `npm run android:assemble:release`
- `npm run android:bundle:release`
- Direct Metro production bundle command

Artifacts created:

- Debug APK: `127,947,517` bytes
- Release APK: `57,292,147` bytes
- Release AAB: `39,158,130` bytes

## Remaining Issues

- Release APK/AAB builds are technically successful, but Play upload requires a real upload keystore configured through `MONEYKAI_UPLOAD_*`.
- Metro still logs a non-fatal `.pytest_cache` EPERM skip in some bundle commands because the monorepo root is watched. The bundle and Gradle builds still succeed.
- Google Sign-In needs Firebase Console SHA-1/SHA-256 fingerprints for the actual debug and upload/release keys.
- Contacts picker was not replaced with a new native contacts dependency; split bill recipient entry remains manual email entry in the CLI build.
- iOS project exists structurally, but this phase verified Android only.
