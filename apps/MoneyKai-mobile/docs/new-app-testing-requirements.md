# New App Testing Requirements

Last reviewed: 2026-06-10

## Purpose

This document defines what MoneyKai would need before building or releasing a new production app, especially one that imports or fetches financial transactions from notifications, SMS, pasted messages, bank sync, or manual entry.

The goal is to make testing robust, scalable, efficient, professional, and production-grade from the first build instead of fixing trust, permission, and device problems late in development.

## Required Access And Rights

### Development Rights

- Repository access with permission to create branches, run builds, and update documentation.
- Access to package manager credentials if private packages are used.
- Access to the app signing setup for Android debug, internal, and release builds.
- Access to Expo/EAS project credentials if cloud builds, updates, or submissions are used.
- Access to Firebase, Supabase, or backend project credentials if the app depends on authentication, storage, analytics, or remote configuration.
- Access to environment variables for development, staging, and production.

### Android Device Rights

- USB debugging enabled on physical Android devices.
- ADB authorization granted for the development machine.
- Ability to install debug and internal test builds.
- Ability to open Android Settings and grant or revoke permissions manually.
- Ability to enable and disable notification listener access.
- Ability to test battery saver, background restrictions, auto-start restrictions, and OEM app management controls.
- Ability to test with real SIM cards if SMS capture, dual-SIM behavior, or carrier delivery is in scope.

### User Permission Requirements

The app must clearly ask for each permission only when needed and explain why it is required.

- Notifications: needed for alerts and, if approved, notification-based transaction detection.
- Notification listener access: needed only for automatic capture from notifications on Android. This is a high-trust permission and must be optional.
- SMS permissions: needed only for research or approved production SMS capture. This is a restricted Google Play permission area.
- Biometric/local authentication: needed only for app lock, secure screens, or sensitive actions.
- Contacts: needed only for group/split features that import contacts.
- Photo library or camera: needed only for profile images, receipt scans, or attachment features.
- Location: avoid unless there is a direct user-facing feature that truly requires it.

## Policy And Legal Gates

Before production release, the team must confirm:

- Google Play policy eligibility for any restricted permission such as SMS or Call Log.
- Play Console declarations for restricted permissions, if used.
- Privacy policy language covering what is collected, why, retention period, deletion process, and support contact.
- Data Safety form accuracy for notifications, SMS-derived data, transaction records, backups, analytics, and crash reports.
- User consent screens for sensitive capture features.
- In-app controls to pause automatic capture, clear pending capture data, and disable research features.
- No raw SMS body or full notification content is stored longer than necessary.
- Production builds do not include research-only permissions or receivers unless policy approval is complete.

## Test Environments

Use separate environments so testing does not pollute real production data.

| Environment | Purpose | Requirements |
| --- | --- | --- |
| Local | Developer testing | Debug build, local logs, mock data, seeded stores |
| Internal | Real device validation | Internal Android build, staging backend, test accounts |
| Staging | Release rehearsal | Production-like backend, analytics, crash reporting, migration tests |
| Production | Public release | Signed release build, policy-approved permissions, monitoring enabled |

## Physical Device Matrix

Device testing is mandatory for mobile finance workflows because emulators do not fully represent OEM permission behavior, background delivery, notification privacy, or dual-SIM routing.

| Area | Minimum Coverage |
| --- | --- |
| Android versions | Android 10/11, Android 12/13, Android 14/15+, current latest Android |
| OEMs | Samsung, Xiaomi/Redmi, OnePlus/Oppo/Vivo/Realme, Motorola, Pixel |
| SIM behavior | Single SIM, dual SIM, default SIM changes, inactive SIM, roaming if relevant |
| App state | Foreground, background, force-stopped/reopened, after reboot |
| Power state | Normal mode, battery saver, OEM restricted mode |
| Permissions | Fresh install, denied, granted, revoked, re-granted |
| Network | Online, offline, poor network, Wi-Fi only, mobile data only |
| Security | Device lock enabled, biometric app lock enabled, notification previews hidden |

## Transaction Capture Testing

### Manual Transactions

- User cannot add transactions before setting the monthly budget.
- Amount, description, date, category, and payment method validation works.
- Income and expense flows both work.
- Edit and delete flows preserve budget calculations.
- Invalid dates, empty fields, and zero amounts are blocked.
- Large values and long descriptions do not break layout.

### Notification Capture

