# MoneyKai Mobile Implementation Plan

This file tracks the implementation phases for the MoneyKai mobile app going forward.

Current focus: **Phase 1: Android Native Validation**

## Phase 1: Android Native Validation

This is the most important next target because the native capture code is written and Expo autolinking passes, but Kotlin compilation and real notification-listener behavior have not yet been proven on-device.

### Phase 1A: Build Readiness Check

Goal: confirm the project is ready for native Android compilation before generating or building the Android app.

- [ ] Confirm `expo.autolinking.nativeModulesDir` points to `./modules`.
- [ ] Confirm `moneykai-native-capture` appears in Expo autolinking resolution.
- [ ] Run mobile TypeScript and lint checks.
- [ ] Confirm the Android native module files are present under `modules/moneykai-native-capture`.
- [ ] Confirm `eas.json` has a development Android build profile.

Completion criteria: the repo is clean enough to attempt a native Android build without first changing feature code.

### Phase 1B: Native Android Build

Goal: prove the Kotlin module, Android manifest, Gradle config, and Expo local module setup compile successfully.

- [ ] Build locally with `npx expo run:android`, or build an EAS development APK.
- [ ] Fix any Gradle, Kotlin, manifest merge, package namespace, or autolinking errors.
- [ ] Re-run the native Android build after every fix until it succeeds.
- [ ] Install the development build on an Android device or emulator.

Completion criteria: MoneyKai launches from a native Android development build that includes the `MoneyKaiNativeCapture` module.

### Phase 1C: Notification Access Permission Flow

Goal: verify Android can expose and grant Notification Listener access for MoneyKai.

- [ ] Open MoneyKai Settings.
- [ ] Tap `Android Notification Access`.
- [ ] Confirm Android opens the Notification Listener settings screen.
- [ ] Grant listener access to MoneyKai.
- [ ] Return to MoneyKai and confirm the native status reports notification access as granted.
- [ ] Confirm the app handles denied or not-granted access without crashing.

Completion criteria: notification access can be granted and detected from the app.

### Phase 1D: Real Notification Capture Test

Goal: prove real transaction notifications are received by the native listener and passed into the JS capture flow.

- [ ] Enable Auto Capture in MoneyKai.
- [ ] Enable Bank Notifications capture.
- [ ] Trigger or receive real UPI, bank, card, wallet, or payment-app notifications.
- [ ] Confirm transaction-like notifications are captured.
- [ ] Confirm unrelated notifications are ignored.
- [ ] Confirm notifications captured while the app is backgrounded or JS is not active are queued and later flushed.

Completion criteria: real financial notifications reach the MoneyKai capture pipeline.

### Phase 1E: Draft Creation And Parser Tuning

Goal: confirm captured signals become useful reviewable drafts and tune obvious false positives or misses.

- [ ] Confirm captured notifications appear as reviewable drafts in Auto Capture.
- [ ] Confirm amount, merchant/source, direction, date, and category are reasonable where possible.
- [ ] Record examples of missed financial notifications.
- [ ] Record examples of incorrectly captured non-financial notifications.
- [ ] Tune notification filtering and parsing rules based on real examples.
- [ ] Re-test after tuning with at least UPI, bank, and card-style notifications.

Completion criteria: captured notifications consistently produce reviewable drafts with acceptable false-positive and missed-capture behavior for an initial build.

### Phase 1F: Validation Signoff

Goal: close Phase 1 with documented evidence and a stable baseline.

- [ ] Run `npm.cmd run mobile:typecheck`.
- [ ] Run `npm.cmd run mobile:lint`.
- [ ] Run `npx expo-modules-autolinking verify --platform android`.
- [ ] Run a final Android native build.
- [ ] Document tested device/emulator, Android version, notification sources, known misses, and known false positives.
- [ ] Mark completed Phase 1A-1F checklist items.

Completion criteria: Phase 1 is complete when a native Android build runs successfully, notification access can be granted, real financial notifications are captured, and those captured signals appear as reviewable drafts inside MoneyKai.

## Phase 2: Capture Quality

After the Android notification listener works, improve parsing and review quality so captured notifications become reliable, explainable, low-noise transaction drafts.

### Phase 2A: Capture Fixture Library

