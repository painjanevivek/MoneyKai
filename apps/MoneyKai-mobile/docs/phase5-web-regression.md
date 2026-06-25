# Phase 5G Web Regression

Last reviewed: 2026-06-11

## Current status

The web app is part of the monorepo and must stay stable while mobile release work changes shared services, assets, and package scripts.

## Automated checks

| Check | Status | Evidence |
| --- | --- | --- |
| Web typecheck | Pending latest run | `npm.cmd run web:typecheck` |
| Web lint | Pending latest run | `npm.cmd run web:lint` |
| Web build/export | Pending latest run | `npm.cmd run web:build` |
| Backup/restore release gate | Pending latest run | `npm.cmd run backup-restore:gate` |

## Smoke checklist

| Area | Expected result | Status |
| --- | --- | --- |
| Public routes | Home, about, features, pricing, trust/security, contact, terms, FAQ, and learning pages export successfully | Pending latest run |
| Auth routes | Login, signup, and forgot-password pages export successfully | Pending latest run |
| Logged-in routes | Dashboard-style routes export without native-module crashes | Pending latest run |
| Backup/restore | Settings shows latest-backup preview before restore, restore confirmation uses the preview metadata, and restore is blocked when no metadata loads | Pending signed-in smoke |
| Android-only controls | Web does not expose Android Notification Access controls as active native actions | Pending latest review |
| SMS controls | Web does not expose native SMS receiver/inbox controls | Pending latest review |
| Shared helpers | Currency/date/capture-adjacent utilities do not break web build | Pending latest run |

## Known web-only warnings

- `expo-notifications` warns that listening to push token changes is not fully supported on web. This warning is expected and is not a Phase 5 blocker if the build completes.
