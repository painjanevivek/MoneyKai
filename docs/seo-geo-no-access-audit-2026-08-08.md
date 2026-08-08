# MoneyKai SEO + GEO no-access audit

**Audit date:** 2026-08-08  
**Scope:** `https://moneykai.com`, deployed Expo static export, public source repository, and current public-search sampling.  
**No production changes were made.**

## A. Executive summary and opportunity assessment

MoneyKai has a sound crawl foundation: the public sitemap declares 38 canonical public URLs; the repository audit confirms those 38 URLs, 2 comparison pages, and 9 learning articles are statically exported; and representative live URLs return HTTP 200 from Vercel. `robots.txt`, `sitemap.xml`, and `llms.txt` are live and publicly available.

The near-term constraint is not URL discovery. It is trust and differentiation. MoneyKai operates in personal finance (YMYL): generic advice, a team-only byline, visible image placeholders, and unsourced educational claims make the current content less useful and less citable than it needs to be. The strongest realistic opportunity is to own a narrow product-led topic cluster: **private/local-first expense tracking, shared-expense organization, and budget review without automatic background transaction capture**. Do not try to compete broadly for generic head terms such as "budget app" before building original proof and authority.

No GSC, GA4, Bing Webmaster Tools, conversion-event, or primary-country confirmation was supplied. Therefore this report does **not** infer rankings, traffic, conversion rate, or indexed-page counts. Country is treated as unconfirmed; INR examples in source suggest India may be intended, but that is not sufficient to make an external-market claim.

### Verified baseline

| Area | Finding | Evidence |
|---|---|---|
| Live delivery | Representative home, learning, pricing, feature, and comparison URLs return HTTP 200 from Vercel. | Live header checks on 2026-08-08. |
| Crawl discovery | `robots.txt` allows crawling and references the XML sitemap. | `apps/MoneyKai-web/public/robots.txt` and live HTTP 200. |
| Sitemap/export | Sitemap declares 38 public URLs; `npm run seo:audit -- --skip-indexnow` passed. | `apps/MoneyKai-web/public/sitemap.xml`; audit output. |
| Canonicals | Public page helper emits absolute self-canonical, title, description, Open Graph, Twitter, and JSON-LD. | `src/components/marketing/SeoHead.tsx`. |
| Structured data | Learn pages emit `Article`, `FAQPage`, and `BreadcrumbList`; features and comparisons emit FAQ and breadcrumbs. | Marketing templates. |
| AI-answer readiness | `llms.txt` gives a concise product definition, selected URLs, and trust boundaries. | `apps/MoneyKai-web/public/llms.txt`; live HTTP 200. |

### Realistic opportunity

1. **High confidence:** improve conversion and citation readiness on existing feature, comparison, and learn pages by adding verified product proof, sources, and expert review. This is within the current site architecture.
2. **Medium confidence:** win long-tail, intent-specific queries for shared expenses, local-first expense tracking, budgeting versus expense tracking, and spreadsheet alternatives after the content is upgraded.
3. **Low confidence / do not forecast:** generic "budget app", "expense tracker app", or broad personal-finance terms. They are highly competitive; do not promise position or traffic without GSC and market-level research.

## B. Technical audit

