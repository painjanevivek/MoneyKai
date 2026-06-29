# MoneyKai Flutter Phase 1 Previous App Memory

Last reviewed: 2026-06-29

## Evidence reviewed

- `apps/MoneyKai-mobile/docs/react-native-cli-migration-phase1.md`
- `apps/MoneyKai-mobile/docs/react-native-cli-migration-phase5.md`
- `apps/MoneyKai-mobile/docs/phase5-release-readiness.md`
- `apps/MoneyKai-mobile/docs/phase5-internal-release-signoff.md`
- `apps/MoneyKai-mobile/docs/new-app-testing-requirements.md`
- `apps/MoneyKai-mobile/src/navigation/RootNavigator.tsx`
- `apps/MoneyKai-mobile/src/navigation/AppTabs.tsx`
- `apps/MoneyKai-mobile/src/constants/theme.ts`
- `apps/MoneyKai-mobile/package.json`
- `apps/MoneyKai-mobile/app.config.js`
- `apps/MoneyKai-mobile/app.json`
- Saved device/UI artifacts under `.codex-artifacts/`, especially `moneykai-physical-final.png`.

Google Stitch MCP was searched for through available tools and was not available in this Codex session.

## What existed

The previous mobile app was a TypeScript React Native mobile app. It started as Expo SDK 56 / Expo Router work and later had a React Native CLI migration documented in the repo. The current tracked mobile package still contains mixed historical Expo files and React Native CLI files, so it should be treated as source memory, not as code to copy directly.

Known app identity:

- App display name: `MoneyKai`.
- Android package: `com.moneykai.mobile`.
- Version in previous mobile package: `1.0.1`.
- Android target SDK in release notes: `36`.
- Previous release goal: Play Console internal testing.

Primary navigation model:

- Auth gate restores session before entering the app.
- Unauthenticated users see auth flow.
- Authenticated users enter bottom tabs.
- Bottom tabs: `Home`, `Transactions`, `Add`, `Budget`, `More`.
- Additional stack screens: profile edit, notifications, notes, groups, learn, savings, AI review, settings, auto capture, subscriptions.

Primary screen inventory:

- Login
- Signup
- Forgot password
- Dashboard/Home
- Transactions
- Add transaction
- Budget
- Savings
- Notifications
- Notes
- Groups
- Learn
- More
- Settings
- Profile edit
- Auto capture
- AI review
- Subscriptions
- Accounts
- Analytics
- Portfolio/wealth

Reusable UI containers and components:

- Balance cards
- Budget health and monthly budget summary cards
- Category budget rail
- Recent transactions
- Quick notes and note modal
- Savings goal card
- Emergency widget
- AI insights
- Charts: trend line, pie, category bar, savings analytics
- Modal sheets and dialogs
- Themed alert provider
- App screen header
- Empty/loading/error screen states
- Transaction composer sheet
- Budget-required dialog
- User avatar
- Progress bars and progress-flow cards

Finance features present or planned:

- Manual income/expense transactions with INR formatting.
- Monthly budget and category budget tracking.
- Budget reset coordination.
- Recent transaction history with search/filter/delete.
- Savings goals and challenges.
- Notes and groups/split-bill concepts.
- Notifications and optional capture review.
- Auto capture from Android notification listener.
- SMS research/import concepts gated by policy.
- Pasted SMS import with reviewable drafts.
- Financial document/statement review components.
- Gmail sync and linked account/provider scaffolding.
- Portfolio/wealth workspace and manual holdings.
- Backup/restore workflow with privacy gates.
- Internal testing report bundle.

State and persistence:

- The previous app used Zustand stores with `persist` middleware.
- Local persisted storage used AsyncStorage broadly.
- `react-native-mmkv` appeared in network/token storage fallback code.
- Important persisted areas included auth/session, settings, budget, transactions, capture queue, notes, groups, badges, portfolio, sync state, and notification state.
- Remote sync boundaries existed through Firebase/Firestore services, backend API clients, backup service, Gmail/linked-account services, and sync queue code.

Security and privacy choices:

