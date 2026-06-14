# MoneyKai Mobile React Native CLI Migration - Phase 4

Date: 2026-06-11
Branch: `codex/migrate-moneykai-mobile-rn-cli`

## Phase 4 Scope

Phase 4 migrates the protected app experience from placeholder screens to usable React Native CLI screens.

No backend files were modified.
No backend commit or push was needed.

## Protected Flow Migrated

The active tab app now includes:

- dashboard
- transaction list and search/filter/delete
- add transaction
- budget settings and adjustments
- savings challenges
- settings/profile/logout
- cloud backup trigger

Updated navigation:

- `src/navigation/AppTabs.tsx`
- `src/navigation/types.ts`

Updated app screens:

- `src/screens/app/HomeScreen.tsx`
- `src/screens/app/TransactionsScreen.tsx`
- `src/screens/app/AddTransactionScreen.tsx`
- `src/screens/app/BudgetScreen.tsx`
- `src/screens/app/SavingsScreen.tsx`
- `src/screens/app/SettingsScreen.tsx`
- `src/screens/app/screenStyles.ts`

## CLI-Safe Replacements

The protected app path now uses CLI-safe packages for:

- notifications: `@notifee/react-native`
- network state: `@react-native-community/netinfo`
- native date picker: `@react-native-community/datetimepicker`
- icons: `react-native-vector-icons`

Removed Expo imports from the active screens/navigation/services/stores/shared UI scan:

```powershell
rg 'from [''\""]firebase|@expo/vector-icons|expo-auth-session|expo-notifications|expo-network|expo-router|@expo/ui' apps\MoneyKai-mobile\src\screens apps\MoneyKai-mobile\src\navigation apps\MoneyKai-mobile\src\services apps\MoneyKai-mobile\src\stores apps\MoneyKai-mobile\src\components\ui -n
```

The scan returned no matches after Phase 4.

## Firebase Status

`google-services.json` is now present at:

```text
apps/MoneyKai-mobile/android/app/google-services.json
```

The Android debug build executed:

```text
:app:processDebugGoogleServices
```

That confirms Gradle is consuming the Firebase Android config.

## User-Scoped Data

The migrated protected screens write through the existing Zustand stores.
Those stores sync data through the native Firestore service under:

```text
users/{uid}/transactions
users/{uid}/settings/app
users/{uid}/budgets/current
users/{uid}/savings
users/{uid}/notifications
users/{uid}/backups
```

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

## Remaining Phase 4 Caveats

- Notes, groups, notifications list, profile edit, and auto-capture are still placeholder stack screens.
- Charts/analytics are represented by dashboard totals and budget progress, not full chart screens yet.
- Legacy Expo Router files remain under `src/app/**` as migration reference material only.
- Expo packages remain in `package.json` until Phase 5 cleanup confirms no remaining native or reference dependency is needed.
- Google sign-in still requires SHA-1/SHA-256 registration in Firebase Console before real Android login should be trusted.

## Phase 5 Recommendation

Finish release readiness:

1. Migrate or remove remaining placeholder stack screens.
2. Remove legacy `src/app/**`, Expo config files, Expo dependencies, and Expo-only scripts.
3. Rework SMS/release tests to inspect native Android files instead of Expo config.
4. Verify Firebase Auth email and Google login on emulator/device.
5. Generate SHA-1 and SHA-256, add them in Firebase Console, redownload `google-services.json` if needed.
6. Run Gradle clean, debug APK, release APK, and release AAB.
7. Prepare Play Store release checks in Android Studio.
