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
      /Current handoff baseline is `main` \/ `origin\/main` at `([0-9a-f]{7,40})` \(`([0-9a-f]{40})`\)/,
    label: 'Phase 5 release-readiness current baseline',
  },
  {
    file: 'apps/MoneyKai-mobile/docs/phase5-internal-release-signoff.md',
    pattern: /\| Current commit \| `([0-9a-f]{7,40})` \(`([0-9a-f]{40})`\) \|/,
    label: 'Phase 5 internal-signoff current commit',
  },
  {
    file: 'apps/MoneyKai-mobile/docs/phase5-internal-release-signoff.md',
    pattern: /\| Commit hash \| `([0-9a-f]{7,40})` \/ `([0-9a-f]{40})` \|/,
    label: 'Phase 5 internal-signoff handoff fill-in commit',
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

function verifyTarget(target, expectedShort, expectedFull, failures) {
  const absolutePath = path.join(ROOT, target.file);
  const source = readFileSync(absolutePath, 'utf8');
  const match = target.pattern.exec(source);

  if (!match) {
    addFailure(failures, `${target.label} was not found in ${target.file}.`);
    return;
  }

  const [, documentedShort, documentedFull] = match;

  if (documentedShort !== expectedShort || documentedFull !== expectedFull) {
    addFailure(
      failures,
      `${target.label} documents \`${documentedShort}\` / \`${documentedFull}\`, but HEAD is \`${expectedShort}\` / \`${expectedFull}\`.`,
    );
  }
}

try {
  const expectedFull = git(['rev-parse', 'HEAD']);
  const expectedShort = git(['rev-parse', '--short', 'HEAD']);
  const failures = [];

  for (const target of BASELINE_TARGETS) {
    verifyTarget(target, expectedShort, expectedFull, failures);
  }

  if (failures.length > 0) {
    console.error('Handoff baseline verification failed:');
    console.error(failures.join('\n'));
    console.error('');
    console.error('Update the Phase 5 Android handoff docs to the current HEAD before building or capturing a Play-internal candidate.');
    process.exit(1);
  }

  console.log(`Handoff baseline verification passed at ${expectedShort} (${expectedFull}).`);
} catch (error) {
  console.error(`Handoff baseline verification failed: ${error.message}`);
  process.exit(1);
}
