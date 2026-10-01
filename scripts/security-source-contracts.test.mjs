import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { hasExactMobileGoogleCallback } from './security-source-contracts.mjs';

const source = readFileSync(new URL('../apps/MoneyKai-mobile/src/services/googleAuth.ts', import.meta.url), 'utf8');

test('accepts the existing exact parsed mobile callback with a rejection guard', () => {
  assert.equal(hasExactMobileGoogleCallback(source), true);
});
test('retains the previous exact literal callback contract', () => {
  assert.equal(hasExactMobileGoogleCallback("const uri = 'moneykai-mobile://auth/google';"), true);
});
for (const [name, original, changed] of [
  ['wrong scheme', "parsed.protocol === 'moneykai-mobile:'", "parsed.protocol === 'https:'"],
  ['wrong hostname', "parsed.hostname === 'auth'", "parsed.hostname === 'other'"],
  ['wrong path', "parsed.pathname === '/google'", "parsed.pathname === '/other'"],
  ['missing rejection guard', 'if (!isGoogleOAuthCallback(url))', 'if (false)'],
]) {
  test(`rejects structured validation with ${name}`, () => {
    assert.equal(hasExactMobileGoogleCallback(source.replace(original, changed)), false);
  });
}
