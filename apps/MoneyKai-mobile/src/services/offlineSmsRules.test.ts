import { describe, expect, it } from 'vitest';
import rules from '../../../../contracts/sms/offline-v1.json';
import fixtures from '../../../../contracts/sms/fixtures-v1.json';
import { CAPTURE_FIXTURES } from './__fixtures__/captureFixtures';
import { parseCapturedSignal } from './captureParser';
import { amountToMinor } from '../../../../packages/domain/src/transactionImports';
describe('shared offline SMS rules', () => {
  it('keeps the native corpus synchronized with the existing TypeScript parser', () => {
    expect(fixtures).toEqual(CAPTURE_FIXTURES);
    const amount = new RegExp(rules.amount,'iu');
    let checked = 0;
    for(const fixture of CAPTURE_FIXTURES) {
      if(!fixture.expected.shouldDraft || new RegExp(rules.currencies,'iu').test(fixture.input.body)) continue;
      const matched = amount.exec(fixture.input.body);
      if(!matched) continue;
      const parsed = parseCapturedSignal(fixture.input);
      expect(amountToMinor(matched[1].replaceAll(',',''))).toBe(amountToMinor(parsed.amount!));
      checked++;
    }
    expect(checked).toBeGreaterThanOrEqual(10);
  });
});
