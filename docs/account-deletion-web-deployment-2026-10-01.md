# Account deletion website: deployment and remaining gate

## Published

- URL: https://moneykai.com/account-deletion (HTTP 200).
- Vercel project: moneykai-web / prj_i7uKxFmYfNMvNYRg5YUdzkxghn81.
- Production deployment: dpl_AuAKztLQTQNQPtm3ufAcSqFDwfhf, READY.
- Immutable URL: https://moneykai-jgxkzcb51-vivek-painjanes-projects.vercel.app.
- Promoted after authenticated candidate HTML, canonical URL, email link and security-header checks.
- Previous production deployment: dpl_22p4GdgyguM5SgL3WccuVJLdFubx.
- Base commit: bf07f73258e9f5117d86ab99400499843e5f5002. Deployment includes the working tree; no broad Git commit or reset was performed.
- Framework: Expo SDK 56 / Expo Router static web export, not Next.js. Remote build completed in about six minutes.

## Implementation

Settings → Delete Account now navigates to the dedicated page instead of the old modal. Public instructions and an explicit support email draft remain available without authentication.

The signed-in confirmation requires exactly DELETE. Deletion reuses the canonical authenticated DELETE /v1/settings/account API, binds token acquisition to the displayed account, and retains a stable idempotency key on retries. A concurrent-press guard prevents duplicate submissions. Local sign-out occurs only after completed account-deletion status and a matching zero-residue certificate. Incomplete operations and network errors do not clear the local session. An account opened while a request is pending is not deliberately signed out by the deletion service.

No real account, transaction, or user data was deleted during verification. No email request was sent.

## Verification

- Website Vitest: 135 tests passed across 28 files, including mocked deletion-service, token-owner and UI interaction tests.
- TypeScript: passed.
- Targeted ESLint: passed without warnings after test import cleanup.
- Security source-contract regression tests: 6 passed. The existing OAuth callback checker was updated to recognize exact parsed scheme/host/path validation without weakening the other auth checks.
- Production build, SEO audit and existing 32-check security gate: passed locally and on Vercel.
- Canonical API boundary check: passed.
- Protected candidate: HTTP 200, correct canonical URL, page bundle, support link, CSP and DENY frame protection.
- Live anonymous browser: 320/768/1024/1440 widths without horizontal overflow; CSS 200% zoom and lower-section scrolling; heading and link semantics; keyboard-reachable email link; no page errors.
- Live account-deletion, home, privacy-policy and settings routes: HTTP 200 with nosniff and DENY frame protection.
- Live screenshots: C:/Users/ASUS/.codex/visualizations/2026/09/29/01a0ec5b-d682-74f3-b0be-02e9ac7b8644/web-account-deletion-20261001/live/.
- These are web checks, not Android TalkBack or a real authenticated destructive end-to-end deletion test.

## Remaining blocker: production backend CORS

Automatic browser deletion is not operational yet. Non-destructive checks against https://money-kai-backend.vercel.app/v1/settings/account found:

- GET → 405, Allow: DELETE (the endpoint exists).
- OPTIONS with Origin: https://moneykai.com, Access-Control-Request-Method: DELETE and the client's authorization/idempotency/content-type/correlation headers → 400, without Access-Control-Allow-Origin.

The existing backend production build is dpl_EcdFVPXbMhreZV9wn3Q2rrrs4gsr / https://money-kai-backend-cjrz46y3c-vivek-painjanes-projects.vercel.app. Its CORS_ORIGINS variable is marked sensitive and shared between production and preview; its existing value is not readable. No backend configuration, deployment, credentials or allowlist was changed. Do not overwrite an unknown allowlist without direction. Approval is needed to specify the production origins and redeploy the existing backend build, preserving preview configuration.

The page and support-request path are live, but the automatic deletion gate remains open.

## Deployment hygiene / limitations

The upload initially included native verification caches. Whole-directory .vercelignore exclusions reduced the source archive to approximately 2 MB and prevented uploading native releases, build caches, credentials, environment files and private device evidence. No local files were deleted. The existing api/v1 exclusion remains in place so this frontend does not package duplicate canonical feature APIs.

The install reported 42 existing dependency vulnerabilities (28 moderate, 14 high). No unrelated automatic dependency upgrades were attempted; passing source-security checks do not resolve that separate dependency-audit backlog. Source maps were removed from the public export; Sentry upload was skipped because upload credentials were unavailable. No historical runtime-log health claim is made: the installed CLI only offers a live log stream, and anonymous browser/route checks were used for the short post-deployment observation.
