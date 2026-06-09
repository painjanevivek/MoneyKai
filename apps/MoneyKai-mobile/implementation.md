# MoneyKai Mobile Implementation Plan

This file tracks the implementation phases for the MoneyKai mobile app going forward.

Current focus: **Phase 3 production-safety baseline implemented; Android manual validation pending**

## Phase 1: Android Native Validation

This is the most important next target because the native capture code is written and Expo autolinking passes, but Kotlin compilation and real notification-listener behavior need to be proven through a native Android build before capture quality work begins.

### Phase 1A: Build Readiness Check

Goal: confirm the project is ready for native Android compilation before generating or building the Android app.

- [x] Confirm `expo.autolinking.nativeModulesDir` points to `./modules`.
- [x] Confirm `moneykai-native-capture` appears in Expo autolinking resolution.
- [x] Run mobile TypeScript and lint checks.
- [x] Confirm the Android native module files are present under `modules/moneykai-native-capture`.
- [x] Confirm `eas.json` has a development Android build profile.

Completion criteria: the repo is clean enough to attempt a native Android build without first changing feature code.

Status: completed locally. `npm.cmd run mobile:typecheck`, `npm.cmd run mobile:lint`, and `npx.cmd expo-modules-autolinking verify --platform android` passed.

### Phase 1B: Native Android Build

Goal: prove the Kotlin module, Android manifest, Gradle config, and Expo local module setup compile successfully.

- [x] Build locally with `npx expo run:android`, or build an EAS development APK.
- [x] Fix any Gradle, Kotlin, manifest merge, package namespace, or autolinking errors.
- [x] Re-run the native Android build after every fix until it succeeds.
- [x] Install the development build on an Android device or emulator.

Completion criteria: MoneyKai launches from a native Android development build that includes the `MoneyKaiNativeCapture` module.

Status: native Android project generation succeeded with `npx.cmd expo prebuild --platform android --no-install`. Local Android tooling was installed and configured with JDK 17, Android SDK Platform 36, Android Build Tools 36.0.0, Android Platform Tools, Android Emulator, Android 36 Google APIs x86_64 system image, and `adb`. The first Gradle build exposed real native-module issues: the local Expo module needed Android `defaultConfig.versionName`, `compileSdkVersion`, and SDK defaults, `MoneyKaiNotificationListenerService` needed `Bundle.getCharSequence(...)` for notification extras, and `MoneyKaiNativeCaptureModule` had an extra closing brace around the companion object. After those fixes, `.\gradlew.bat :moneykai-native-capture:compileDebugKotlin --console=plain` and `.\gradlew.bat :app:assembleDebug --stacktrace --console=plain` both passed. A debug APK was produced at `android/app/build/outputs/apk/debug/app-debug.apk`, installed on the `MoneyKai_API_36` Android emulator, launched through Expo Dev Launcher, connected to Metro, and loaded the authenticated JS app.

### Phase 1C: Notification Access Permission Flow

Goal: verify Android can expose and grant Notification Listener access for MoneyKai.

- [x] Open MoneyKai Settings.
- [x] Tap `Android Notification Access`.
- [x] Confirm Android opens the Notification Listener settings screen.
- [x] Grant listener access to MoneyKai.
- [x] Return to MoneyKai and confirm the native/system status reports notification access as granted.
- [x] Confirm the app handles denied or not-granted access without crashing.

Completion criteria: notification access can be granted and detected from the app.

Status: completed on emulator. Android sees `com.moneykai.mobile/com.moneykai.nativecapture.MoneyKaiNotificationListenerService` in the merged manifest with `android.permission.BIND_NOTIFICATION_LISTENER_SERVICE`. The hidden-route navigation fix lets `Home -> menu -> Settings` resolve to the real Settings screen instead of an Expo Router unmatched route. In a clean native dev-client session, MoneyKai Settings exposed the Auto Capture section, tapping `Android Notification Access` opened Android's notification access settings, and the system screen showed MoneyKai Mobile under `Allowed`. `settings get secure enabled_notification_listeners` and `dumpsys notification listeners` confirmed MoneyKai under allowed, enabled, and live notification listeners. Denied/revoked access was validated by removing the MoneyKai listener component from `enabled_notification_listeners`, force-stopping and relaunching the app, confirming the app remained stable, then restoring the original listener setting.

### Phase 1D: Real Notification Capture Test

Goal: prove real transaction notifications are received by the native listener and passed into the JS capture flow.

- [x] Enable Auto Capture in MoneyKai.
- [x] Enable Bank Notifications capture.
- [ ] Trigger or receive real UPI, bank, card, wallet, or payment-app notifications.
- [x] Confirm transaction-like notifications are captured.
- [x] Confirm unrelated notifications are ignored.
- [x] Confirm notifications captured while the app is backgrounded or JS is not active are queued and later flushed.

