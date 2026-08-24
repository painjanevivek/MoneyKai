import assert from 'node:assert/strict';
import test from 'node:test';

import { evaluateAuditReport } from './audit-npm-dependencies.mjs';

const basePolicy = {
  version: 1,
  exceptions: [{
    id: 'EX-1',
    packages: ['build-only-package'],
    scope: 'build',
    owner: 'Engineering owner',
    review_by: '2026-09-24',
    maximum_severity: 'high',
    removal_condition: 'Upgrade the parent dependency.',
    compensating_controls: ['Not present in runtime output.'],
  }],
};

function reportFor(vulnerabilities) {
  const counts = { info: 0, low: 0, moderate: 0, high: 0, critical: 0, total: 0 };
  for (const vulnerability of Object.values(vulnerabilities)) {
    counts[vulnerability.severity] += 1;
    counts.total += 1;
  }
  return { vulnerabilities, metadata: { vulnerabilities: counts } };
}

test('accepts a documented unexpired high build-time advisory', () => {
  const result = evaluateAuditReport(reportFor({ 'build-only-package': { severity: 'high' } }), basePolicy, '2026-08-24');
  assert.deepEqual(result.violations, []);
});

test('blocks an undocumented high advisory', () => {
  const result = evaluateAuditReport(
    reportFor({ 'runtime-package': { severity: 'high' }, 'build-only-package': { severity: 'high' } }),
    basePolicy,
    '2026-08-24',
  );
  assert.match(result.violations.join('\n'), /runtime-package has no documented exception/);
});

test('blocks an expired exception', () => {
  const result = evaluateAuditReport(reportFor({ 'build-only-package': { severity: 'high' } }), basePolicy, '2026-09-25');
  assert.match(result.violations.join('\n'), /expired 2026-09-24/);
});

test('blocks stale exceptions after remediation', () => {
  const result = evaluateAuditReport(reportFor({}), basePolicy, '2026-08-24');
  assert.match(result.violations.join('\n'), /stale exception/);
});

test('blocks a severity escalation beyond the accepted maximum', () => {
  const result = evaluateAuditReport(reportFor({ 'build-only-package': { severity: 'critical' } }), basePolicy, '2026-08-24');
  assert.match(result.violations.join('\n'), /exceeds exception/);
});
