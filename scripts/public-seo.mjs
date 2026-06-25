#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const require = createRequire(import.meta.url);
const ts = require('typescript');

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const WEB_ROOT = path.join(ROOT, 'apps', 'MoneyKai-web');
const WEB_SRC = path.join(WEB_ROOT, 'src');
const SITEMAP_PATH = path.join(WEB_ROOT, 'public', 'sitemap.xml');
const DIST_PATH = path.join(WEB_ROOT, 'dist');

const args = new Set(process.argv.slice(2));

function printHelp() {
  console.log(`MoneyKai public SEO helper

Usage:
  node scripts/public-seo.mjs --write
  node scripts/public-seo.mjs --audit-dist

Options:
  --write           Regenerate apps/MoneyKai-web/public/sitemap.xml.
  --audit-dist      Also verify exported dist files for dynamic SEO routes.
  --skip-indexnow   Skip the IndexNow dry-run payload check.
  --help            Show this help message.
`);
}

function resolveTsPath(specifier, fromFile) {
  if (specifier.startsWith('@/')) {
    return withTsExtension(path.join(WEB_SRC, specifier.slice(2)));
  }

  if (specifier.startsWith('.')) {
    return withTsExtension(path.resolve(path.dirname(fromFile), specifier));
  }

  return null;
}

function withTsExtension(filePath) {
  if (path.extname(filePath)) return filePath;

  for (const extension of ['.ts', '.tsx']) {
    const candidate = `${filePath}${extension}`;
    if (existsSync(candidate)) return candidate;
  }

  const indexPath = path.join(filePath, 'index.ts');
  if (existsSync(indexPath)) return indexPath;

  return `${filePath}.ts`;
}

function createTsModuleLoader() {
  const cache = new Map();

  function load(filePath) {
    const resolvedPath = path.resolve(filePath);
    const cached = cache.get(resolvedPath);
    if (cached) return cached.exports;

    const source = readFileSync(resolvedPath, 'utf8');
    const module = { exports: {} };
    cache.set(resolvedPath, module);

    const { outputText } = ts.transpileModule(source, {
      compilerOptions: {
        esModuleInterop: true,
        jsx: ts.JsxEmit.ReactJSX,
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
      },
      fileName: resolvedPath,
    });

    const localRequire = (specifier) => {
      const projectPath = resolveTsPath(specifier, resolvedPath);
      if (projectPath) return load(projectPath);
      return require(specifier);
    };

    const sandbox = {
      console,
      exports: module.exports,
      module,
      process,
      require: localRequire,
    };

    vm.runInNewContext(outputText, sandbox, { filename: resolvedPath });
    return module.exports;
  }

  return load;
}

function loadPublicSeoData() {
  const loadTsModule = createTsModuleLoader();
  const siteModule = loadTsModule(path.join(WEB_SRC, 'constants', 'site.ts'));
  const comparisonsModule = loadTsModule(path.join(WEB_SRC, 'content', 'comparisons.ts'));
  const learnModule = loadTsModule(path.join(WEB_SRC, 'data', 'learnArticles.ts'));

  return {
    comparisonPages: comparisonsModule.COMPARISON_PAGES,
    learnArticles: learnModule.LEARN_ARTICLES,
    learnCategories: learnModule.LEARN_CATEGORIES,
    publicRoutes: siteModule.PUBLIC_ROUTES,
    site: siteModule.SITE,
  };
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function validateRoutes({ comparisonPages, learnArticles, learnCategories, publicRoutes }) {
  assert(Array.isArray(publicRoutes), 'PUBLIC_ROUTES must be an array.');

  const seenRoutes = new Set();
  for (const route of publicRoutes) {
    assert(typeof route === 'string', `PUBLIC_ROUTES contains a non-string route: ${String(route)}`);
    assert(route === '' || route.startsWith('/'), `Public route must be empty or start with "/": ${route}`);
    assert(route === '' || route === '/' || !route.endsWith('/'), `Public route must not end with "/": ${route}`);
    assert(!seenRoutes.has(route), `Duplicate public route: ${route || '/'}`);
    seenRoutes.add(route);
  }

  const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

  for (const page of comparisonPages) {
    assert(slugPattern.test(page.slug), `Comparison slug is not export-safe: ${page.slug}`);
    assert(seenRoutes.has(`/compare/${page.slug}`), `Missing comparison route in PUBLIC_ROUTES: /compare/${page.slug}`);
  }

  for (const category of learnCategories) {
    assert(slugPattern.test(category.slug), `Learn category slug is not export-safe: ${category.slug}`);
    assert(seenRoutes.has(`/learn/${category.slug}`), `Missing learn category route in PUBLIC_ROUTES: /learn/${category.slug}`);
  }

  for (const article of learnArticles) {
    assert(slugPattern.test(article.slug), `Learn article slug is not export-safe: ${article.slug}`);
    assert(seenRoutes.has(`/learn/${article.slug}`), `Missing learn article route in PUBLIC_ROUTES: /learn/${article.slug}`);
  }
}

function publicRoutesToUrls(siteUrl, publicRoutes) {
  const origin = siteUrl.replace(/\/$/, '');
  return publicRoutes.map((route) => (route === '' ? `${origin}/` : `${origin}${route}`));
}

function escapeXml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function buildSitemapXml(urls) {
  const lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls.map((url) => `  <url><loc>${escapeXml(url)}</loc></url>`),
    '</urlset>',
    '',
  ];

  return lines.join('\n');
}