Completion criteria: real financial notifications reach the MoneyKai capture pipeline. On an emulator, this can only be signed off for synthetic transaction-like notifications because live bank, UPI, card, and wallet apps are not available.

Status: emulator capture validation is complete. Auto Capture and Bank Notifications were enabled, then synthetic shell notifications were used to model transaction and noise behavior. After posting a correctly quoted transaction-like notification, Android stored `android.title=HDFC Bank` and `android.text=Rs 123.45 debited from account for UPI payment to TEST MERCHANT`. The native listener captured it and queued it in app private storage at `shared_prefs/moneykai_native_capture.xml` under `pending_notification_signals` with source `notification`, source app `Shell`, title, body, received timestamp, and raw package name. After the JS app was connected and authenticated in dev demo mode, a fresh synthetic notification (`Rs 789.50 debited from account for UPI payment to PHASE ONE CAFE`) was consumed by the native bridge and did not remain in native pending storage. A non-financial noise notification (`Calendar`, `Team standup starts in 10 minutes`) did not create `moneykai_native_capture.xml` and did not queue a pending capture. Real UPI/bank/card notifications remain untested because the emulator does not have real banking/payment apps or live notification sources.

### Phase 1E: Draft Creation And Parser Tuning

Goal: confirm captured signals become useful reviewable drafts and tune obvious false positives or misses.

- [x] Confirm captured notifications appear as reviewable drafts in Auto Capture.
- [x] Confirm amount, merchant/source, direction, date, and category are reasonable where possible.
- [ ] Record examples of missed financial notifications.
- [ ] Record examples of incorrectly captured non-financial notifications.
- [ ] Tune notification filtering and parsing rules based on real examples.
- [ ] Re-test after tuning with at least UPI, bank, and card-style notifications.

Completion criteria: captured notifications consistently produce reviewable drafts with acceptable false-positive and missed-capture behavior for an initial build.

Status: validated on emulator for the synthetic notification path. The fresh HDFC/UPI shell notification became one pending Auto Capture draft. The Auto Capture screen showed `Pending = 1`, description `PHASE`, amount rounded/displayed as `₹ 790`, payment method `UPI`, transaction date `2026-06-09`, high confidence, and a suggested Food & Dining category. Parser quality still needs real-world fixture testing in Phase 2 because merchant extraction shortened `PHASE ONE CAFE` to `PHASE`.

### Phase 1F: Validation Signoff

Goal: close Phase 1 with documented evidence and a stable baseline.

- [x] Run `npm.cmd run mobile:typecheck`.
- [x] Run `npm.cmd run mobile:lint`.
- [x] Run `npx expo-modules-autolinking verify --platform android`.
- [x] Run a final Android native build.
- [x] Document tested device/emulator, Android version, notification sources, known misses, and known false positives.
- [x] Mark completed Phase 1A-1F checklist items.

Completion criteria: Phase 1 is complete when a native Android build runs successfully, notification access can be granted, real financial notifications are captured, and those captured signals appear as reviewable drafts inside MoneyKai. With only an emulator available, Phase 1 can be marked emulator-complete; the physical-device real-notification check remains a separate hardware-dependent follow-up.

Status: emulator-complete on `MoneyKai_API_36` using Android API 36. Native build, install, listener permission, live listener registration, synthetic transaction notification capture, native bridge consumption, reviewable Auto Capture draft creation, in-app Settings -> Android Notification Access navigation, denied/revoked permission stability, and unrelated/noise notification filtering are validated. `adb`/emulator access has been restored locally, JDK 17 and the Android SDK path are configured for the generated Android project, and the Expo dev client now uses a configured Android launcher URL (`http://10.0.2.2:8081`) instead of unstable raw localhost deep links. While doing that recovery work, a runtime regression in `ModalSheet` surfaced from the sheet touch-propagation workaround; it has now been replaced with a safer layered backdrop plus `Animated.View` sheet implementation. Final clean verification passed with `npm.cmd run typecheck`, `npm.cmd run lint`, `npx.cmd expo-modules-autolinking verify --platform android`, and `.\gradlew.bat :app:assembleDebug --console=plain`. Remaining Phase 1 follow-up: test real UPI/bank/card notifications on a physical Android device or a real installed banking/payment app source. That follow-up is hardware/source-dependent and cannot be completed on the current emulator.

## Phase 2: Capture Quality

After the Android notification listener works, improve parsing and review quality so captured notifications become reliable, explainable, low-noise transaction drafts.

### Phase 2A: Capture Fixture Library

Goal: build a repeatable sample set of real-world notification patterns before changing parser behavior.