Goal: build a repeatable sample set of real-world notification patterns before changing parser behavior.

- [ ] Collect sanitized examples for UPI payments, bank debits, bank credits, card spends, wallet spends, refunds, cashback, failed transactions, OTPs, low-balance alerts, promotional alerts, and statement reminders.
- [ ] Store examples as local test fixtures with sensitive values replaced by realistic placeholders.
- [ ] Include source app, title, body, expected amount, expected merchant, expected transaction type, expected payment method, expected status, and expected capture decision.
- [ ] Include at least 30 fixture cases before tuning parser rules.
- [ ] Mark each fixture as `shouldDraft`, `shouldIgnore`, or `needsReview`.

Completion criteria: Phase 2 has a reusable fixture set that represents both valid transaction notifications and noise.

### Phase 2B: Indian Bank And Payment Pattern Expansion

Goal: recognize common Indian financial notification formats more reliably.

- [ ] Add parser patterns for common wording from UPI apps, banks, card issuers, wallets, and payment gateways.
- [ ] Normalize currency markers including `INR`, `Rs`, `Rs.`, rupee symbol, and amount formats with commas and decimals.
- [ ] Fix any encoding issues in parser/display text, including mojibake currency or separator characters.
- [ ] Detect payment rails such as UPI, debit card, credit card, net banking, IMPS, NEFT, RTGS, wallet, and POS.
- [ ] Keep patterns data-driven enough that new bank/payment phrases can be added without rewriting parser flow.

Completion criteria: known Indian UPI, bank, wallet, and card notifications parse into the correct amount and payment method across the fixture set.

### Phase 2C: Merchant Extraction Improvements

Goal: extract useful merchant/payee labels from UPI and card messages instead of falling back to source app names.

- [ ] Add merchant extraction patterns for phrases like `paid to`, `sent to`, `to VPA`, `at`, `towards`, `merchant`, `Info`, `UPI Ref`, and card/POS merchant formats.
- [ ] Strip transaction references, UPI IDs, account masks, timestamps, and trailing bank boilerplate from merchant names.
- [ ] Normalize merchant keys consistently for dedupe and learned category rules.
- [ ] Preserve a human-readable merchant label for draft display.
- [ ] Add fallback priority: parsed merchant, sender, source app, then generic captured transaction label.

Completion criteria: valid fixtures produce stable merchant labels and merchant keys that work for dedupe and learned category matching.

### Phase 2D: Direction And Status Classification

Goal: detect whether a notification should become an expense, income, or ignored signal.

- [ ] Improve debit vs credit detection using stronger phrase groups instead of single-word matches like `dr` or `cr` alone.
- [ ] Classify refunds and cashback as income only when the message confirms money was credited or reversed.
- [ ] Ignore failed, declined, reversed-before-settlement, OTP, mandate, promotional, statement, and low-balance notifications.
- [ ] Add a clear parse status such as `draft`, `ignore`, or `review` in parser output.
- [ ] Prefer conservative behavior when ambiguous: create a low-confidence review draft only if amount and financial action are both present.

Completion criteria: fixture cases classify debit, credit, refund, cashback, failed-payment, and OTP/noise messages correctly.

### Phase 2E: Explainability And Debug View

Goal: make each captured draft transparent so users and developers can understand why it appeared.

- [ ] Extend capture parse output with explainability metadata such as matched amount pattern, matched direction terms, matched merchant pattern, matched payment method, matched category rule, confidence factors, and ignore reason.
- [ ] Store safe explainability metadata with captured signals or drafts.
- [ ] Add a small `Why captured?` section or modal in Auto Capture draft cards.
- [ ] Show user-safe details: source app, matched amount, matched merchant, capture confidence, suggested category reason, and dedupe key summary.
- [ ] Avoid showing full raw notification payload by default; expose only sanitized text or compact matched snippets.

Completion criteria: every pending draft can explain why MoneyKai captured it and which rule or heuristic influenced it.

### Phase 2F: Dedupe And Review Quality

Goal: reduce duplicate drafts and make review behavior more stable.

