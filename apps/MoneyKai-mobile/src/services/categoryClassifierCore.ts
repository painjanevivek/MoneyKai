export type CategoryExample = { label: string; text: string };
export type CategoryModel = { labels: string[]; vocabulary: Set<string>; counts: Record<string, Record<string, number>>; totals: Record<string, number> };
export const categoryTokens = (text: string) => [...new Set(text.normalize('NFC').toLowerCase().match(/[\p{L}\p{M}\p{N}]+/gu) ?? [])];
export const genericTokens = new Set(['payment', 'paid', 'pay', 'fee', 'fees', 'service', 'services', 'store', 'shop', 'company', 'limited', 'pvt', 'ltd', 'enterprise', 'enterprises', 'fresh', 'new', 'city', 'home', 'digital', 'general']);

/** Small multinomial Naive Bayes model, trained locally from inspectable labels. No I/O. */
export function trainCategoryModel(examples: CategoryExample[]): CategoryModel {
  const labels = [...new Set(examples.map((item) => item.label))].sort();
  const counts: CategoryModel['counts'] = Object.fromEntries(labels.map((label) => [label, {}]));
  const totals: Record<string, number> = Object.fromEntries(labels.map((label) => [label, 0]));
  const vocabulary = new Set<string>();
  for (const example of examples) for (const token of categoryTokens(example.text)) {
    vocabulary.add(token);
    counts[example.label][token] = (counts[example.label][token] ?? 0) + 1;
    totals[example.label] += 1;
  }
  return { labels, counts, totals, vocabulary };
}


export function predictCategory(text: string, model: CategoryModel): string | undefined {
  const tokens = categoryTokens(text).filter((token) => {
    if (!model.vocabulary.has(token) || genericTokens.has(token)) return false;
    // Neutral business-name words shared by classes are not evidence of spending purpose.
    const frequencies = model.labels.map(label => model.counts[label][token] ?? 0).sort((a, b) => b - a);
    // Shared brand tokens (e.g. Reliance retail vs digital) cannot establish purpose.
    return frequencies[1] === 0 || (frequencies[0] + 1) / ((frequencies[1] ?? 0) + 1) >= 3;
  });
  if (!tokens.length) return undefined; // Never guess a category for an unseen person's name.
  const scores = model.labels.map((label) => ({ label, score: tokens.reduce((sum, token) =>
    // Purpose-bearing descriptors have twice the weight of incidental business-name tokens.
    sum + (Object.values(anchors).some((pattern) => pattern.test(token)) ? 2 : 1) * Math.log(((model.counts[label][token] ?? 0) + 1) / (model.totals[label] + model.vocabulary.size)), 0) }))
    .sort((a, b) => b.score - a.score);
  // This margin is an abstention rule, NOT a calibrated probability of correctness.
  return scores[0] && scores[1] && scores[0].score - scores[1].score >= Math.log(1.5) ? scores[0].label : undefined;
}

export const anchors: Record<string, RegExp> = {
  food: /\b(?:swiggy|zomato|dominos|kfc|mcdonalds|starbucks|pizza|restaurant|cafe|bakery|canteen)\b/i,
  healthcare: /\b(?:pharmacy|medico|medical|hospital|clinic|medicines?|netmeds|pharmeasy|diagnostic)\b/i,
  shopping: /\b(?:amazon|flipkart|myntra|supermarket|groceries|grocery|apparel|footwear|dmart)\b/i,
  electronics: /\b(?:electronics|laptop|computer|appliances|croma|handset)\b/i,
  transport: /\b(?:uber|ola|taxi|metro|petrol|diesel|fuel|railway|rapido|toll|parking)\b/i,
  bills: /\b(?:recharge|electricity|broadband|utility)\b/i,
  education: /\b(?:school|college|university|tuition|udemy|coursera)\b/i,
  entertainment: /\b(?:netflix|spotify|bookmyshow|cinema|theatre|hotstar)\b/i,
  rent: /\b(?:rent|rental|landlord)\b/i,
};