- [x] Collect sanitized examples for UPI payments, bank debits, bank credits, card spends, wallet spends, refunds, cashback, failed transactions, OTPs, low-balance alerts, promotional alerts, and statement reminders.
- [x] Store examples as local test fixtures with sensitive values replaced by realistic placeholders.
- [x] Include source app, title, body, expected amount, expected merchant, expected transaction type, expected payment method, expected status, and expected capture decision.
- [x] Include at least 30 fixture cases before tuning parser rules.
- [x] Mark each fixture as `shouldDraft`, `shouldIgnore`, or `needsReview`.

Completion criteria: Phase 2 has a reusable fixture set that represents both valid transaction notifications and noise.

Status: implemented in `src/services/__fixtures__/captureFixtures.ts` with 30 curated sanitized notification cases covering valid drafts, ignored noise, review-needed signals, and duplicate-style updates. Real physical-device examples should still be added as they become available.

### Phase 2B: Indian Bank And Payment Pattern Expansion

Goal: recognize common Indian financial notification formats more reliably.

- [x] Add parser patterns for common wording from UPI apps, banks, card issuers, wallets, and payment gateways.
- [x] Normalize currency markers including `INR`, `Rs`, `Rs.`, rupee symbol, and amount formats with commas and decimals.
- [x] Fix any encoding issues in parser/display text, including mojibake currency or separator characters.
- [x] Detect payment rails such as UPI, debit card, credit card, net banking, IMPS, NEFT, RTGS, wallet, and POS.
- [x] Keep patterns data-driven enough that new bank/payment phrases can be added without rewriting parser flow.

Completion criteria: known Indian UPI, bank, wallet, and card notifications parse into the correct amount and payment method across the fixture set.

Status: implemented in `src/services/captureParser.ts`. Parser rules now use explicit amount, direction, payment-method, merchant, ignore, and category rule groups, with fixture coverage for Indian UPI, card, wallet, bank debit/credit, IMPS, NEFT, POS, refund, and cashback wording.

### Phase 2C: Merchant Extraction Improvements

Goal: extract useful merchant/payee labels from UPI and card messages instead of falling back to source app names.

- [x] Add merchant extraction patterns for phrases like `paid to`, `sent to`, `to VPA`, `at`, `towards`, `merchant`, `Info`, `UPI Ref`, and card/POS merchant formats.
- [x] Strip transaction references, UPI IDs, account masks, timestamps, and trailing bank boilerplate from merchant names.
- [x] Normalize merchant keys consistently for dedupe and learned category rules.
- [x] Preserve a human-readable merchant label for draft display.
- [x] Add fallback priority: parsed merchant, sender, source app, then generic captured transaction label.

Completion criteria: valid fixtures produce stable merchant labels and merchant keys that work for dedupe and learned category matching.

Status: implemented with merchant phrase extraction plus cleanup for UPI refs, UPI IDs, account/card masks, timestamps, and boilerplate. The Phase 1 `PHASE ONE CAFE` truncation is covered by a fixture and now parses as `PHASE ONE CAFE`.

### Phase 2D: Direction And Status Classification

Goal: detect whether a notification should become an expense, income, or ignored signal.

- [x] Improve debit vs credit detection using stronger phrase groups instead of single-word matches like `dr` or `cr` alone.
- [x] Classify refunds and cashback as income only when the message confirms money was credited or reversed.
- [x] Ignore failed, declined, reversed-before-settlement, OTP, mandate, promotional, statement, and low-balance notifications.
- [x] Add a clear parse status such as `draft`, `ignore`, or `review` in parser output.
- [x] Prefer conservative behavior when ambiguous: create a low-confidence review draft only if amount and financial action are both present.

Completion criteria: fixture cases classify debit, credit, refund, cashback, failed-payment, and OTP/noise messages correctly.

Status: implemented. `CaptureParseResult` now exposes `parseStatus`, `ignoreReason`, and transaction reference metadata. Ignored safety-rule matches are stored as ignored signals and do not create drafts.

### Phase 2E: Explainability And Debug View

Goal: make each captured draft transparent so users and developers can understand why it appeared.

- [x] Extend capture parse output with explainability metadata such as matched amount pattern, matched direction terms, matched merchant pattern, matched payment method, matched category rule, confidence factors, and ignore reason.
- [x] Store safe explainability metadata with captured signals or drafts.
- [x] Add a small `Why captured?` section or modal in Auto Capture draft cards.
- [x] Show user-safe details: source app, matched amount, matched merchant, capture confidence, suggested category reason, and dedupe key summary.
- [x] Avoid showing full raw notification payload by default; expose only sanitized text or compact matched snippets.

Completion criteria: every pending draft can explain why MoneyKai captured it and which rule or heuristic influenced it.

Status: implemented. Drafts now store safe parse explanation metadata, and Auto Capture draft cards expose `Why captured?` details without showing the full raw notification payload.

### Phase 2F: Dedupe And Review Quality

Goal: reduce duplicate drafts and make review behavior more stable.

