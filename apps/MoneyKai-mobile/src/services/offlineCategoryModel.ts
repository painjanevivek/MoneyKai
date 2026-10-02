import weights from './models/categoryModelV2.json';
import { anchors, predictCategory as predict, type CategoryModel } from './categoryClassifierCore';
export { categoryTokens, trainCategoryModel } from './categoryClassifierCore';
export type { CategoryModel, CategoryExample } from './categoryClassifierCore';

export const categoryModelVersion = weights.version;
const bundledModel: CategoryModel = { labels: weights.labels, counts: weights.counts, totals: weights.totals, vocabulary: new Set(weights.vocabulary) };
/** Pretrained, inspectable local weights. No network, customer-SMS training, or runtime retraining. */
export function predictCategory(text: string, model = bundledModel): string | undefined {
  return predict(text, model);
}

export function classifyCounterpartyCategory(name: string) {
  const category = predictCategory(name);
  const matches = Object.entries(anchors).filter(([, pattern]) => pattern.test(name)).map(([label]) => label);
  // Mixed-use delivery, wellness/spas, ambiguous descriptors and conflicting purposes need review.
  const ambiguous = /\b(?:instamart|blinkit|zepto|big\s*basket|wellness|spa|gift|transfer)\b/i.test(name);
  return { category, reliable: Boolean(category && !ambiguous && matches.length === 1 && matches[0] === category) };
}
