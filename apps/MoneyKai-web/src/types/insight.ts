export type InsightTone = 'info' | 'warning' | 'success';

export type InsightEvidenceCode =
  | 'total_spent'
  | 'total_income'
  | 'previous_month_spent'
  | 'category_totals'
  | 'monthly_allowance'
  | 'period_progress'
  | 'target_savings'
  | 'emergency_mode';

export interface InsightProvenance {
  source: 'reviewed_transactions' | 'budget_settings' | 'submitted_aggregate' | 'deterministic_rule';
  evidenceCode: InsightEvidenceCode;
  period: string;
  recordCount?: number | null;
  ruleId?: string | null;
}

export interface InsightAction {
  label: string;
  href: '/budgets' | '/reports' | '/transactions' | '/savings' | '/review';
}

export interface GuardedInsightCard {
  id: string;
  tone: InsightTone;
  title: string;
  body: string;
  actionLabel?: string | null;
  metricLabel?: string | null;
  metricValue?: string | null;
  caveat: string;
  provenance: InsightProvenance[];
  actions: InsightAction[];
  generatedBy: 'deterministic' | 'ai';
}

const ALLOWED_INSIGHT_HREFS = new Set(['/budgets', '/reports', '/transactions', '/savings', '/review']);
const ALLOWED_GENERATORS = new Set(['deterministic', 'ai']);
const ALLOWED_TONES = new Set(['info', 'warning', 'success']);
const ALLOWED_PROVENANCE_SOURCES = new Set(['reviewed_transactions', 'budget_settings', 'submitted_aggregate', 'deterministic_rule']);
const ALLOWED_EVIDENCE_CODES = new Set<InsightEvidenceCode>([
  'total_spent',
  'total_income',
  'previous_month_spent',
  'category_totals',
  'monthly_allowance',
  'period_progress',
  'target_savings',
  'emergency_mode',
]);
const PERIOD_PATTERN = /^\d{4}-\d{2}(?:-\d{2})?$/;

export const isRenderableInsightCard = (value: unknown): value is GuardedInsightCard => {
  if (!value || typeof value !== 'object') return false;
  const card = value as Partial<GuardedInsightCard>;
  if (
    typeof card.id !== 'string'
    || card.id.trim().length === 0
    || typeof card.tone !== 'string'
    || !ALLOWED_TONES.has(card.tone)
    || typeof card.title !== 'string'
    || card.title.trim().length === 0
    || typeof card.body !== 'string'
    || card.body.trim().length === 0
    || typeof card.caveat !== 'string'
    || typeof card.generatedBy !== 'string'
    || !ALLOWED_GENERATORS.has(card.generatedBy)
    || !Array.isArray(card.provenance)
    || !Array.isArray(card.actions)
  ) return false;

  return card.caveat.trim().length > 0
    && card.provenance.length > 0
    && card.provenance.every((item) => (
      !!item
      && typeof item.source === 'string'
      && ALLOWED_PROVENANCE_SOURCES.has(item.source)
      && typeof item.period === 'string'
      && PERIOD_PATTERN.test(item.period)
      && typeof item.evidenceCode === 'string'
      && ALLOWED_EVIDENCE_CODES.has(item.evidenceCode as InsightEvidenceCode)
      && (card.generatedBy !== 'deterministic' || (typeof item.ruleId === 'string' && item.ruleId.endsWith('.v1')))
    ))
    && card.actions.every((action) => (
      !!action
      && typeof action.label === 'string'
      && action.label.trim().length > 0
      && typeof action.href === 'string'
      && ALLOWED_INSIGHT_HREFS.has(action.href)
    ))
    && (card.generatedBy === 'deterministic' || (!card.metricLabel && !card.metricValue));
};
