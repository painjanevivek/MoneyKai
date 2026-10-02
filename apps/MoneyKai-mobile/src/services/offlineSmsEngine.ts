/** Pure, bounded CRF inference. No network, storage, logging, or model updates. */
export interface CrfWeights {
  labels: string[];
  features: Record<string, [number, number][]>;
  transitions: number[][];
}
export interface OfflineSmsModel {
  schema_version: number;
  slots: CrfWeights;
  classifiers: Record<string, CrfWeights>;
  threshold: number;
  release_enabled: boolean;
  csv_sha256: string;
}
export interface OfflineSmsPrediction {
  target: Record<string, string | null>;
  evidence: Record<string, { start: number; end: number; text: string }>;
  score: number;
  warnings: string[];
}
const SLOTS = ['amount', 'bank', 'account_hint', 'counterparty', 'vpa', 'transaction_date',
  'reference', 'reported_balance', 'available_credit_limit', 'due_amount', 'due_date'];
const CLASSES = ['message_type', 'direction', 'event_kind', 'payment_rail'];
const MONEY = new Set(['amount', 'reported_balance', 'available_credit_limit', 'due_amount']);
const BLOCK = /\b(?:otp|one.time password|verification|failed|declined|pending|initiated|requested|request|will be|once processed|mandate|scheduled|due|reversed|reversal|cancelled)\b/i;
type Token = { text: string; start: number; end: number };