| Priority | Evidence and affected URLs | Recommended approval-only change | Expected effect | Risk / rollback |
|---|---|---|---|---|
| High | All learn articles visibly render an **"Article image placeholder"** and the image-generation prompt (`LearnArticleTemplate.tsx`). | Replace each placeholder with an original, optimized image or product screenshot; do not publish generated imagery without a human check. Render only meaningful alt text. | Better perceived quality, originality, engagement, and citable proof. | Visual/content risk. Roll back each asset independently. |
| High | Financial education covers emergency funds, budgets, debt, and savings with a generic `MoneyKai Team` byline and no cited sources (`learnArticles.ts`). | Add named or clearly qualified reviewer, review date, reputable sources, and a practical jurisdiction note; send financial claims through compliance review before publication. | Higher YMYL trust and lower misinformation risk. | Legal/compliance risk; no change without reviewer approval. |
| Medium | Schema exists, but FAQ markup is deployed broadly. Google limits FAQ rich results mainly to well-known government/health sites. | Keep visible FAQs if useful; do not treat `FAQPage` as a ranking or rich-result lever. Validate only representative pages in Rich Results Test after approval. | Avoid wasted SEO effort and preserve valid on-page help. | Low; markup may remain. |
| Medium | `SITE.sameAs` is empty; organization schema has no externally corroborated profiles. | Add only verified official social/app-store/company profiles and keep name, logo, support contact, and product facts consistent. | Better entity disambiguation and AI-answer reliability. | Brand-entity risk; use verified URLs only. |
| Medium | Sitemap lacks `<lastmod>` and image/video entries. It is valid but gives crawlers less change context. | Add accurate `lastmod` only if content metadata is reliably maintained; add image sitemap only after real images exist. | Potentially more efficient recrawling; no ranking guarantee. | Incorrect dates can reduce trust; omit rather than guess. |
| Medium | No `hreflang`; public product copy contains India-specific currency examples while target market is unconfirmed. | Confirm primary country. Use one neutral English site until localized offerings, pricing, and reviewed financial guidance genuinely differ. Add `hreflang` only for distinct, equivalent localized pages. | Prevent accidental international mismatch or doorway-style localization. | International SEO risk; rollback tags if alternate pages are not equivalent. |
| Medium | Web export has 86 HTML files and passes the dynamic-export audit, but no live Core Web Vitals or mobile field data was supplied. | Connect GSC/CrUX and Vercel Speed Insights; run controlled mobile Lighthouse tests as diagnostics, not substitutes for field data. | Visibility into performance bottlenecks. | None; measurement only. |
| Low | The HTML helper emits a legacy `meta keywords` tag. | Remove only in a general metadata cleanup; do not replace it with keyword repetition. | Minor maintenance benefit. | None. |
| Low | Representative live URLs are HTTP 200. Full production crawl, redirect chain inventory, and indexability status were not available in this no-access review. | Run a bounded crawl plus GSC URL Inspection after access is granted. | Finds route-specific issues not visible from source. | Read-only; no rollback needed. |

### URL inventory

| Class | URLs / count | Assessment |
|---|---|---|
| Money/product | `/`, `/features`, six feature pages, `/pricing`, `/how-it-works`, `/services` | Retain; sharpen each around one job-to-be-done and verified product evidence. |
| Trust/support | `/about`, `/contact`, `/trust`, `/security`, `/docs`, `/privacy-policy`, `/terms` | Retain; they support entity trust. Legal/privacy claims need owner review. |
| Informational | `/learn`, four category hubs, nine learning articles | Retain but consolidate overlapping beginner/budget/expense content before adding pages. |
| Comparative | `/compare`, two comparison pages | Retain; add transparent methodology and product proof. Do not make competitor-specific claims without current verification. |
| Sensitive/low-value review | `/financial-first-aid`, `/news` | Retain only if editorially maintained; financial-first-aid requires expert review. `news` should be noindexed if it is empty, stale, or lacks unique updates. |
| Authentication/app routes | `/login`, `/signup`, callback and private routes | Correctly intended to stay out of search; verify all private variants remain `noindex` in the full crawl. |

## C. Keyword/topic-to-URL map

Score is a transparent relative prioritization: **business value (1–5) × intent fit (1–5) × achievable visibility (1–5) × conversion potential (1–5)**. It is not search-volume data.

| Cluster / intent | Target URL | Primary terms and useful entities | Funnel | Cannibalization / action | Score |
|---|---|---|---|---|---|
| Private expense tracking | `/features/expense-tracking` | private expense tracker, daily expense tracker, manual expense tracking, transaction history | Commercial | Distinguish from the daily-expense guide with product proof and onboarding CTA. | 400 |
| Monthly budget review | `/features/budgeting` | monthly budget app, budget review, spending plan, budget health | Commercial | Keep planning-product intent here; guide intent on `/learn/monthly-budget-planner`. | 375 |
| Shared expenses | `/features/groups` | shared expense tracker, roommate expenses, couples shared budget, group spending | Commercial | Product page owns “tool”; guide owns “how to manage.” | 375 |
| Local-first data control | `/features/backup-restore` | local-first budget app, offline expense tracker, encrypted backup file, finance-data export | Commercial | High differentiation; every claim must match current platform support. | 320 |
| Expense tracking how-to | `/learn/how-to-track-daily-expenses` | how to track daily expenses, daily spending tracker, expense tracking method | Informational | Add practical worksheet/example; link to feature page. | 300 |
| Monthly budget planner | `/learn/monthly-budget-planner` | monthly budget planner, how to make a monthly budget, budget categories | Informational | Keep different from general budgeting category and 50/30/20 guide. | 300 |
| Shared expenses how-to | `/learn/how-to-manage-shared-expenses` | how to manage shared expenses, split household bills, roommate expense system | Informational | Add a worked scenario and source-supported principles. | 288 |
| Spreadsheet alternative | `/compare/moneykai-vs-spreadsheets` | budget app vs spreadsheet, expense tracker spreadsheet alternative | Comparison | Avoid unverified superiority claims; publish a transparent comparison method. | 280 |
| Budget vs expense tracker | `/learn/budget-tracker-vs-expense-tracker` | budget tracker vs expense tracker, difference between budget and expense tracking | Informational | Strong direct-answer page; improve source/proof and cross-links. | 256 |
| Beginner money organization | `/learn/personal-finance-for-beginners` | personal finance for beginners, money management basics | Informational | Broad and competitive. Do not expand until expert review and original value are ready. | 200 |