- [x] Improve dedupe keys using source, amount, merchant key, direction, date/time bucket, and transaction reference when available.
- [x] Avoid duplicate drafts from notification updates, grouped notifications, or repeated app alerts.
- [x] Keep legitimate repeated transactions possible when they differ by time, merchant, reference, or amount.
- [x] Ensure ignored signals do not repeatedly reappear as new drafts.
- [x] Preserve learned merchant category rules and apply them only when merchant confidence is high enough.

Completion criteria: duplicate notification fixtures collapse correctly while distinct real transactions remain separate.

Status: implemented with dedupe keys that include source, source app/sender, merchant key, amount, direction, transaction reference when present, and a time bucket. Tests cover duplicate reference collapse and distinct repeated same-amount transactions outside the no-reference time bucket.

### Phase 2G: Local Parser Test Suite And Signoff

Goal: prevent parser regressions as new bank/payment patterns are added.

- [x] Add `vitest` as a mobile dev dependency.
- [x] Add a local test script such as `test:capture`.
- [x] Add tests for `parseCapturedSignal`, `normalizeMerchantKey`, and `buildCaptureDedupeKey`.
- [x] Cover fixture cases for UPI, bank debit, bank credit, card spend, wallet spend, refund, cashback, failed transaction, OTP, promotional noise, and duplicate notifications.
- [x] Run `npm.cmd run mobile:typecheck`, `npm.cmd run mobile:lint`, and the new capture test script before closing Phase 2.
- [x] Document known parser limitations and examples that still require manual review.

Completion criteria: parser and dedupe behavior is covered by local automated tests, and all Phase 2 fixtures pass with accepted confidence and ignore behavior.

Status: implemented. `npm.cmd run mobile:test:capture`, `npm.cmd run mobile:typecheck`, and `npm.cmd run mobile:lint` passed after the parser/test/UI changes. Known limitation: the fixture set is curated and sanitized; real missed-capture and false-positive examples from physical banking/payment apps should be appended when available.

## Phase 3: Production Safety

Before shipping Auto Capture widely, focus on privacy, consent, and user controls so notification capture is transparent, reversible, and safe by default.

### Phase 3A: Permission Explainer Before Android Access

Goal: explain notification access clearly before sending the user to Android system settings.

- [x] Replace direct `Android Notification Access` behavior with a MoneyKai explainer modal or screen first.
- [x] Explain that Android notification access may allow MoneyKai to read notifications, but MoneyKai only uses supported transaction alerts for reviewable drafts.
- [x] Add clear actions: `Open Android Settings`, `Not Now`, and `Learn More`.
- [x] Track whether the user has seen or accepted the explainer.
- [x] Keep notification access hidden or disabled on unsupported platforms.
- [x] Re-check native permission status after the user returns from Android settings.

Completion criteria: users see a clear explanation before opening Android notification-listener settings.

Status: implemented in Settings. Android notification access is gated by an explainer modal, consent timestamp, source status labels, and native permission re-checks on return/AppState active.

### Phase 3B: Privacy Copy And User Trust

Goal: make the privacy model visible inside the app and privacy policy.

- [x] Update the Privacy Policy with a dedicated Auto Capture section.
- [x] Explain that supported notification signals are processed on-device for transaction draft creation.
- [x] Explain that captured drafts require review before affecting budgets or transaction history.
- [x] Explain what is stored locally: source, parsed amount, merchant, confidence, and safe metadata.
- [x] Explain what should not be stored or shown by default: full raw notification payloads and unrelated notification content.
- [x] Add short privacy copy near Auto Capture settings.

Completion criteria: users can understand what Auto Capture reads, stores, ignores, and controls before enabling it.

Status: implemented in the Privacy Policy and the Auto Capture Settings section.

### Phase 3C: Quick Disable And Clear Capture Controls

Goal: give users immediate control over Auto Capture and captured history.

- [x] Add a prominent `Disable Auto Capture` control in Auto Capture or Settings.
- [x] Add `Clear Capture History` to remove pending/ignored captured signals and drafts.
- [x] Add confirmation before clearing data.
- [x] Preserve confirmed transactions when clearing capture history.
- [x] Stop native listening when Auto Capture or notification capture is disabled.
- [x] Add native cleanup support if queued native pending signals need to be cleared too.

Completion criteria: users can quickly stop capture and clear unconfirmed capture data without deleting confirmed transactions.

Status: implemented. Settings provides Disable Auto Capture and Clear Capture History. The native module supports `setCaptureEnabled(false)` and `clearPendingSignals()` so disabled capture cannot continue queuing native notification signals.

### Phase 3D: Capture Source Badges

Goal: make every draft and signal source obvious.

