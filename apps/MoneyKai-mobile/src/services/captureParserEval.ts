import { CAPTURE_FIXTURES, type CaptureFixture } from '@/services/__fixtures__/captureFixtures';
import { normalizeMerchantKey, parseCapturedSignal } from '@/services/captureParser';

type EvalField = 'amount' | 'merchant' | 'type' | 'paymentMethod' | 'category' | 'ignoreReason' | 'shouldDraft';

export interface CaptureParserEvalCaseResult {
  id: string;
  label: string;
  passed: boolean;
  failures: string[];
}

export interface CaptureParserEvalMetrics {
  total: number;
  passed: number;
  failed: number;
  passRate: number;
  status: Record<string, { expected: number; actual: number; matched: number }>;
  fields: Record<EvalField, { checked: number; matched: number; rate: number }>;
  failures: CaptureParserEvalCaseResult[];
}

const EVAL_FIELDS: EvalField[] = [
  'amount',
  'merchant',
  'type',
  'paymentMethod',
  'category',
  'ignoreReason',
  'shouldDraft',
];

const emptyFieldMetrics = (): CaptureParserEvalMetrics['fields'] =>
  EVAL_FIELDS.reduce(
    (acc, field) => ({
      ...acc,
      [field]: { checked: 0, matched: 0, rate: 1 },
    }),
    {} as CaptureParserEvalMetrics['fields']
  );

const incrementStatus = (
  status: CaptureParserEvalMetrics['status'],
  key: string,
  bucket: 'expected' | 'actual' | 'matched'
) => {
  status[key] ??= { expected: 0, actual: 0, matched: 0 };
  status[key][bucket] += 1;
};

const recordField = (
  fields: CaptureParserEvalMetrics['fields'],
  field: EvalField,
  matched: boolean,
  failures: string[],
  message: string
) => {
  fields[field].checked += 1;
  if (matched) {
    fields[field].matched += 1;
  } else {
    failures.push(message);
  }
};

export const runCaptureParserEval = (fixtures: CaptureFixture[] = CAPTURE_FIXTURES): CaptureParserEvalMetrics => {
  const status: CaptureParserEvalMetrics['status'] = {};
  const fields = emptyFieldMetrics();
  const failures: CaptureParserEvalCaseResult[] = [];

  for (const fixture of fixtures) {
    const parsed = parseCapturedSignal(fixture.input);
    const caseFailures: string[] = [];

    incrementStatus(status, fixture.expected.status, 'expected');
    incrementStatus(status, parsed.parseStatus, 'actual');
    if (parsed.parseStatus === fixture.expected.status) {
      incrementStatus(status, fixture.expected.status, 'matched');
    } else {
      caseFailures.push(`status expected ${fixture.expected.status}, got ${parsed.parseStatus}`);
    }

    if (fixture.expected.amount !== undefined) {
      recordField(
        fields,
        'amount',
        parsed.amount !== undefined && Math.abs(parsed.amount - fixture.expected.amount) < 0.001,
        caseFailures,
        `amount expected ${fixture.expected.amount}, got ${parsed.amount ?? 'none'}`
      );
    }

    if (fixture.expected.merchant) {
      recordField(
        fields,
        'merchant',
        parsed.merchantKey === normalizeMerchantKey(fixture.expected.merchant),
        caseFailures,
        `merchant expected ${fixture.expected.merchant}, got ${parsed.merchantLabel ?? 'none'}`
      );
    }

    if (fixture.expected.type) {
      recordField(
        fields,
        'type',
        parsed.type === fixture.expected.type,
        caseFailures,
        `type expected ${fixture.expected.type}, got ${parsed.type ?? 'none'}`
      );
    }

    if (fixture.expected.paymentMethod) {
      recordField(
        fields,
        'paymentMethod',
        parsed.paymentMethod === fixture.expected.paymentMethod,
        caseFailures,
        `paymentMethod expected ${fixture.expected.paymentMethod}, got ${parsed.paymentMethod ?? 'none'}`
      );
    }

    if (fixture.expected.category) {
      recordField(
        fields,
        'category',
        parsed.category === fixture.expected.category,
        caseFailures,
        `category expected ${fixture.expected.category}, got ${parsed.category ?? 'none'}`
      );
    }

    if (fixture.expected.ignoreReasonIncludes) {
      recordField(
        fields,
        'ignoreReason',
        Boolean(parsed.ignoreReason?.toLowerCase().includes(fixture.expected.ignoreReasonIncludes)),
        caseFailures,
        `ignoreReason expected to include ${fixture.expected.ignoreReasonIncludes}, got ${parsed.ignoreReason ?? 'none'}`
      );
    }

    recordField(
      fields,
      'shouldDraft',
      (parsed.parseStatus !== 'ignore') === fixture.expected.shouldDraft,
      caseFailures,
      `shouldDraft expected ${fixture.expected.shouldDraft}, got ${parsed.parseStatus !== 'ignore'}`
    );

    if (caseFailures.length > 0) {
      failures.push({
        id: fixture.id,
        label: fixture.label,
        passed: false,
        failures: caseFailures,
      });
    }
  }

  for (const field of EVAL_FIELDS) {
    fields[field].rate = fields[field].checked > 0 ? fields[field].matched / fields[field].checked : 1;
  }

  const total = fixtures.length;
  const failed = failures.length;
  const passed = total - failed;

  return {
    total,
    passed,
    failed,
    passRate: total > 0 ? passed / total : 1,
    status,
    fields,
    failures,
  };
};
