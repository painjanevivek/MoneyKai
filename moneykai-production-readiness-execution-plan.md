# MoneyKai Production-Readiness Execution Plan

**Status:** In progress — PR-0 passed with accepted backend protection exception  
**Prepared:** 2026-08-24  
**Execution owner:** Codex, acting on behalf of the founder  
**Scope:** MoneyKai web and FastAPI backend  
**Explicitly deferred:** MoneyKai mobile/Android synchronization and the global backend-only Firestore rules cutover

## 1. Outcome

Close every remaining technical, security, operational, accessibility, provider, and rollout gate from the completed Phases 0–7 implementation program. The target outcome is a production release that has:

- no reachable unresolved critical/high dependency vulnerability without written risk acceptance;
- durable multi-instance storage, coordination, quotas, idempotency, cleanup, backup, restore, and deletion evidence;
- a launchable non-Gmail document flow while Gmail verification proceeds independently;
- a verified or deliberately disabled Gmail integration with truthful consent and revocation;
- deterministic insights available even when AI is disabled;
- measured accessibility, performance, support, incident, rollback, and internal-cohort evidence;
- protected, repeatable CI/CD rather than direct branch-protection bypasses.

This plan distinguishes **implementation completion** from **production authorization**. Code may be complete while an external provider or legal gate remains open.

## 2. Delegated execution authority

Codex will perform every safe, automatable action within the repositories and connected deployment accounts:

- inspect infrastructure and deployment state;
- triage and remediate dependencies in bounded batches;
- implement validation, diagnostics, monitoring, cleanup, tests, scripts, and documentation;
- create staging fixtures and run failure-injection, reconciliation, deletion, restore, accessibility, performance, and security checks;
- prepare OAuth verification copy, scope justification, demo script, privacy disclosures, evidence packages, runbooks, and release notes;
- use authenticated CLIs or browser automation for reversible configuration where the intended project and environment are unambiguous;
- create branches, commits, pull requests, and pushes; wait for CI; repair failures; and merge only when gates pass;
- monitor bounded rollout evidence and prepare the final go/no-go report.

Codex will stop only for an **Account-Holder Gate** that cannot legally or securely be delegated:

1. entering or revealing a secret that is not already available through an approved secret manager;
2. completing 2FA, CAPTCHA, identity, domain-ownership, or billing verification;
3. accepting provider terms, signing legal attestations, or approving a paid security assessment;
4. naming internal pilot participants or approving use of their accounts;
5. accepting a documented security risk;
6. authorizing the final public production rollout.

At each Account-Holder Gate, Codex will prepare the exact screen, values, evidence, and recommended choice so the founder only performs the minimum required approval.

## 3. Non-negotiable boundaries

- Keep Gmail, PDF parsing, and AI capabilities fail-closed until their individual gates pass.
- Never print, commit, copy into chat, or store secrets in evidence artifacts.
- Never use provider absence or partial data to delete canonical MoneyKai records.
- Preserve stable IDs, durable operation journals, reconciliation, and retry safety.
- Use synthetic/redacted data for staging and evaluation unless explicitly approved otherwise.
- Do not modify `apps/MoneyKai-mobile` or `apps/MoneyKai-android`.
- Do not deploy `firestore.backend-authority.rules` globally while deferred mobile clients may still write directly.
- Every production-affecting phase has a rollback and a captured pre-change baseline.
- Every phase is committed and pushed independently after its evidence gate passes.

## 4. Launch profiles

Work proceeds through independent capability profiles so provider delay does not block the safe core product.

| Profile | Public launch condition | Default |
|---|---|---|
| Core web + deterministic insights | Security, durability, accessibility, support, and release gates pass | Target first launch |
| Manual financial-document pilot | Private storage, consent, parsing, import/retry, cleanup, and deletion evidence pass | Internal, then gradual |
| Gmail metadata/attachment pilot | Google verification, security assessment if required, staging and cohort gates pass | Disabled until approved |
| Guarded AI guidance | Provider evaluation, cost/quota, cleanup, safety, accessibility, and kill-switch gates pass | Disabled; deterministic fallback remains |
| Mobile synchronization | Separate approved parity plan and compatibility window | Deferred |

## 5. Execution phases

### Phase PR-0 — Re-baseline and establish release control

**Execution state (2026-08-24):** Automated baseline, preflight, immutable-target,
working-backend-preview, and web branch-protection work is complete. GitHub does not
support protection/rulesets for the private backend repository on the current account
plan. The founder rejected public visibility and accepted a time-bounded exception with
PR-only workflow, mandatory manual CI verification, and evidence controls. `PR-EG0`
passes with that documented residual risk.

