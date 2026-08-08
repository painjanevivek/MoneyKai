# MoneyKai SEO + GEO human approval queue

This queue contains work that must not be automated or deployed without an accountable human decision. It accompanies the automated checks in [seo-geo-automation-report.md](./seo-geo-automation-report.md).

## Required business decisions

- Confirm the primary country and audience. The current site should remain global English until the product, pricing, support, and reviewed content genuinely differ by locale.
- Name the owner of organic acquisition and the reviewer for financial, privacy, security, and legal claims.
- Confirm which official company, app-store, and social profiles may be added to organization schema.

## Required financial and compliance review

- Review all advice-like content about debt, emergency funds, savings, budgets, and financial first aid for accuracy, jurisdiction, and appropriate disclaimers.
- Replace generic MoneyKai Team bylines with truthful author and/or reviewer information, including review date and scope.
- Add sources only after a reviewer has verified that each source supports the exact claim. Do not use citations to imply personalized financial advice.
- Confirm every local-first, backup, encryption, cloud-sync, and platform-availability statement against the released product version.

## Required content and brand approval

- Approve final product screenshots or original imagery; remove public placeholders and generation prompts before release.
- Approve direct-answer copy, comparison criteria, calls to action, and any statements about competitors.
- Validate the difference between product documentation and educational content so that no article overstates a feature or outcome.

## External access needed

- Google Search Console: indexing, query/page performance, URL Inspection, sitemap status, and Core Web Vitals.
- GA4 or approved privacy-respecting analytics: organic landing sessions and the consent-aware `signup_success` conversion event.
- Bing Webmaster Tools/Bing AI Performance where available: Bing search and AI-surface visibility.
- Vercel Speed Insights or CrUX: field performance by URL template.

## Human verification after an approved release

- Run Rich Results Test and URL Inspection on representative home, feature, learn, and comparison URLs.
- Verify desktop and mobile rendering, canonical URL, robots directives, page title, description, schema, and sign-up conversion.
- Monitor each material change for 28 days by intent cluster, then retain, revise, merge, or remove work based on qualified traffic and sign-ups.

## Non-negotiable safeguards

- Do not publish financial guidance, security claims, or competitor comparisons without review.
- Do not use AI to create scaled low-value pages, fabricated citations, fake reviews, or unverified testimonials.
- Do not change production robots, redirects, canonicals, schema, analytics, or public content without explicit approval.
