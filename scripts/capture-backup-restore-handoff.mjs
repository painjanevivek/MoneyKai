#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';

const normalize = (value) => String(value ?? '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
const stripAnsi = (value) => normalize(value).replace(/\u001b\[[0-9;]*m/g, '');
const escapeTable = (value) => String(value).replace(/\|/g, '\\|').replace(/\n/g, '<br>');

const inlineCode = (value) => {
  const text = String(value);
  return text.includes('`') ? `\`\` ${text} \`\`` : `\`${text}\``;
};

const git = (args, fallback = 'Unavailable') => {
  const result = spawnSync('git', args, {
    cwd: ROOT,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  if (result.status !== 0 || result.error) {
    return fallback;
  }

  return normalize(result.stdout).trim() || fallback;
};

const worktreeSummary = () => {
  const status = git(['status', '--short'], '');
  if (!status) {
    return 'clean';
  }

  const changeCount = status.split('\n').filter(Boolean).length;
  return `dirty (${changeCount} change${changeCount === 1 ? '' : 's'})`;
};

const capturedAt = new Date().toISOString();
const branch = git(['branch', '--show-current'], 'detached HEAD');
const shortCommit = git(['rev-parse', '--short', 'HEAD']);
const fullCommit = git(['rev-parse', 'HEAD']);
const commitDate = git(['log', '-1', '--format=%cI']);
const commitSubject = git(['log', '-1', '--format=%s']);
const worktree = worktreeSummary();

const useWindowsShell = process.platform === 'win32';
const gateCommand = [npmCommand, 'run', 'backup-restore:gate'];
const gate = spawnSync(useWindowsShell ? gateCommand.join(' ') : npmCommand, useWindowsShell ? [] : ['run', 'backup-restore:gate'], {
  cwd: ROOT,
  encoding: 'utf8',
  stdio: ['ignore', 'pipe', 'pipe'],
  shell: useWindowsShell,
  maxBuffer: 20 * 1024 * 1024,
});

const gateExitCode = gate.error ? 1 : (gate.status ?? 1);
const gateResult = gateExitCode === 0 ? 'PASS' : 'FAIL';
const stdout = stripAnsi(gate.stdout).trim();
const stderr = stripAnsi(gate.stderr).trim();
const startupError = gate.error ? `Command startup error: ${gate.error.message}` : '';
const gateOutput = [
  stdout,
  stderr ? `[stderr]\n${stderr}` : '',
  startupError,
].filter(Boolean).join('\n\n') || '(no output)';

const rows = [
  ['Captured at', inlineCode(capturedAt)],
  ['Command', inlineCode('npm run backup-restore:gate')],
  ['Result', gateResult],
  ['Exit code', inlineCode(gateExitCode)],
  ['Branch', inlineCode(branch)],
  ['Commit', `${inlineCode(shortCommit)} / ${inlineCode(fullCommit)}`],
  ['Commit date', inlineCode(commitDate)],
  ['Commit subject', escapeTable(commitSubject)],
  ['Worktree', inlineCode(worktree)],
];

console.log('<!-- BACKUP_RESTORE_HANDOFF_START -->');
console.log('## Backup/Restore Handoff Evidence');
console.log('');
console.log('| Field | Value |');
console.log('| --- | --- |');
for (const [field, value] of rows) {
  console.log(`| ${field} | ${escapeTable(value)} |`);
}
console.log('');
console.log('### Gate Output');
console.log('');
console.log('```text');
console.log(gateOutput);
console.log('```');
console.log('');
console.log('### Live Smoke Follow-Up');
console.log('');
console.log('- Record the signed-in tester account alias, device/browser, backup timestamp, preview counts, restore result, and screenshot/report evidence for the exact handoff build.');
console.log('<!-- BACKUP_RESTORE_HANDOFF_END -->');

process.exit(gateExitCode);