**Purpose:** Establish exact production/staging targets and prevent evidence from being collected against the wrong deployment.

**Codex actions**

1. Inspect local and remote branches, tags, CI workflows, deployment projects, domains, backend aliases, Firebase projects, buckets, OAuth clients, feature flags, cron jobs, monitoring, and secret-name presence without revealing values.
2. Confirm web and backend remote heads match the intended production source.
3. Create a non-secret environment matrix for local, test, staging, and production.
4. Record current capability status, health/diagnostics output, data counts/hashes, dependency alerts, build artifacts, and rollback references.
5. Add deployment preflight validation for ambiguous Firebase service-account configuration and other mutually exclusive environment variables.
6. Require pull requests and mandatory checks for subsequent production changes; remove routine reliance on branch-protection bypasses.
7. Keep sensitive feature flags disabled during the program.

**Evidence gate `PR-EG0`**

- Every target has an immutable project/repository identifier and owner.
- No secret value appears in the plan, logs, or evidence.
- A tested rollback commit/deployment reference exists for web and backend.
- Required CI checks are enforceable before merge.

**Commit:** `chore(release): establish production readiness baseline`

### Phase PR-1 — Dependency and supply-chain security closure

**Purpose:** Resolve the vulnerability backlog based on reachability and production risk, not bulk version churn.

**Codex actions**

1. Retrieve the current Dependabot/npm/pip alert inventory and deduplicate advisories by affected package and dependency path.
2. Classify each alert by severity, EPSS/exploitability where available, runtime versus development scope, direct versus transitive relationship, deployed surface, patch availability, and breaking-change risk.
3. Prove whether the vulnerable package/function is present in production bundles or backend runtime.
4. Remediate in isolated batches:
   - Batch A: reachable critical/high production runtime dependencies.
   - Batch B: remaining direct runtime dependencies.
   - Batch C: transitive runtime dependencies through parent upgrades or overrides.
   - Batch D: build/test/development dependencies.
5. Run typecheck, unit/API/backend tests, production export, SEO/CSP/OWASP checks, auth flows, and targeted browser smoke tests after every batch.
6. Produce an exception record only where no safe patch exists. It must include reachability, compensating controls, owner, review date, and removal condition.
7. Add recurring dependency audit automation and a lockfile-drift check.

**Evidence gate `PR-EG1`**

- Zero reachable unresolved critical/high alerts.
- No undocumented dismissal or risk acceptance.
- Production build and all existing gates pass after each batch.
- Dependency and license manifests are reproducible from a clean install.

**Commits:**

- `fix(security): remediate reachable runtime dependencies`
- `fix(tooling): update transitive and development dependencies`
- `chore(security): automate dependency risk monitoring`

### Phase PR-2 — Production durability, secrets, and scheduled lifecycle

**Purpose:** Prove sensitive features survive multiple instances, restarts, retries, and cleanup schedules.

**Codex actions**

1. Separate staging and production configuration, OAuth projects, storage namespaces, coordination collections, and monitoring destinations.
2. Validate Firebase Admin configuration and make environment errors fail closed with non-secret diagnostics.
3. Configure private sensitive-object storage with least-privilege service access, encryption, object lifecycle, and public-access prevention.
4. Configure Firestore distributed coordination for quotas and idempotency.
5. Configure Firestore TTL on the coordination `expiresAt` field and verify expired records are eventually removed; TTL delay is treated as expected, not immediate deletion.
6. Configure scheduled cleanup for AI attachments and any non-terminal temporary document objects, with idempotent execution, bounded batches, metrics, and alerts.
7. Run cross-instance fixtures for upload/read/delete, concurrent quota enforcement, idempotency replay/conflict, interrupted operations, and cleanup races.
8. Run backup, restore, account deletion, secret deletion, raw-object residue, and coordination-residue checks against staging.
9. Document secret rotation and perform a staging rotation drill without exposing values.

**Account-Holder Gates**

- Enter/rotate unavailable production secrets or complete cloud-provider 2FA.
- Approve any billing-affecting storage, Firestore, scheduler, or monitoring configuration.

**Evidence gate `PR-EG2`**

- Two independent backend instances pass storage and coordination tests.
- No object, token, operation, or coordination residue remains after deletion fixtures.
- Scheduled cleanup has a successful execution record and failure alert.
- Backup/restore and rollback preserve canonical data.

