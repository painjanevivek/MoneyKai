# MoneyKai automated SEO + GEO report

**Generated:** 2026-08-08  
**Scope:** repeatable repository checks only. This report does not infer rankings, indexing, Core Web Vitals, or conversions.

## Automated checks

| Check | Status | Result |
|---|---|---|
| Static public SEO audit | PASS | Passed: 38 sitemap URLs and 15 dynamic learn/comparison exports verified. |
| Sitemap URLs | PASS | 38 declared URLs in `public/sitemap.xml`. |
| robots.txt | PASS | Crawl allow rule and canonical sitemap reference detected. |
| llms.txt | PASS | Official-site declaration detected. |
| Learn-page visible placeholder | REVIEW | Visible placeholder text remains in the learn template. |
| Learn-page visible prompt | REVIEW | Image-generation prompt remains visible in the learn template. |
| Learn-article named authors | REVIEW | 9 article records use the generic MoneyKai Team byline. |
| Learn-article source metadata | REVIEW | No source field was detected in article data. |
| Organization sameAs | REVIEW | No verified organization profiles are configured. |

## What this command can automate

- Static sitemap and dynamic-export validation.
- Crawl-discovery file checks for robots and sitemap.
- Regressions in visible image placeholders and internal generation prompts.
- Basic evidence signals: generic financial-content bylines, source metadata, and organization-profile configuration.

## What requires human approval or external access

See [SEO + GEO human approval queue](./seo-geo-human-approval-queue.md).
