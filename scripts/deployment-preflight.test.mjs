import assert from 'node:assert/strict';
import test from 'node:test';

import { validateRuntime, validateTemplate } from './deployment-preflight.mjs';

const requiredRuntime = {
  EXPO_PUBLIC_BACKEND_BASE_URL: 'https://api.example.invalid',
  EXPO_PUBLIC_FIREBASE_API_KEY: 'public-api-key',
  EXPO_PUBLIC_FIREBASE_APP_ID: 'public-app-id',
  EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN: 'example.invalid',
  EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: 'public-sender-id',
  EXPO_PUBLIC_FIREBASE_PROJECT_ID: 'public-project-id',
  EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET: 'public-bucket',
};

test('tracked template requires every public deployment key', () => {
  const issues = validateTemplate(new Map());

  assert.deepEqual(issues.map(({ code }) => code), ['public_contract_missing', 'sensitive_default_open']);
});

test('runtime rejects local backend origins and malformed flags', () => {
  const issues = validateRuntime({
    ...requiredRuntime,
    EXPO_PUBLIC_BACKEND_BASE_URL: 'http://localhost:8000',
    EXPO_PUBLIC_GMAIL_SYNC_ENABLED: 'yes',
  });

  assert.deepEqual(
    new Set(issues.map(({ code }) => code)),
    new Set(['backend_url_not_public_https', 'feature_flag_invalid']),
  );
});

test('runtime accepts a complete public HTTPS contract', () => {
  assert.deepEqual(validateRuntime(requiredRuntime), []);
});