- [x] Add source badges for `Notification`, `SMS`, and `Manual`.
- [x] Show source badges on Auto Capture draft cards.
- [x] Show source app where safe, such as bank app, UPI app, or wallet app.
- [x] Use consistent colors, icons, and labels for each source.
- [x] Keep SMS visually marked as future or research-only until it is production-ready.
- [x] Ensure source badges are accessible and readable in light and dark themes.

Completion criteria: users can immediately tell where every captured draft came from.

Status: implemented on pending draft cards and recent signals, with Settings marking SMS as research-only and unavailable through production controls.

### Phase 3E: Raw Payload Minimization

Goal: prevent sensitive notification payloads from being overexposed, persisted unnecessarily, or backed up accidentally.

- [x] Stop storing full raw notification payloads by default.
- [x] Store only safe parsed fields and sanitized explainability metadata.
- [x] Redact account numbers, UPI IDs, card masks, transaction references, OTPs, and long raw message text where possible.
- [x] Keep raw payload access behind dev-only diagnostics if needed.
- [x] Confirm cloud backups do not include raw notification payloads or capture inbox data unless a future explicit opt-in is designed.
- [x] Add a safety review for AsyncStorage persistence of captured signals and drafts.

Completion criteria: captured notification data is minimized, sanitized, and not exposed through normal UI or backup flows.

Status: implemented for normal capture storage. JS capture storage persists sanitized snippets and safe parse explanation metadata instead of raw payloads. Native pending signals are sanitized before being emitted or queued. Existing cloud backup snapshots do not include capture inbox state.

### Phase 3F: Consent State And Settings Robustness

Goal: make Auto Capture state predictable and scalable as more sources are added.

- [x] Extend capture settings with consent fields such as notification explainer accepted status and timestamp.
- [x] Keep source-level toggles independent: Auto Capture master switch, Notification source, SMS research source, and future Manual source.
- [x] Show status labels for each source: `Enabled`, `Disabled`, `Needs Android access`, `Research only`, or `Unsupported`.
- [x] Handle revoked Android notification access gracefully.
- [x] Avoid enabling source toggles when the platform or permission state makes them unusable.

Completion criteria: settings accurately reflect consent, platform support, and permission state.

Status: implemented. Settings stores notification explainer acceptance and native access status, refreshes access state on app activation, disables unsupported source controls, and labels notification/SMS source readiness.

### Phase 3G: Production Safety Test Pass

Goal: verify Phase 3 protections before wider release.

- [x] Test first-time permission explainer flow.
- [x] Test denied, granted, and revoked Android notification access.
- [x] Test disable Auto Capture stops new drafts.
- [x] Test clear capture history removes pending/ignored capture data but keeps confirmed transactions.
- [x] Test source badges for notification drafts and placeholder future SMS/manual states.
- [x] Test privacy copy renders correctly.
- [x] Test backups do not include raw capture payloads.
- [x] Run `npm.cmd run mobile:typecheck` and `npm.cmd run mobile:lint`.

Completion criteria: privacy, consent, controls, source labeling, and data minimization pass manual and automated validation.

Status: complete on the `MoneyKai_API_36` Android emulator. A clean dev-client session validated `Home -> menu -> Settings`, the Auto Capture privacy copy, first-time Android notification-access explainer, source readiness labels, SMS research-only placeholder state, disabled Notification Access behavior, and Disable Auto Capture confirmation copy. Android secure listener state was tested through denied, granted, and revoked values for `com.moneykai.mobile/com.moneykai.nativecapture.MoneyKaiNotificationListenerService`; MoneyKai reflected revoked access as needing Android access. Disabling Auto Capture set native `capture_enabled=false`, and a synthetic HDFC-style notification posted while disabled did not create new pending native capture data. Repeatable Vitest coverage now verifies disabled capture ignores new signals and `clearCaptureInbox()` removes pending/ignored capture data while preserving confirmed drafts and transaction-history writes. Final checks passed with `npm.cmd run mobile:test:capture`, `npm.cmd run mobile:typecheck`, and `npm.cmd run mobile:lint`.

## Phase 4: SMS Research Mode

SMS is not implemented yet. Start this only after notification capture is stable, because SMS access carries Android permission, privacy, and Google Play policy risk.

### Phase 4A: SMS Policy And Product Viability Review

Goal: decide whether SMS capture is worth pursuing before writing native SMS code.

- [x] Review current Google Play SMS and Call Log permission policy.
- [x] Confirm whether MoneyKai qualifies for SMS permissions as a budgeting app.
- [x] Document risks of `READ_SMS`, `RECEIVE_SMS`, and inbox-read approaches.
- [x] Compare safer alternatives: notification capture, manual paste/import, email statement parsing, or bank export import.
- [x] Decide one of three outcomes: `Do not pursue`, `Research-only`, or `Production candidate after policy approval`.

Completion criteria: Phase 4 has a written go/no-go decision before SMS permissions are added.