function tokenize(text: string): Token[] {
  const pattern = /\[[A-Z]+\]|UPI(?=-)|[A-Za-z0-9_+][A-Za-z0-9._+-]*@[A-Za-z0-9]+(?:[.-][A-Za-z0-9]+)*|\d{1,2}[/-]\d{1,2}[/-](?:\d{4}|\d{2})|\d[\d,]*(?:\.\d+)?|[A-Za-z_*][A-Za-z0-9_*]*|₹|[^\s]/gu;
  return Array.from(text.matchAll(pattern), m => ({ text: m[0], start: m.index, end: m.index + m[0].length }));
}
function norm(value: string): string {
  value = value.toLowerCase();
  if (/^\d{1,2}[/-]\d{1,2}[/-]\d{2,4}$/.test(value)) return '<date>';
  if (value.includes('@')) return '<vpa>';
  if (/^[x*]+\d+$/.test(value)) return '<account>';
  if (/^\d[\d,.]*$/.test(value)) return '<number>';
  return value;
}
function features(items: Token[], i: number): string[] {
  const result = ['bias'];
  for (let delta = -2; delta <= 2; delta++) {
    const item = items[i + delta];
    result.push(`w${delta}=${item ? norm(item.text) : '<edge>'}`);
  }
  const word = items[i].text;
  result.push(`shape=${word.replace(/[a-z]/g, 'a').replace(/[A-Z]/g, 'A').replace(/\d/g, '0').slice(0, 24)}`,
    `upper=${/[A-Z]/.test(word) && !/[a-z]/.test(word)}`,
    `title=${/^[A-Z]/.test(word)}`);
  return result;
}
function messageFeatures(items: Token[]): string[] {
  const words = items.map(t => norm(t.text));
  return [...new Set(['bias', ...words.map(w => `u=${w}`),
    ...words.slice(1).map((w, i) => `b=${words[i]}|${w}`)])].sort();
}
/** Shared feature encoder for device-only classifier adaptation. Never logs text. */
export function offlineSmsMessageFeatures(text: string): string[] {
  if (!text || text.length > 4096) return [];
  const items = tokenize(text);
  return items.length && items.length <= 256 ? messageFeatures(items) : [];
}
function logsum(values: number[]): number {
  const maximum = Math.max(...values);
  return maximum + Math.log(values.reduce((s, x) => s + Math.exp(x - maximum), 0));
}
function decode(model: CrfWeights, sequence: string[][]): { labels: string[]; probabilities: number[] } {
  const n = model.labels.length;
  const emissions = sequence.map(attributes => {
    const scores = Array<number>(n).fill(0);
    for (const attribute of attributes) {
      for (const [label, weight] of model.features[attribute] ?? []) scores[label] += weight;
    }
    return scores;
  });
  if (!emissions.length) return { labels: [], probabilities: [] };
  const trans = model.transitions;
  let best = emissions[0].slice();
  const paths: number[][] = [];
  const forward = [best.slice()];
  for (const scores of emissions.slice(1)) {
    const choices = scores.map((_, b) => best.map((value, a) => value + trans[a][b]));
    const back = choices.map(xs => xs.indexOf(Math.max(...xs)));
    paths.push(back);
    best = scores.map((value, b) => value + choices[b][back[b]]);
    const previous = forward[forward.length - 1];
    forward.push(scores.map((value, b) => value + logsum(previous.map((v, a) => v + trans[a][b]))));
  }
  const ids = [best.indexOf(Math.max(...best))];
  for (const back of paths.reverse()) ids.unshift(back[ids[0]]);
  const backward = emissions.map(() => Array<number>(n).fill(0));
  for (let t = emissions.length - 2; t >= 0; t--) {
    backward[t] = model.labels.map((_, a) => logsum(model.labels.map((__, b) =>
      trans[a][b] + emissions[t + 1][b] + backward[t + 1][b])));
  }
  const partition = logsum(forward[forward.length - 1]);
  return { labels: ids.map(i => model.labels[i]),
    probabilities: ids.map((i, t) => Math.exp(forward[t][i] + backward[t][i] - partition)) };
}
function normalizedSlot(key: string, raw: string): string | null {
  if (MONEY.has(key)) {
    if (!/^\d[\d,]*(?:\.\d{1,2})?$/.test(raw)) return null;
    const [whole, fraction = ''] = raw.replace(/,/g, '').split('.');
    return `${whole.replace(/^0+(?=\d)/, '')}.${fraction.padEnd(2, '0')}`;
  }
  if (key.endsWith('date')) {
    const m = /^(\d{1,2})[/-](\d{1,2})[/-](\d{2}|\d{4})$/.exec(raw);
    if (!m) return null;
    const day = Number(m[1]), month = Number(m[2]);
    const year = Number(m[3]) + (m[3].length === 2 ? 2000 : 0);
    const d = new Date(Date.UTC(year, month - 1, day));
    if (d.getUTCFullYear() !== year || d.getUTCMonth() !== month - 1 || d.getUTCDate() !== day) return null;
    return `${year.toString().padStart(4, '0')}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  }
  return raw;
}
export function predictOfflineSms(model: OfflineSmsModel, text: string): OfflineSmsPrediction {
  const target = Object.fromEntries([...SLOTS, ...CLASSES, 'currency', 'transaction_status', 'posting_action'].map(k => [k, null])) as Record<string, string | null>;
  const evidence: OfflineSmsPrediction['evidence'] = {};
  const confidence: Record<string, number> = {};
  const errors: string[] = [];
  if (!text || text.length > 4096) return { target, evidence, score: 0, warnings: ['input_limit'] };
  const items = tokenize(text);
  if (!items.length || items.length > 256) return { target, evidence, score: 0, warnings: ['input_limit'] };
  for (const key of CLASSES) {
    const decoded = decode(model.classifiers[key], [messageFeatures(items)]);
    target[key] = decoded.labels[0] === 'none' ? null : decoded.labels[0];
    confidence[key] = decoded.probabilities[0];
  }
  const { labels, probabilities } = decode(model.slots, items.map((_, i) => features(items, i)));
  const seen: Record<string, number> = {};
  let i = 0;
  while (i < items.length) {
    if (labels[i] === 'O') { i++; continue; }
    const [prefix, key] = labels[i].split('-');
    if (prefix !== 'B') { errors.push('invalid_bio'); i++; continue; }
    let j = i + 1;
    while (j < items.length && labels[j] === `I-${key}`) j++;
    const start = items[i].start, end = items[j - 1].end;
    const raw = text.slice(start, end);
    let value = normalizedSlot(key, raw);
    seen[key] = (seen[key] ?? 0) + 1;
    if (seen[key] > 1) {
      value = null;
      delete evidence[key];
      errors.push(`duplicate_${key}`);
    } else if (value !== null) {
      // Dataset evidence uses Unicode code points, NOT JS UTF-16 indices.
      evidence[key] = { start: Array.from(text.slice(0, start)).length,
        end: Array.from(text.slice(0, end)).length, text: raw };
      confidence[key] = Math.min(...probabilities.slice(i, j));
    } else errors.push(`invalid_${key}`);
    target[key] = value;
    i = j;
  }
  if (/\b(?:Rs\.?|INR)\s*\d|₹\s*\d/i.test(text)) target.currency = 'INR';
  const transaction = target.message_type === 'transaction';
  target.transaction_status = transaction ? 'completed' : 'not_applicable';
  target.posting_action = transaction ? 'review' : 'ignore';
  if (!transaction) {
    for (const key of ['amount', 'direction', 'transaction_date']) { target[key] = null; delete evidence[key]; }
  }
  const score = transaction ? Math.min(...['message_type', 'direction', 'amount'].map(k => confidence[k] ?? 0)) : confidence.message_type ?? 0;
  if (transaction && (!target.amount || Number(target.amount) <= 0 || !['debit', 'credit'].includes(target.direction ?? '') || target.currency !== 'INR')) errors.push('missing_core_evidence');
  if (transaction && BLOCK.test(text)) errors.push('unsupported_or_noncompleted_action');
  if (transaction && !/\b(?:debited|credited|spent|paid|received|withdrawn|deducted|purchase|cashback|refund)\b/i.test(text)) errors.push('no_completed_action');
  return { target, evidence, score, warnings: [...new Set(errors)].sort() };
}

/** A review candidate is NEVER authorization to post a financial entry. */
export function getOfflineSmsDecision(model: OfflineSmsModel, result: OfflineSmsPrediction): 'review' | 'abstain' | 'ignore' {
  if (result.warnings.length || result.score < model.threshold) return 'abstain';
  return result.target.message_type === 'transaction' ? 'review' : 'ignore';
}
