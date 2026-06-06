# SmartPaisa TODO

This file tracks the remaining setup and verification work after the cleanup pass.

## Phase 1: Critical Setup
- [ ] Configure `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` in `.env`.
- [ ] Apply `supabase/migrations/001_initial_schema.sql` and `supabase/migrations/002_user_backups.sql` in Supabase.
- [ ] Verify Google OAuth settings in Supabase so the browser-based sign-in redirect matches the app scheme.
- [ ] Run the app once with a real Supabase project and confirm auth hydration, sign out, and profile edits work end to end.

## Phase 2: Data Verification
- [ ] Back up a real signed-in account and restore it on another device or a fresh app install.
- [ ] Verify notification toggles, local alerts, and notification tap routing on a physical device.
- [ ] Confirm transactions, notes, groups, savings, and challenges all persist under the signed-in user instead of the demo account.

## Phase 3: Polish
- [ ] Replace the placeholder store/app identifiers in the project metadata with the final production values when they are available.
- [ ] Add app-store-specific review links once the real App Store and Play Store IDs exist.
- [ ] Document the production launch checklist in the repo README once the environment is finalized.