Status: completed as a policy/product gate. Current Google Play policy treats SMS and Call Log permissions as high-risk sensitive access. Apps normally must be the active default SMS, Phone, or Assistant handler, and exceptions require Play Console declaration and review. Google lists `SMS-based money management` as a possible exception category for apps that track or manage budgets with `READ_SMS`, `RECEIVE_MMS`, `RECEIVE_SMS`, and `RECEIVE_WAP_PUSH`, but approval is not automatic and the app must limit access to critical core functionality, disclose use clearly, avoid non-financial SMS exfiltration, and remove permissions if it does not qualify. MoneyKai's decision for Phase 4 is `Research-only`: do not add SMS permissions to production builds, do not ship inbox-read or receiver code in production, and continue relying on notification capture plus manual/import alternatives unless Play policy approval, legal/privacy review, and real-device validation later support a production candidate.

Risk notes:
- `READ_SMS` is the highest-risk approach because it can expose historical inbox content, OTPs, personal conversations, and non-financial messages; it should not be used outside an explicitly approved research/internal build.
- `RECEIVE_SMS` is narrower than inbox read because it only receives new messages, but it still requests restricted SMS access and can ingest unrelated personal messages if filtering fails.
- Inbox-read strategies create the largest privacy and backup risk because they invite bulk processing; if ever prototyped, they must store only sanitized parsed fields, never raw message history.
- SMS Retriever/User Consent APIs are suitable for OTP-style verification flows, not bank transaction scraping or budgeting ingestion.
- Safer alternatives stay preferred: Android notification capture, manual paste/import of sanitized messages, email statement parsing, bank export import, and future account-aggregator/bank-sync style integrations.

### Phase 4B: Research-Only Architecture

Goal: design SMS capture so it cannot accidentally ship in production.

- [x] Keep SMS disabled by default.
- [x] Keep `smsResearchModeEnabled` separate from normal Auto Capture.
- [x] Ensure production builds do not include SMS permissions unless explicitly approved.
- [x] Use a dev/internal build profile for SMS experiments.
- [x] Add clear in-app labeling: `SMS Research Mode`.
- [x] Add a kill switch that disables SMS ingestion immediately.

Completion criteria: SMS research can be tested without creating Play Store production risk.

Status: implemented as a research-only architecture guard. `smsResearchModeEnabled` remains disabled by default and separate from the Auto Capture master and notification source toggles. `ingestSmsCapture()` now refuses SMS signals unless `isSmsResearchBuildEnabled()` returns true, and the environment guard only allows that when `EXPO_PUBLIC_SMS_RESEARCH_BUILD=true` in a dev runtime. `eas.json` explicitly enables the research flag only for the internal development profile and disables it for preview and production. Production app config still declares no restricted SMS permissions. Repeatable tests cover the SMS research ingestion gate, EAS profile flag split, and absence of restricted SMS permissions in `app.json`.

### Phase 4C: SMS Ingestion Strategy Spike

Goal: evaluate possible SMS ingestion approaches and choose the safest one.

- [x] Evaluate native `RECEIVE_SMS` receiver for new incoming SMS.
- [x] Evaluate inbox-read strategy with `READ_SMS`.
- [x] Evaluate manual paste/import as a no-permission fallback.
- [x] Evaluate SMS Retriever/User Consent APIs only for OTP-style messages, not bank transaction scraping.
- [x] Choose a research strategy based on privacy, reliability, Play policy risk, and implementation cost.

Completion criteria: one SMS ingestion strategy is selected for research, with rejected alternatives documented.

Status: completed as a strategy spike. Chosen next research strategy is `manual paste/import first`, with native `RECEIVE_SMS` kept as a later dev-only prototype candidate only if manual/import validation proves enough user value and policy review remains favorable. `READ_SMS` inbox-read is rejected for now because broad historical inbox access has the highest privacy, policy, and data-minimization risk. SMS Retriever/User Consent APIs are rejected for transaction ingestion because they are intended for OTP-style verification and do not provide a compliant path for broad bank-message parsing. Manual paste/import has the best production safety profile because it needs no restricted permissions, can reuse the existing fixture-driven parser, can show strong consent/disclosure before parsing, and can discard raw input immediately after sanitized draft creation.

Strategy notes:
- Manual paste/import should become the first implementation target if Phase 4 proceeds because it validates SMS parsing value without adding Play Store SMS permissions.
- Native `RECEIVE_SMS` can be reconsidered only for internal research builds guarded by `EXPO_PUBLIC_SMS_RESEARCH_BUILD=true`, with no production manifest permissions.
- `READ_SMS` should remain blocked unless MoneyKai has explicit Play Console approval, legal/privacy sign-off, and a narrow user-initiated import design that avoids bulk raw storage.
- All SMS paths must route through `source: 'sms'`, never auto-confirm transactions, and preserve the existing sanitized parse-explanation model.

