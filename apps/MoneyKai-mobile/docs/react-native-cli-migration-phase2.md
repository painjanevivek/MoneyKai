# MoneyKai Mobile React Native CLI Migration - Phase 2

Date: 2026-06-11
Branch: `codex/migrate-moneykai-mobile-rn-cli`

## Phase 2 Scope

Phase 2 establishes a React Native CLI shell and native Android build path while preserving the Expo app source as migration reference material.

No backend files were modified.
No website files were intentionally modified. A workspace install briefly changed the web lockfile, and that accidental change was reverted.

## Added CLI Entry and Config

New active React Native CLI files:

- `index.js`
- `App.tsx`
- `metro.config.js`
- `babel.config.js`
- `react-native.config.js`

`app.json` is now React Native CLI-shaped:

```json
{
  "name": "MoneyKai",
  "displayName": "MoneyKai"
}
```

The previous Expo config values were preserved in `docs/expo-config-preserved-phase2.md`.

## Added Navigation Shell

New navigation files:

- `src/navigation/types.ts`
- `src/navigation/AuthNavigator.tsx`
- `src/navigation/AppTabs.tsx`
- `src/navigation/RootNavigator.tsx`

New placeholder screen files:

- `src/screens/PlaceholderScreen.tsx`
- `src/screens/auth/LoginScreen.tsx`
- `src/screens/auth/SignupScreen.tsx`
- `src/screens/auth/ForgotPasswordScreen.tsx`
- `src/screens/app/HomeScreen.tsx`
- `src/screens/app/TransactionsScreen.tsx`
- `src/screens/app/AddTransactionScreen.tsx`
- `src/screens/app/BudgetScreen.tsx`
- `src/screens/app/SavingsScreen.tsx`
- `src/screens/app/ProfileEditScreen.tsx`
- `src/screens/app/NotificationsScreen.tsx`
- `src/screens/app/NotesScreen.tsx`
- `src/screens/app/GroupsScreen.tsx`
- `src/screens/app/SettingsScreen.tsx`
- `src/screens/app/AutoCaptureScreen.tsx`

These placeholders prove the CLI shell and navigation compile. Phase 3 should migrate the real screens from `src/app/**` into these routes.

## Package and Script Changes

The mobile app now starts from `index.js` instead of `expo-router/entry`.

React Native CLI scripts added:

- `start`: `react-native start`
- `android`: `react-native run-android`
- `ios`: `react-native run-ios`
- `android:clean`: `cd android && gradlew.bat clean`
- `android:assemble:debug`: `cd android && gradlew.bat :app:assembleDebug`
- `android:assemble:release`: `cd android && gradlew.bat :app:assembleRelease`
- `android:bundle:release`: `cd android && gradlew.bat :app:bundleRelease`

CLI-safe packages added:

- `@react-navigation/native`
- `@react-navigation/native-stack`
- `@react-navigation/bottom-tabs`
- `react-native-vector-icons`
- `@react-native-community/datetimepicker`
- `@react-native-community/netinfo`
- `@react-native-firebase/app`
- `@react-native-firebase/auth`
- `@react-native-firebase/firestore`
- `@react-native-google-signin/google-signin`
- `@notifee/react-native`
- `react-native-biometrics`
- `react-native-nitro-modules`

React Native CLI/build dev packages added:

- `@react-native-community/cli`
- `@react-native-community/cli-platform-android`
- `@react-native/babel-preset`
- `@react-native/metro-config`
- `@react-native/typescript-config`
- `babel-plugin-module-resolver`

Temporarily retained Expo packages are disabled for native autolinking in `react-native.config.js`.
They remain only because the real Expo-era screens/services have not yet been migrated.

## Android CLI Shell Changes

Android is no longer using Expo prebuild startup wiring:

- `android/settings.gradle` now uses React Native CLI settings and Node-based Gradle plugin resolution.
- `android/build.gradle` no longer applies `expo-root-project`.
- `android/build.gradle` defines explicit SDK/NDK versions:
  - build tools: `36.0.0`
  - min SDK: `24`
  - compile SDK: `36`
  - target SDK: `36`
  - NDK: `27.1.12297006`
- `android/app/build.gradle` now uses `index.js` as the bundle entry.
- `android/app/build.gradle` no longer uses Expo CLI bundling.
- `android/app/build.gradle` applies Google Services only when `android/app/google-services.json` exists.
- `android/app/build.gradle` adds AndroidX Core SplashScreen.
- `android/gradle.properties` now builds 64-bit ABIs only: `arm64-v8a,x86_64`.
- `MainApplication.kt` now uses the plain React Native host.
- `MainActivity.kt` no longer uses Expo splash wrappers.
- `AndroidManifest.xml` no longer contains Expo updates/dev-client metadata.

## Firebase Status

Native Firebase packages are installed and autolinked.
`google-services.json` is still missing, by design.

Required placement:

```text
apps/MoneyKai-mobile/android/app/google-services.json
```

The Gradle Google Services plugin is conditional until that file is added, so the debug shell can build during migration.

## Verification

Passed:

```powershell
npm run typecheck
npx vitest run src/services/captureParser.test.ts src/services/autoCaptureService.test.ts src/services/diagnosticsService.test.ts src/services/diagnosticsUploadService.test.ts src/stores/useCaptureStore.test.ts src/config/environment.test.ts
npm run android:assemble:debug
```

Debug APK produced:

```text
apps/MoneyKai-mobile/android/app/build/outputs/apk/debug/app-debug.apk
```

The full `npm run test:capture` command was not used in Phase 2 because `src/config/smsPolicyConfig.test.ts` still asserts Expo/EAS `app.json` semantics. That test should be rewritten in a later phase to assert `AndroidManifest.xml`, Gradle config, and release build variants instead.

## Remaining Phase 2 Caveats

- The app opens to placeholder CLI screens. Real feature screens move in Phase 3.
- Expo files are still present as migration references:
  - `app.config.js`
  - `eas.json`
  - `expo-env.d.ts`
  - `src/app/**`
  - `plugins/**`
  - `modules/moneykai-native-capture/**`
- Expo packages are still present temporarily but disabled for native autolinking.
- Existing Firebase web SDK services still exist; native Firebase service migration is next.
- The local Expo native capture module has not yet been converted to a React Native native module.
- `react-native-vector-icons` reports a deprecation notice in favor of per-family packages, but it works for this migration phase.

## Phase 3 Recommendation

Migrate real app behavior into the CLI shell:

1. Replace Firebase web SDK auth/firestore with `@react-native-firebase`.
2. Replace `expo-auth-session` Google login with `@react-native-google-signin/google-signin`.
3. Move Login/Register/Forgot Password into `src/screens/auth`.
4. Move Dashboard, Transactions, Add Transaction, Budget, Savings, Settings, Notes, Notifications, Groups, and Auto Capture into `src/screens/app`.
5. Replace `expo-router` calls with React Navigation props/hooks.
6. Replace `@expo/vector-icons` imports with `react-native-vector-icons`.
7. Rewrite the SMS policy test against native Android files.
