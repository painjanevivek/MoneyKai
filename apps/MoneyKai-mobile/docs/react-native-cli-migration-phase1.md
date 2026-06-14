# MoneyKai Mobile React Native CLI Migration - Phase 1

Date: 2026-06-11
Branch: codex/migrate-moneykai-mobile-rn-cli

## Phase 1 Scope

This phase preserves the current mobile app state and records the migration inventory before replacing Expo code.
No Expo-to-CLI implementation changes are made in this phase.
No backend files are modified in this phase.

## Current Project Shape

- Mobile app root: `apps/MoneyKai-mobile`
- Website root: `apps/MoneyKai-web`
- The mobile app is TypeScript.
- The mobile app is currently an Expo SDK 56 app using Expo Router.
- A native Android folder already exists, but it is Expo prebuild output rather than a pure React Native CLI Android shell.
- No mobile-root `App.tsx`, `index.js`, `metro.config.js`, or `babel.config.js` currently exists.
- No `google-services.json` was found in the repository.

## Dirty Worktree at Phase Start

Phase 1 started from an already-dirty worktree. Existing modified and untracked files were left intact.

Modified tracked files observed:

- `.easignore`
- `.gitignore`
- `apps/MoneyKai-mobile/.env.example`
- `apps/MoneyKai-mobile/app.config.js`
- `apps/MoneyKai-mobile/app.json`
- `apps/MoneyKai-mobile/docs/phase5-device-validation.md`
- `apps/MoneyKai-mobile/docs/phase5-release-readiness.md`
- `apps/MoneyKai-mobile/eas.json`
- `apps/MoneyKai-mobile/implementation.md`
- `apps/MoneyKai-mobile/package-lock.json`
- `apps/MoneyKai-mobile/package.json`
- `apps/MoneyKai-mobile/src/config/environment.ts`
- `apps/MoneyKai-mobile/src/config/smsPolicyConfig.test.ts`
- `apps/MoneyKai-mobile/src/services/googleAuth.ts`
- `package-lock.json`

Untracked files and folders observed:

- `.gradle-codex-build/`
- `.gradle-codex-build2/`
- `LOGO.jpeg`
- `apps/MoneyKai-mobile/.easignore`
- `apps/MoneyKai-mobile/docs/phase5-internal-release-signoff.md`
- `apps/MoneyKai-mobile/docs/phase5-mobile-regression.md`
- `apps/MoneyKai-mobile/docs/phase5-play-store-disclosures.md`
- `apps/MoneyKai-mobile/docs/phase5-web-regression.md`
- `apps/MoneyKai-mobile/src/config/environment.test.ts`
- `scripts/generate-play-store-assets.ps1`

## Expo Dependencies and Files

Expo entry and config:

- `package.json` main entry: `expo-router/entry`
- `app.json`
- `app.config.js`
- `eas.json`
- `expo-env.d.ts`
- `.expo/`
- Expo Router route tree under `src/app`

Expo packages currently present include:

- `expo`
- `expo-router`
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
- `@expo/google-fonts/poppins`
- `@expo/ui`
- `@expo/vector-icons`

Expo-specific source patterns:

- Expo Router imports in 30+ files.
- `@expo/vector-icons` imports across app screens and shared components.
- `@expo/ui/community/datetime-picker` in transaction and monthly reset UI.
- `expo-auth-session` in Google auth.
- `expo-notifications` in notification service and root layout.
- `expo-network` in sync queue/coordinator.
- `expo-local-authentication` in app lock.
- `expo-font`, `expo-splash-screen`, `expo-status-bar`, `expo-web-browser`, and `expo-constants` in root layout.
- `requireOptionalNativeModule` from `expo` in native capture bridge.

## Android State

Current Android package:

- `com.moneykai.mobile`

The Android folder is Expo-prebuild shaped:

- `android/settings.gradle` includes Expo autolinking settings and Expo modules.
- `android/build.gradle` applies `expo-root-project`.
- `android/app/build.gradle` resolves the JS entry through Expo scripts and uses Expo CLI bundling.
- `android/app/src/main/AndroidManifest.xml` contains Expo updates and notifications metadata.
- `MainApplication.kt` uses `ExpoReactHostFactory` and `ApplicationLifecycleDispatcher`.
- `MainActivity.kt` uses Expo splash-screen and `ReactActivityDelegateWrapper`.

