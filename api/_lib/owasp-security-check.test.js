const assert = require('node:assert/strict');
const { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } = require('node:fs');
const { tmpdir } = require('node:os');
const path = require('node:path');
const { execFileSync, spawnSync } = require('node:child_process');
const test = require('node:test');

const root = path.resolve(__dirname, '..', '..');

test('security audit accepts API routes intentionally excluded from the frontend deploy', () => {
  const temporaryParent = mkdtempSync(path.join(tmpdir(), 'moneykai-security-check-'));
  const temporaryRoot = path.join(temporaryParent, 'repo');

  try {
    const trackedFiles = execFileSync('git', ['ls-files', '-z'], {
      cwd: root,
      encoding: 'utf8',
    }).split('\0').filter(Boolean);
    for (const relativePath of trackedFiles) {
      const destination = path.join(temporaryRoot, relativePath);
      mkdirSync(path.dirname(destination), { recursive: true });
      copyFileSync(path.join(root, relativePath), destination);
    }
    for (const relativePath of trackedFiles.filter(
      (file) => file.startsWith('api/v1/') && !file.startsWith('api/v1/auth/google/'),
    )) {
      rmSync(path.join(temporaryRoot, relativePath));
    }
    const vercelConfigPath = path.join(temporaryRoot, 'vercel.json');
    const vercelConfig = JSON.parse(readFileSync(vercelConfigPath, 'utf8'));
    for (const rewrite of vercelConfig.rewrites ?? []) {
      if (rewrite.source.startsWith('/__/')) {
        rewrite.source = `/vercel-normalized${rewrite.source}`;
      }
    }
    writeFileSync(vercelConfigPath, `${JSON.stringify(vercelConfig, null, 2)}\n`);
    const temporaryDist = path.join(temporaryRoot, 'apps', 'MoneyKai-web', 'dist');
    mkdirSync(path.join(temporaryDist, '.well-known'), { recursive: true });
    copyFileSync(
      path.join(temporaryRoot, 'apps', 'MoneyKai-web', 'public', '.well-known', 'security.txt'),
      path.join(temporaryDist, '.well-known', 'security.txt'),
    );
    writeFileSync(path.join(temporaryDist, 'index.html'), '<!doctype html><html><body></body></html>');

    for (const gitArgs of [['init', '--quiet'], ['add', '-A']]) {
      const gitResult = spawnSync('git', gitArgs, {
        cwd: temporaryRoot,
        encoding: 'utf8',
      });
      assert.equal(gitResult.status, 0, `${gitResult.stdout}\n${gitResult.stderr}`);
    }

    const result = spawnSync(
      process.execPath,
      [path.join(temporaryRoot, 'scripts', 'owasp-security-check.mjs'), '--require-dist'],
      { cwd: temporaryRoot, encoding: 'utf8' },
    );

    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
    assert.match(result.stdout, /AI attachment analysis is excluded from the frontend deploy/);
    assert.match(result.stdout, /Email auth routes are excluded from the frontend deploy/);
  } finally {
    rmSync(temporaryParent, { recursive: true, force: true });
  }
});
