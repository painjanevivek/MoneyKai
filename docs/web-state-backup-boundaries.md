# Web state and backup boundaries

MoneyKai web keeps fast UI state in Zustand stores and treats backup/sync services as integration
boundaries. Stores may request durable work, but they should not import heavyweight persistence
services directly.

## Decision

- Zustand stores own local UI state transitions and optimistic updates.
- Stores queue automatic backups through `automaticBackupClient`, which lazy-loads the backup
  service only when a signed-in, configured app needs to persist a change.
- Automatic backup queue state lives in `automaticBackupQueue`. It can be used by sync/reset code
  without importing the full cloud backup service.
- `backupService` owns backup snapshot creation, manual cloud save/restore, and automatic backup
  flushing. It may read store snapshots at this boundary.
- Notification recording from backup flows is loaded dynamically to avoid introducing service/store
  import cycles.

## Guardrails

- Do not import `backupService` from stores.
- Do not put Firestore/backend details inside store actions.
- Keep backup debounce, pending state, and clear/reset behavior in `automaticBackupQueue`.
- Keep UI orchestration components, such as auto-backup coordinators, thin and side-effect focused.
- If a new durable domain is added, prefer a typed service/client boundary before adding store logic.
