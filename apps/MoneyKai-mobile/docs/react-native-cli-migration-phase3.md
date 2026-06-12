# MoneyKai Mobile React Native CLI Migration - Phase 3

Date: 2026-06-11
Branch: `codex/migrate-moneykai-mobile-rn-cli`

## Phase 3 Scope

Phase 3 connects the React Native CLI shell to real authentication and native Firebase service code.

No backend files were modified.
No backend commit or push was needed.

## Auth Flow Migrated

The placeholder auth screens from Phase 2 were replaced with React Navigation screens:

- `src/screens/auth/LoginScreen.tsx`
- `src/screens/auth/SignupScreen.tsx`
- `src/screens/auth/ForgotPasswordScreen.tsx`

Preserved behavior:

- email/password login
- account registration
- password reset
- Google sign-in entry point
- validation and loading states
- demo-mode fallback behavior

Expo Router calls were removed from the active auth flow. React Navigation now drives auth routes through `src/navigation/AuthNavigator.tsx` and `src/navigation/RootNavigator.tsx`.

## Native Firebase Service Layer

Added native Firebase files:

- `src/firebase/firebaseConfig.ts`
- `src/services/authService.ts`
- `src/services/firestoreService.ts`

Updated compatibility files:

- `src/services/firebase.ts`
- `src/services/firestoreData.ts`

The active auth and Firestore paths now use:

- `@react-native-firebase/app`
- `@react-native-firebase/auth`
- `@react-native-firebase/firestore`
- `@react-native-google-signin/google-signin`

The user-scoped Firestore model is preserved:

```text
users/{uid}/transactions
users/{uid}/notes
users/{uid}/groups
users/{uid}/groups/{groupId}/expenses
users/{uid}/badges
users/{uid}/notifications
users/{uid}/savings
users/{uid}/settings/app
users/{uid}/budgets/current
users/{uid}/backups
```

## Expo-Specific Auth Replacements

Replaced in the active Phase 3 path:

- `firebase/auth` web SDK in `useAuthStore.ts`
- `firebase/firestore` web SDK in `firestoreData.ts`
- `expo-auth-session` in `googleAuth.ts`
- `@expo/vector-icons` in shared `Input` and `Button`

The old `src/app/**` Expo Router files remain as migration reference material only and are excluded from the active CLI TypeScript shell.

## Environment Config

`.env.example` now uses CLI-oriented names:

- `MONEYKAI_FIREBASE_*`
- `MONEYKAI_GOOGLE_*`
- `MONEYKAI_BACKEND_BASE_URL`
- `MONEYKAI_APP_STORE_URL`
- `MONEYKAI_PLAY_STORE_URL`
- `MONEYKAI_DEBUG`
- `MONEYKAI_DEMO_MODE`

For migration tolerance, `src/config/environment.ts` still accepts the old `EXPO_PUBLIC_*` names as fallbacks.

## Firebase Manual Setup Still Required

Add the Android Firebase config file here:

```text
apps/MoneyKai-mobile/android/app/google-services.json
```

Until that file exists, Gradle logs:

```text
[MoneyKai] google-services.json not found. Firebase native configuration will be disabled until android/app/google-services.json is added.
```

The app still builds because the Google Services plugin is applied conditionally during migration.

## Verification

Passed:

```powershell
npm run typecheck
npx vitest run src/services/captureParser.test.ts src/services/autoCaptureService.test.ts src/services/diagnosticsService.test.ts src/services/diagnosticsUploadService.test.ts src/stores/useCaptureStore.test.ts src/config/environment.test.ts
npm run android:assemble:debug
```

Test result:

```text
6 test files passed
86 tests passed
```

Debug APK path:

```text
apps/MoneyKai-mobile/android/app/build/outputs/apk/debug/app-debug.apk
```

## Remaining Phase 3 Caveats

- Auth screens are now real, but the main app tabs are still Phase 2 placeholders.
- Expo packages remain in `package.json` temporarily because legacy `src/app/**` and native capture reference files still need staged migration.
- `google-services.json` has not been added because credentials must come from the Firebase project.
- Google sign-in will need Firebase Console SHA-1/SHA-256 setup before real Android login works.
- `app.config.js`, `eas.json`, and `src/app/**` are still preserved as migration reference files.

## Phase 4 Recommendation

Migrate real protected app screens into `src/screens/app`:

1. Dashboard and income/expense summary.
2. Transactions list and add/edit transaction flow.
3. Budget and category management.
4. Savings/challenges.
5. Notes, groups, notifications, profile/settings, and logout.
6. Replace remaining active Expo imports as each screen is moved.
7. Rewrite the SMS policy test against native Android files instead of Expo/EAS config.