### Phase 4C.1: No-Permission Manual SMS Import Prototype

Goal: validate SMS parsing value without requesting restricted Android SMS permissions.

- [x] Add an internal research-only paste/import entry point.
- [x] Keep production and preview builds free of SMS import UI and SMS permissions.
- [x] Require `SMS Research Mode` as a kill switch before pasted SMS can be imported.
- [x] Route pasted SMS through the existing capture pipeline as `source: 'sms'`.
- [x] Do not auto-confirm imported SMS transactions.
- [x] Store only sanitized capture fields and discard raw pasted text after parsing.
- [x] Cover the manual SMS import path with repeatable tests.

Completion criteria: internal builds can create reviewable SMS drafts from pasted messages without adding Android SMS permissions or storing raw SMS payloads.

Status: implemented. The Auto Capture review screen now exposes a dev/research-only `Paste SMS` action when `EXPO_PUBLIC_SMS_RESEARCH_BUILD=true`. The action remains blocked unless `SMS Research Mode` is enabled in Settings, preserving a clear kill switch. Pasted SMS text is passed through `ingestSmsCapture()` without raw payload forwarding, creates only reviewable drafts, and uses the existing `SMS` source badge and sanitized parse-explanation model. Production and preview builds keep the SMS research flag off and still request no restricted SMS permissions.

### Phase 4D: Dev-Only Native SMS Prototype

Goal: build a contained prototype only if Phase 4A and 4C allow it.

- [x] Add SMS native code only behind dev/internal build controls.
- [x] Route SMS signals through the existing capture pipeline as `source: 'sms'`.
- [x] Do not auto-confirm SMS transactions.
- [x] Store only sanitized parsed fields.
- [x] Ignore OTP, promotional, failed, and non-financial SMS messages.
- [x] Ensure disabling SMS Research Mode stops ingestion.

Completion criteria: SMS can create reviewable research drafts in dev builds without affecting production builds.

Status: implemented as a dev-only native prototype. `app.config.js` preserves the existing Expo config but loads `withMoneyKaiSmsResearch` only when `EXPO_PUBLIC_SMS_RESEARCH_BUILD=true`; production and preview builds therefore keep `app.json` free of restricted SMS permissions and do not register the SMS receiver. The Android receiver handles only new `SMS_RECEIVED` events in research builds, requires the native capture master switch plus the SMS source switch, performs conservative native filtering for financial wording while dropping OTP/promotional/failed/noise messages, sanitizes SMS sender/body fields before queuing, and emits through the existing capture event path as `source: 'sms'`. The JS coordinator now sets notification and SMS native source switches independently, while the store still requires `SMS Research Mode` before creating reviewable SMS drafts.

### Phase 4E: SMS Parser And Noise Handling

Goal: make SMS parsing conservative and privacy-safe.

- [x] Reuse Phase 2 fixture-driven parser approach.
- [x] Add sanitized SMS fixtures for bank debit, bank credit, card spend, UPI, refund, cashback, OTP, and promotional messages.
- [x] Prefer `ignored` or `needsReview` over aggressive drafting when uncertain.
- [x] Redact account numbers, card masks, UPI IDs, OTPs, and transaction references.
- [x] Track why each SMS was drafted or ignored.

Completion criteria: SMS parser behavior is covered by fixtures and avoids noisy or sensitive drafts.

### Phase 4F: Consent, Privacy, And Controls

Goal: make SMS research transparent and reversible.

- [x] Add a strong SMS Research Mode explainer before enabling.
- [x] Explain that SMS access is experimental and disabled by default.
- [x] Add quick disable and clear SMS research data controls.
- [x] Prevent SMS raw message bodies from cloud backup by default.
- [x] Show `SMS` source badges on drafts.
- [x] Add privacy-policy copy only if SMS research is actually implemented.

Completion criteria: users can understand, disable, and clear SMS research data safely.

Status: implemented. Settings now requires an SMS-specific explainer before enabling `SMS Research Mode`, records the acceptance timestamp, and keeps SMS research disabled by default outside internal builds. Internal builds expose quick `Disable SMS Research` and `Clear SMS Research Data` controls that stop new SMS ingestion and remove pending or ignored SMS research drafts without touching notification drafts or confirmed transactions. Cloud backup copy now states that capture inbox data and raw SMS bodies are excluded by default, the Privacy Policy includes SMS Research Mode, and automated tests cover consent tracking, SMS-only clearing, config gating, and backup exclusion.

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

## Phase 6: Account Aggregator Feasibility And Bank Sync

Account Aggregator should be treated as a separate feasibility-led phase after native notification capture and release readiness. AA is a regulated bank-data integration, not a normal mobile permission or direct bank API.

### Phase 6A: AA Eligibility And Provider Decision

Goal: decide whether MoneyKai can pursue Account Aggregator directly or needs a regulated partner/provider.