Current search sampling validates that shared-expense products compete on clear group records, balances, and budgeting context. It does **not** validate a named competitor list or ranking position for MoneyKai. Before competitor comparisons, validate product facts, pricing, and feature parity on current official competitor pages.

## D. Content briefs for the top 10 opportunities

All briefs require factual/product/compliance review before publishing. Use product screenshots, a reproducible walkthrough, or anonymized first-party examples—never invented performance claims or testimonials.

### 1. Expense tracking feature page

- **URL / title / H1:** `/features/expense-tracking` — `Private Expense Tracker for Daily Spending | MoneyKai` — `Track daily expenses in a private workspace`.
- **Direct answer:** “MoneyKai helps you record and review everyday spending in one private workspace, so you can see patterns before they become surprises.”
- **Outline:** What it does; 3-step walkthrough; what is manual/imported; transaction history and review; privacy/data boundary; real screenshot; FAQ; create-account CTA.
- **Proof / links / schema:** Screenshot of add-and-review flow; link to budgeting, analytics, security, and daily-expense guide; `SoftwareApplication` only if truthful required fields are available, plus breadcrumb.

### 2. Budgeting feature page

- **URL / title / H1:** `/features/budgeting` — `Monthly Budget App for Clearer Spending Reviews | MoneyKai` — `Make your monthly budget easier to review`.
- **Direct answer:** “MoneyKai connects a monthly spending plan with the records you review during the month.”
- **Outline:** Budget setup; check-in routine; adjustment example; what it does not advise; screenshot; FAQ; CTA.
- **Proof / links / schema:** First-party walkthrough and reviewed non-prescriptive example; link to monthly planner, expense tracking, and savings; breadcrumb.

### 3. Shared expenses feature page

- **URL / title / H1:** `/features/groups` — `Shared Expense Tracker for Roommates, Couples, and Groups | MoneyKai` — `Keep shared expenses visible to the people involved`.
- **Direct answer:** “MoneyKai organizes who paid, what the cost was, and the shared context in one group record.”
- **Outline:** Who it helps; record structure; equal/custom split boundary (only if supported); real scenario; privacy/permissions; FAQ; CTA.
- **Proof / links / schema:** Actual group-flow screenshots; link to shared-expense guide and comparison hub; breadcrumb + visible FAQ only.

### 4. Daily-expense guide

- **URL / title / H1:** `/learn/how-to-track-daily-expenses` — `How to Track Daily Expenses: A Simple, Repeatable Method` — `How to track daily expenses without overcomplicating it`.
- **Direct answer:** “Record each purchase promptly, use a small set of consistent categories, and review the record weekly.”
- **Outline:** Minimal system; category decisions; a seven-day example; review checklist; common failure modes; tool-agnostic alternatives; MoneyKai walkthrough.
- **Proof / links / schema:** Original printable/example table, named expert review, consumer-education sources; links to expense tracking and budget-vs-expense guide; Article + breadcrumb.

### 5. Monthly budget planner guide

- **URL / title / H1:** `/learn/monthly-budget-planner` — `How to Make a Monthly Budget: A Practical Planner` — `Build a monthly budget from your actual spending`.
- **Direct answer:** “Start with income and essential commitments, use your recent spending to set flexible categories, then review the plan during the month.”
- **Outline:** Inputs; planning template; realistic category method; monthly review; example with clearly labeled fictional amounts; uncertainty/disclaimer; CTA.
- **Proof / links / schema:** Downloadable original worksheet after review; credible nonprofit/government financial-education sources appropriate to target country; Article + breadcrumb.

### 6. Shared-expenses guide

