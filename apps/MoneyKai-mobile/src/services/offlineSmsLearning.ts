/** Diagnostic-only local classifier training. No I/O, uploads, or ledger posting. */
import { offlineSmsMessageFeatures, predictOfflineSms, type CrfWeights, type OfflineSmsModel } from './offlineSmsEngine';

export const CORE_FIELDS = ['message_type', 'amount', 'direction', 'currency', 'transaction_date'] as const;
export type CoreLabels = Record<typeof CORE_FIELDS[number], string | null>;
export interface ReviewedSms { id: string; body: string; labels: CoreLabels }
export interface LocalEvaluation {
  training: number; heldout: number; trainingGroups: number; heldoutGroups: number;
  baselineErrors: number; candidateErrors: number; improvements: number; regressions: number;
  fieldErrors: Record<string, number>; diagnosticImprovement: boolean;
}
const TYPES = ['transaction', 'reminder', 'promotion', 'other'];

export function validateCoreLabels(labels: CoreLabels): CoreLabels {
  if (!TYPES.includes(labels.message_type ?? '')) throw new Error('Choose the actual message type.');
  if (labels.message_type !== 'transaction') return {
    message_type: labels.message_type, amount: null, direction: null, currency: null, transaction_date: null,
  };
  if (!['debit', 'credit'].includes(labels.direction ?? '')) throw new Error('Choose debit or credit.');
  const money = /^(\d+)(?:\.(\d{1,2}))?$/.exec((labels.amount ?? '').trim());
  if (!money) throw new Error('Enter the transaction amount, with at most two decimal places.');
  const amount = `${money[1].replace(/^0+(?=\d)/, '')}.${(money[2] ?? '').padEnd(2, '0')}`;
  if (amount === '0.00') throw new Error('Transaction amount must be positive.');
  const currency = (labels.currency ?? '').trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(currency)) throw new Error('Enter the three-letter currency code.');
  const date = labels.transaction_date?.trim() || null;
  if (date && (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date)) ||
    new Date(date).toISOString().slice(0, 10) !== date)) throw new Error('Use a valid YYYY-MM-DD date or leave it empty.');
  return { message_type: 'transaction', amount, direction: labels.direction, currency, transaction_date: date };
}

// Retain structural/action words, mask entities, dates, accounts and amounts.
// This deliberately over-groups similar messages rather than splitting duplicates.
const STRUCTURAL = new Set(('a an the your you account ac a/c card bank rs inr upi on at by to from for of with via ' +
  'is has have been was debited credited debit credit spent paid received withdrawn deducted purchase refund cashback ' +
  'balance bal avl available ref reference txn transaction payment transferred sent transfer due bill minimum ' +
  'otp failed declined pending initiated reversal reversed cancelled requested request limit statement reminder ' +
  'towards using through successful successfully not will be no').split(' '));