**Commit:** `feat(infrastructure): prove durable production lifecycle controls`

### Phase PR-3 — Google OAuth verification and Gmail launch package

**Purpose:** Complete provider approval without blocking launch of the non-Gmail core product.

**Codex actions**

1. Reconfirm the exact Gmail endpoints used and prove `gmail.readonly` is the narrowest scope compatible with user-selected metadata inspection plus attachment download.
2. Evaluate a lower-scope or manual-upload alternative. If full Gmail read access is not essential to the initial value proposition, keep Gmail disabled publicly and launch the manual-document profile first.
3. Use separate testing and production Google Cloud projects.
4. Verify app identity, domain ownership status, authorized domains, homepage, privacy policy, terms, deletion instructions, support contact, redirect URIs, and project contacts.
5. Prepare the Google submission package:
   - exact scope list;
   - least-privilege justification;
   - user-facing benefit and permitted-use explanation;
   - step-by-step reviewer test account instructions;
   - consent, disconnect, revocation, deletion, and failure-state screenshots;
   - narrated demo-video script showing the complete OAuth and data-deletion journey;
   - architecture/data-flow diagram and retention/deletion controls;
   - Limited Use and privacy-policy mapping.
6. Determine security-assessment applicability. Because MoneyKai transmits/stores restricted Gmail data through a server, plan for Google’s annual third-party security assessment unless Google confirms an exception.
7. Submit brand verification first, then restricted-scope verification and the required assessment package.
8. Track reviewer questions, prepare evidence-backed responses, and update code/docs only through reviewed change sets.

**Account-Holder Gates**

- Verify domain/account identity and complete Google 2FA.
- Accept Google declarations and submit the verification request.
- Approve and pay for an external security assessor if required.

**Evidence gate `PR-EG3`**

- Production OAuth client requests only approved scopes.
- Exact redirect and consent configuration is verified.
- Google approval/security-assessment status is recorded.
- Gmail remains disabled for public users until approval; the manual-document launch path remains available.

**Commit:** `docs(oauth): prepare Gmail verification and data-use evidence`

### Phase PR-4 — Staging failure, reconciliation, and rollback program

**Purpose:** Prove the system behaves truthfully when providers and infrastructure fail.

**Codex actions**

1. Deploy current web/backend commits to isolated staging with synthetic fixtures.
2. Exercise connect, actual-scope validation, metadata sync, bounded pagination, attachment consent, PDF password attempts, parsing, review, import, raw deletion, disconnect, and revocation retry.
3. Inject provider timeout, 429, 5xx, malformed payload, missing scope, invalid refresh token, storage outage, Firestore outage, process interruption, duplicate request, stale operation, and cleanup failure.
4. Verify partial results remain visible and stable-ID retries create no duplicate transaction, holding, email, document, or operation.
5. Verify no provider response deletes or replaces canonical data.
6. Run count/total/hash reconciliation before and after every destructive-looking scenario.
7. Exercise feature kill switches and rollback deployments while preserving deterministic core workflows.
8. Capture correlation IDs, operation IDs, generic errors, metrics, and support lookup evidence without payloads.

**Evidence gate `PR-EG4`**

- Zero unexplained divergence and zero duplicate canonical imports.
- Zero unresolved raw-object, coordination, token-revocation, or deletion residue.
- Every injected failure has a truthful user state and documented recovery.
- Rollback and kill-switch drills pass.

**Commit:** `test(integrations): add production-like failure and recovery evidence`

### Phase PR-5 — Guarded AI production decision

**Purpose:** Decide with evidence whether AI can be enabled; AI is not a prerequisite for the core launch.

**Codex actions**

1. Keep deterministic insights as the primary implementation and AI as explicit secondary explanation.
2. Run the redacted evaluation suite against the configured real provider/model in staging.
3. Measure factual consistency, schema compliance, refusal safety, caveats, provenance, latency, provider errors, tokens, and cost.
4. Test prompt injection, metric smuggling, unsupported financial advice, malformed output, quota exhaustion, provider outage, cancellation, and attachment cleanup.
5. Validate distributed per-user/global quotas and daily cost caps across instances.
6. Run the AI kill-switch drill and prove every core journey remains useful.
7. Produce a scored enable/disable recommendation. Failed thresholds keep AI disabled without delaying deterministic launch.

**Account-Holder Gate**

- Approve the provider spending ceiling and the final AI enablement decision.

**Evidence gate `PR-EG5`**

- Evaluation thresholds, cost ceiling, cleanup, accessibility, quota, and kill-switch evidence pass, or AI remains disabled.