The CLI migration must de-Expo these files while preserving app identity, icons, resources, package name, and signing config intent.

## Native Capture Module

Current module path:

- `modules/moneykai-native-capture`

Current module status:

- Uses Expo Modules metadata and Gradle plugin.
- Kotlin source provides notification listener and SMS research/native capture logic.
- JS bridge currently uses Expo `requireOptionalNativeModule`.

CLI migration requirement:

- Preserve the Kotlin logic as source material.
- Rewrite the module as a standard React Native Android native module/package.
- Keep production restricted SMS permissions disabled unless explicitly building an internal research variant.

## Firebase and User Data

Existing Firebase implementation uses the web Firebase SDK:

- `src/services/firebase.ts`
- `src/services/googleAuth.ts`
- `src/services/firestoreData.ts`
- `src/stores/useAuthStore.ts`

Existing Firestore user scoping:

- User data is stored under `users/{uid}/...`.
- `firestore.rules` allows reads/writes only when `request.auth.uid == userId`.

Important collections and user-owned data to preserve:

- transactions
- notes
- groups
- group expenses
- badges
- notifications
- savings/challenges
- app settings
- budget settings
- backups
- profile/session state

CLI migration requirement:

- Move Firebase config to `src/firebase/firebaseConfig.ts`.
- Move auth operations to `src/services/authService.ts`.
- Move Firestore operations to `src/services/firestoreService.ts`.
- Use `@react-native-firebase/app`, `@react-native-firebase/auth`, and `@react-native-firebase/firestore`.
- Use `@react-native-google-signin/google-signin` for Google login.
- Do not invent Firebase credentials.

## Screens and Navigation to Preserve

Expo Router currently has 46 files under `src/app`.

Primary app screens to migrate first:

- Login
- Signup
- Forgot password
- Dashboard
- Transactions
- Add transaction composer
- Budget
- Savings
- Notifications
- Notes
- Groups
- Settings
- Profile edit
- Auto capture
- Learn center if retained as a native content section

Navigation target:

- `src/navigation/RootNavigator.tsx`
- `src/navigation/AuthNavigator.tsx`
- `src/navigation/AppTabs.tsx`
- React Navigation native stack for auth/protected flows.
- Bottom tabs for primary app areas.
- Hidden stack screens for settings/profile/notifications/notes/groups/auto-capture as needed.

## CLI-Safe Replacement Map

- `expo-router` -> `@react-navigation/native`, `@react-navigation/native-stack`, `@react-navigation/bottom-tabs`
- `@expo/vector-icons` -> `react-native-vector-icons/MaterialCommunityIcons`
- `@expo/ui/community/datetime-picker` -> `@react-native-community/datetimepicker`
- `expo-auth-session` -> `@react-native-google-signin/google-signin`
- Firebase web SDK -> `@react-native-firebase/app`, `@react-native-firebase/auth`, `@react-native-firebase/firestore`
- `expo-network` -> `@react-native-community/netinfo`
- `expo-local-authentication` -> CLI-safe biometric/keychain package
- `expo-notifications` -> CLI-safe local notification package, likely Notifee
- `expo-status-bar` -> React Native `StatusBar`
- `expo-font` and Expo Google Fonts -> bundled font assets through native RN font linking
- `expo-splash-screen` -> native Android launch theme and resources
- `expo-constants` app version reads -> package/native config fallback

## Backend Rule for Later Phases

If a later phase modifies backend code or backend contracts, that backend change must be committed with a clear message and pushed before moving on.
Phase 1 did not modify backend code.

## Next Phase

Phase 2 should create the pure React Native CLI app shell while preserving existing screens and services for gradual migration:

- Add `index.js`, `App.tsx`, `metro.config.js`, `babel.config.js`.
- Convert `tsconfig.json` away from `expo/tsconfig.base`.
- Update mobile `package.json` scripts and dependencies.
- Create `src/navigation`.
- Begin moving the auth and primary tab screens from `src/app` into `src/screens`.
- Keep old Expo files temporarily until replacements compile, then remove them in a later cleanup phase.
