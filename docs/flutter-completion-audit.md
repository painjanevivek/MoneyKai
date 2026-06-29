# MoneyKai Flutter Completion Audit

Last reviewed: 2026-06-29

This audit checks the current Flutter app against the requested Android-first, iOS-ready MoneyKai goal. It is not a substitute for the phase docs; it is a requirement-to-evidence map for final readiness decisions.

## Overall Status

Status: not complete.

Reason: the Android MVP implementation, emulator QA, unsigned release artifacts, and iOS-compatible codebase are in place, but the full requested end state still has external gates:

- No production Android upload keystore has been provided, so no Play-ready signed APK/AAB exists.
- Real TalkBack spoken-output QA is still pending.
- Physical Android device performance and cold-start QA are still pending.
- iOS simulator, real-device, archive, IPA, and TestFlight validation require macOS/Xcode and Apple signing.

## Evidence Summary

Primary project:

```text
apps\MoneyKai-flutter
```

Current Android identity:

```text
applicationId = com.moneykai.mobile
namespace = com.moneykai.mobile
app label = MoneyKai
version = 1.0.1+2
```

Current artifact evidence:

| Artifact | Status | Evidence |
| --- | --- | --- |
| Debug APK | Built | `apps\MoneyKai-flutter\build\app\outputs\flutter-apk\app-debug.apk` |
| Unsigned release APK | Built for inspection | `apps\MoneyKai-flutter\build\app\outputs\flutter-apk\app-release.apk` |
| Unsigned release AAB | Built for inspection | `apps\MoneyKai-flutter\build\app\outputs\bundle\release\app-release.aab` |
| Play-ready signed AAB | Not complete | Requires production upload keystore and `.\tool\audit_android_release.ps1 -RequireSigned` |

Latest documented verification commands:

```powershell
dart format lib test
flutter analyze
flutter test
.\tool\audit_ios_project.ps1
flutter build apk --debug
flutter build apk --release
flutter build appbundle --release
.\tool\audit_android_release.ps1
```

CI evidence path:

```text
.github\workflows\moneykai-flutter-android.yml
```

The CI workflow mirrors the Android verification loop for Flutter app changes on push and pull request.

## Requirement Audit

