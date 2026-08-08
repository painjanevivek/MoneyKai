#!/usr/bin/env node

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const WEB_ROOT = path.join(ROOT, 'apps', 'MoneyKai-web');
const REPORT_PATH = path.join(ROOT, 'docs', 'seo-geo-automation-report.md');

const read = (relativePath) => readFileSync(path.join(ROOT, relativePath), 'utf8');
const count = (value, pattern) => (value.match(pattern) ?? []).length;
const status = (condition) => (condition ? 'PASS' : 'REVIEW');

function extractSlugs(source) {
  return [...source.matchAll(/slug:\s*'([^']+)'/g)].map((match) => match[1]);
}

function verifyStaticSeoExport({ sitemap, learnArticles, comparisons }) {
  const distRoot = path.join(WEB_ROOT, 'dist');
  const distSitemapPath = path.join(distRoot, 'sitemap.xml');
  const urls = count(sitemap, /<loc>/g);
  const expectedDynamicPages = [
    ...extractSlugs(comparisons).map((slug) => path.join(distRoot, 'compare', `${slug}.html`)),
    ...extractSlugs(learnArticles).map((slug) => path.join(distRoot, 'learn', `${slug}.html`)),
  ];
  const missingPages = expectedDynamicPages.filter((filePath) => !existsSync(filePath));

  if (!existsSync(distSitemapPath)) throw new Error('Static export is missing dist/sitemap.xml.');
  if (readFileSync(distSitemapPath, 'utf8') !== sitemap) throw new Error('The dist sitemap differs from public/sitemap.xml.');
  if (missingPages.length > 0) {
    throw new Error(`Static export is missing ${missingPages.length} dynamic SEO page(s).`);
  }

  return `Passed: ${urls} sitemap URLs and ${expectedDynamicPages.length} dynamic learn/comparison exports verified.`;
}

function buildReport({ staticAudit, sitemapUrlCount, robots, llms, learnTemplate, learnArticles, siteConstants }) {
  const placeholderVisible = learnTemplate.includes('Article image placeholder');
  const imagePromptVisible = learnTemplate.includes('{article.image.prompt}');
  const teamBylineCount = count(learnArticles, /author:\s*'MoneyKai Team'/g);
  const sourceFieldPresent = /\bsources?\s*:/i.test(learnArticles);
  const sameAsEmpty = /sameAs:\s*\[\]/.test(siteConstants);
  const today = new Date().toISOString().slice(0, 10);

  return `# MoneyKai automated SEO + GEO report\n\n` +
    `**Generated:** ${today}  \n` +
    `**Scope:** repeatable repository checks only. This report does not infer rankings, indexing, Core Web Vitals, or conversions.\n\n` +
    `## Automated checks\n\n` +
    `| Check | Status | Result |\n` +
    `|---|---|---|\n` +
    `| Static public SEO audit | PASS | ${staticAudit.replace(/\n/g, ' ')} |\n` +
    `| Sitemap URLs | PASS | ${sitemapUrlCount} declared URLs in \`public/sitemap.xml\`. |\n` +
    `| robots.txt | ${status(robots.includes('Allow: /') && robots.includes('Sitemap: https://moneykai.com/sitemap.xml'))} | Crawl allow rule and canonical sitemap reference detected. |\n` +
    `| llms.txt | ${status(llms.includes('Official site: [https://moneykai.com]'))} | Official-site declaration detected. |\n` +
    `| Learn-page visible placeholder | ${status(!placeholderVisible)} | ${placeholderVisible ? 'Visible placeholder text remains in the learn template.' : 'No visible placeholder text detected.'} |\n` +
    `| Learn-page visible prompt | ${status(!imagePromptVisible)} | ${imagePromptVisible ? 'Image-generation prompt remains visible in the learn template.' : 'No visible prompt detected.'} |\n` +
    `| Learn-article named authors | ${status(teamBylineCount === 0)} | ${teamBylineCount} article records use the generic MoneyKai Team byline. |\n` +
    `| Learn-article source metadata | ${status(sourceFieldPresent)} | ${sourceFieldPresent ? 'A source field was detected.' : 'No source field was detected in article data.'} |\n` +
    `| Organization sameAs | ${status(!sameAsEmpty)} | ${sameAsEmpty ? 'No verified organization profiles are configured.' : 'Organization profiles are configured; validate them manually.'} |\n\n` +
    `## What this command can automate\n\n` +
    `- Static sitemap and dynamic-export validation.\n` +
    `- Crawl-discovery file checks for robots and sitemap.\n` +
    `- Regressions in visible image placeholders and internal generation prompts.\n` +
    `- Basic evidence signals: generic financial-content bylines, source metadata, and organization-profile configuration.\n\n` +
    `## What requires human approval or external access\n\n` +
    `See [SEO + GEO human approval queue](./seo-geo-human-approval-queue.md).\n`;
}

function main() {
  const requiredPaths = [
    'apps/MoneyKai-web/public/sitemap.xml',
    'apps/MoneyKai-web/public/robots.txt',
    'apps/MoneyKai-web/public/llms.txt',
    'apps/MoneyKai-web/src/components/marketing/LearnArticleTemplate.tsx',
    'apps/MoneyKai-web/src/data/learnArticles.ts',
    'apps/MoneyKai-web/src/constants/site.ts',
  ];

  for (const relativePath of requiredPaths) {
    if (!existsSync(path.join(ROOT, relativePath))) {
      throw new Error(`Required SEO input is missing: ${relativePath}`);
    }
  }

  const sitemap = read('apps/MoneyKai-web/public/sitemap.xml');
  const learnArticles = read('apps/MoneyKai-web/src/data/learnArticles.ts');
  const comparisons = read('apps/MoneyKai-web/src/content/comparisons.ts');
  const staticAudit = verifyStaticSeoExport({ sitemap, learnArticles, comparisons });
  const report = buildReport({
    staticAudit,
    sitemapUrlCount: count(sitemap, /<loc>/g),
    robots: read('apps/MoneyKai-web/public/robots.txt'),
    llms: read('apps/MoneyKai-web/public/llms.txt'),
    learnTemplate: read('apps/MoneyKai-web/src/components/marketing/LearnArticleTemplate.tsx'),
    learnArticles,
    siteConstants: read('apps/MoneyKai-web/src/constants/site.ts'),
  });

  writeFileSync(REPORT_PATH, report, 'utf8');
  console.log(`SEO + GEO automation report written: ${path.relative(ROOT, REPORT_PATH)}`);
}

try {
  main();
} catch (error) {
  console.error(`SEO + GEO automation failed: ${error.message}`);
  process.exit(1);
}
