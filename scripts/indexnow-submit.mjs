#!/usr/bin/env node

import { readFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const DEFAULT_HOST = 'moneykai.com';
const DEFAULT_KEY = '2798fae71bac4fe1ad2b379c5825b8f9';
const DEFAULT_SITEMAP_PATH = 'apps/MoneyKai-web/public/sitemap.xml';
const DEFAULT_ENDPOINT = 'https://api.indexnow.org/indexnow';

function parseArgs(argv) {
  const options = {
    dryRun: false,
    endpoint: process.env.INDEXNOW_ENDPOINT || DEFAULT_ENDPOINT,
    host: process.env.INDEXNOW_HOST || DEFAULT_HOST,
    key: process.env.INDEXNOW_KEY || DEFAULT_KEY,
    sitemapPath: process.env.INDEXNOW_SITEMAP_PATH || DEFAULT_SITEMAP_PATH,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--help' || arg === '-h') {
      options.help = true;
      continue;
    }

    if (arg === '--dry-run') {
      options.dryRun = true;
      continue;
    }

    if (['--endpoint', '--host', '--key', '--sitemap'].includes(arg)) {
      const next = argv[index + 1];
      if (!next) {
        throw new Error(`${arg} requires a value.`);
      }

      if (arg === '--endpoint') options.endpoint = next;
      if (arg === '--host') options.host = next;
      if (arg === '--key') options.key = next;
      if (arg === '--sitemap') options.sitemapPath = next;
      index += 1;
      continue;
    }

    if (arg.startsWith('--endpoint=')) options.endpoint = arg.slice('--endpoint='.length);
    else if (arg.startsWith('--host=')) options.host = arg.slice('--host='.length);
    else if (arg.startsWith('--key=')) options.key = arg.slice('--key='.length);
    else if (arg.startsWith('--sitemap=')) options.sitemapPath = arg.slice('--sitemap='.length);
    else throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

function printHelp() {
  console.log(`MoneyKai IndexNow submitter

Usage:
  npm run indexnow:dry-run
  npm run indexnow:submit

Options:
  --dry-run             Print the payload without submitting.
  --host moneykai.com   Host that owns every submitted URL.
  --key <key>           IndexNow key. Defaults to the hosted MoneyKai key.
  --sitemap <path>      Local sitemap XML path.
  --endpoint <url>      IndexNow endpoint. Defaults to https://api.indexnow.org/indexnow.
`);
}

function extractSitemapUrls(sitemapXml) {
  const urls = [...sitemapXml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/g)]
    .map((match) => match[1].trim())
    .filter(Boolean);

  return [...new Set(urls)];
}

function validateUrls(urls, host) {
  if (urls.length === 0) {
    throw new Error('No <loc> URLs were found in the sitemap.');
  }

  if (urls.length > 10000) {
    throw new Error(`IndexNow supports up to 10,000 URLs per request; found ${urls.length}.`);
  }

  const invalidUrls = [];

  for (const url of urls) {
    try {
      const parsed = new URL(url);
      if (parsed.hostname !== host) {
        invalidUrls.push(url);
      }
    } catch {
      invalidUrls.push(url);
    }
  }

  if (invalidUrls.length > 0) {
    throw new Error(`Sitemap contains URLs outside host "${host}": ${invalidUrls.slice(0, 5).join(', ')}`);
  }
}

async function submitIndexNow(endpoint, payload) {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`IndexNow returned HTTP ${response.status}: ${body || response.statusText}`);
  }

  return response.status;
}

try {
  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    printHelp();
    process.exit(0);
  }

  const sitemapPath = path.resolve(process.cwd(), options.sitemapPath);
  const sitemapXml = readFileSync(sitemapPath, 'utf8');
  const urlList = extractSitemapUrls(sitemapXml);

  validateUrls(urlList, options.host);

  const payload = {
    host: options.host,
    key: options.key,
    keyLocation: `https://${options.host}/${options.key}.txt`,
    urlList,
  };

  if (options.dryRun) {
    console.log('IndexNow dry run payload:');
    console.log(JSON.stringify(payload, null, 2));
    console.log(`URL count: ${urlList.length}`);
    process.exit(0);
  }

  const status = await submitIndexNow(options.endpoint, payload);
  console.log(`IndexNow submission accepted with HTTP ${status}.`);
  console.log(`Submitted ${urlList.length} URLs for ${options.host}.`);
} catch (error) {
  console.error(`IndexNow submission failed: ${error.message}`);
  process.exit(1);
}
