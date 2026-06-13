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

## SMS Account Flow

| Step | Expected result | Pass/Fail | Evidence |
| --- | --- | --- | --- |
| Install research build fresh | SMS access starts denied or disabled until the user enables research mode | | |
| Enable SMS Research Mode | App explains SMS use and requests permission through Android runtime/settings flow | | |
| Discover SMS accounts | Pending bank account cards appear from eligible financial SMS only | | |
| Open evidence dialog | Redacted sender/body/date preview appears; OTPs, account digits, references, long numbers, and UPI IDs are hidden | | |
| Approve one account | Account moves to monitored/approved and import starts for the selected range | | |
| Confirm pending drafts | Each draft requires review; suggested category can be changed before approval | | |
| Unselect approved account | Account moves to paused/unselected state and future import skips it | | |
| Re-import same range while unselected | Summary counts the account as skipped; no new drafts for that account | | |
| Resume account | Account becomes approved again and native approved-account list is updated | | |
| Re-import same range after resume | Eligible SMS from the resumed account are included; duplicates are skipped | | |
| Decline pending account | Account does not import until explicitly selected again | | |

## Large Import Matrix

Run every range at least once with a real inbox, then run it again to confirm duplicate behavior.

| Range | First import expected | Retry expected | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 15 days | Progress sheet updates; only eligible approved accounts draft | Same SMS skipped as duplicate | | |
| 1 month | Progress sheet updates; UI remains usable | Same SMS skipped as duplicate | | |
| 3 months | Batched ingestion; no UI freeze | Same SMS skipped as duplicate | | |
| 6 months | Batched ingestion; draft cap warning appears if needed | Same SMS skipped as duplicate | | |
| 1 year | Native scan respects safety caps | Same SMS skipped as duplicate | | |
| ALL | Native scan pages safely until complete or capped | Same SMS skipped as duplicate | | |

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
| Inbox rows scanned | Recorded from summary | |
| Eligible financial SMS | Recorded from summary | |
| Drafted transactions | Recorded from summary | |
| Duplicate skipped | Recorded from summary | |
| Parser ignored | Recorded from summary | |
| Unselected account skipped | Recorded from summary | |
| Time to first progress update | Under 2 seconds on modern devices | |
| Longest visible UI stall | No obvious multi-second freeze | |
| App memory trend | No crash or repeated low-memory kill | |
| Draft review UI | Does not attempt to render thousands of full cards at once | |

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
