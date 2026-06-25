import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const failures = [];

const relativePath = (filePath) => path.relative(root, filePath).replaceAll(path.sep, '/');

const readTextFile = (filePath) => {
  if (!fs.existsSync(filePath)) {
    failures.push(`Missing required file: ${relativePath(filePath)}`);
    return '';
  }
  return fs.readFileSync(filePath, 'utf8');
};

const printSection = (title) => {
  console.log(`\n${title}`);
  console.log('-'.repeat(title.length));
};

const assertIncludes = (label, source, snippets) => {
  const missing = snippets.filter((snippet) => !source.includes(snippet));
  if (missing.length > 0) {
    failures.push(`${label} is missing: ${missing.join(', ')}`);
    console.log(`[FAIL] ${label}`);
    for (const snippet of missing) {
      console.log(`  missing ${snippet}`);
    }
    return;
  }
  console.log(`[PASS] ${label}`);
};

const runCommand = (label, command, args, options = {}) => {
  console.log(`\n$ ${[command, ...args].join(' ')}`);
  const useWindowsShell = process.platform === 'win32';
  const result = spawnSync(useWindowsShell ? [command, ...args].join(' ') : command, useWindowsShell ? [] : args, {
    cwd: root,
    stdio: 'inherit',
    shell: useWindowsShell,
    ...options,
  });

  if (result.error) {
    failures.push(`${label} could not start: ${result.error.message}`);
    return;
  }

  if (result.status !== 0) {
    failures.push(`${label} failed with exit code ${result.status ?? 'unknown'}`);
  }
};

printSection('Focused Backup/Restore Tests');
runCommand('Mobile backup/restore unit tests', npmCommand, [
  '--prefix',
  'apps/MoneyKai-mobile',
  'run',
  'test:backup-restore',
]);

printSection('Preview-Before-Restore Surface Checks');

const mobileNativeSettingsPath = path.join(root, 'apps', 'MoneyKai-mobile', 'src', 'screens', 'app', 'SettingsScreen.tsx');
const mobileRouterMorePath = path.join(root, 'apps', 'MoneyKai-mobile', 'src', 'app', '(tabs)', 'more.tsx');
const webSettingsPath = path.join(root, 'apps', 'MoneyKai-web', 'src', 'app', '(tabs)', 'settings.tsx');
const mobileBackupServicePath = path.join(root, 'apps', 'MoneyKai-mobile', 'src', 'services', 'backupService.ts');
const webBackupServicePath = path.join(root, 'apps', 'MoneyKai-web', 'src', 'services', 'backupService.ts');

const requiredUiSnippets = [
  'getLatestCloudBackupMetadata',
  'restoreLatestCloudBackup',
  'Latest available backup',
  'Restore Latest Backup',
  'Restore this backup?',
  'buildBackupConfirmationMessage',
];

assertIncludes('Native mobile Settings preview/restore UI', readTextFile(mobileNativeSettingsPath), requiredUiSnippets);
assertIncludes('Expo-router mobile More preview/restore UI', readTextFile(mobileRouterMorePath), requiredUiSnippets);
assertIncludes('Web Settings preview/restore UI', readTextFile(webSettingsPath), requiredUiSnippets);

const requiredServiceSnippets = [
  'summarizeBackupSnapshot',
  'getLatestCloudBackupMetadata',
  'restoreLatestCloudBackup',
  'This backup belongs to a different account.',
  'firebaseUser.uid !== user.id',
];

assertIncludes('Mobile backup service signed-in restore guard', readTextFile(mobileBackupServicePath), requiredServiceSnippets);
assertIncludes('Web backup service signed-in restore guard', readTextFile(webBackupServicePath), requiredServiceSnippets);

printSection('Handoff Evidence Reminder');
console.log('- Run this gate before the internal handoff: npm run backup-restore:gate');
console.log('- Still perform one live signed-in smoke with the handoff build and record account, device/browser, backup timestamp, preview counts, restore result, and screenshot/report evidence.');

if (failures.length > 0) {
  console.error('\nBackup/restore release gate failed:');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log('\nBackup/restore release gate passed.');