- [ ] Improve dedupe keys using source, amount, merchant key, direction, date/time bucket, and transaction reference when available.
- [ ] Avoid duplicate drafts from notification updates, grouped notifications, or repeated app alerts.
- [ ] Keep legitimate repeated transactions possible when they differ by time, merchant, reference, or amount.
- [ ] Ensure ignored signals do not repeatedly reappear as new drafts.
- [ ] Preserve learned merchant category rules and apply them only when merchant confidence is high enough.

Completion criteria: duplicate notification fixtures collapse correctly while distinct real transactions remain separate.

### Phase 2G: Local Parser Test Suite And Signoff

Goal: prevent parser regressions as new bank/payment patterns are added.

- [ ] Add `vitest` as a mobile dev dependency.
- [ ] Add a local test script such as `test:capture`.
- [ ] Add tests for `parseCapturedSignal`, `normalizeMerchantKey`, and `buildCaptureDedupeKey`.
- [ ] Cover fixture cases for UPI, bank debit, bank credit, card spend, wallet spend, refund, cashback, failed transaction, OTP, promotional noise, and duplicate notifications.
- [ ] Run `npm.cmd run mobile:typecheck`, `npm.cmd run mobile:lint`, and the new capture test script before closing Phase 2.
- [ ] Document known parser limitations and examples that still require manual review.

Completion criteria: parser and dedupe behavior is covered by local automated tests, and all Phase 2 fixtures pass with accepted confidence and ignore behavior.

## Phase 3: Production Safety

Before shipping Auto Capture widely, focus on privacy, consent, and user controls so notification capture is transparent, reversible, and safe by default.

### Phase 3A: Permission Explainer Before Android Access

Goal: explain notification access clearly before sending the user to Android system settings.

- [ ] Replace direct `Android Notification Access` behavior with a MoneyKai explainer modal or screen first.
- [ ] Explain that Android notification access may allow MoneyKai to read notifications, but MoneyKai only uses supported transaction alerts for reviewable drafts.
- [ ] Add clear actions: `Open Android Settings`, `Not Now`, and `Learn More`.
- [ ] Track whether the user has seen or accepted the explainer.
- [ ] Keep notification access hidden or disabled on unsupported platforms.
- [ ] Re-check native permission status after the user returns from Android settings.

Completion criteria: users see a clear explanation before opening Android notification-listener settings.

### Phase 3B: Privacy Copy And User Trust

Goal: make the privacy model visible inside the app and privacy policy.

- [ ] Update the Privacy Policy with a dedicated Auto Capture section.
- [ ] Explain that supported notification signals are processed on-device for transaction draft creation.
- [ ] Explain that captured drafts require review before affecting budgets or transaction history.
- [ ] Explain what is stored locally: source, parsed amount, merchant, confidence, and safe metadata.
- [ ] Explain what should not be stored or shown by default: full raw notification payloads and unrelated notification content.
- [ ] Add short privacy copy near Auto Capture settings.

Completion criteria: users can understand what Auto Capture reads, stores, ignores, and controls before enabling it.

### Phase 3C: Quick Disable And Clear Capture Controls

Goal: give users immediate control over Auto Capture and captured history.

- [ ] Add a prominent `Disable Auto Capture` control in Auto Capture or Settings.
- [ ] Add `Clear Capture History` to remove pending/ignored captured signals and drafts.
- [ ] Add confirmation before clearing data.
- [ ] Preserve confirmed transactions when clearing capture history.
- [ ] Stop native listening when Auto Capture or notification capture is disabled.
- [ ] Add native cleanup support if queued native pending signals need to be cleared too.

Completion criteria: users can quickly stop capture and clear unconfirmed capture data without deleting confirmed transactions.

### Phase 3D: Capture Source Badges

Goal: make every draft and signal source obvious.

- [ ] Add source badges for `Notification`, `SMS`, and `Manual`.
- [ ] Show source badges on Auto Capture draft cards.
- [ ] Show source app where safe, such as bank app, UPI app, or wallet app.
- [ ] Use consistent colors, icons, and labels for each source.
- [ ] Keep SMS visually marked as future or research-only until it is production-ready.
- [ ] Ensure source badges are accessible and readable in light and dark themes.

Completion criteria: users can immediately tell where every captured draft came from.

### Phase 3E: Raw Payload Minimization

