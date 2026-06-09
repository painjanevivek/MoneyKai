# SMS Research Validation

Last reviewed: 2026-06-10

## Scope

SMS Research Mode is an internal-only prototype. It must not be treated as production-ready until device validation, Google Play permission review, privacy review, and release signoff are complete.

## Current Policy Review

Google Play treats SMS and Call Log permissions as high-risk or sensitive permissions. Apps that do not qualify must remove those permissions from the manifest, and qualifying apps must declare the permissions in Play Console. Google Play lists SMS-based money management as a possible exception for apps that track or manage budgets, with eligible permissions including `READ_SMS`, `RECEIVE_MMS`, `RECEIVE_SMS`, and `RECEIVE_WAP_PUSH`, but exceptions remain subject to Google Play review and broader user-data policy requirements.

Policy source: https://support.google.com/googleplay/android-developer/answer/10208820

MoneyKai decision for this validation pass: keep SMS as research-only. Production and preview builds must not register the SMS receiver or request restricted SMS permissions.

## Automated Validation

| Check | Status | Evidence |
| --- | --- | --- |
| Preview and production EAS profiles disable `EXPO_PUBLIC_SMS_RESEARCH_BUILD` | Passed | `src/config/smsPolicyConfig.test.ts` |
| Static app config does not request restricted SMS permissions | Passed | `src/config/smsPolicyConfig.test.ts` |
| Dynamic Expo config loads SMS manifest plugin only when research flag is true | Passed | `src/config/smsPolicyConfig.test.ts` |
| Capture backup snapshot excludes capture inbox state and raw SMS bodies by default | Passed | `src/config/smsPolicyConfig.test.ts` |
| Native SMS receiver compiles in the local Expo module | Passed | `./gradlew.bat :moneykai-native-capture:compileDebugKotlin --console=plain` |
| SMS parser ignores OTP, promotional, failed, and non-financial messages through fixtures | Passed | `npm.cmd run mobile:test:capture` |

## Device Validation Matrix

These tests require physical Android devices or a managed device lab. They are not complete on the current workstation.

| Area | Required Coverage | Current Status |
| --- | --- | --- |
| Android versions | At least Android 10/11, Android 12/13, Android 14/15+ | Pending device access |
| OEM behavior | Samsung, Xiaomi/Redmi, OnePlus, Vivo/Oppo, Realme, Motorola where possible | Pending device access |
| Dual-SIM behavior | Incoming transaction SMS on SIM 1 and SIM 2, sender availability, timestamp accuracy | Pending dual-SIM device |
| Permission denied/revoked | Install without SMS permission, deny permission, revoke permission, re-enable permission | Pending device build |
| Background delivery | App foreground, background, killed/restarted, battery saver enabled | Pending device build |
| Queue flushing | SMS received while JS bridge is inactive flushes only after source controls allow it | Pending device build |
| Data minimization | Confirm no raw SMS body appears in UI, backup, or normal persisted capture state | Pending device build |

## Release Gate

SMS Research Mode cannot move beyond internal research until:

- The full device matrix is completed with build ID, commit hash, Android version, OEM, and observed result.
- Production AAB inspection confirms no restricted SMS permissions when `EXPO_PUBLIC_SMS_RESEARCH_BUILD=false`.
- Google Play declaration, legal/privacy review, and Data Safety copy are prepared if production SMS is considered.
- Any failures around background delivery, permission revocation, dual-SIM handling, or noisy drafts are fixed and retested.
