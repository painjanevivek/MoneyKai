# SMS Capture Real-Device QA

Last reviewed: 2026-06-13

## Scope

This checklist validates the remaining device-only SMS account flow, large import, retry, and performance work from `D:\Work\Project\Plans\sms-auto-capture-account-calendar-budget-plan.md`.

These checks require a physical Android device and real or user-approved test SMS inbox data. ADB shell broadcasts are not a substitute for `SMS_RECEIVED`, because Android protects that broadcast.

## Build Prerequisites

- Use an Android development or internal research build only.
- Set `EXPO_PUBLIC_SMS_RESEARCH_BUILD=true`.
- Set `EXPO_PUBLIC_NATIVE_SMS_RESEARCH_BUILD=true`.
- Confirm the installed package declares SMS permissions only for this research build.
- Confirm release/preview profiles keep `EXPO_PUBLIC_NATIVE_SMS_RESEARCH_BUILD=false`.
- Start from a known app account with an active monthly budget and no pending capture drafts unless the test case says otherwise.

## Device Matrix

Record every run in this table format:

| Date | Commit | Device | Android/API | OEM skin | SIM setup | App build | Result | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| | | | | | Single SIM / Dual SIM | debug/internal | Pass / Fail | |

Minimum target coverage:

- Android 10 or 11.
- Android 12 or 13.
- Android 14, 15, or 16.
- At least Samsung, Xiaomi/Redmi, OnePlus/Oppo/Vivo/Realme, and Motorola where available.
- Dual-SIM incoming SMS on SIM 1 and SIM 2 where a dual-SIM device is available.

## Device Connection Session - 2026-06-13

| Check | Result | Evidence |
| --- | --- | --- |
| ADB available | Passed | `adb version` reported Android Debug Bridge `37.0.0-14910828` from `D:\Android\Sdk\platform-tools\adb.exe` |
| Wireless pairing | Passed | `adb pair 192.168.0.3:43165 846123` returned successfully paired |
| Wireless connect | Passed | After the user supplied a new pairing session, `adb mdns services` discovered the `_adb-tls-connect` endpoint and `adb devices -l` listed the device |
| Device identified | Passed | Device reported model `AIN065`, product `PongIND`, Android `16`, API `36` |
| Clean source-matched rebuild | Passed | Deleted generated `node_modules`, `.gradle-project-cache`, and `android`; reinstalled dependencies; `expo config --type prebuild --json`, `expo prebuild --platform android --no-install`, and `:app:assembleDebug` completed successfully |
| Installed app identified | Passed | Fresh debug APK reported package `com.moneykai.mobile`, `versionCode=1`, `versionName=1.0.0` |
| SMS permissions on research build | Passed | Fresh debug APK requested and was granted `READ_SMS` and `RECEIVE_SMS` for user 0; `READ_SMS`, `RECEIVE_SMS`, and `POST_NOTIFICATIONS` were granted before launch |
| Notification capture access | Passed | `dumpsys notification` listed MoneyKai's notification listener service as enabled |

Pairing note: Android wireless debugging uses a short-lived pairing-code port and a separate connect port. The first pairing succeeded but could not connect until a later pairing session exposed the `_adb-tls-connect` service.

## Physical Device Run - 2026-06-13

| Check | Result | Evidence |
| --- | --- | --- |
| Inbox availability | Passed | Device inbox metadata query returned 8,713 rows using `_id`, `date`, and `address` projection only; raw SMS bodies were not queried |
| Debug app startup | Passed with note | Debug APK requires Metro; without Metro it showed the expected React Native "Unable to load script" screen. With Metro on `tcp:8081` and `adb reverse tcp:8081 tcp:8081`, the app loaded correctly. |
| Runtime blocker found and fixed | Passed | Initial main-tab load hit a `WealthScreen` maximum-update-depth loop. `wealth.tsx` now uses stable store slices plus memoized `buildWealthOverview`, and the main tab shell loads after relaunch. |
| Auto Capture prerequisites | Passed | Transaction Capture screen was reachable and showed Auto Capture controls, native SMS import action, manual paste action, pending/learned counters, and range controls. |
| Range selector visibility | Passed | The current source-matched build exposed `15 days`, `1 month`, `3 months`, `6 months`, `1 year`, and `ALL`; `ALL` was selectable. |
| Native capture source startup | Passed | Native diagnostics showed capture source updates ending with `notificationEnabled=true` and `smsEnabled=true`, followed by `nativeCapture.startListening`. |
| Real inbox discovery import | Passed with privacy note | Tapping `Import recent SMS` with `ALL` triggered real-device SMS discovery sheets. Observed samples were redacted in UI, including masked account hints and long number redaction. |
| Large-inbox responsiveness smoke test | Partial | The real inbox discovery path opened and remained responsive on the large inbox, but the full range matrix and retry timing still need a controlled pass. |
| Approved account visibility | Pending on clean build | The source-matched screen is reachable, but approve/unselect/resume still needs a controlled account-state test. |
| Empty manual paste validation | Pending on clean build | Use synthetic SMS text for the next safe category-review pass to avoid exposing private inbox content. |
| Source/install parity | Passed | The installed debug APK was rebuilt from the current source after a clean generated-folder reset. |

## SMS Account Flow