- Notification listener setup is optional and reversible.
- Hidden notification content is detected and handled gracefully.
- Notifications from banking, UPI, wallet, and merchant apps are parsed only when enough data is visible.
- Duplicate notifications do not create duplicate transactions.
- Revoking notification access immediately stops capture.
- Capture queue is flushed only when user controls allow it.

### SMS Capture

- SMS capture is disabled in production unless policy approval is complete.
- Fresh install does not grant SMS permission automatically.
- The app must request Android `RECEIVE_SMS` runtime permission only after clear in-app consent.
- Permission grant, deny, revoke, and re-enable are tested manually on device.
- Real carrier SMS is tested because Android blocks fake `SMS_RECEIVED` broadcasts from ADB.
- Dual-SIM SMS behavior is tested for SIM 1 and SIM 2.
- Native capture stores only sanitized parsed snippets and allowlisted metadata such as SIM slot/subscription. Raw SMS bodies must not be persisted in capture history or backups.
- OTP, promotional, failed, reversed, and non-financial messages are ignored.
- Raw SMS body is discarded after parsing unless explicit research logging is enabled for internal builds.

### Pasted SMS Import

- Pasted SMS import requires monthly budget setup.
- Pasted text produces a reviewable draft, not an automatic confirmed transaction.
- Raw pasted text is discarded after parsing.
- Duplicate pasted messages are detected.
- Invalid or incomplete SMS text returns a clear in-app message.

## UI And UX Testing

- All dialogs, sheets, menus, and empty states follow the app theme.
- No default system alert is used for primary product workflows.
- All screens work in light and dark mode.
- Text does not overlap, truncate badly, or overflow buttons.
- Bottom tabs clearly show the selected state.
- Sheets animate from the expected direction.
- Side menus animate from left to right.
- Dialogs have accessible labels, clear primary actions, and dismiss behavior.
- No large blank areas are left at the end of main tabs.
- Layout is checked on small, standard, and large Android screens.

## Security And Privacy Testing

- App lock and biometric lock protect sensitive screens if enabled.
- A locked messaging app does not block notification capture if Android exposes notification content.
- If Android hides notification content, the app cannot read it through notification listener access and must ask the user to enable previews or use SMS/paste import.
- Sensitive data is not printed in production logs.
- Backups exclude raw SMS bodies and raw notification text.
- Local persisted data is minimized.
- Sign-out clears user-specific sensitive state.
- Permission revocation does not leave stale capture jobs running.

## Backend And Data Testing

- Transactions sync correctly across sessions and devices if account sync is enabled.
- Offline transactions queue safely and reconcile when online.
- Duplicate protection works across local and remote sources.
- Monthly budget and category limits recalculate after add, edit, delete, import, and restore.
- Migration tests cover old app versions.
- Cloud backup and restore are validated with realistic user data.
- API failures show useful in-app recovery states.

## Performance And Reliability

- Cold start and warm start times are measured on low-end and mid-range devices.
- Capture parsing completes quickly and does not block UI.
- Large transaction histories remain scrollable.
- Charts and budget screens render without jank.
- Background capture does not drain battery.
- Crash reporting is enabled in staging and production.
- Memory usage is checked after repeated sheet/dialog navigation.

## Accessibility

- All interactive controls have accessible labels.
- Touch targets are at least 44 x 44 points where practical.
- Text remains readable with larger font settings.
- Color is not the only indicator of state.
- Important values are readable by screen readers.
- Dialog focus and dismiss behavior are predictable.

## Release Gate Checklist

A new app build should not move to production until:

- TypeScript, lint, unit tests, and relevant integration tests pass.
- Real device testing covers the agreed device matrix.
- Sensitive permissions are approved, optional, and reversible.
- Production build inspection confirms no research-only permissions are included accidentally.
- Data Safety, privacy policy, and in-app consent copy are complete.
- Backup, restore, sign-out, and data deletion flows are verified.
- The app handles hidden notifications, locked messaging apps, denied permissions, and offline state gracefully.
- Design review confirms dialogs, sheets, tabs, spacing, color grading, and empty states match the app theme.
- A rollback or hotfix plan exists for release issues.

## Evidence To Record Per Test Run

Each test run should record:

- App version, build number, commit hash, and build profile.
- Device model, Android version, OEM skin, and security patch.
- SIM setup if SMS is tested.
- Permission state before and after the test.
- App state during the test: foreground, background, killed, after reboot.
- Exact input used, with sensitive values redacted.
- Expected result, actual result, pass/fail, and screenshots or logs when useful.
- Follow-up bug link if the test fails.
