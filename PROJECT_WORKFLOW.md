# MoneyKai Project Workflow

This document summarizes the important systems included in MoneyKai and the workflow we have built from the beginning of the project to the current implementation state.

## 1. Project Structure

MoneyKai is organized as a monorepo with three main surfaces:

- `apps/MoneyKai-mobile`: Expo Router mobile app for the main MoneyKai product experience.
- `apps/MoneyKai-web`: Expo Router website and browser-first product experience.
- `backend`: FastAPI backend with Firebase/Firestore-backed APIs for sync, backups, groups, settings, news, and shared resources.

The root package provides shared commands for mobile, web, backend, linting, typechecking, and builds. Mobile and web are kept as separate app packages so each surface can evolve independently while still sharing product direction and backend contracts.

## 2. Core User Workflow

The main MoneyKai product flow is:

1. User opens MoneyKai.
2. If not authenticated, user goes directly to login or signup.
3. If already authenticated and not signed out, user enters the app directly.
4. User lands on the Home dashboard.
5. User tracks income and expenses through transactions.
6. Budgets, savings, groups, notes, notifications, analytics, and Auto Capture build on top of the transaction data.
7. Backend sync and backup systems preserve user data across sessions and devices.

The landing-page-first behavior was removed from the mobile app so authenticated users reach the app faster and unauthenticated users reach auth immediately.

## 3. Authentication And App Entry

Important systems included:

- Email/password Firebase authentication.
- Google sign-in support path.
- Forgot-password flow.
- Auth persistence so logged-in users can re-enter the app without signing in again.
- Profile and account-related settings screens.
- App-lock/security surfaces for protecting access after login.

Current workflow:

1. App starts.
2. Auth store checks persisted user/session state.
3. Authenticated users go to the tabbed app.
4. Unauthenticated users go to login/signup.
5. Sign-out clears access and returns the user to authentication.

## 4. Main Mobile App Navigation

Important app areas included:

- Home dashboard.
- Transactions.
- Budget.
- Savings.
- Auto Capture.
- Notifications.
- Notes.
- Groups.
- Analytics.
- Learn Center.
- Settings.

The bottom tab workflow keeps core actions close to the user. The central plus action opens the transaction composer from anywhere instead of forcing the user to navigate into the Transactions tab first.

## 5. Transaction System

Important systems included:

- Manual transaction creation.
- Expense and income transaction types.
- Amount, description, date, category, and payment-context handling.
- Transaction list, filters, sorting, and search.
- Category-based transaction organization.
- Transaction data feeding budget, dashboard, analytics, and savings views.

Workflow:

1. User taps the central add action.
2. Transaction composer opens.
3. User chooses expense or income.
4. User enters amount, description, date, and category.
5. Confirmed transaction is saved into local state and sync-ready storage.
6. Dashboard, budgets, and analytics update from the transaction store.

## 6. Budget And Dashboard System

Important systems included:

- Monthly budget summary.
- Budget used progress.
- Spent, remaining, and budget cards.
- Spending overview.
- Category budget rail.
- Budget reset coordinator.
- Budget health indicators.
- Dashboard insight widgets.

Workflow:

1. User sets or views a monthly budget.
2. Expense transactions reduce the remaining monthly budget.
3. Budget cards and charts summarize current month progress.
4. Budget reset logic keeps month-based tracking clean.
5. Dashboard widgets surface useful next actions.

## 7. Savings, Groups, Notes, And Learning

Important systems included:

- Savings goals and challenge-style progress.
- Savings analytics snapshot.
- Groups and split-bill workflow.
- Notes and quick notes.
- Learn Center with personal-finance content.
- Public feature, pricing, security, trust, FAQ, contact, and policy pages.

These systems support the broader product beyond expense tracking: planning, collaboration, education, and user trust.

## 8. Backend, Sync, And Backup Workflow

Important systems included:

- FastAPI backend.
- Firebase token-based authentication on backend routes.
- Firestore storage services.
- Resource APIs for transactions, notes, badges, notifications, groups, settings, challenges/savings, news, and backups.
- Bootstrap API for restoring app state.
- Backup creation, listing, latest backup retrieval, and restore.
- Remote sync and sync queue services in the app.
- Auto backup coordinator.