**Commit:** `test(ai): complete guarded production evaluation gate`

### Phase PR-6 — Accessibility, performance, observability, and support readiness

**Purpose:** Make every important state usable and supportable under real conditions.

**Codex actions**

1. Automate keyboard, focus, accessible-name, contrast, reduced-motion, modal, loading, error, partial-sync, revocation, and document-review checks where reliable.
2. Perform manual browser/screen-reader verification for flows automation cannot prove.
3. Test narrow, tablet, desktop, high zoom, long labels, empty data, partial data, slow network, offline, and provider failure.
4. Establish performance budgets for first render, authenticated hydration, Gmail sync requests, document parsing, and API p95/error rate.
5. Verify correlation propagation, structured/redacted events, dashboards, alerts, cleanup metrics, quota pressure, revocation pending, storage failure, and operation backlog.
6. Execute a support rehearsal using only correlation/operation IDs and bounded metadata.
7. Finalize user-facing privacy, consent, deletion, support, and incident copy.

**Evidence gate `PR-EG6`**

- Critical journeys pass keyboard/reduced-motion/accessibility validation.
- Production build stays within agreed performance budgets.
- Alerts reach the intended channel and contain no sensitive payload.
- A support operator can diagnose and repair every documented pilot state.

**Commit:** `fix(readiness): close accessibility and operational support gates`

### Phase PR-7 — Bounded internal cohort

**Purpose:** Collect real operational evidence before public exposure.

**Codex actions**

1. Implement or verify an allowlist-based capability cohort and emergency global disable.
2. Prepare onboarding, consent, expected-use, privacy, issue-reporting, and deletion instructions.
3. Run a recommended five-account, seven-day internal cohort using the core and manual-document profiles. Gmail is included only when Google test-user policy and the current approval state permit it.
4. Monitor daily: connects, sync outcomes, duplicates, divergence, import retries, cleanup, revocation, quota rejection, latency, provider cost, accessibility/support incidents, and user drop-off.
5. Repair defects through isolated commits, rerun affected evidence gates, and restart the clean observation window when integrity invariants are affected.
6. Produce the signed cohort exit report.

**Account-Holder Gates**

- Name/approve participants and authorize their test-account use.
- Approve the cohort exit report.

**Evidence gate `PR-EG7`**

- Zero unexplained divergence.
- Zero duplicate canonical records.
- Zero unresolved raw-object or deletion residue.
- Every revocation-pending case is resolved within the support target.
- No severity-one security, privacy, or integrity incident remains open.

**Commit:** `docs(release): capture bounded cohort exit evidence`

### Phase PR-8 — Progressive production release

**Purpose:** Release the smallest proven capability set with immediate rollback.

**Codex actions**

1. Capture production backup, reconciliation baseline, dependency report, environment manifest, deployed commit hashes, and rollback references.
2. Deploy backend before dependent web contracts; run health, diagnostics, OpenAPI, auth, storage, coordination, and smoke checks.
3. Deploy web; verify login, core dashboard, deterministic insights, review, settings, deletion, security headers, SEO, CSP, and monitoring.
4. Enable only profiles whose gates passed:
   - core web/deterministic insights first;
   - manual documents through allowlist then gradual expansion;
   - Gmail only after `PR-EG3`, `PR-EG4`, and `PR-EG7`;
   - AI only after `PR-EG5`.
5. Observe each rollout stage before expanding. Any integrity, security, privacy, deletion, or false-success signal triggers immediate capability disable and reconciliation.
6. Publish release evidence and restore normal protected-branch workflow.

**Account-Holder Gate**

- Approve the final production go/no-go and any paid capacity increase.

**Evidence gate `PR-EG8`**

- Deployed hashes match approved commits.
- Smoke, monitoring, reconciliation, accessibility, and rollback checks pass.
- No capability is enabled without its evidence package.

**Commit:** `chore(release): complete progressive production launch`

### Phase PR-9 — Post-launch assurance

**Purpose:** Prevent production-readiness work from decaying after launch.

**Codex actions**

1. Monitor the first hour, first 24 hours, and first seven days; issue concise health reports.
2. Reconcile canonical counts/totals/hashes and storage/deletion residue after rollout expansion.
3. Schedule recurring dependency review, monthly restore drill, quarterly deletion-residue drill, secret rotation, capability kill-switch drill, and accessibility regression.
4. Track Google annual re-verification/security assessment and privacy-policy changes.
5. Keep Gmail/AI disabled automatically if approval, assessment, quota, storage, or safety evidence expires.
6. Open a separate mobile-parity plan only after web/backend contracts and rollout evidence stabilize.

