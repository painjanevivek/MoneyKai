# Backup/Restore Release Gate

Last reviewed: 2026-06-26

MoneyKai must not hand off a mobile or web build unless the latest-backup preview and restore path have passed the repository gate and one live signed-in smoke.

## Automated Gate

Run from the repository root:

```powershell
npm run backup-restore:gate
```

The gate runs:

- `npm --prefix apps/MoneyKai-mobile run test:backup-restore`
- Static checks that native mobile Settings, mobile Expo-router More, and web Settings all expose:
  - latest-backup metadata loading
  - latest-backup preview copy
  - restore confirmation copy
  - restore latest backup action
- Static checks that mobile and web backup services still enforce signed-in user ownership before restore.

## Manual Smoke Still Required

The automated gate does not prove production Firebase Console, backend, Firestore indexes/rules, or device/browser auth state. Before an internal handoff, also run one signed-in smoke with the exact handoff build:

| Step | Evidence to record |
| --- | --- |
| Sign in with the tester account | Account email or tester alias, app surface, device/browser |
| Create a cloud backup | Backup timestamp shown by the app |
| Open latest-backup preview | Account label, transaction count, linked account count, note count, group count, goal count, budget, income, expense |
| Restore latest backup | Restore success alert and expected local data after restore |
| Cross-surface check | Mobile build and web app both expose preview-before-restore |
| Testing report | Mobile internal testing report bundle, when testing the mobile build |

## Release Blockers

Treat any of these as a blocker before handoff:

- Restore can run without first showing latest-backup preview metadata.
- Preview account does not match the signed-in tester account.
- Restore succeeds with data from a different user id.
- Preview omits the core counts used by testers to detect the wrong backup.
- The gate fails or is skipped.
- The live smoke cannot prove the exact build or web deployment under handoff.
