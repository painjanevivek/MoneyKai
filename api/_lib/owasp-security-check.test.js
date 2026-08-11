const assert = require('node:assert/strict');
const { copyFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } = require('node:fs');
const { tmpdir } = require('node:os');
const path = require('node:path');
const { execFileSync, spawnSync } = require('node:child_process');
const test = require('node:test');

const root = path.resolve(__dirname, '..', '..');

test('deployment audit accepts the exact Vercel-filtered source bundle without ignore metadata', () => {
  const temporaryParent = mkdtempSync(path.join(tmpdir(), 'moneykai-vercel-bundle-'));
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

    const ignoredV1Routes = trackedFiles.filter(
      (file) => file.startsWith('api/v1/') && !file.startsWith('api/v1/auth/google/'),
    );
    assert.equal(ignoredV1Routes.length, 26, 'fixture must match Vercel\'s reported removal set');

    for (const relativePath of ignoredV1Routes) {
      rmSync(path.join(temporaryRoot, relativePath));
    }
    rmSync(path.join(temporaryRoot, '.vercelignore'));

    const temporaryDist = path.join(temporaryRoot, 'apps', 'MoneyKai-web', 'dist');
    mkdirSync(path.join(temporaryDist, '.well-known'), { recursive: true });
    copyFileSync(
      path.join(temporaryRoot, 'apps', 'MoneyKai-web', 'public', '.well-known', 'security.txt'),
      path.join(temporaryDist, '.well-known', 'security.txt'),
    );
    writeFileSync(path.join(temporaryDist, 'index.html'), '<!doctype html><html><body></body></html>');

    const result = spawnSync(
      process.execPath,
      [
        path.join(temporaryRoot, 'scripts', 'owasp-security-check.mjs'),
        '--require-dist',
        '--deployment-input',
      ],
      { cwd: temporaryRoot, encoding: 'utf8' },
    );

    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
    assert.match(result.stdout, /AI attachment analysis source is intentionally absent from the deployment input/);
    assert.match(result.stdout, /Email auth route sources are intentionally absent from the deployment input/);
  } finally {
    rmSync(temporaryParent, { recursive: true, force: true });
  }
});