- User-owned Firestore data was scoped under `users/{uid}`.
- Sensitive capture features were intended to be optional and reversible.
- Production Play-safe builds blocked restricted SMS permissions.
- SMS research/native capture was separated from Play-safe production builds.
- Raw SMS bodies and raw notification payloads were not supposed to persist in backups or diagnostics.
- App lock / biometric concepts existed through native biometric dependency usage.
- Release docs required permission audits, signing guardrails, and sanitized test reports.

Android build and release notes:

- Historical debug/release artifacts existed, but older local AABs were explicitly not Play upload candidates when debug signed.
- Release docs required fresh AAB production, permission verification, signing verification, device smoke testing, and handoff capture.
- Production builds were expected to avoid restricted SMS permissions unless policy approval existed.
- Android Studio was referenced as useful for native debugging and final signing work, but CLI builds were the core automation path.

UI memory from screenshots and theme files:

- Visual direction was calm finance utility.
- Base colors were off-white/white with deep text and restrained teal/emerald accents.
- Layout used large readable headings, metric cards, rounded inputs, pill filters, primary teal action buttons, and bottom navigation.
- Existing theme palettes included light, dark, emerald, ocean, rose, aurora, and several dark variants.
- The saved physical-device screenshot showed a real icon-font rendering defect where icons appeared as `NO GLYPH`. Flutter should avoid that by using Material/Cupertino icons or bundled icon assets with verified rendering.

## What should be kept

- Android-first delivery with iOS-compatible architecture.
- App identity: `MoneyKai`, `com.moneykai.mobile`.
- Auth gate and local session restoration pattern.
- Bottom-tab app shell with quick add as a first-class action.
- Core finance workflow: dashboard, add transaction, transactions, budget, insights, settings.
- INR-first formatting and India-oriented financial UX.
- Offline-first local persistence with a clear future sync boundary.
- Review-before-confirm pattern for imported/captured transactions.
- Privacy posture: no raw SMS/notification payload persistence, optional sensitive permissions, sanitized diagnostics.
- Release discipline: permission audit, signing checks, artifact capture, documented handoff.
- Calm off-white + deep text + restrained teal accent direction, with better icon reliability and less visual clutter.

## What should be improved

- Build a Flutter/Dart app instead of reusing the old React Native implementation.
- Start with a smaller production-grade MVP rather than recreating every old screen at once.
- Replace scattered store-heavy logic with feature-first Flutter folders, repositories, services, and focused state controllers.
- Use an explicit local storage layer from day one.
- Keep remote sync interfaces but do not wire fake backend behavior.
- Replace `NO GLYPH` icon dependency issues with verified Flutter icons/assets.
- Avoid overbroad native permissions in the first Flutter MVP.
- Make every visible button functional or clearly marked as coming soon.
- Add Flutter unit/widget tests while features are implemented, rather than only release-end checks.
- Keep iOS compatibility by avoiding Android-only assumptions in shared business/UI code.

## What should be discarded for the Flutter MVP

- Blind porting of React Native component trees or Expo/CLI migration code.
- Expo-specific routing/config/plugin decisions.
- React Navigation, Zustand, AsyncStorage, React Native Firebase, Notifee, and native module code as implementation dependencies.
- SMS receiver/restricted SMS production behavior.
- Play-upload artifacts and debug-signed historical AABs.
- Marketing/website routes inside the mobile app.
- Portfolio broker sync, Gmail sync, financial document ingestion, AI attachment analysis, and subscriptions as first MVP requirements.
- Decorative glass/gradient complexity where it hurts readability or performance.

## Flutter direction derived from memory

The Flutter app should start as a focused offline-first personal finance app:

- Local/mock auth.
- Dashboard summary.
- Add transaction.
- Transaction list with search/filter/delete.
- Budget setup and category progress.
- Insights/reports from local transactions.
- Profile/settings/privacy.
- A review queue only if implemented as local manual/import drafts, not as native notification/SMS capture in the MVP.

Implementation should preserve the old product intent while rebuilding the app natively in Flutter with a smaller, testable surface.
