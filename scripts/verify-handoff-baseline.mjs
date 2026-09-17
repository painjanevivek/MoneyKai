#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import process from 'node:process';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const BASELINE_TARGETS = [
  {
    file: 'apps/MoneyKai-mobile/docs/phase5-release-readiness.md',
    pattern:
      /Minimum verified release baseline is `main` at `([0-9a-f]{7,40})` \(`([0-9a-f]{40})`\)/,
    label: 'Phase 5 release-readiness minimum verified baseline',
  },
  {
    file: 'apps/MoneyKai-mobile/docs/phase5-internal-release-signoff.md',
    pattern: /\| Minimum verified baseline \| `([0-9a-f]{7,40})` \(`([0-9a-f]{40})`\) \|/,
    label: 'Phase 5 internal-signoff minimum verified baseline',
  },
  {
    file: 'apps/MoneyKai-mobile/docs/phase5-internal-release-signoff.md',
    pattern: /\| Source baseline \| `([0-9a-f]{7,40})` \/ `([0-9a-f]{40})` \|/,
    label: 'Phase 5 internal-signoff handoff source baseline',
  },
];

function git(args) {
  return execFileSync('git', args, {
    cwd: ROOT,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

function addFailure(failures, message) {
  failures.push(`- ${message}`);
}

function isCommitAncestor(commit) {
  try {
    git(['merge-base', '--is-ancestor', commit, 'HEAD']);
    return true;
  } catch {
    return false;
  }
}

function verifyTarget(target, headFull, failures) {
  const absolutePath = path.join(ROOT, target.file);
  const source = readFileSync(absolutePath, 'utf8');
  const match = target.pattern.exec(source);

  if (!match) {
    addFailure(failures, `${target.label} was not found in ${target.file}.`);
    return;
  }

  const [, documentedShort, documentedFull] = match;

  if (!documentedFull.startsWith(documentedShort)) {
    addFailure(
      failures,
      `${target.label} short hash \`${documentedShort}\` does not match documented commit \`${documentedFull}\`.`,
    );
    return;
  }

  if (!isCommitAncestor(documentedFull)) {
    addFailure(
      failures,
      `${target.label} documents \`${documentedFull}\`, which is not an ancestor of HEAD \`${headFull}\`.`,
    );
  }
}

try {
  const expectedFull = git(['rev-parse', 'HEAD']);
  const failures = [];

  for (const target of BASELINE_TARGETS) {
    verifyTarget(target, expectedFull, failures);
  }

  if (failures.length > 0) {
    console.error('Handoff baseline verification failed:');
    console.error(failures.join('\n'));
    console.error('');
    console.error('Update the Phase 5 Android handoff docs with a verified baseline that is an ancestor of HEAD before building or capturing a Play candidate.');
    process.exit(1);
  }

  console.log(`Handoff baseline verification passed. HEAD ${git(['rev-parse', '--short', 'HEAD'])} (${expectedFull}) descends from every documented release baseline.`);
} catch (error) {
  console.error(`Handoff baseline verification failed: ${error.message}`);
  process.exit(1);
}