Workflow:

1. App authenticates with Firebase.
2. Backend validates Firebase bearer token.
3. User data is read/written through scoped backend routes.
4. App can create backups from local state.
5. App can restore from the latest backup.
6. Sync coordinator keeps local and remote data aligned.

Important safety rule: capture inbox data and raw notification/SMS payloads are not included in normal backup snapshots by default.

## 9. Native Android Auto Capture

Important systems included:

- Local Expo native module: `moneykai-native-capture`.
- Android Notification Listener service.
- Native capture bridge from Kotlin to JavaScript.
- Pending native signal queue for cases where JS is inactive.
- Expo dev-client Android configuration for emulator validation.
- Android notification access permission flow.

Phase 1 completed on emulator:

- Native Android project generation passed.
- Kotlin/Gradle build issues were fixed.
- Native module compiled.
- Debug APK built and installed on `MoneyKai_API_36`.
- Notification Listener permission was granted and detected.
- Denied/revoked permission state was tested.
- Synthetic transaction-like notifications were captured.
- Unrelated/noise notifications were ignored.
- Captured notification signals became reviewable Auto Capture drafts.

Remaining Phase 1 hardware follow-up:

- Test real UPI, bank, card, wallet, or payment-app notifications on a physical Android device or real installed app source.

## 10. Capture Parser And Review Workflow

Important systems included:

- `captureParser` service.
- Sanitized capture fixtures.
- Parser tests with Vitest.
- UPI, bank, card, wallet, refund, cashback, failed transaction, OTP, promotional, and noise examples.
- Amount extraction.
- Debit/credit direction detection.
- Payment method detection.
- Merchant extraction and cleanup.
- Ignore/review/draft classification.
- Dedupe key generation.
- Safe explainability metadata.
- Auto Capture review cards.
- `Why captured?` debug/explanation details.

Workflow:

1. Native notification or research SMS import creates a capture signal.
2. Parser extracts amount, merchant, direction, method, category hints, and status.
3. Unsafe or irrelevant signals are ignored.
4. Ambiguous signals can become review-needed drafts.
5. Valid financial signals become reviewable drafts, never auto-confirmed transactions.
6. User reviews the draft.
7. Confirmed draft becomes a normal transaction and updates budgets/analytics.

## 11. Auto Capture Production Safety

Important systems included:

- Permission explainer before Android Notification Access.
- Runtime permission and consent gate before SMS Research Mode can receive real SMS.
- Privacy copy in Settings and Privacy Policy.
- Clear statement that supported notifications are processed locally.
- Source-level capture controls.
- Auto Capture disable control.
- Clear capture history control.
- Native `setCaptureEnabled(false)` support.
- Native pending signal cleanup.
- Capture source badges: Notification, SMS, Manual/future source model.
- Raw payload minimization and redaction.
- Allowlisted capture metadata persistence so raw SMS bodies and raw notification payloads are not stored in capture history.
- Consent timestamps and source readiness labels.
- Tests for disabled capture and clear capture behavior.

Workflow:

1. User sees a clear explainer before opening Android notification access.
2. User can enable or decline access.
3. Settings shows whether Notification capture is enabled, disabled, unsupported, or needs Android access.
4. User can disable Auto Capture at any time.
5. User can clear unconfirmed capture data without deleting confirmed transactions.
6. Raw sensitive notification and SMS payloads are minimized and not exposed in normal UI or backup snapshots.

## 12. SMS Research Mode

Important systems included:

- SMS policy and product viability review.
- Decision: SMS remains research-only, not production.
- SMS Research Mode setting separated from normal Auto Capture.
- Build-time guard through `EXPO_PUBLIC_SMS_RESEARCH_BUILD`.
- Production and preview builds do not request restricted SMS permissions.
- Manual paste/import research prototype.
- Android runtime `RECEIVE_SMS` permission request before SMS Research Mode can be enabled.
- Native SMS receiver for research builds, registered only through the research manifest plugin.
- Native SMS access status reporting: granted, denied, or unsupported.
- Pending native signal queue for real incoming SMS received while the JavaScript bridge is inactive.
- Safe real-SMS metadata: capture origin, raw-body-storage marker, subscription id, SIM slot, and phone id where Android exposes them.
- Data minimization guard that persists only parser safe snippets and allowlisted metadata, not raw SMS bodies or sender fields in `rawPayload`.
- SMS source badge and parser reuse.
- SMS fixtures and tests.
- SMS minimization regression test for raw body/sender exclusion.

