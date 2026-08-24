import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import process from 'node:process';

const LOCKFILE_PATH = resolve('package-lock.json');
const MANIFEST_PATH = resolve('docs/operations/production-readiness/pr-1-npm-dependency-license-manifest.json');

function packageNameFromPath(packagePath) {
  const marker = 'node_modules/';
  const index = packagePath.lastIndexOf(marker);
  return index < 0 ? packagePath : packagePath.slice(index + marker.length);
}

export function buildManifest(lockfileText) {
  const lockfile = JSON.parse(lockfileText);
  const packages = Object.entries(lockfile.packages ?? {})
    .filter(([packagePath, details]) => packagePath.includes('node_modules/') && details.version)
    .map(([packagePath, details]) => ({
      path: packagePath,
      name: details.name ?? packageNameFromPath(packagePath),
      version: details.version,
      license: details.license ?? 'UNKNOWN',
      integrity: details.integrity ?? null,
      development_only: details.dev === true,
      optional: details.optional === true,
    }))
    .sort((left, right) => left.path.localeCompare(right.path));

  const licenseSummary = Object.entries(packages.reduce((summary, item) => {
    const license = typeof item.license === 'string' ? item.license : JSON.stringify(item.license);
    summary[license] = (summary[license] ?? 0) + 1;
    return summary;
  }, {}))
    .map(([license, count]) => ({ license, count }))
    .sort((left, right) => left.license.localeCompare(right.license));

  return {
    schema_version: 1,
    source: 'package-lock.json',
    lockfile_version: lockfile.lockfileVersion,
    lockfile_sha256: createHash('sha256').update(lockfileText).digest('hex'),
    package_count: packages.length,
    license_summary: licenseSummary,
    packages,
  };
}

function serializedManifest() {
  return `${JSON.stringify(buildManifest(readFileSync(LOCKFILE_PATH, 'utf8')), null, 2)}\n`;
}

const mode = process.argv[2] ?? '--check';
if (mode === '--write') {
  writeFileSync(MANIFEST_PATH, serializedManifest());
  console.log(`Wrote ${MANIFEST_PATH}`);
} else if (mode === '--check') {
  const expected = serializedManifest();
  const actual = readFileSync(MANIFEST_PATH, 'utf8');
  if (actual !== expected) {
    console.error('Dependency/license manifest is stale. Run npm run security:dependency-manifest:write.');
    process.exit(1);
  }
  console.log('Dependency/license manifest matches the committed lockfile.');
} else {
  console.error(`Unknown mode: ${mode}`);
  process.exit(1);
}