**Evidence gate `PR-EG9`**

- Seven-day production observation closes without unexplained integrity or privacy incidents.
- Recurring controls have owners, schedules, alerts, and evidence retention.

**Commit:** `chore(operations): establish post-launch assurance cadence`

## 6. Dependency and gate order

```text
PR-0 baseline
  ├─> PR-1 dependency security
  ├─> PR-2 production durability
  └─> PR-3 Google verification (long-running external lane)

PR-1 + PR-2 ─> PR-4 staging failure program
PR-2 ─────────> PR-5 guarded AI decision
PR-4 + PR-5 ─> PR-6 accessibility/support readiness
PR-4 + PR-6 ─> PR-7 internal cohort
PR-1..PR-7 ──> PR-8 progressive release
PR-8 ─────────> PR-9 post-launch assurance
```

Google verification runs in parallel because provider review can take weeks. Its delay does not block the core/manual-document launch profile.

### Indicative calendar

These are planning ranges, not delivery promises; defects, provider queues, and required upgrades can change them.

| Work | Indicative duration | Blocking relationship |
|---|---:|---|
| PR-0 baseline/control | 0.5–1 working day | Starts first |
| PR-1 dependency closure | 2–5 working days | Depends on breaking upgrades and alert reachability |
| PR-2 durability/lifecycle | 2–4 working days | Cloud access and billing may gate configuration |
| PR-3 submission package | 2–3 working days of preparation | Google review/security assessment is provider-controlled and may take several weeks |
| PR-4 staging failure program | 2–3 working days | Requires PR-1 and PR-2 |
| PR-5 AI decision | 1–2 working days | Can finish as “disabled” without delaying core launch |
| PR-6 accessibility/support | 2–3 working days | Follows stable staging behavior |
| PR-7 cohort | 7 calendar days recommended | Requires clean PR-4 and PR-6 gates |
| PR-8 launch | 1 controlled release day | Founder go/no-go required |
| PR-9 observation | 7 calendar days | Runs after launch |

The core/manual-document profile can realistically reach its go/no-go before Gmail approval. Gmail remains a parallel, disabled capability until Google’s gate closes.

## 7. Evidence ledger

Each gate produces a machine-readable summary and a human-readable report containing:

- date, environment, repository and deployed commit hashes;
- exact command/scenario and sanitized result;
- correlation/operation IDs where relevant;
- expected versus actual invariant;
- unresolved risks and owner;
- rollback used or verified;
- approval identity for Account-Holder Gates;
- expiration/revalidation date for time-sensitive evidence.

Evidence never includes OAuth codes, tokens, passwords, document contents, email bodies, raw prompts, private financial rows, or service-account material.

## 8. Definition of complete

This program is complete only when:

1. `PR-EG0` through `PR-EG9` pass for the enabled launch profiles.
2. Gmail and AI remain disabled if their independent gates do not pass.
3. All production deployments match reviewed commits and required CI checks.
4. No reachable critical/high dependency risk remains undocumented.
5. No unexplained data divergence, duplicate canonical record, raw-object residue, revocation residue, deletion residue, or false-success state remains.
6. Accessibility, support, incident, monitoring, backup/restore, rollback, and recurring assurance evidence exists.
7. Mobile remains unchanged and is governed by a later approved parity plan.

## 9. Official external requirements used by this plan

- Google OAuth verification overview: https://support.google.com/cloud/answer/13463073
- Google sensitive/restricted scope requirements: https://support.google.com/cloud/answer/13464321
- Google restricted-scope production readiness: https://developers.google.com/identity/protocols/oauth2/production-readiness/restricted-scope-verification
- Firestore TTL policies: https://firebase.google.com/docs/firestore/ttl
- GitHub dependency-alert prioritization: https://docs.github.com/en/code-security/tutorials/manage-security-alerts/prioritizing-dependabot-alerts-using-metrics

## 10. Execution protocol

For every phase, Codex will:

1. announce the phase, scope, assumptions, and rollback;
2. inspect current state and preserve unrelated work;
3. implement in bounded, reviewable units;
4. run focused tests, then the full phase gate;
5. update evidence and this plan;
6. produce a copy-pastable conventional commit message with `-` body points;
7. commit and push only phase-owned files;
8. verify local and remote hashes match;
9. continue automatically to the next safe phase;
10. stop only at an Account-Holder Gate or a genuine safety blocker.