function extractSitemapUrls(sitemapXml) {
  return [...sitemapXml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/g)]
    .map((match) => match[1].trim())
    .filter(Boolean);
}

function assertSameList(actual, expected, label) {
  assert(actual.length === expected.length, `${label} count mismatch: expected ${expected.length}, found ${actual.length}.`);

  for (let index = 0; index < expected.length; index += 1) {
    assert(actual[index] === expected[index], `${label} mismatch at ${index + 1}: expected ${expected[index]}, found ${actual[index] || '(missing)'}.`);
  }
}

function assertSitemap(expectedUrls, sitemapPath, label) {
  assert(existsSync(sitemapPath), `${label} does not exist: ${sitemapPath}`);
  const actualUrls = extractSitemapUrls(readFileSync(sitemapPath, 'utf8'));
  assertSameList(actualUrls, expectedUrls, label);
}

function assertIndexNowPayload(expectedUrls, siteUrl) {
  const stdout = execFileSync(process.execPath, ['scripts/indexnow-submit.mjs', '--dry-run'], {
    cwd: ROOT,
    encoding: 'utf8',
  });
  const payloadMatch = stdout.match(/IndexNow dry run payload:\r?\n([\s\S]*?)\r?\nURL count:/);

  assert(payloadMatch, 'Could not parse IndexNow dry-run payload.');

  const payload = JSON.parse(payloadMatch[1]);
  const expectedHost = new URL(siteUrl).hostname;

  assert(payload.host === expectedHost, `IndexNow host mismatch: expected ${expectedHost}, found ${payload.host}.`);
  assertSameList(payload.urlList, expectedUrls, 'IndexNow urlList');
}

function assertExportedHtml({ comparisonPages, learnArticles }) {
  assert(existsSync(DIST_PATH), `Expo dist output does not exist: ${DIST_PATH}`);

  const expectedFiles = [
    ...comparisonPages.map((page) => path.join(DIST_PATH, 'compare', `${page.slug}.html`)),
    ...learnArticles.map((article) => path.join(DIST_PATH, 'learn', `${article.slug}.html`)),
  ];

  const missingFiles = expectedFiles.filter((filePath) => !existsSync(filePath));
  assert(
    missingFiles.length === 0,
    `Static export is missing ${missingFiles.length} dynamic SEO page(s): ${missingFiles.map((filePath) => path.relative(ROOT, filePath)).join(', ')}`,
  );
}

function main() {
  if (args.has('--help') || args.has('-h')) {
    printHelp();
    return;
  }

  const publicSeoData = loadPublicSeoData();
  validateRoutes(publicSeoData);

  const expectedUrls = publicRoutesToUrls(publicSeoData.site.url, publicSeoData.publicRoutes);

  if (args.has('--write')) {
    writeFileSync(SITEMAP_PATH, buildSitemapXml(expectedUrls), 'utf8');
  }

  assertSitemap(expectedUrls, SITEMAP_PATH, 'public sitemap');

  if (!args.has('--skip-indexnow')) {
    assertIndexNowPayload(expectedUrls, publicSeoData.site.url);
  }

  if (args.has('--audit-dist')) {
    assertExportedHtml(publicSeoData);
    assertSitemap(expectedUrls, path.join(DIST_PATH, 'sitemap.xml'), 'dist sitemap');
  }

  console.log(
    `Public SEO audit passed: ${expectedUrls.length} URLs, ${publicSeoData.comparisonPages.length} comparison pages, ${publicSeoData.learnArticles.length} learn articles.`,
  );
}

try {
  main();
} catch (error) {
  console.error(`Public SEO audit failed: ${error.message}`);
  process.exit(1);
}