Goal: prevent sensitive notification payloads from being overexposed, persisted unnecessarily, or backed up accidentally.

- [ ] Stop storing full raw notification payloads by default.
- [ ] Store only safe parsed fields and sanitized explainability metadata.
- [ ] Redact account numbers, UPI IDs, card masks, transaction references, OTPs, and long raw message text where possible.
- [ ] Keep raw payload access behind dev-only diagnostics if needed.
- [ ] Confirm cloud backups do not include raw notification payloads or capture inbox data unless a future explicit opt-in is designed.
- [ ] Add a safety review for AsyncStorage persistence of captured signals and drafts.

Completion criteria: captured notification data is minimized, sanitized, and not exposed through normal UI or backup flows.

### Phase 3F: Consent State And Settings Robustness

Goal: make Auto Capture state predictable and scalable as more sources are added.

- [ ] Extend capture settings with consent fields such as notification explainer accepted status and timestamp.
- [ ] Keep source-level toggles independent: Auto Capture master switch, Notification source, SMS research source, and future Manual source.
- [ ] Show status labels for each source: `Enabled`, `Disabled`, `Needs Android access`, `Research only`, or `Unsupported`.
- [ ] Handle revoked Android notification access gracefully.
- [ ] Avoid enabling source toggles when the platform or permission state makes them unusable.

Completion criteria: settings accurately reflect consent, platform support, and permission state.

### Phase 3G: Production Safety Test Pass

Goal: verify Phase 3 protections before wider release.

- [ ] Test first-time permission explainer flow.
- [ ] Test denied, granted, and revoked Android notification access.
- [ ] Test disable Auto Capture stops new drafts.
- [ ] Test clear capture history removes pending/ignored capture data but keeps confirmed transactions.
- [ ] Test source badges for notification drafts and placeholder future SMS/manual states.
- [ ] Test privacy copy renders correctly.
- [ ] Test backups do not include raw capture payloads.
- [ ] Run `npm.cmd run mobile:typecheck` and `npm.cmd run mobile:lint`.

Completion criteria: privacy, consent, controls, source labeling, and data minimization pass manual and automated validation.

## Phase 4: SMS Research Mode

SMS is not implemented yet. Start this only after notification capture is stable, because SMS access carries Android permission, privacy, and Google Play policy risk.

### Phase 4A: SMS Policy And Product Viability Review

Goal: decide whether SMS capture is worth pursuing before writing native SMS code.

- [ ] Review current Google Play SMS and Call Log permission policy.
- [ ] Confirm whether MoneyKai qualifies for SMS permissions as a budgeting app.
- [ ] Document risks of `READ_SMS`, `RECEIVE_SMS`, and inbox-read approaches.
- [ ] Compare safer alternatives: notification capture, manual paste/import, email statement parsing, or bank export import.
- [ ] Decide one of three outcomes: `Do not pursue`, `Research-only`, or `Production candidate after policy approval`.

Completion criteria: Phase 4 has a written go/no-go decision before SMS permissions are added.

### Phase 4B: Research-Only Architecture

Goal: design SMS capture so it cannot accidentally ship in production.

- [ ] Keep SMS disabled by default.
- [ ] Keep `smsResearchModeEnabled` separate from normal Auto Capture.
- [ ] Ensure production builds do not include SMS permissions unless explicitly approved.
- [ ] Use a dev/internal build profile for SMS experiments.
- [ ] Add clear in-app labeling: `SMS Research Mode`.
- [ ] Add a kill switch that disables SMS ingestion immediately.

Completion criteria: SMS research can be tested without creating Play Store production risk.

### Phase 4C: SMS Ingestion Strategy Spike

Goal: evaluate possible SMS ingestion approaches and choose the safest one.

- [ ] Evaluate native `RECEIVE_SMS` receiver for new incoming SMS.
- [ ] Evaluate inbox-read strategy with `READ_SMS`.
- [ ] Evaluate manual paste/import as a no-permission fallback.
- [ ] Evaluate SMS Retriever/User Consent APIs only for OTP-style messages, not bank transaction scraping.
- [ ] Choose a research strategy based on privacy, reliability, Play policy risk, and implementation cost.

Completion criteria: one SMS ingestion strategy is selected for research, with rejected alternatives documented.

