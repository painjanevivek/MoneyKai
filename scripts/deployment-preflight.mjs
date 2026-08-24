import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

const REQUIRED_PUBLIC_KEYS = [
  'EXPO_PUBLIC_BACKEND_BASE_URL',
  'EXPO_PUBLIC_FIREBASE_API_KEY',
  'EXPO_PUBLIC_FIREBASE_APP_ID',
  'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'EXPO_PUBLIC_FIREBASE_PROJECT_ID',
  'EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET',
];

const SENSITIVE_FLAGS = [
  'EXPO_PUBLIC_FINANCIAL_AI_ENABLED',
  'EXPO_PUBLIC_GMAIL_SYNC_ENABLED',
  'EXPO_PUBLIC_LINKED_ACCOUNT_DEMO_ENABLED',
  'EXPO_PUBLIC_PDF_STATEMENT_PARSING_ENABLED',
];

const parseEnvTemplate = (content) => {
  const entries = new Map();
  for (const line of content.split(/\r?\n/u)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/u);
    if (match) {
      entries.set(match[1], match[2].trim());
    }
  }
  return entries;
};

const issue = (code, variables, message) => ({ code, variables, message });

export const validateTemplate = (entries) => {
  const issues = [];
  const missing = REQUIRED_PUBLIC_KEYS.filter((name) => !entries.has(name));
  if (missing.length > 0) {
    issues.push(issue('public_contract_missing', missing, 'The web environment template is incomplete.'));
  }

  const unsafeDefaults = SENSITIVE_FLAGS.filter((name) => entries.get(name) !== 'false');
  if (unsafeDefaults.length > 0) {
    issues.push(
      issue(
        'sensitive_default_open',
        unsafeDefaults,
        'Sensitive capability flags must default to false in the tracked template.',
      ),
    );
  }
  return issues;
};

export const validateRuntime = (environment) => {
  const issues = [];
  const missing = REQUIRED_PUBLIC_KEYS.filter((name) => !environment[name]?.trim());
  if (missing.length > 0) {
    issues.push(issue('public_runtime_missing', missing, 'Required public deployment variables are missing.'));
  }

  const backendUrl = environment.EXPO_PUBLIC_BACKEND_BASE_URL?.trim() ?? '';
  if (backendUrl && !isPublicHttpsUrl(backendUrl)) {
    issues.push(
      issue(
        'backend_url_not_public_https',
        ['EXPO_PUBLIC_BACKEND_BASE_URL'],
        'The production backend URL must use public HTTPS.',
      ),
    );
  }

  const invalidBooleans = SENSITIVE_FLAGS.filter(
    (name) => environment[name] !== undefined && !['true', 'false'].includes(environment[name].trim()),
  );
  if (invalidBooleans.length > 0) {
    issues.push(issue('feature_flag_invalid', invalidBooleans, 'Feature flags must be exactly true or false.'));
  }

  if (process.argv.includes('--require-sensitive-disabled')) {
    const enabled = SENSITIVE_FLAGS.filter((name) => environment[name]?.trim() === 'true');
    if (enabled.length > 0) {
      issues.push(
        issue(
          'sensitive_capability_enabled',
          enabled,
          'Sensitive capabilities must remain disabled during the readiness program.',
        ),
      );
    }
  }
  return issues;
};

const isPublicHttpsUrl = (value) => {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:' && !['localhost', '127.0.0.1', '[::1]'].includes(parsed.hostname);
  } catch {
    return false;
  }
};

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const templatePath = path.resolve('apps/MoneyKai-web/.env.example');
  const templateEntries = parseEnvTemplate(fs.readFileSync(templatePath, 'utf8'));
  const runtimeMode = process.argv.includes('--runtime');
  const issues = runtimeMode ? validateRuntime(process.env) : validateTemplate(templateEntries);

  console.log(
    JSON.stringify(
      {
        ok: issues.length === 0,
        mode: runtimeMode ? 'runtime' : 'template',
        issueCount: issues.length,
        issues,
      },
      null,
      2,
    ),
  );
  process.exitCode = issues.length === 0 ? 0 : 1;
}
