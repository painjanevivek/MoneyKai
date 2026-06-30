# MoneyKai Flutter Play Store Policy Readiness

Last reviewed: 2026-06-30

Scope: Android Play Store release for `apps\MoneyKai-flutter`.

This is a release gate for the Android app. The iOS build path may be hosted outside the App Store, but that does not reduce or change the Android Play Store requirements.

## Official Sources Checked

- [Google Play Developer Policy Center](https://play.google/developer-content-policy/)
- [User Data policy](https://support.google.com/googleplay/android-developer/answer/10144311?hl=en)
- [Data safety section guidance](https://support.google.com/googleplay/android-developer/answer/10787469?hl=en)
- [Permissions and APIs that Access Sensitive Information](https://support.google.com/googleplay/android-developer/answer/9888170?hl=en)
- [Financial Services policy](https://support.google.com/googleplay/android-developer/answer/9876821?hl=en)
- [Financial features declaration](https://support.google.com/googleplay/android-developer/answer/13849271?hl=en)
- [Misrepresentation policy](https://support.google.com/googleplay/android-developer/answer/9888689?hl=en)
- [Google Play Protect](https://support.google.com/googleplay/answer/2812853?hl=en)

## Policy Stance

Do not bypass Play review by hiding, disguising, or misrepresenting features.

Allowed: rewrite app, store-listing, and disclosure copy so it is accurate, specific, and not overclaiming.

Not allowed: keep a non-compliant feature and rename it so reviewers or users cannot understand what it does.

If a feature conflicts with Play policy, the compliant path is one of:

- Change the feature to a policy-safe implementation.
- Remove or gate the feature from the Play production build.
- Add the required Play Console declaration, disclosure, consent flow, license, or documentation.
- Delay release until the required compliance evidence exists.

## Current Android Build Policy Summary

Current app behavior:

- Offline-first personal finance tracker.
- Local profile/session only; no real remote authentication.
- Local transactions, budgets, insights, theme preference, and diagnostics.
- Plaintext local JSON export to clipboard by explicit user action.
- Password-encrypted JSON backup export through the platform share sheet by explicit user action.
- Password-encrypted JSON backup restore through the platform file picker by explicit user action.
- No backend sync, bank sync, payment processing, loan facilitation, investment execution, tax/legal/investment advice, or remote crash reporting.

Current permission surface:

- Release APK does not request SMS, notification listener, contacts, camera, microphone, location, storage, all-files access, accessibility service, package visibility, or install-package permissions.
- Debug/profile manifests request `android.permission.INTERNET` for Flutter tooling only.
- Release audit allowlists the current compiled release permissions and fails on unexpected permission drift.

Current Play Protect posture:

- The app avoids high-risk fraud-abuse surfaces called out by Play Protect guidance: SMS reading, notification reading, accessibility control, broad storage, contact scraping, package inventory, and silent install behavior.
- The app does not include code paths that modify system settings, bypass Android privacy controls, or automate other apps.

## Financial Services Position

MoneyKai should be declared and described as a budgeting and expense-tracking app.

Current MVP does not provide:

- Personal loans, earned wage access, loan lead generation, credit lines, or loan calculators.
- Banking, brokerage, cryptocurrency, NFT, trading, crowdfunding, chit fund, or portfolio-management execution.
- Financial, investment, tax, or legal advice.
- Payments, remittance, bill payment, or money transfer.

Required Play Console action:

- Complete the Financial features declaration before release.
- If Play Console requires a financial feature category for budgeting/expense tracking, select the narrowest truthful category and avoid loan/advice/trading categories.
- If any future lending, credit, investment, insurance, money movement, crypto, or advice feature is added, re-audit before implementation and before upload. Licenses, regional declarations, and metadata disclosures may be required.

## Data Safety And Privacy Draft

This is a draft for Play Console and privacy-policy preparation. The account owner must review the final form against the exact production build and all included SDKs.

Current build:

- The app stores user-entered profile, transaction, budget, theme, backup, and diagnostic data locally on the device.
- The developer does not receive this data from the current build because there is no backend sync, analytics SDK, remote crash SDK, or account service.
- User-initiated export can copy plaintext app data to the clipboard.
- User-initiated encrypted backup export can share a password-protected file through Android's share sheet.
- User-initiated restore can read a selected backup file through the platform file picker.

Privacy policy must disclose:

- MoneyKai app name and developer/entity identity.
- Privacy contact or inquiry mechanism.
- Local-only storage boundary for the current MVP.
- Data types users can enter: profile display name/email, transactions, budgets, settings, and local diagnostics.
- Plaintext clipboard export behavior.
- Password-encrypted backup export/restore behavior and the fact that users choose where to share/store the file.
- No sale of personal or sensitive user data.
- Retention and deletion: data remains on device until the user deletes/resets it or uninstalls the app; Settings includes local reset and diagnostics clear actions.
- Any future backend, analytics, crash reporting, ads, bank sync, or authentication provider before it ships.

Play Console Data safety notes:

- A privacy policy URL is still required even if the app does not transmit user data to the developer.
- The Data safety form must be kept consistent with the production build, privacy policy, and any third-party SDK behavior.
- Do not mark remote collection/sharing unless the production build actually sends data off device to the developer or another company.
- Do not omit user-initiated sharing/export behavior from the privacy policy.

## Store Listing Wording Guardrails

Use accurate wording:

- "Expense and budget tracking"
- "Local-first finance workspace"
- "Record transactions manually"
- "Review monthly income, expenses, budgets, and trends"
- "Export a plaintext snapshot to clipboard when you choose"
- "Create a password-encrypted backup file when you choose"
- "Restore from a selected encrypted backup file"
- "No SMS, contacts, camera, microphone, location, or storage permissions in the current Android release build"

Avoid unsupported or risky wording:

- "Bank-grade security"
- "Guaranteed savings"
- "AI financial advisor"
- "Investment advice"
- "Tax advice"
- "Loan approval"
- "Instant credit"
- "Automatic bank tracking"
- "Automatic SMS tracking"
- "Reads your notifications"
- "Connects to every bank"
- "Secure forever"

Suggested Play short description:

```text
Track expenses, budgets, and monthly money trends with a local-first MoneyKai workspace.
```

Suggested Play long-description opening:

```text
MoneyKai helps you record expenses, manage monthly budgets, and review personal finance trends on your device. The current Android release focuses on manual tracking, local persistence, local export, and optional password-encrypted backup files. It does not offer loans, trading, investment advice, bank sync, SMS reading, or notification capture.
```

## Android Release Gate

Before uploading to Play internal testing:

1. Re-check the exact production build against this document.
2. Provide/create the Android upload keystore outside the repository.
3. Build signed release artifacts with all `MONEYKAI_UPLOAD_*` variables set.
4. Run:

```powershell
cd apps\MoneyKai-flutter
.\tool\audit_android_release.ps1 -RequireSigned
```

5. Run physical-device QA:

```powershell
cd apps\MoneyKai-flutter
.\tool\collect_android_runtime_qa.ps1 `
  -Install `
  -InstallMode Aab `
  -RequirePhysical `
  -ClearAppData `
  -ExpectedAabSha256 239D3B916F840C12127E2F21E208C34E100F1B4D19C1703F88DD6F7585A16C95 `
  -OutputDir "../../.codex-artifacts/play-preupload/physical"
```

6. Run real TalkBack spoken-output QA.
7. After Play internal testing upload and opt-in install, run the same collector without side-loading and require Play as the installer:

```powershell
cd apps\MoneyKai-flutter
.\tool\collect_android_runtime_qa.ps1 `
  -RequirePhysical `
  -ExpectedInstallerPackage com.android.vending `
  -ExpectedAabSha256 239D3B916F840C12127E2F21E208C34E100F1B4D19C1703F88DD6F7585A16C95 `
  -OutputDir "../../.codex-artifacts/play-preupload/play-internal"
```

8. Publish/update the public privacy policy URL.
9. Complete Play Console Data safety.
10. Complete Play Console Financial features declaration.
11. Verify app category, store listing text, screenshots, and declarations match the exact signed AAB.

## Feature Re-Audit Triggers

Re-audit Play policy before adding any of these:

- SMS import, SMS Retriever, or call-log access.
- Notification listener capture.
- Accessibility service automation.
- Contacts, location, camera, microphone, media, storage, all-files access, package visibility, or install-package permissions.
- Backend sync, real auth, analytics, ads, remote crash reporting, or third-party SDKs.
- Bank sync, statement import, payment, remittance, bill payment, UPI, card, loan, credit, insurance, investment, tax, legal, crypto, trading, or financial-advice features.
- Any copy that changes the app's primary purpose or implies features not present in the production build.