### Phase 4D: Dev-Only Native SMS Prototype

Goal: build a contained prototype only if Phase 4A and 4C allow it.

- [ ] Add SMS native code only behind dev/internal build controls.
- [ ] Route SMS signals through the existing capture pipeline as `source: 'sms'`.
- [ ] Do not auto-confirm SMS transactions.
- [ ] Store only sanitized parsed fields.
- [ ] Ignore OTP, promotional, failed, and non-financial SMS messages.
- [ ] Ensure disabling SMS Research Mode stops ingestion.

Completion criteria: SMS can create reviewable research drafts in dev builds without affecting production builds.

### Phase 4E: SMS Parser And Noise Handling

Goal: make SMS parsing conservative and privacy-safe.

- [ ] Reuse Phase 2 fixture-driven parser approach.
- [ ] Add sanitized SMS fixtures for bank debit, bank credit, card spend, UPI, refund, cashback, OTP, and promotional messages.
- [ ] Prefer `ignored` or `needsReview` over aggressive drafting when uncertain.
- [ ] Redact account numbers, card masks, UPI IDs, OTPs, and transaction references.
- [ ] Track why each SMS was drafted or ignored.

Completion criteria: SMS parser behavior is covered by fixtures and avoids noisy or sensitive drafts.

### Phase 4F: Consent, Privacy, And Controls

Goal: make SMS research transparent and reversible.

- [ ] Add a strong SMS Research Mode explainer before enabling.
- [ ] Explain that SMS access is experimental and disabled by default.
- [ ] Add quick disable and clear SMS research data controls.
- [ ] Prevent SMS raw message bodies from cloud backup by default.
- [ ] Show `SMS` source badges on drafts.
- [ ] Add privacy-policy copy only if SMS research is actually implemented.

Completion criteria: users can understand, disable, and clear SMS research data safely.

### Phase 4G: Device And Policy Validation

Goal: test SMS research on real Android environments before any production decision.

- [ ] Test on multiple Android versions and OEM devices.
- [ ] Test dual-SIM behavior where possible.
- [ ] Test permission denied, revoked, and re-enabled states.
- [ ] Test background delivery behavior.
- [ ] Verify production builds do not request SMS permissions.
- [ ] Re-check Google Play policy before any release decision.

Completion criteria: SMS research is proven technically and remains isolated from production builds.

### Phase 4H: Production Decision Gate

Goal: decide whether SMS should remain research-only, be removed, or move toward production.

- [ ] Review policy risk, user value, parser accuracy, privacy impact, and maintenance cost.
- [ ] If policy risk remains high, keep SMS out of production.
- [ ] If production is considered, prepare Play Console permission declaration and legal/privacy review.
- [ ] If rejected, remove native SMS code and keep safer alternatives.
- [ ] Document final decision in `implementation.md`.

Completion criteria: SMS has a clear final path: abandoned, research-only, or production candidate with approval requirements.

## Phase 5: Release Readiness

Once native capture is stable, move toward an APK/internal release with onboarding, diagnostics, disclosures, and full regression checks.

### Phase 5A: Release Channel And Build Setup

Goal: create a reliable internal Android release path.

- [ ] Confirm `eas.json` has development, preview APK, and production AAB profiles.
- [ ] Build a development APK for native-module validation.
- [ ] Build a preview/internal APK for broader tester distribution.
- [ ] Confirm app version, package name, app icon, adaptive icon, splash screen, and app metadata are release-ready.
- [ ] Confirm production builds do not include research-only SMS permissions or dev-only diagnostics.
- [ ] Document exact build commands for dev APK, preview APK, and production AAB.

Completion criteria: MoneyKai can produce a repeatable internal APK build that installs and launches on tester devices.

### Phase 5B: Multi-Device Android Validation

Goal: verify Auto Capture behaves across Android versions and vendors.

- [ ] Test on at least one Android 10/11 device if available.
- [ ] Test on at least one Android 12/13 device if available.
- [ ] Test on at least one Android 14/15+ device if available.
- [ ] Test common Indian OEMs where possible: Samsung, Xiaomi/Redmi, OnePlus, Vivo/Oppo, Realme, Motorola.
- [ ] Verify notification-listener permission flow on each tested device.
- [ ] Verify background delivery, app restart, reboot behavior, battery saver behavior, and permission revocation behavior.
- [ ] Record known OEM-specific issues and workarounds.

