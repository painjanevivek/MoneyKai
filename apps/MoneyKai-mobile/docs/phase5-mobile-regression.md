# Phase 5F Mobile Regression

Last reviewed: 2026-06-11

## Current status

Automated validation passes and Android release artifacts build. Runtime device validation is limited to the currently connected device, so broader OEM/Android coverage remains a known limitation for internal testing.

## Automated checks

| Check | Status | Evidence |
| --- | --- | --- |
| TypeScript | Pending latest run | `npm.cmd run mobile:typecheck` |
| Lint | Pending latest run | `npm.cmd run mobile:lint` |
| Capture/diagnostics tests | Pending latest run | `npm.cmd run mobile:test:capture` |
| Backup/restore release gate | Pending latest handoff block | `npm.cmd run --silent backup-restore:handoff` |
| Web export from mobile app | Pending latest run | `npm.cmd run mobile:build` |
| Expo autolinking | Pending latest run | `npx.cmd expo-modules-autolinking verify --platform android` |
| Play-safe APK build | Pending latest run | `:app:assembleRelease` with native SMS disabled |
| Play-safe AAB build | Pending latest run | `:app:bundleRelease` with native SMS disabled |
| Original MoneyKai APK build | Pending latest run | `:app:assembleRelease` with native SMS enabled |

## Manual regression checklist

Use the Play-safe MoneyKai APK unless a row explicitly says Original MoneyKai.

| Area | Expected result | Status |
| --- | --- | --- |
| Launch | App opens as `MoneyKai` without fatal crash | Pending latest device run |
| Login/signup | Email and configured provider auth flows open and return safely | Pending tester account |
| Sign out | User can sign out and return to auth flow | Pending tester account |
| Profile edit | Profile screen opens and saves supported fields | Pending tester account |
| Settings | Settings opens with no extra top gap and shows Auto Capture controls | Pending latest device run |
| App lock | App lock gate remains usable with device auth when enabled | Pending tester account/device auth |
| Notifications | Push/local notification settings remain controllable | Pending latest device run |
| Backup/restore | Latest-backup preview loads before restore, restore confirmation names counts/totals, and backups do not include capture inbox/raw SMS | Pending tester account |
| Transactions | Add/edit/delete transaction flows still update lists | Pending manual data run |
| Budgets | Budget totals update after transaction changes | Pending manual data run |
| Groups | Group and split-bill flows still open and persist | Pending tester account |
| Notes | Notes list and editor still open and persist | Pending manual data run |
| Savings | Savings views still open and update | Pending manual data run |
| Auto Capture | Notification capture creates reviewable drafts only | Pending real/synthetic notification run |
| Manual SMS paste | Play-safe build supports pasted SMS only, no SMS permission request | Pending latest device run |
| Confirm draft | Confirmed capture draft becomes a normal transaction and updates budget | Pending manual data run |
| Offline/local-first | Core local screens remain usable without network | Pending latest device run |
| Restore behavior | Restore path rejects a different signed-in account and does not rehydrate capture inbox/raw SMS bodies | Pending tester account |
| Original MoneyKai | Local APK requests/grants SMS permissions and exposes native SMS research | Pending latest device run |

## Known limits

- Broader physical validation is not complete across Android 10/11, Android 12/13, Samsung, Xiaomi/Redmi, Vivo/Oppo, Realme, Motorola, and battery-restricted OEM modes.
- Real bank/payment notification capture still needs live notification sources.
- Original MoneyKai real SMS validation still needs real incoming carrier/bank SMS; protected Android SMS broadcasts cannot be simulated safely through ADB.
