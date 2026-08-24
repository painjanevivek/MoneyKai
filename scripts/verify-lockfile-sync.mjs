import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import process from 'node:process';

const rootManifest = JSON.parse(readFileSync(resolve('package.json'), 'utf8'));
const lockfile = JSON.parse(readFileSync(resolve('package-lock.json'), 'utf8'));
const dependencySections = ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies'];
const workspacePaths = (rootManifest.workspaces ?? []).filter((entry) => typeof entry === 'string' && !entry.includes('*'));
const manifestPaths = ['', ...workspacePaths];
const violations = [];

for (const manifestPath of manifestPaths) {
  const manifest = manifestPath ? JSON.parse(readFileSync(resolve(manifestPath, 'package.json'), 'utf8')) : rootManifest;
  const lockedPackage = lockfile.packages?.[manifestPath];
  if (!lockedPackage) {
    violations.push(`${manifestPath || '.'}: missing from package-lock.json packages map`);
    continue;
  }

  for (const section of dependencySections) {
    const declared = manifest[section] ?? {};
    const locked = lockedPackage[section] ?? {};
    if (JSON.stringify(declared) !== JSON.stringify(locked)) {
      violations.push(`${manifestPath || '.'}: ${section} differs from package-lock.json`);
    }
  }
}

if (violations.length) {
  console.error(['Lockfile drift detected:', ...violations.map((item) => `- ${item}`)].join('\n'));
  process.exit(1);
}
console.log(`Lockfile dependency specs match ${manifestPaths.length} package manifests.`);