| Step | Expected result | Pass/Fail | Evidence |
| --- | --- | --- | --- |
| Install research build fresh | SMS access starts denied or disabled until the user enables research mode | | |
| Enable SMS Research Mode | App explains SMS use and requests permission through Android runtime/settings flow | | |
| Discover SMS accounts | Pending bank account cards appear from eligible financial SMS only | | |
| Open evidence dialog | Redacted sender/body/date preview appears; OTPs, account digits, references, long numbers, and UPI IDs are hidden | | |
| Approve one account | Account moves to monitored/approved and import starts for the selected range | Pending | Discovery surfaced real inbox candidates, but the approval path was not completed to avoid inspecting private SMS content during this run |
| Confirm pending drafts | Each draft requires review; suggested category can be changed before approval | | |
| Unselect approved account | Account moves to paused/unselected state and future import skips it | Pending | Needs a controlled approved-account state on the clean build |
| Re-import same range while unselected | Summary counts the account as skipped; no new drafts for that account | Pending | Needs a controlled approved-account state on the clean build |
| Resume account | Account becomes approved again and native approved-account list is updated | Pending | Needs a controlled paused-account state on the clean build |
| Re-import same range after resume | Eligible SMS from the resumed account are included; duplicates are skipped | Pending | Needs a controlled paused-account state on the clean build |
| Decline pending account | Account does not import until explicitly selected again | | |

## Large Import Matrix

Run every range at least once with a real inbox, then run it again to confirm duplicate behavior.

| Range | First import expected | Retry expected | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 15 days | Progress sheet updates; only eligible approved accounts draft | Same SMS skipped as duplicate | Pending | Range control is visible on the clean build; run remains pending |
| 1 month | Progress sheet updates; UI remains usable | Same SMS skipped as duplicate | Pending | Range control is visible on the clean build; run remains pending |
| 3 months | Batched ingestion; no UI freeze | Same SMS skipped as duplicate | Pending | Range control is visible on the clean build; run remains pending |
| 6 months | Batched ingestion; draft cap warning appears if needed | Same SMS skipped as duplicate | Pending | Range control is visible on the clean build; run remains pending |
| 1 year | Native scan respects safety caps | Same SMS skipped as duplicate | Pending | Range control is visible on the clean build; run remains pending |
| ALL | Native scan pages safely until complete or capped | Same SMS skipped as duplicate | Partial | `ALL` was selected and real inbox discovery opened without crash; full import summary and retry behavior remain pending |
| Installed default recent import | Completes safely on real inbox | Same SMS skipped as duplicate | Superseded | Older installed-build smoke result is retained as historical evidence only |

## Interrupt And Retry

| Scenario | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- |
| Background app during import | Import does not create duplicate final transactions when resumed/retried | | |
| Lock device during import | App recovers with safe summary or allows retry | | |
| Kill app during import | Retry skips already-ingested signals and drafts | | |
| Revoke SMS permission | Import stops with permission status, not a crash | | |
| Re-enable SMS permission | Import can run again after user action | | |
| Toggle approved account mid-test | Paused account is skipped; resumed account is included | | |

## Performance Validation

Capture these values for every large import run:

| Metric | Target | Actual |
| --- | --- | --- |
| Inbox rows scanned | Recorded from summary | 8,713 inbox rows available from metadata-only device query; installed import summary did not expose scanned count |
| Eligible financial SMS | Recorded from summary | |
| Drafted transactions | Recorded from summary | |
| Duplicate skipped | Recorded from summary | 60 on installed default recent import |
| Parser ignored | Recorded from summary | |
| Unselected account skipped | Recorded from summary | |
| Time to first progress update | Under 2 seconds on modern devices | |
| Longest visible UI stall | No obvious multi-second freeze | No crash or stuck state observed during the roughly 10-second default import smoke run |
| App memory trend | No crash or repeated low-memory kill | |
| Draft review UI | Does not attempt to render thousands of full cards at once | |

Current remaining work before this matrix can be marked complete:

- Re-run the approval, unselect, re-import skip, resume, and range-specific large import checks on the clean source-matched build.
- Prefer synthetic pasted SMS for category-review checks and only inspect real inbox discovery content with explicit user consent.
- Record per-range timing, progress behavior, and retry summaries for 15 days, 1 month, 3 months, 6 months, 1 year, and ALL.

Pass criteria:

- Progress appears during large scans.
- Import can be retried safely.
- UI remains responsive while JS ingestion batches run.
- Confirmed transaction history remains deduplicated and newest-first.
- Raw SMS bodies do not appear in diagnostics, backups, or persisted capture store state.

## Native Import Tests

Automated native filter coverage lives in:

- `modules/moneykai-native-capture/android/src/test/java/com/moneykai/nativecapture/MoneyKaiSmsFiltersTest.kt`

Run when an Android Gradle wrapper or project Gradle command is available:

```bash
./gradlew :moneykai-native-capture:testDebugUnitTest --console=plain
```

If the generated Android project has no wrapper in the checked-in tree, regenerate/prebuild the native project in the normal Expo workflow, then run the same module test task from the Android project root.

Current local status on 2026-06-13:

- Kotlin unit tests are present in source.
- The Android project was regenerated by Expo prebuild and the debug app assembled successfully from `apps/MoneyKai-mobile/android`.
- Native import/filter tests passed through `.\gradlew.bat :moneykai-native-capture:testDebugUnitTest --console=plain`: build successful, 71 actionable tasks with 6 executed.
- Mobile capture tests passed through `npm.cmd run test:capture`: 12 test files, 117 tests.
