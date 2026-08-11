const assert = require('node:assert/strict');
const {
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} = require('node:fs');
const { tmpdir } = require('node:os');
const path = require('node:path');
const { execFileSync, spawnSync } = require('node:child_process');
const test = require('node:test');

const root = path.resolve(__dirname, '..', '..');

const createDeploymentFixture = () => {
  const temporaryParent = mkdtempSync(path.join(tmpdir(), 'moneykai-vercel-bundle-'));
  const temporaryRoot = path.join(temporaryParent, 'repo');

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

  const vercelConfigPath = path.join(temporaryRoot, 'vercel.json');
  writeFileSync(
    vercelConfigPath,
    JSON.stringify(JSON.parse(readFileSync(vercelConfigPath, 'utf8'))),
  );

  const temporaryDist = path.join(temporaryRoot, 'apps', 'MoneyKai-web', 'dist');
  mkdirSync(path.join(temporaryDist, '.well-known'), { recursive: true });
  copyFileSync(
    path.join(temporaryRoot, 'apps', 'MoneyKai-web', 'public', '.well-known', 'security.txt'),
    path.join(temporaryDist, '.well-known', 'security.txt'),
  );
  writeFileSync(path.join(temporaryDist, 'index.html'), '<!doctype html><html><body></body></html>');

  return { temporaryParent, temporaryRoot };
};

const runDeploymentAudit = (temporaryRoot) => spawnSync(
  process.execPath,
  [
    path.join(temporaryRoot, 'scripts', 'owasp-security-check.mjs'),
    '--require-dist',
    '--deployment-input',
  ],
  { cwd: temporaryRoot, encoding: 'utf8' },
);

test('deployment audit accepts Vercel-filtered sources with normalized config JSON', () => {
  const { temporaryParent, temporaryRoot } = createDeploymentFixture();

  try {
    const result = runDeploymentAudit(temporaryRoot);

    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
    assert.match(result.stdout, /AI attachment analysis source is intentionally absent from the deployment input/);
    assert.match(result.stdout, /Email auth route sources are intentionally absent from the deployment input/);
  } finally {
    rmSync(temporaryParent, { recursive: true, force: true });
  }
});

test('deployment audit names the missing password-reset evidence', () => {
  const { temporaryParent, temporaryRoot } = createDeploymentFixture();

  try {
    const mobileAuthServicePath = path.join(
      temporaryRoot,
      'apps',
      'MoneyKai-mobile',
      'src',
      'services',
      'authService.ts',
    );
    const mobileAuthService = readFileSync(mobileAuthServicePath, 'utf8');
    writeFileSync(
      mobileAuthServicePath,
      mobileAuthService.replace(
        'requestPasswordResetGateway(normalizedEmail)',
        'requestPasswordResetGateway(email)',
      ),
    );

    const result = runDeploymentAudit(temporaryRoot);

    assert.notEqual(result.status, 0, `${result.stdout}\n${result.stderr}`);
    assert.match(
      result.stdout,
      /missing password-reset evidence: mobile auth service gateway call/i,
    );
  } finally {
    rmSync(temporaryParent, { recursive: true, force: true });
  }
});
