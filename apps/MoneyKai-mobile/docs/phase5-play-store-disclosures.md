# Phase 5E Play Store-Safe Disclosure Package

Last reviewed: 2026-06-17

## Release scope

The Play-distributed app is **MoneyKai**. It is intended for Play Console internal testing first, not public production launch.

The separate local APK referred to as **Original MoneyKai** is for direct/internal use only. It includes native SMS Research Mode and restricted SMS permissions, so it must not be uploaded to Play unless a separate SMS permission declaration, policy review, legal/privacy review, and release signoff are completed.

## Prominent disclosure copy

Use this copy in tester instructions, reviewer notes, or any in-app disclosure where concise policy-safe wording is needed:

> MoneyKai can use Android notification access to detect supported bank and payment transaction alerts. Captured alerts become reviewable drafts only. MoneyKai does not automatically confirm transactions, and you can disable Auto Capture or clear capture drafts at any time.

For SMS:

> The Play Store build does not read your SMS inbox and does not request SMS permissions. SMS Research Mode in this build supports only manually pasted SMS text that you choose to provide for parsing into a reviewable draft.

## Play reviewer notes

MoneyKai requests Android notification listener access so users can optionally convert supported bank/payment transaction notifications into reviewable budget drafts. Notification capture is opt-in, disabled by user controls, and never auto-confirms transactions.

The Play Store build does not include restricted SMS permissions, does not register the MoneyKai SMS receiver, and does not read the SMS inbox. A separate internal-only APK exists for native SMS research, but that APK is not intended for Play distribution.

Before uploading a production AAB to Play Console, run the release permission verifier against the exact downloaded/upload candidate artifact:

```powershell
npm.cmd --prefix apps\MoneyKai-mobile run android:verify:release-permissions -- --aab path\to\production.aab
```

The upload must be blocked if the verifier reports `READ_SMS`, `RECEIVE_MMS`, `RECEIVE_SMS`, `RECEIVE_WAP_PUSH`, `SEND_SMS`, or `WRITE_SMS`.

## Data Safety notes

- **Account/profile data:** Firebase Authentication identifies the signed-in user. Profile data can sync to the backend when cloud features are configured.
- **Financial app data:** Transactions, budgets, notes, savings, groups, app settings, and backups may sync to the backend for authenticated users.
- **Notifications:** Notification access is optional and used only to create reviewable transaction drafts from supported financial notifications. Raw notification content is minimized; stored capture data uses sanitized snippets and parser explanations.
- **SMS:** Play builds do not request SMS permissions and do not read the SMS inbox. Manual SMS paste is user-initiated, parsed into reviewable drafts, and raw pasted SMS text is not included in cloud backup snapshots.
- **Diagnostics:** Warning/error/fatal diagnostics can be sent to the authenticated backend. Diagnostics redact SMS and notification content fields before upload, and the backend applies server-side redaction again.
- **Contacts:** Contact access is requested only for selecting people in split-bill/group workflows.
- **Photos/camera:** Image picker/camera access is used for user-selected receipt/profile-related images where applicable.
- **Notifications permission:** Push/local notifications are optional and used for app alerts.

## Screenshot checklist

Capture screenshots only from the Play-safe MoneyKai build:

- Settings page showing Auto Capture controls and optional notification access.
- Auto Capture page showing drafts as reviewable, not automatic transactions.
- Notification access explainer before opening Android settings.
- Privacy Policy or Privacy Details screen showing local processing, backup exclusions, and user controls.
- Manual SMS paste flow only if it clearly shows user-provided text and does not imply automatic SMS inbox access.

Do not use screenshots from Original MoneyKai or any screen showing native SMS permissions, SMS inbox import, or automatic SMS receiver behavior for Play listing/reviewer materials.

## Current status

Phase 5E is ready for internal testing materials. Final Play Console Data Safety answers still need to be entered and reviewed in Play Console before a closed or production release. The current Play-safe AAB has passed the repository release permission verifier with no restricted SMS permissions detected.
