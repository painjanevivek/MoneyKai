import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];

const readText = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');
const readJson = (relativePath) => JSON.parse(readText(relativePath));

const listFiles = (directory) => {
  if (!fs.existsSync(directory)) {
    return [];
  }
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    return entry.isDirectory() ? listFiles(fullPath) : [fullPath];
  });
};

const assertBoundary = (condition, message) => {
  if (!condition) {
    failures.push(message);
  }
};

const authGateway = readText('apps/MoneyKai-web/src/services/authGateway.ts');
assertBoundary(
  authGateway.includes('getAuthGatewayUrl') && authGateway.includes('getBackendBaseUrl'),
  'Web authentication must construct requests from the canonical backend base URL.',
);
assertBoundary(
  !authGateway.includes('window.location.origin') && !authGateway.includes('withApiPrefix'),
  'Web authentication must not probe the web origin or an /api/v1 fallback.',
);

const vercelIgnoreRules = readText('.vercelignore')
  .split(/\r?\n/)
  .map((rule) => rule.trim())
  .filter(Boolean);
assertBoundary(
  vercelIgnoreRules.includes('api/v1/**'),
  'The root web deployment must exclude legacy api/v1 compatibility sources.',
);
assertBoundary(
  !vercelIgnoreRules.some((rule) => rule.startsWith('!api/v1/')),
  'No legacy api/v1 source may be reintroduced into the web deployment.',
);

for (const configPath of ['vercel.json', 'apps/MoneyKai-web/vercel.json']) {
  const rewrites = readJson(configPath).rewrites ?? [];
  assertBoundary(
    !rewrites.some(({ source = '', destination = '' }) =>
      source.startsWith('/api/v1/') || destination.includes('auth-google')
    ),
    `${configPath} must not route canonical API traffic to a web-side implementation.`,
  );
}

assertBoundary(
  !fs.existsSync(path.join(root, 'api', 'auth-google.js')),
  'The root web deployment must not expose the retired Google OAuth function.',
);

const webApiFiles = listFiles(path.join(root, 'apps', 'MoneyKai-web', 'api'))
  .filter((file) => file.endsWith('.js'));
assertBoundary(
  webApiFiles.length === 0,
  `The web app must not contain deployable API implementations: ${webApiFiles
    .map((file) => path.relative(root, file))
    .join(', ')}`,
);

if (failures.length > 0) {
  console.error('Canonical API boundary check failed:');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log('canonical API boundary check ok');