- [ ] Confirm whether MoneyKai can legally act as a Financial Information User.
- [ ] Confirm whether MoneyKai needs a regulated FIU partner, TSP, or AA integration provider.
- [ ] Review RBI, Sahamati, and provider requirements for FIU onboarding.
- [ ] Identify required business, legal, security, and compliance documents.
- [ ] Compare provider options for sandbox access, pricing, APIs, support, bank coverage, and production onboarding.
- [ ] Decide one of three outcomes: `Do not pursue`, `Partner/provider route`, or `Direct FIU onboarding`.

Completion criteria: MoneyKai has a documented AA go/no-go decision and a selected integration route before writing production AA code.

### Phase 6B: Consent UX And Permission Model

Goal: design a user consent flow that is transparent, revocable, and limited to the data MoneyKai actually needs.

- [ ] Add an AA explainer that clearly states bank data access is optional and consent-based.
- [ ] Explain that AA consent is not an Android permission and is approved through the AA ecosystem.
- [ ] Show requested data type, purpose, data range, data life, fetch type, consent duration, and revocation option before starting consent.
- [ ] Prefer one-time consent for v1 instead of recurring/periodic fetch.
- [ ] Request only deposit account transaction data needed for budgeting and expense tracking.
- [ ] Avoid profile, credit, investment, insurance, pension, GSTN, or unrelated financial data in v1.
- [ ] Add user controls to view consent status, refresh status, expiry, and revoke/disconnect.

Completion criteria: users can understand exactly what bank data MoneyKai requests, why it is needed, how long it is used, and how to revoke it.

### Phase 6C: Backend AA Sandbox Integration

Goal: implement AA through the backend only, keeping provider secrets and financial-data handling out of the mobile app.

- [ ] Add backend endpoints for starting consent, checking consent status, syncing data, listing linked accounts, listing imports, and revoking consent.
- [ ] Integrate with the selected AA/FIU provider sandbox.
- [ ] Handle consent callbacks or webhooks securely.
- [ ] Store consent IDs, provider references, status, expiry, linked account metadata, and sync status.
- [ ] Do not store provider secrets, tokens, or decrypted financial payloads on the mobile client.
- [ ] Add backend audit logs for consent creation, data fetch, revocation, and failure states.

Completion criteria: the backend can complete a sandbox AA consent flow and fetch approved financial information without exposing AA credentials to the app.

### Phase 6D: Structured Transaction Import

Goal: convert AA bank statement data into MoneyKai reviewable transaction drafts.

- [ ] Map AA financial information into a normalized MoneyKai bank transaction model.
- [ ] Extract transaction date, posted date if available, amount, debit/credit direction, narration, reference, account source, and balance if available.
- [ ] Reuse capture parser/category logic where useful, but keep AA imports as structured bank data rather than notification text.
- [ ] Create reviewable imported transaction drafts before adding them to transaction history.
- [ ] Add dedupe using account, transaction date, amount, direction, reference, narration hash, and source.
- [ ] Handle failed syncs, empty statements, unsupported banks, partial data, duplicate imports, and revoked consent.

Completion criteria: AA statement data imports into MoneyKai as stable reviewable drafts without duplicating existing transactions.

### Phase 6E: Privacy, Security, And Revocation Controls

Goal: protect bank data and make user control obvious.

- [ ] Add privacy-policy copy for AA bank sync before any production rollout.
- [ ] Store only normalized transaction data needed by MoneyKai, not full raw AA payloads by default.
- [ ] Encrypt sensitive backend records and restrict access by authenticated user.
- [ ] Add `Disconnect Bank Sync` and `Delete Imported Bank Data` controls.
- [ ] Stop future syncs immediately when consent is revoked or expires.
- [ ] Exclude raw AA payloads from backups unless a future explicit opt-in is designed.
- [ ] Add user-visible consent history and last sync status.

Completion criteria: users can revoke consent, disconnect bank sync, delete imported data, and trust that raw AA payloads are minimized.

### Phase 6F: AA Production Gate

Goal: decide whether AA is ready to move beyond sandbox.

- [ ] Complete sandbox consent, fetch, import, revoke, and expired-consent tests.
- [ ] Complete provider production onboarding requirements.
- [ ] Complete security review for backend endpoints, storage, logging, and access control.
- [ ] Complete privacy/legal review for AA consent copy and policy text.
- [ ] Validate bank coverage for target users.
- [ ] Confirm support process for failed linking, revoked consent, incorrect imports, and data deletion requests.
- [ ] Decide final status: `Keep sandbox-only`, `Pilot with limited users`, or `Move toward production`.

Completion criteria: Account Aggregator has a documented production-readiness decision backed by sandbox results, compliance review, and user-control implementation.

## Upcoming Phases

Future phases will be added here one by one as they are defined.