Completion criteria: internal APK is tested on enough Android environments to identify major vendor/version failures.

### Phase 5C: Auto Capture Onboarding

Goal: help users understand and safely enable Auto Capture.

- [ ] Add onboarding entry for Auto Capture after first login or first Settings visit.
- [ ] Explain that Auto Capture creates reviewable drafts, not automatic confirmed transactions.
- [ ] Explain that Android notification access is optional and can be disabled.
- [ ] Link onboarding to Auto Capture settings and privacy details.
- [ ] Add empty-state guidance in Auto Capture explaining how drafts appear.
- [ ] Avoid enabling native capture silently without user action.

Completion criteria: first-time users understand Auto Capture before enabling Android notification access.

### Phase 5D: Crash And Native Failure Reporting

Goal: make native capture failures diagnosable before internal release.

- [ ] Add a crash/error reporting solution, such as Sentry or another Expo-compatible service.
- [ ] Capture JS errors from the existing app error boundary.
- [ ] Capture native-module failures from status checks, listener startup, listener shutdown, and settings open actions.
- [ ] Add safe diagnostic events for capture state changes without logging raw notification content.
- [ ] Add user-safe fallback messages when native capture is unavailable.
- [ ] Document how to inspect crash reports during internal testing.

Completion criteria: native capture failures are visible to the team without exposing sensitive user notification content.

### Phase 5E: Play Store-Safe Disclosure Package

Goal: prepare release-safe copy and assets before internal/closed testing.

- [ ] Prepare prominent disclosure copy for notification access.
- [ ] Prepare Data Safety notes for local processing, backups, notifications, profile/account data, and third-party SDKs.
- [ ] Update privacy policy copy to match actual app behavior.
- [ ] Prepare screenshots that show Auto Capture as optional and review-based.
- [ ] Avoid screenshots or copy implying SMS capture is production-ready.
- [ ] Prepare reviewer notes explaining notification access purpose and user controls.

Completion criteria: internal or closed-track release materials accurately describe what Auto Capture reads, stores, and controls.

### Phase 5F: Full Mobile Regression Pass

Goal: ensure native capture does not break existing mobile app flows.

- [ ] Run `npm.cmd run mobile:typecheck`.
- [ ] Run `npm.cmd run mobile:lint`.
- [ ] Run mobile web export/build.
- [ ] Run Android native build.
- [ ] Test login, signup, sign out, profile edit, settings, app lock, notifications, backup/restore, transactions, budgets, groups, notes, savings, and Auto Capture.
- [ ] Test offline/local-first behavior and restore behavior.
- [ ] Confirm confirmed capture drafts become normal transactions and update budgets correctly.

Completion criteria: mobile app core flows pass after native capture and safety work.

### Phase 5G: Web Regression Pass

Goal: verify monorepo web app behavior remains stable.

- [ ] Run web typecheck.
- [ ] Run web lint.
- [ ] Run web build.
- [ ] Smoke-test main public pages and logged-in app routes.
- [ ] Confirm shared utility changes, especially date/currency/capture-adjacent helpers, did not regress web behavior.
- [ ] Confirm web does not expose Android-only native capture controls.

Completion criteria: web app passes build and smoke checks after mobile release work.

### Phase 5H: Internal Release Signoff

Goal: decide whether the APK is ready for internal testers.

- [ ] Create an internal release checklist with build ID, commit hash, version, tester group, and known issues.
- [ ] Confirm Phase 1 through Phase 3 are complete.
- [ ] Confirm Phase 4 SMS remains research-only or excluded.
- [ ] Confirm crash reporting is active.
- [ ] Confirm privacy/disclosure copy is present.
- [ ] Ship APK to internal testers only after signoff.
- [ ] Collect tester feedback for capture accuracy, permission confusion, crashes, and device-specific failures.

Completion criteria: MoneyKai has a controlled internal APK release with documented scope, risks, known issues, and feedback loop.

## Upcoming Phases

Future phases will be added here one by one as they are defined.
