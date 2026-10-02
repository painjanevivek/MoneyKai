# SMS 100,000 implementation and validation

Recorded 3 October 2026. Implementation is on the paired `codex/sms-100k-free` branches. Original dirty working directories were preserved. Phase commits are separate from production activation.

## What is implemented

Android inbox → offline native parser → Keystore-protected SQLCipher ledger → explicitly approved, consent-controlled upload queue → FastAPI/Firestore → paginated website.

Raw SMS, notification content and pending drafts remain private to the phone. Approved SMS requests contain only the versioned transaction DTO and hashed identities. Reading the inbox and uploading approved transactions have separate consent. Revoking cloud consent stops future uploads; explicit deletion is separate.

Local import batches contain at most 250 temporary inbox rows. Database outcomes, financial records, summaries and checkpoints commit together. Historical boundaries are fixed, date/message-ID cursors resume interrupted work, and incremental scans include newly inserted backdated messages. Pending drafts have no automatic financial-record eviction.

The website fetches 50 records per page, limits each query cache to ten pages, and obtains monthly totals independently of page contents. Mobile uses indexed local pages and a bounded JavaScript screen cache. Strong account-scoped references confirm duplicates; weak merchant/amount/time similarities require review. Transfers, refunds and reversals preserve their semantics.

## Checklist coverage

| Item | Implementation | Main verification |
| --- | --- | --- |
| 1. Durable local database | SQLCipher Community Edition, Android Keystore, WAL, serialized writer | Encryption, reopen, missing-key failure |
| 2. Indexed owner-scoped storage | Separate financial, draft, outcome, job, outbox and summary tables | Owner isolation and indexed page queries |
| 3. Migration and draft retention | Restartable verified encrypted JSON migration; originals retained | Interrupted migration; 100,000 pending drafts |
| 4. Stable identities | Message outcomes, strong account/reference hashes, permanent cloud identities | Complete replay; overlapping devices; tombstones |
| 5. Bounded batches | 250 local inbox rows; 50 cloud approved transactions; 65,536-byte requests | Capacity and whole-batch validation |
| 6. Durable jobs and queue | Persisted local jobs, consent revisions and frozen cloud payloads | Reopen/checkpoint and replayed receipts |
| 7. Background scheduling | Existing JobScheduler plus serialized native executor | Synthetic job scheduling/recovery checks |
| 8. Atomic checkpoints | Outcomes, financial writes, summaries and progress commit together | Failed writes and interrupted batches |
| 9. Incremental scanning/sync | Fixed history boundary, date/ID pages, compact cloud manifests | Incremental and stale-session tests |
| 10. Offline parser accuracy | Shared versioned rules/fixtures, cached local category model | Native/TypeScript parity and account semantics |
| 11. Bounded views | Local and cloud cursor pages, virtualized lists, merchant-prefix search | Browser paging/filtering and cache limits |
| 12. Reliable summaries | Integer monthly/category contributions and resumable reconciliation | Edit/delete/transfer/rebuild checks |
| 13. Controlled side effects | Separate consent, quota/storage admission, one completion summary, private notifications | Privacy, conflict, revocation and quota checks |
| 14. Capacity/recovery evidence | Synthetic Android capacity test, native recovery tests, emulator integration | Results and unresolved gates below |

## Observed device results

The final repeated synthetic instrumentation run passed on **AIN065, Android 16**, with approximately 11 GiB usable physical memory (12 GB class). It did not read the real inbox or change the installed MoneyKai application's data. It used an isolated library test application.

- 100,000 valid SMS messages were retained as pending drafts and subsequently approved; no silent draft loss.
- Reopening after a 50,250-record checkpoint preserved progress.
- A 110,000-message mixed inbox contained 100,000 valid transactions; overlapping strong identities remained duplicates and distinct additional references survived.
- A complete repeated import produced no extra ledger records.
- Transaction-page query p95: **7.95 ms**, 100 sampled queries.
- Monthly-summary query p95: **25.13 ms**, 100 sampled queries.
- Initial parsing stage: **1,262,329 ms** (about 21 minutes). Replay/mixed stage: **231,754 ms**. Entire Gradle instrumentation command: about 33 minutes.
- Database growth: **388,345,856 bytes**, including retained drafts, approved rows, outcomes, indexes and synthetic jobs. This is local storage, not a cloud storage estimate.
- Maximum temporary parser batch: **250 rows**. The sampled native heap delta was −1,003,520 bytes; this is neither peak memory nor a JavaScript heap measurement.

Machine-readable measurements are in `sms-100k-capacity.json`. An earlier successful run was faster (15-minute parsing stage); observed throughput varies with device load. No generalized phone-capacity or battery claim is made.

## Checks actually completed

- Backend complete suite: 362 tests passed; the optional real-SDK test requires explicit emulator opt-in.
- Real Firestore SDK integration: one test passed against localhost demo project `demo-moneykai-sms`, including 50-record atomic batches, lost-response replay, overlapping devices, summary consistency, key misuse rejection, permanent deletion and exhausted quota.
- Mobile capture regression suite: 179 tests passed. Focused privacy/sync/parser checks: 25 passed.
- Native Android library recovery/parity checks: 13 instrumented tests passed. The 100,000-record capacity test passed twice separately.
- Native unit checks and complete local debug APK build passed. On long Windows checkouts, use the optional short `MONEYKAI_CXX_STAGING_DIR` property. No app APK was installed over existing MoneyKai data.
- Website complete unit suite: 139 tests passed. Mobile and website TypeScript checks passed.
- OpenAPI compatibility, generated API-client and canonical website API-boundary checks passed.
- Actual website browser verification used 125 synthetic cloud rows: distinct 50-row next pages, a merchant-prefix match beyond the first page, complete monthly totals (₹1,542.50), keyboard focus, and no application console errors. Viewports 320, 768, 1024 and 1440 had no page-level horizontal overflow. Budget and report views use monthly totals independent of the visible page.