export function reviewTemplateGroup(body: string): string {
  return body.toLowerCase().replace(/\d{1,4}[/-]\d{1,2}[/-]\d{1,4}/g, ' <date> ')
    .replace(/[\w.+-]+@[\w.-]+/g, ' <entity> ').replace(/[x*]+\d+/g, ' <entity> ')
    .replace(/\d[\d,.]*/g, ' <number> ').match(/<[^>]+>|[a-z/]+|₹/g)
    ?.map(w => w.startsWith('<') || STRUCTURAL.has(w) || w === '₹' ? w : '<entity>')
    .join(' ').replace(/(?:<entity>\s*)+/g, '<entity> ').trim() ?? '';
}
export function reviewPartition(body: string): 'train' | 'heldout' {
  let hash = 2166136261;
  for (const char of reviewTemplateGroup(body)) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return (hash >>> 0) % 5 === 0 ? 'heldout' : 'train';
}
export function coreErrors(target: Record<string, string | null>, labels: CoreLabels): string[] {
  return CORE_FIELDS.filter(field => {
    const actual = field !== 'message_type' && target.message_type !== 'transaction' ? null : target[field] ?? null;
    return actual !== labels[field];
  });
}
function softmax(values: number[]): number[] {
  const max = Math.max(...values), weights = values.map(v => Math.exp(v - max));
  const sum = weights.reduce((a, b) => a + b, 0);
  return weights.map(w => w / sum);
}
function adapt(weights: CrfWeights, rows: ReviewedSms[], key: 'message_type' | 'direction'): void {
  const encoded = rows.map(row => ({ features: offlineSmsMessageFeatures(row.body),
    label: row.labels[key] ?? 'none' }));
  for (const row of encoded) if (!weights.labels.includes(row.label)) {
    weights.labels.push(row.label);
    weights.transitions.forEach(values => values.push(0));
    weights.transitions.push(Array(weights.labels.length).fill(0));
  }
  const anchor = JSON.parse(JSON.stringify(weights.features)) as CrfWeights['features'];
  for (let epoch = 0; epoch < 40; epoch++) for (const row of encoded) {
    const scores = Array<number>(weights.labels.length).fill(0);
    for (const feature of row.features) for (const [label, weight] of weights.features[feature] ?? []) scores[label] += weight;
    const probabilities = softmax(scores);
    const truth = weights.labels.indexOf(row.label);
    for (const feature of row.features) {
      const current = new Map(weights.features[feature] ?? []);
      const original = new Map(anchor[feature] ?? []);
      weights.features[feature] = weights.labels.map((_, label) => [label, (current.get(label) ?? 0) +
        0.025 * ((label === truth ? 1 : 0) - probabilities[label] -
          0.01 * ((current.get(label) ?? 0) - (original.get(label) ?? 0))) ]);
    }
  }
}

export function trainLocalSmsCandidate(base: OfflineSmsModel, input: ReviewedSms[]): {
  model: OfflineSmsModel; evaluation: LocalEvaluation;
} {
  if (input.length > 500) throw new Error('Review limit reached.');
  const rows = input.map(row => {
    if (!row.id || !offlineSmsMessageFeatures(row.body).length) throw new Error('Invalid reviewed SMS.');
    return { ...row, labels: validateCoreLabels(row.labels) };
  });
  if (new Set(rows.map(row => row.id)).size !== rows.length) throw new Error('Duplicate review IDs.');
  // Held-out labels are never passed to adapt(). Partition is determined before training.
  const training = rows.filter(row => reviewPartition(row.body) === 'train');
  const heldout = rows.filter(row => reviewPartition(row.body) === 'heldout');
  const trainingGroups = new Set(training.map(row => reviewTemplateGroup(row.body))).size;
  const heldoutGroups = new Set(heldout.map(row => reviewTemplateGroup(row.body))).size;
  if (training.length < 20 || heldout.length < 5 || trainingGroups < 2 || heldoutGroups < 2) {
    throw new Error(`Need 20 training reviews and 5 held-out reviews across at least two template groups each. Have ${training.length} / ${heldout.length}.`);
  }
  const model = JSON.parse(JSON.stringify(base)) as OfflineSmsModel;
  model.release_enabled = false;
  adapt(model.classifiers.message_type, training, 'message_type');
  adapt(model.classifiers.direction, training, 'direction');
  const evaluation: LocalEvaluation = { training: training.length, heldout: heldout.length,
    trainingGroups, heldoutGroups, baselineErrors: 0, candidateErrors: 0, improvements: 0, regressions: 0,
    fieldErrors: Object.fromEntries(CORE_FIELDS.map(f => [f, 0])), diagnosticImprovement: false };
  for (const row of heldout) {
    const before = coreErrors(predictOfflineSms(base, row.body).target, row.labels);
    const after = coreErrors(predictOfflineSms(model, row.body).target, row.labels);
    evaluation.baselineErrors += Number(before.length > 0);
    evaluation.candidateErrors += Number(after.length > 0);
    // Reject even a new field regression in an already-incorrect record.
    evaluation.regressions += Number(after.some(field => !before.includes(field)));
    evaluation.improvements += Number(before.length > 0 && after.length === 0);
    for (const field of after) evaluation.fieldErrors[field]++;
  }
  evaluation.diagnosticImprovement = evaluation.candidateErrors < evaluation.baselineErrors && evaluation.regressions === 0;
  return { model, evaluation }; // Never changes the live parser or production eligibility.
}
