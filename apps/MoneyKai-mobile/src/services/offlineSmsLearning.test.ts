import { describe, expect, it } from 'vitest';
import { offlineSmsMessageFeatures, predictOfflineSms, type CrfWeights, type OfflineSmsModel } from './offlineSmsEngine';
import { coreErrors, reviewPartition, reviewTemplateGroup, trainLocalSmsCandidate, validateCoreLabels, type ReviewedSms } from './offlineSmsLearning';

const classifier = (labels: string[], winner = 0): CrfWeights => ({ labels,
  features: { bias: [[winner, 2]] }, transitions: labels.map(() => labels.map(() => 0)) });
function model(): OfflineSmsModel {
  return { schema_version: 1, threshold: 0.9, release_enabled: true, csv_sha256: 'test-only',
    slots: { labels: ['O', 'B-amount'], features: { 'w0=<number>': [[1, 12]], bias: [[0, 2]] }, transitions: [[0, 0], [0, 0]] },
    classifiers: { message_type: classifier(['transaction', 'reminder', 'promotion']),
      direction: classifier(['credit', 'debit', 'none']), event_kind: classifier(['bank_transfer']), payment_rail: classifier(['none']) } };
}
function reviews(): ReviewedSms[] {
  const phrases = ['on at', 'by to', 'from for', 'with via', 'has been', 'using through'];
  const groups = Array.from({ length: 64 }, (_, i) =>
    `Your account ${phrases.map((phrase, bit) => (i & (1 << bit)) ? phrase : '').join(' ')} debited INR 10.`);
  const train = groups.filter(body => reviewPartition(body) === 'train').slice(0, 4);
  const heldout = groups.filter(body => reviewPartition(body) === 'heldout').slice(0, 2);
  return [...train, ...heldout].flatMap((body, g) => Array.from({ length: 5 }, (_, n) => ({
    id: `${g}-${n}`, body: body.replace('10.', `${10 + n}.`),
    labels: { message_type: 'transaction', direction: 'debit', amount: `${10 + n}.00`, currency: 'INR', transaction_date: null },
  })));
}
describe('device-only SMS candidate learning', () => {
  it('rejects missing, invalid and impossible confirmed labels', () => {
    const gold = reviews()[0].labels;
    expect(() => validateCoreLabels({ ...gold, amount: '-10' })).toThrow();
    expect(() => validateCoreLabels({ ...gold, amount: '0' })).toThrow();
    expect(() => validateCoreLabels({ ...gold, amount: '1.234' })).toThrow();
    expect(() => validateCoreLabels({ ...gold, transaction_date: '2026-02-30' })).toThrow();
    expect(validateCoreLabels({ ...gold, amount: '0010.5' }).amount).toBe('10.50');
  });
  it('keeps non-transactions free of transaction fields', () => {
    const result = validateCoreLabels({ ...reviews()[0].labels, message_type: 'other' });
    expect(result).toEqual({ message_type: 'other', amount: null, direction: null, currency: null, transaction_date: null });
    expect(coreErrors({ ...result, currency: 'INR', amount: '100.00' }, result)).toEqual([]);
  });
  it('groups changed amounts, dates, accounts, merchants and VPAs together', () => {
    const a = 'Your account XX1234 debited INR 10 on 20/09/2026 at ALPHA via a@bank ref 123456.';
    const b = 'Your account XX9876 debited INR 999 on 25/09/2026 at BETA via b@upi ref 456789.';
    expect(reviewTemplateGroup(a)).toBe(reviewTemplateGroup(b));
    expect(reviewPartition(a)).toBe(reviewPartition(b));
  });
  it('refuses training without sufficiently separate reviewed holdout groups', () => {
    expect(() => trainLocalSmsCandidate(model(), reviews().slice(0, 10))).toThrow(/Need 20/);
    expect(() => trainLocalSmsCandidate(model(), [...reviews(), reviews()[0]])).toThrow(/Duplicate/);
  });
  it('trains actual classifier weights without changing the base, slots or production parser', () => {
    const base = model(), before = JSON.stringify(base);
    const result = trainLocalSmsCandidate(base, reviews());
    expect(JSON.stringify(base)).toBe(before);
    expect(result.model.release_enabled).toBe(false);
    expect(result.model.slots).toEqual(base.slots);
    expect(result.model.classifiers.event_kind).toEqual(base.classifiers.event_kind);
    expect(result.model.classifiers.direction).not.toEqual(base.classifiers.direction);
    expect(result.evaluation.heldout).toBe(10);
    expect(result.evaluation.candidateErrors).toBeLessThan(result.evaluation.baselineErrors);
    expect(result.evaluation.diagnosticImprovement).toBe(true);
    expect(predictOfflineSms(result.model, reviews()[0].body).target.direction).toBe('debit');
  });
  it('never feeds heldout labels to weight training', () => {
    const input = reviews(), base = model();
    const first = trainLocalSmsCandidate(base, input);
    const changed = input.map(row => reviewPartition(row.body) === 'heldout' ?
      { ...row, labels: { ...row.labels, direction: 'credit' } } : row);
    const second = trainLocalSmsCandidate(base, changed);
    expect(first.model).toEqual(second.model);
    expect(second.evaluation.regressions).toBeGreaterThan(0);
    expect(second.evaluation.diagnosticImprovement).toBe(false);
  });
  it('does not claim amount extraction errors were repaired by classifier training', () => {
    const input = reviews().map(row => ({ ...row, labels: { ...row.labels, amount: '999.00' } }));
    const result = trainLocalSmsCandidate(model(), input);
    expect(result.evaluation.fieldErrors.amount).toBe(result.evaluation.heldout);
    expect(result.evaluation.candidateErrors).toBe(result.evaluation.heldout);
    expect(result.evaluation.diagnosticImprovement).toBe(false);
  });
  it('bounds inputs and has a deterministic feature encoder', () => {
    expect(offlineSmsMessageFeatures('x'.repeat(4097))).toEqual([]);
    expect(offlineSmsMessageFeatures('word '.repeat(257))).toEqual([]);
    expect(offlineSmsMessageFeatures('Debited INR 10')).toEqual(offlineSmsMessageFeatures('Debited INR 20'));
  });
});
