import { describe, expect, it } from 'vitest';
import { amountToMinor } from '../../../../packages/domain/src/transactionImports';
describe('exact approved transaction amounts', () => {
  it('converts without rounding fractional paise', () => {
    expect(amountToMinor('123.45')).toBe(12345);
    expect(amountToMinor(0.1)).toBe(10);
    for (const input of ['1.001', 'NaN', '-1', 'Infinity', 0]) expect(() => amountToMinor(input)).toThrow();
  });
});
