# MoneyKai TODO

This file tracks the remaining setup and verification work after the cleanup pass.

## Phase 1: Critical Setup
- [x] Configure the `EXPO_PUBLIC_FIREBASE_*` keys in `.env`.
- [ ] Enable Email/Password auth in Firebase Authentication.
- [ ] Enable Google auth in Firebase if browser-based Google sign-in should be available.
- [ ] Create a Firestore database and verify backup/restore works end to end.
- [ ] Run the app once with a real Firebase project and confirm auth hydration, sign out, profile edits, and backups work end to end.

## Phase 2: Data Verification
- [ ] Back up a real signed-in account and restore it on another device or a fresh app install.
- [ ] Verify notification toggles, local alerts, and notification tap routing on a physical device.
- [ ] Confirm transactions, notes, groups, savings, and challenges all persist under the signed-in user instead of the demo account.

## Phase 3: Polish
- [ ] Replace the placeholder store/app identifiers in the project metadata with the final production values when they are available.
- [ ] Add app-store-specific review links once the real App Store and Play Store IDs exist.
- [x] Document the production launch checklist in the repo README once the environment is finalized.


