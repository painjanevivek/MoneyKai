import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const distDir = path.join(root, 'apps', 'MoneyKai-web', 'dist');
const release =
  process.env.SENTRY_RELEASE ||
  process.env.VERCEL_GIT_COMMIT_SHA ||
  `moneykai-web@${process.env.npm_package_version || '1.0.0'}`;
const required = ['SENTRY_AUTH_TOKEN', 'SENTRY_ORG', 'SENTRY_PROJECT'];
const missing = required.filter((key) => !process.env[key]);
const keepPublicSourceMaps = process.env.MONEYKAI_KEEP_PUBLIC_SOURCE_MAPS === 'true';

const log = (message) => console.log(`[sentry-sourcemaps] ${message}`);

if (!fs.existsSync(distDir)) {
  log(`Skipping upload; ${distDir} does not exist.`);
  process.exit(0);
}

const removeSourceMapReferences = (dir) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      removeSourceMapReferences(fullPath);
      continue;
    }

    if (entry.name.endsWith('.js')) {
      const source = fs.readFileSync(fullPath, 'utf8');
      fs.writeFileSync(fullPath, source.replace(/\n?\/\/# sourceMappingURL=.*\.map\s*$/gm, ''), 'utf8');
    }
  }
};

const deletePublicSourceMaps = () => {
  for (const mapFile of mapFiles) {
    fs.rmSync(mapFile, { force: true });
  }
  removeSourceMapReferences(distDir);
  log('Deleted public source maps from the web export.');
};

const mapFiles = [];
const walk = (dir) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath);
    } else if (entry.name.endsWith('.map')) {
      mapFiles.push(fullPath);
    }
  }
};
walk(distDir);

if (!mapFiles.length) {
  log('Skipping upload; no .map files were emitted by the web build.');
  process.exit(0);
}

if (missing.length) {
  log(`Skipping upload; missing ${missing.join(', ')}.`);
  if (!keepPublicSourceMaps) {
    deletePublicSourceMaps();
  } else {
    log('Kept public source maps because MONEYKAI_KEEP_PUBLIC_SOURCE_MAPS=true.');
  }
  process.exit(0);
}

const run = (args) => {
  const result = spawnSync('npx', ['@sentry/cli', ...args], {
    cwd: root,
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: {
      ...process.env,
      SENTRY_RELEASE: release,
    },
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
};

log(`Uploading ${mapFiles.length} source map(s) for release ${release}.`);
run(['releases', 'new', release]);
run(['sourcemaps', 'inject', distDir]);
run(['sourcemaps', 'upload', '--release', release, '--dist', 'web', '--url-prefix', '~/', distDir]);
run(['releases', 'finalize', release]);

if (!keepPublicSourceMaps) {
  deletePublicSourceMaps();
} else {
  log('Kept public source maps because MONEYKAI_KEEP_PUBLIC_SOURCE_MAPS=true.');
}
