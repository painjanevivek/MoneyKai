# Phase 5H Internal Release Signoff

Last reviewed: 2026-06-11

## Release decision

Target: **Play Console internal testing**, not closed testing or public production launch.

Build split:

- **MoneyKai**: Play-safe internal testing build. Must not contain restricted SMS permissions or the SMS receiver.
- **Original MoneyKai**: local/internal APK for full native SMS Research Mode. Must not be uploaded to Play.

## Current build metadata

| Field | Value |
| --- | --- |
| Current commit | `76cc1f3` |
| App display name | `MoneyKai` |
| Android package | `com.moneykai.mobile` |
| Version name | `1.0.0` |
| Version code | `1` |
| Target SDK | `36` |
| Play-safe APK | `artifacts/phase5a/moneykai-phase5-release-no-devclient-arm64.apk` |
| Play-safe AAB | `artifacts/phase5a/moneykai-phase5-release-no-devclient-arm64.aab` |
| Original MoneyKai APK | `artifacts/phase5a/moneykai-phase5-sms-research-local-arm64.apk` |
| Tester group | Internal testers |

## Signoff checklist

| Gate | Status |
| --- | --- |
| Phase 1 native notification capture baseline complete | Complete |
| Phase 2 parser/fixture hardening complete | Complete |
| Phase 3 consent/privacy controls complete | Complete |
| Phase 4 SMS decision complete | Complete: Play-safe manual SMS only; Original MoneyKai local native SMS only |
| Phase 5A build profiles/artifacts complete | Complete |
| Phase 5B one-device validation | Partial, accepted for internal testing with documented external gaps |
| Phase 5C onboarding complete | Complete |
| Phase 5D backend diagnostics active for app-emitted errors | Complete |
| Phase 5E disclosure package | Pending latest doc review |
| Phase 5F mobile regression | Pending latest run |
| Phase 5G web regression | Pending latest run |

## Known issues for internal testers

- Local Gradle release artifacts use the generated debug keystore and are not final Play upload artifacts.
- Play-ready upload requires EAS-managed credentials or a configured project upload keystore.
- Multi-device/OEM validation is incomplete.
- Notification capture behavior with real bank/payment apps needs more live-source evidence.
- Original MoneyKai SMS validation needs real incoming carrier/bank SMS and remains local/internal only.
- Native crash SDK is not installed; backend diagnostics cover app-emitted JS/native-module diagnostics.

## Tester feedback fields

Collect the following for every tester report:

- Build artifact and SHA-256.
- Device model, Android version, OEM skin, and battery mode.
- Whether notification access was granted, denied, revoked, or left disabled.
- Whether a capture draft appeared, whether it was accurate, and whether confirming it updated budget totals.
- Any confusion around SMS Research Mode, notification access, privacy copy, or manual SMS paste.
- Crash, freeze, or failed navigation details with approximate timestamp.

## Final signoff state

Internal release signoff is pending the latest automated runs, artifact rebuilds, artifact inspections, and available-device smoke checks.