The broad mobile unit suite is **not completely green**: 500 tests passed and three assertions/five suites failed because the isolated baseline excludes the original branding SVG and personal/model fixture datasets, and several pure tests import React Native Flow source without a native test mock. The capture/privacy suites and client type checks above are independently green. These failures are recorded, not reclassified as passing.

## Activation gates still open

Both mobile switches in `src/config/largeSmsFeatures.ts` remain false. Backend `sms_import_enabled`, `sms_import_free_deployment_verified` and `sms_import_storage_capacity_verified` default false.

1. The requested approximately 4 GB device gate is unverified; only the available 12 GB class device was tested.
2. JavaScript incremental memory below 75 MiB, battery impact, and real SMS-provider kill/reboot/permission-revocation scenarios have not been measured end to end. Synthetic database/job recovery checks do not replace these hardware checks.
3. Production Firebase no-billing/Spark configuration, shared free project capacity, and a fresh whole-project storage attestation have not been verified. No cloud backfill or production activation occurred.

Consequently, **implementation and synthetic capacity are verified; production activation and the full target-hardware capacity claim remain pending**. The completion condition requiring enabled local capacity is not yet met.

## Zero-spending boundary

No paid library/service, billing upgrade, paid TTL, managed backup, AI parser invocation, cloud build or new cloud database was introduced or enabled. Feature branch Vercel previews are disabled. Large cloud workloads use mocks/emulators.

The feature's project-wide reservations are 20,000 reads, 8,000 writes and 2,000 deletes per provider quota day, with conservative metadata/retry margins. A 750 MiB admission ceiling uses whole-project storage attestation plus reserved growth; import storage reservations include conservative index overhead. Counters are throttles. Verified provider no-billing configuration is the financial safeguard. Other project traffic and users share provider capacity; 100,000 local rows do not imply that all rows fit in the free cloud.

SMS index definitions are separate in the backend's `sms-ledger.indexes.json`. They have not been deployed and contain no TTL policy. Existing environment index/TTL policies were restored to the baseline. Merge only the SMS indexes after deployment/free-capacity verification; do not replace existing index policies with the SMS-only file.

## Compatibility limits and rollback

- Complete-history snapshot backup/export is explicitly unavailable for paginated website history and for the new mobile ledger path, preventing a 50-row page from masquerading as a full backup. Existing backup restoration remains supported. A bounded streaming complete-history export is future work.
- Automatic budget carry-forward pauses on paginated website history and the new mobile ledger path; preferences remain saved. Advanced full-history mobile analytics remain unavailable in the large-ledger path until they use indexed aggregate queries. Lists, local monthly totals and synced website monthly totals remain available.
- Website summary and budget figures describe synchronized records only. Category details are bounded and indicate when truncated. The phone can contain additional local/private records.
- Stop jobs using native import configuration/user capture preferences and disable approved upload/cloud ingestion. Preserve the encrypted repository, its key, schema and queued records. **Do not switch an already-migrated owner back to legacy JSON persistence or install an older incompatible schema.** Resume with the same repository after correcting the gate.

## Reproduction

Use existing local Node/Python/Java 21 and Android SDK dependencies. No cloud deployment is needed.

```powershell
npm --prefix apps/MoneyKai-mobile run test:capture
npm --prefix apps/MoneyKai-mobile run typecheck
npm --prefix apps/MoneyKai-web run test:unit
npm --prefix apps/MoneyKai-web run typecheck
npm run api-client:check
npm run web:api-boundary:check
# From apps/MoneyKai-mobile/android, with a synthetic test device selected:
./gradlew.bat :moneykai-native-capture:connectedDebugAndroidTest '-Pandroid.testInstrumentationRunnerArguments.notClass=com.moneykai.nativecapture.MoneyKaiCapacityTest'
./gradlew.bat :moneykai-native-capture:connectedDebugAndroidTest '-Pandroid.testInstrumentationRunnerArguments.class=com.moneykai.nativecapture.MoneyKaiCapacityTest' '-Pandroid.testInstrumentationRunnerArguments.timeout_msec=3600000'
./gradlew.bat :app:assembleDebug :moneykai-native-capture:testDebugUnitTest -PMONEYKAI_CXX_STAGING_DIR=<short-local-build-directory>
# From the backend checkout:
python -m pytest -q
python scripts/openapi_contract.py
# Only with a localhost Firestore emulator running:
$env:FIRESTORE_EMULATOR_HOST='127.0.0.1:18081'
$env:SMS_EMULATOR_TEST='1'
python -m pytest tests/test_sms_firestore_emulator.py -q
```

The debug build needs a locally generated standard Android debug keystore; keys and build artifacts stay ignored. Raw instrumentation/device logs are not committed. Only synthetic measurements above are retained.