Current SMS strategy:

- Use manual paste/import for quick parser research and real incoming SMS for delivery/background/SIM validation.
- Do not add `READ_SMS` or `RECEIVE_SMS` to production builds.
- Keep native SMS receiver research-only behind `EXPO_PUBLIC_SMS_RESEARCH_BUILD`.
- Ask for runtime SMS permission only after explicit in-app SMS Research Mode consent.
- Never auto-confirm SMS-derived transactions.
- Discard raw pasted SMS text after sanitized draft creation.
- Do not attempt to bypass Android protected broadcasts; ADB cannot honestly simulate the real `SMS_RECEIVED` telephony path.
- Final SMS delivery proof still requires a real carrier/bank SMS on a physical device, including foreground, background, JS-inactive queue flushing, and dual-SIM checks.

Completed SMS research work:

- Google Play SMS policy and app-config gates documented.
- Production and preview build profiles keep SMS Research Mode disabled.
- Research debug build can declare `RECEIVE_SMS` and register the SMS receiver.
- Runtime SMS permission status is surfaced in Settings.
- Deny, grant, revoke, and re-enable permission behavior was partially validated on a OnePlus Android 16 device.
- Native Kotlin module compiles with the real SMS permission/status and receiver metadata path.
- Capture tests verify SMS research gating and raw payload minimization.

## 13. Release Readiness Workflow

Important release work still targeted:

- Create development and internal APK builds.
- Test across Android versions and OEM vendors.
- Test real incoming SMS delivery on a physical SIM device, including background, JS-inactive queue flushing, and SIM 1/SIM 2 behavior.
- Add onboarding around Auto Capture and SMS Research Mode for internal testers.
- Add crash/error reporting around native module failures.
- Prepare Play Store-safe disclosure copy and screenshots.
- Run full mobile regression.
- Run full web regression.
- Confirm production builds exclude research-only SMS permissions and dev diagnostics.

Release signoff should happen only after native capture, privacy controls, parser quality, and regression checks are stable.

## 14. Validation Commands

Important validation commands currently used:

```powershell
npm.cmd run mobile:typecheck
npm.cmd run mobile:lint
npm.cmd run mobile:test:capture
npx.cmd expo-modules-autolinking verify --platform android
.\gradlew.bat :app:assembleDebug --console=plain
.\gradlew.bat :moneykai-native-capture:compileDebugKotlin --console=plain
```

Backend validation:

```powershell
npm.cmd run backend:test
npm.cmd run backend:compile
```

Web validation:

```powershell
npm.cmd run web:typecheck
npm.cmd run web:lint
npm.cmd run web:build
```

## 15. Current Project State

Completed or substantially implemented:

- Monorepo structure.
- Mobile app auth-first entry flow.
- Main finance app tabs and dashboard.
- Manual transactions.
- Budget tracking.
- Savings, groups, notes, learning, notifications, and settings surfaces.
- Backend sync and backup architecture.
- Native Android notification capture on emulator.
- Capture parser and fixture test suite.
- Auto Capture review workflow.
- Production safety controls for Auto Capture.
- SMS Research Mode policy gate, manual paste/import prototype, runtime SMS permission gate, research receiver, native queue, SIM metadata, and minimization tests.
- Physical OnePlus Android 16 validation for research build installation, permission grant/revoke/re-enable, notification listener access, and synthetic-test limitations.
- New app testing requirements documentation for permissions, physical devices, privacy, performance, release gates, and evidence collection.
- Generated native module build output has been removed from Git tracking and ignored.

Still pending or hardware/compliance dependent:

- Physical-device testing with real UPI/bank/card notifications and real incoming carrier/bank SMS.
- Dual-SIM real SMS validation for SIM 1/SIM 2 sender, timestamp, subscription, and slot metadata.
- Multi-device Android OEM validation.
- Release APK/internal distribution.
- Crash/error reporting around native module failures.
- Any production SMS feature, which remains blocked behind policy and research gates.