- **URL / title / H1:** `/learn/how-to-manage-shared-expenses` — `How to Manage Shared Expenses with Roommates, Partners, or Friends` — `A simple system for managing shared expenses`.
- **Direct answer:** “Agree on the split, record each shared cost promptly, and review the group balance on a regular schedule.”
- **Outline:** Agreement before expense; fields to record; common split methods; worked household example; settlement cadence; disputes/edge cases; CTA.
- **Proof / links / schema:** Original scenario table, reviewer check, links to groups feature and spreadsheet comparison; Article + breadcrumb.

### 7. Budget tracker vs expense tracker

- **URL / title / H1:** `/learn/budget-tracker-vs-expense-tracker` — `Budget Tracker vs Expense Tracker: What’s the Difference?` — `A budget tracker and expense tracker solve different problems`.
- **Direct answer:** “An expense tracker records what happened; a budget tracker compares spending with a plan.”
- **Outline:** Definitions; side-by-side scenario; when to use each; using both; limitations; tool CTA.
- **Proof / links / schema:** One original visual comparison; sources only for externally made financial claims; link to both feature pages and monthly planner; Article + breadcrumb.

### 8. Spreadsheet comparison

- **URL / title / H1:** `/compare/moneykai-vs-spreadsheets` — `Budget App vs Spreadsheet: Which Fits Your Money Routine?` — `Choose a budget app or spreadsheet based on how you review money`.
- **Direct answer:** “Use a spreadsheet for complete custom control; use MoneyKai when you want an existing workflow for records, budgets, shared expenses, and review.”
- **Outline:** Transparent criteria; who each option fits; setup/time/privacy trade-offs; side-by-side task demo; migration/export boundary; CTA.
- **Proof / links / schema:** First-hand timed walkthrough/screenshots, dated methodology, no unsupported “better” claims; link to features and backup policy; breadcrumb.

### 9. Local-first backup page

- **URL / title / H1:** `/features/backup-restore` — `Local Finance Data Backups You Control | MoneyKai` — `Create and restore encrypted backup files you control`.
- **Direct answer:** “MoneyKai’s current Android backup flow lets you create a password-encrypted file and restore a file you select.”
- **Outline:** Exact availability/platform scope; how backup works; what it does not do (cloud sync); restore steps; password responsibility; privacy/security boundary; FAQ; CTA.
- **Proof / links / schema:** Reproducible Android walkthrough, version/date, screenshots, security reviewer; links to security, privacy, and docs; breadcrumb.

### 10. Personal finance for beginners

- **URL / title / H1:** `/learn/personal-finance-for-beginners` — `Personal Finance for Beginners: Start with Your Real Money Picture` — `A beginner’s first steps for organizing money`.
- **Direct answer:** “Begin by understanding income, recording expenses, setting a simple plan, and reviewing it consistently.”
- **Outline:** Foundational terms; first-week checklist; simple budget/expense example; saving and debt with cautious language; when to seek qualified local advice; tool CTA.
- **Proof / links / schema:** Named qualified review, authoritative country-specific sources after market confirmation, original checklist; Article + breadcrumb.

## E. Sustainable authority plan

1. Publish one **original product evidence asset** per quarter: a transparent local-first/privacy architecture explainer, a usability study, or an anonymized workflow analysis with method and limitations.
2. Create small, helpful tools only when they solve a real task: monthly-review checklist, shared-expense agreement template, or spending-category starter worksheet. Do not mass-produce calculators.
3. Build named author/reviewer pages with actual expertise, review scope, and dates. Financial education requires qualified review; product documentation can be written by the product team with a clearly named technical reviewer.
4. Earn relevant mentions through founder/product stories, independent finance educators, privacy/consumer-tech communities, and practical templates. Offer original data or a useful resource—not payment for links or artificial citations.
5. Maintain an evidence ledger for product claims: claim, platform/version, owner, proof, last verified date, and page URLs that use it. This directly improves traditional SEO, AI-answer consistency, and compliance review.

## F. Approval-ready implementation backlog

