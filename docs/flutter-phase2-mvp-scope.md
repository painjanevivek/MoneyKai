# MoneyKai Flutter Phase 2 MVP Scope

Last reviewed: 2026-06-29

## Product goal

Build MoneyKai as an Android-first Flutter personal finance app with the same Dart/Flutter UI and architecture kept iOS-compatible from day one.

The MVP is an offline-first local finance workspace. It should feel production-grade, but it should not pretend to have live bank sync, investment advice, or backend services before those are actually implemented.

## MVP screens

### 1. Splash and onboarding

Purpose:

- Show MoneyKai identity while local state initializes.
- Route returning users into the app shell.
- Route first-time users to local sign-in/sign-up.

Required actions:

- Continue/get started.
- Sign in.
- Create local account.

### 2. Sign in, sign up, and local auth

Purpose:

- Provide a local/mock session boundary while backend auth is deferred.
- Keep interfaces ready for real auth later.

Required actions:

- Sign in with email/password-style local credentials.
- Create local account.
- Sign out from settings.

Deferred:

- Firebase/Google sign-in.
- Backend session refresh.
- Password reset email delivery.

### 3. Dashboard

Purpose:

- Give the user a fast monthly overview.

Required containers:

- Balance summary.
- Monthly income and expense.
- Budget progress.
- Recent transactions.
- Category breakdown preview.
- Quick add transaction action.

Required actions:

- Open add transaction.
- Open transaction list.
- Open budget.
- Open insights.

### 4. Add transaction

Purpose:

- Let users record income and expenses quickly.

Required fields:

- Type: income or expense.
- Amount.
- Date.
- Category.
- Payment method.
- Description/note.

Required behavior:

- Validate required fields.
- Reject zero or negative amounts.
- Save locally.
- Update dashboard, budget, and insights immediately.

### 5. Transactions list

Purpose:

- Maintain the transaction history that powers budgets and reports.

Required containers/actions:

- Search.
- Type filter: all, income, expense.
- Category filter.
- Month grouping.
- Edit transaction.
- Delete transaction.
- Empty state.

### 6. Budget

Purpose:

- Let users define and review monthly spending limits.

Required containers/actions:

- Monthly budget amount.
- Category budgets.
- Progress bars.
- Over-budget state.
- Update budget action.

Required behavior:

- Expense transactions update category and total progress.
- Budget state persists after restart.

### 7. Insights and reports

Purpose:

- Provide simple, honest reporting from local data.

Required containers:

- Income vs expense summary.
- Top spending categories.
- Monthly trend.
- Basic savings rate.

Non-goal:

- No AI or investment advice in the MVP.

### 8. Profile and settings

Purpose:

- Give users control over profile, app behavior, and local data.

Required containers/actions:

- Local profile display.
- Theme preference if implemented without complexity.
- Currency display fixed to INR for MVP.
- Local data export as JSON when implemented without extra platform dependencies.
- Data reset with confirmation.
- Sign out.

### 9. Privacy and security

Purpose:

- Make the data model and local-only status clear.

Required containers/actions:

- Local data explanation.
- Sensitive-permission status.
- No SMS/notification capture status for MVP.
- Coming-soon backend sync explanation.

## Feature containers and cards

The first Flutter UI pass should include reusable widgets for:

- App shell.
- Screen wrapper.
- Bottom navigation.
- Primary and secondary buttons.
- Metric card.
- Balance summary card.
- Monthly income/expense card.
- Budget progress card.
- Category progress row.
- Transaction row.
- Recent transactions card.
- Category breakdown card.
- Quick add action.
- Empty state.
- Error state.
- Loading state.
- Form field.
- Confirmation dialog.

Review/approval queue:

- Carry forward only as a local "Drafts" or "Review queue" if imported transaction drafts are implemented.
- Do not implement native notification/SMS capture in the MVP.

## Offline-first behavior

Required:

- All MVP data is stored locally on device.
- App works without network.
- Local data survives app restart.
- Repositories expose interfaces that can later be backed by a remote sync service.
- Backend sync is a boundary, not a fake feature.

Initial persistence choice:

- Use a stable Flutter local persistence package after evaluating build compatibility.
- Prefer simple structured persistence for MVP data.
- Avoid adding a database abstraction until the model needs query complexity beyond local transaction/budget lists.

Backend sync boundary:

- Keep models serializable.
- Keep repository interfaces independent from widgets.
- Do not hard-code Firebase, Supabase, or custom API clients into UI code.

## Design direction

The Flutter MVP should keep the previous app's useful visual memory but simplify execution:

- Calm finance utility.
- White/off-white base.
- Deep slate/black text.
- Restrained teal/emerald accent.
- High contrast for amounts and destructive actions.
- No loud gradients.
- No cluttered dashboard.
- No icon-font placeholders; use verified Flutter icons or local assets.
- Layout must work on small Android screens and larger iOS screens.

## Non-goals

- No blind React Native port.
- No Expo/WebView surface.
- No WebView.
- No fake investment advice.
- No live bank sync.
- No Gmail sync.
- No broker/portfolio provider sync.
- No SMS inbox access.
- No notification listener capture.
- No Play-restricted permissions.
- No subscriptions or payments.
- No backend auth until a real backend integration phase is opened.
- No broken buttons.

## Button and navigation rule

Every visible button in the Flutter MVP must do one of the following:

- Complete the action immediately.
- Navigate to an implemented screen.
- Open an implemented dialog/sheet.
- Be clearly marked `Coming soon` and remain non-destructive.

No visible button may silently do nothing.

## Initial route map

| Route | Screen | Status |
| --- | --- | --- |
| `/splash` | Splash/onboarding | MVP |
| `/auth/sign-in` | Sign in | MVP |
| `/auth/sign-up` | Sign up | MVP |
| `/dashboard` | Dashboard tab | MVP |
| `/transactions` | Transactions tab | MVP |
| `/transactions/add` | Add transaction | MVP |
| `/transactions/edit/:id` | Edit transaction | MVP |
| `/budget` | Budget tab | MVP |
| `/insights` | Insights tab or stack screen | MVP |
| `/settings` | Profile/settings tab | MVP |
| `/privacy` | Privacy/security | MVP |

## Architecture guardrails for implementation

- Feature-first folder structure.
- Models/entities separate from widgets.
- Repositories/services separate from widgets.
- State management selected deliberately before feature implementation.
- Business logic stays out of widget files except trivial formatting or UI-only state.
- Tests should cover models, repositories, and key widgets as features are added.

## Definition of done for Phase 2

- MVP scope is explicitly documented.
- Previous app memory has influenced the scope.
- Non-goals are listed.
- Offline-first behavior is defined.
- Every visible button rule is defined before implementation.