| Requirement | Current status | Evidence |
| --- | --- | --- |
| Build with Flutter and Dart | Complete | Flutter app exists under `apps\MoneyKai-flutter`; phase docs and README identify the Flutter implementation. |
| Do not blindly reuse old React Native implementation | Complete | `docs\flutter-phase1-previous-app-memory.md` documents prior app memory and what was carried forward as product context. |
| Android first | Complete for unsigned/emulator state | Debug APK, unsigned release APK, unsigned AAB, emulator QA, permission audit, and release audit are documented in `docs\flutter-phase6-android-build.md`. |
| iOS-ready same codebase | Partially complete | iOS bundle/display config and dependency compatibility are documented in `docs\flutter-phase7-ios-parity.md`; actual iOS build requires macOS/Xcode. |
| Environment verification before code | Complete | `docs\flutter-phase0-environment.md` documents Flutter/Dart/Android readiness and Windows/iOS limitation. |
| Previous app recollection | Complete | `docs\flutter-phase1-previous-app-memory.md` records screens, flows, storage, UI decisions, and discarded historical APK concerns. |
| MVP scope freeze | Complete | `docs\flutter-phase2-mvp-scope.md` defines screens, containers, offline-first behavior, and non-goals. |
| Feature-first architecture | Complete | `docs\flutter-phase3-architecture.md` documents `lib\features`, repositories, Riverpod, routing, and local storage boundaries. |
| Design system | Complete for MVP | `docs\flutter-phase4-design-system.md` documents tokens, components, screen shell, metric cards, transaction rows, budget cards, and responsive behavior. |
| Core MVP screens functional | Complete for local MVP | Splash/onboarding, local auth, dashboard, add transaction, transactions list, budget, insights, settings, and privacy/security are implemented and covered by tests/manual QA. |
| Local persistence after restart | Complete | Repository tests cover persistence; emulator QA captures restart/session persistence in `docs\flutter-phase8-testing-self-review.md`. |
| No dead routes / visible broken buttons | Complete for current MVP | Widget tests and emulator QA cover navigation/settings actions; coming-soon backend/auth/store work is documented outside the MVP UI surface. |
| Local JSON export | Complete | Settings export tests and emulator evidence are documented in `docs\flutter-phase8-testing-self-review.md`. |
| Encrypted backup export | Complete | AES-GCM/PBKDF2 unit tests, Settings flow, and Android share-sheet evidence are documented. |
| Encrypted backup restore | Complete on Android emulator | Unit tests validate restore behavior; selected-file restore from Downloads is documented with QA10 evidence in `docs\flutter-phase8-testing-self-review.md`. |
| Local error capture | Complete for local reports | Diagnostics tests and docs cover bounded local error report capture. |
| Android app icon and launch assets | Complete | Phase 6 docs record source and generated asset hashes. |
| Android permission audit | Complete for current artifacts | Phase 6 docs and `.\tool\audit_android_release.ps1` verify no restricted SMS/storage/contact/camera/mic/location permissions. |
| Android release signing config | Partially complete | Gradle requires all `MONEYKAI_UPLOAD_*` vars or leaves release unsigned; audit script catches partial env. Actual production signed artifacts require keystore. |
| Android CI verification | Complete | `.github\workflows\moneykai-flutter-android.yml` runs format, analyzer, tests, Android debug/release builds, AAB build, and release audit for Flutter app changes. |
| iOS static project audit | Complete for non-Xcode checks | `apps\MoneyKai-flutter\tool\audit_ios_project.ps1` verifies bundle id, display name, Flutter version placeholders, deployment target, app icons, launch images, no sensitive iOS permission declarations, and no known Android-only dependencies; CI runs it on Flutter app changes. |
| Play Store-ready artifact | Not complete | No upload keystore was provided; current release APK/AAB are unsigned inspection artifacts. |
| Android emulator manual QA | Mostly complete | Fresh install, auth, transactions, budget, insights, export, encrypted backup export/restore, reset, sign out, visual, and hierarchy QA are documented. |
| TalkBack spoken-output QA | Not complete | Accessibility hierarchy exists, but real spoken-output QA is still pending. |
| Physical Android device QA | Not complete | No physical Android device is connected; `apps\MoneyKai-flutter\tool\collect_android_runtime_qa.ps1 -RequirePhysical` is ready to collect launch timing, screenshot, hierarchy, and device evidence once hardware is available. |
| iOS simulator/device/archive/TestFlight | Not complete | Current machine is Windows; macOS/Xcode and Apple Developer signing are required. |
| Security/privacy self-review | Partially complete | Permissions, local-only boundaries, reset namespace, encrypted backups, and privacy copy are documented; local storage is not encrypted and real auth/backend sync remain future work. |
| Backend sync | Future work | Repository boundaries are ready; no backend sync implementation exists. |
| Real authentication | Future work | Local auth/session boundary exists; real auth integration is still outside the MVP. |
| Remote crash dashboard | Future work | Local error capture exists; no remote crash/error dashboard SDK or backend is configured. |

## Remaining Gates

Required before Play Store internal testing:

1. Provide or create the production Android upload keystore outside the repo.
2. Set all four signing variables:
   - `MONEYKAI_UPLOAD_STORE_FILE`
   - `MONEYKAI_UPLOAD_STORE_PASSWORD`
   - `MONEYKAI_UPLOAD_KEY_ALIAS`
   - `MONEYKAI_UPLOAD_KEY_PASSWORD`
3. Rebuild release APK/AAB.
4. Run:

```powershell
.\tool\audit_android_release.ps1 -RequireSigned
```

5. Smoke test the signed artifact.
6. Run real TalkBack spoken-output QA.
7. Run physical Android device performance and cold-start QA:

```powershell
cd apps\MoneyKai-flutter
.\tool\collect_android_runtime_qa.ps1 -Install -RequirePhysical
```

Required before TestFlight:

1. Move to macOS with Xcode.
2. Run `flutter doctor -v` on macOS.
3. Configure Apple Developer team and provisioning.
4. Run iOS simulator QA.
5. Run iOS real-device QA.
6. Archive and upload with Xcode Organizer.

## Completion Decision

The goal should remain active. The current repo proves an Android-first Flutter MVP with strong local/emulator verification and iOS-ready project structure, but it does not yet prove production-store readiness because required signing credentials, physical-device accessibility/performance QA, and macOS/Xcode iOS validation are missing.