| Horizon | Item | Owner / effort / dependency | Exact proposed change | KPI / timeframe / verification |
|---|---|---|---|---|
| 0–2 weeks | Remove public placeholders | Web + content; M; approved assets | Replace placeholder/prompt block on all learn pages with reviewed original images or suppress it until assets exist. | Engagement and conversion assist; deploy check + mobile visual QA. |
| 0–2 weeks | YMYL content gate | Content lead + qualified reviewer; M; reviewer identified | Add author/reviewer/date/source fields and review the 9 learn articles plus financial-first-aid. Correct or unpublish unsupported claims. | 100% reviewed priority financial pages; page-by-page evidence ledger. |
| 0–2 weeks | Measurement setup | Growth + engineering; M; GSC/GA4/Bing access | Verify GSC/Bing ownership; configure sign-up-success event with consent-aware analytics; document event definition. | Baseline dashboard live; test signup event in debug view. |
| 0–2 weeks | Entity consistency | Brand + web; S; official profiles verified | Populate `sameAs` only with verified official profiles; reconcile support email, logo, platform availability, and data-control claims. | Rich Results/JSON-LD validation; manual entity checklist. |
| 2–8 weeks | Refresh four product/comparison pages | Product marketing + design; L; screenshots and product verification | Implement briefs 1–3, 8, and 9: direct answers, proof, internal links, and accurate scope. | Organic conversion rate, assisted signup, query CTR; URL inspection and rendering QA. |
| 2–8 weeks | Consolidate/upgrade learning hub | Content + reviewer; L; source policy | Implement briefs 4–7 and 10; merge material overlap before adding new URLs. | Impressions/clicks by intent cluster, time on page, internal CTA clicks; 28-day comparison. |
| 2–8 weeks | Crawl and field performance baseline | Engineering; M; tool access | Crawl all public URLs; inspect redirects/canonicals/rendering; collect CrUX/GSC/Vercel data. | 0 critical technical errors; CWV baseline and remediation tickets. |
| 2–6 months | Original authority assets | Product, research, partnerships; XL; consenting participants/data | Publish 2–3 original studies/tools with methodology and editorial outreach. | Quality referring domains, citations, branded demand; source ledger. |
| 2–6 months | International decision | Product/brand/legal; L; primary-country decision | Decide whether to serve a single global-English site or genuinely localized content; do not create city/country doorway pages. | Country-level conversion quality; hreflang/canonical validation if localized. |

## G. KPI dashboard definition

| Weekly view | Definition / source | Guardrail |
|---|---|---|
| Crawl/index health | Submitted vs indexed URLs, URL Inspection states, robots/canonical errors, sitemap processing (GSC/Bing). | Never treat indexed count alone as success. |
| Search performance | Impressions, clicks, CTR, average position by page and query intent cluster (GSC/Bing). | Segment brand vs non-brand and country/device. |
| Organic conversion | `signup_success` from organic landing sessions, conversion rate, assisted conversion (GA4 or privacy-aware equivalent). | Define consent and attribution model before benchmarking. |
| Content quality | CTA clicks, engaged sessions, return visits, source/reviewer coverage, stale-page count. | Do not use dwell time as a standalone ranking claim. |
| Experience | CWV field data: LCP, INP, CLS by URL template; Vercel Speed Insights/CrUX. | Prefer field data; Lighthouse is diagnostic only. |
| AI-search visibility | Monthly manual prompt set, answer inclusion/citation checks, Bing AI Performance where available, referral traffic. | Treat citations as observed signals, not a guaranteed KPI. |

Every 28 days, compare to the baseline by URL and intent cluster, annotate deployments/content updates/SERP shifts/seasonality, and select the next experiment only if it improves user or business value. Stop or merge pages that create overlap without qualified traffic or conversions.

## H. Risks, assumptions, and approvals required

- **Assumptions:** global-English site; primary country unknown; no verified analytics/search-console data; no assertion about current rankings, traffic, or conversion performance.
- **YMYL/compliance:** all financial education, emergency-fund, saving, debt, privacy, and security claims need human subject-matter and legal/compliance review. This report is not financial, legal, or investment advice.
- **Platform scope:** backup/local-first claims must be version- and platform-specific. Do not generalize Android behavior to web, iOS, or future releases without evidence.
- **Competitors:** only generic product-category competitors were observed during initial search sampling. Validate official competitor domains and claims before publishing named comparison pages.
- **Approval required before any production modification:** public copy, page additions/removals, noindex/canonical/robots/schema changes, analytics events, redirects, localization, profile links, or outbound citations.
- **Policy guardrail:** Google recommends helpful, reliable people-first content and warns against scaled low-value pages. For YMYL, trust and demonstrable expertise matter especially; correct markup does not guarantee a search feature or AI citation.

### References used for policy guardrails

- [Google: creating helpful, reliable, people-first content](https://developers.google.com/search/docs/fundamentals/creating-helpful-content)
- [Google: spam policies](https://developers.google.com/search/docs/essentials/spam-policies)
- [Google: FAQ rich-result changes](https://developers.google.com/search/blog/2023/08/howto-faq-changes)
