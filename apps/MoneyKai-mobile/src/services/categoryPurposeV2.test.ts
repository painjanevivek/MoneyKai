import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import weights from './models/categoryModelV2.json';
import corpus from './models/categoryPurposeDataV2.json';
import { categoryTokens, classifyCounterpartyCategory, predictCategory, trainCategoryModel } from './offlineCategoryModel';
import type { CategoryExample } from './categoryClassifierCore';
import { parseCapturedSignal } from './captureParser';

const directory = new URL('../../../../datasets/category-purpose-v2/', import.meta.url);
const categoryTrainingExamples = corpus.examples;
const read = (name: string) => readFileSync(new URL(name, directory), 'utf8');
const examples = (name: string): CategoryExample[] => read(name).trim().split('\n').map(line => JSON.parse(line));

describe('bundled category-purpose-v2 provenance and validation', () => {
  it.each([
    ['Aranya restaurant cafe', 'food'],
    ['Pallav medical pharmacy', 'healthcare'],
    ['Neel university tuition', 'education'],
  ])('uses the trained category weights in the real capture parser: %s', (name, category) => {
    const parsed = parseCapturedSignal({ source: 'sms', body: `Rs 900 paid to ${name} via UPI on 30/09/2026. UPI Ref 123456789012.`, receivedAt: '2026-09-30T10:00:00Z' });
    expect(parsed.category).toBe(category);
    expect(parsed.reliableCategory).toBe(true);
    expect(parsed.reason).toBe('matched offline category model');
  });
  it('loads exact reproducible trained weights, rather than training a different model at runtime', () => {
    const trained = trainCategoryModel(categoryTrainingExamples);
    expect(weights.labels).toEqual(trained.labels);
    expect(weights.counts).toEqual(trained.counts);
    expect(weights.totals).toEqual(trained.totals);
    expect(weights.vocabulary).toEqual([...trained.vocabulary].sort());
    expect(weights.trainSha256).toBe(createHash('sha256').update(read('train.jsonl')).digest('hex'));
  });
  it('keeps exact entities/text out of the training split for 324 synthetic holdouts', () => {
    const training = new Set(categoryTrainingExamples.map(row => row.text.toLowerCase()));
    const holdout = [...examples('validation.jsonl'), ...examples('test.jsonl')];
    expect(holdout).toHaveLength(324);
    for (const row of holdout) {
      expect(training.has(row.text.toLowerCase())).toBe(false);
      expect(predictCategory(row.text), row.text).toBe(row.label);
    }
  });
  it('abstains on names, neutral business words and unknown payments', () => {
    const negative: string[] = JSON.parse(read('negative.json'));
    for (const text of negative) {
      expect(predictCategory(text), text).toBeUndefined();
      expect(classifyCounterpartyCategory(text).reliable, text).toBe(false);
    }
  });
  it('preserves combining marks and does not claim general multilingual auto-post reliability', () => {
    expect(categoryTokens('समीर पाटील')).toEqual(['समीर', 'पाटील']);
    expect(predictCategory('नया स्कूल ट्यूशन शिक्षा')).toBe('education');
    expect(classifyCounterpartyCategory('नया स्कूल ट्यूशन शिक्षा').reliable).toBe(false);
    expect(predictCategory('Fresh Enterprises')).toBeUndefined();
    expect(predictCategory('Reliance Fresh Bangalore')).toBeUndefined();
  });
  it.each(['Aranya Cafe Medical', 'Setu Amazon Gift', 'Pallav Swiggy Instamart', 'Maple Railway Rental', 'Avani Wellness Spa'])('keeps conflicting or mixed purposes review-only: %s', text => {
    expect(classifyCounterpartyCategory(text).reliable).toBe(false);
  });
});
