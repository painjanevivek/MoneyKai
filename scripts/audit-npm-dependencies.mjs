import { execFileSync } from 'node:child_process';
import { appendFileSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import process from 'node:process';

const SEVERITIES = ['critical', 'high', 'moderate', 'low', 'info'];
const SEVERITY_RANK = Object.fromEntries(SEVERITIES.map((severity, index) => [severity, SEVERITIES.length - index]));
const DEFAULT_POLICY_PATH = resolve('config/security/npm-audit-exceptions.json');

function runNpmAudit() {
  const npmArguments = ['audit', '--json'];
  const useNpmCliEntrypoint = process.platform === 'win32' && process.env.npm_execpath;
  const command = useNpmCliEntrypoint ? process.execPath : process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const commandArguments = useNpmCliEntrypoint ? [process.env.npm_execpath, ...npmArguments] : npmArguments;

  try {
    return execFileSync(command, commandArguments, {
      encoding: 'utf8',
      maxBuffer: 20 * 1024 * 1024,
      shell: process.platform === 'win32' && !useNpmCliEntrypoint,
      timeout: 120_000,
    });
  } catch (error) {
    if (typeof error.stdout === 'string' && error.stdout.trim()) return error.stdout;
    throw new Error(`npm audit could not complete: ${error.message}`);
  }
}

function countVulnerabilities(report) {
  const metadata = report.metadata?.vulnerabilities;
  if (metadata) return Object.fromEntries(SEVERITIES.map((severity) => [severity, metadata[severity] ?? 0]));

  return Object.values(report.vulnerabilities ?? {}).reduce(
    (counts, vulnerability) => {
      const severity = vulnerability.severity;
      if (SEVERITIES.includes(severity)) counts[severity] += 1;
      return counts;
    },
    Object.fromEntries(SEVERITIES.map((severity) => [severity, 0])),
  );
}

function ensureCompleteReport(report) {
  if (report.error) {
    const description = report.error.summary ?? report.error.message ?? report.error.code ?? JSON.stringify(report.error);
    throw new Error(`npm audit returned an incomplete report: ${description}`);
  }
  if (!report.metadata?.vulnerabilities && !report.vulnerabilities) {
    throw new Error('npm audit returned no vulnerability metadata.');
  }
}

function validateException(exception) {
  const requiredStrings = ['id', 'scope', 'owner', 'review_by', 'maximum_severity', 'removal_condition'];
  for (const field of requiredStrings) {
    if (typeof exception[field] !== 'string' || !exception[field].trim()) {
      throw new Error(`Audit exception is missing a valid ${field}.`);
    }
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(exception.review_by)) {
    throw new Error(`Audit exception ${exception.id} has an invalid review_by date.`);
  }
  if (!SEVERITY_RANK[exception.maximum_severity]) {
    throw new Error(`Audit exception ${exception.id} has an invalid maximum_severity.`);
  }
  if (!Array.isArray(exception.packages) || exception.packages.length === 0) {
    throw new Error(`Audit exception ${exception.id} must name at least one package.`);
  }
  if (!Array.isArray(exception.compensating_controls) || exception.compensating_controls.length === 0) {
    throw new Error(`Audit exception ${exception.id} must document compensating controls.`);
  }
}

export function evaluateAuditReport(report, policy, today = new Date().toISOString().slice(0, 10)) {
  ensureCompleteReport(report);
  if (policy.version !== 1 || !Array.isArray(policy.exceptions)) {
    throw new Error('Unsupported or incomplete npm audit exception policy.');
  }

  const exceptionByPackage = new Map();
  for (const exception of policy.exceptions) {
    validateException(exception);
    for (const packageName of exception.packages) {
      if (exceptionByPackage.has(packageName)) {
        throw new Error(`Package ${packageName} is covered by more than one audit exception.`);
      }
      exceptionByPackage.set(packageName, exception);
    }
  }

  const highRisk = Object.entries(report.vulnerabilities ?? {})
    .filter(([, vulnerability]) => ['critical', 'high'].includes(vulnerability.severity))
    .sort(([left], [right]) => left.localeCompare(right));
  const violations = [];
  const accepted = [];
  const observedExceptionPackages = new Set();

  for (const [packageName, vulnerability] of highRisk) {
    const exception = exceptionByPackage.get(packageName);
    if (!exception) {
      violations.push(`${vulnerability.severity}: ${packageName} has no documented exception`);
      continue;
    }

    observedExceptionPackages.add(packageName);
    if (today > exception.review_by) {
      violations.push(`${vulnerability.severity}: ${packageName} exception ${exception.id} expired ${exception.review_by}`);
      continue;
    }
    if (SEVERITY_RANK[vulnerability.severity] > SEVERITY_RANK[exception.maximum_severity]) {
      violations.push(`${vulnerability.severity}: ${packageName} exceeds exception ${exception.id} maximum ${exception.maximum_severity}`);
      continue;
    }
    accepted.push({ packageName, severity: vulnerability.severity, exception });
  }

  for (const packageName of exceptionByPackage.keys()) {
    if (!observedExceptionPackages.has(packageName)) {
      violations.push(`stale exception: ${packageName} is no longer reported and must be removed`);
    }
  }

  return { counts: countVulnerabilities(report), highRisk, accepted, violations };
}

function writeSummary(lines) {
  const output = `${lines.join('\n')}\n`;
  console.log(output);
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, output);
}

function main() {
  try {
    const report = JSON.parse(runNpmAudit());
    const policy = JSON.parse(readFileSync(DEFAULT_POLICY_PATH, 'utf8'));
    const result = evaluateAuditReport(report, policy);
    const acceptedPackages = result.accepted.map(
      ({ packageName, severity, exception }) => `- ${severity}: ${packageName} (${exception.id}, review by ${exception.review_by})`,
    );

    writeSummary([
      '## npm dependency audit',
      `- Critical: ${result.counts.critical}`,
      `- High: ${result.counts.high}`,
      `- Moderate: ${result.counts.moderate}`,
      `- Low: ${result.counts.low}`,
      `- Info: ${result.counts.info}`,
      `- Policy violations: ${result.violations.length}`,
      ...(acceptedPackages.length ? ['', '### Time-bounded exceptions', ...acceptedPackages] : []),
      ...(result.violations.length ? ['', '### Blocking violations', ...result.violations.map((item) => `- ${item}`)] : []),
    ]);

    if (result.violations.length) process.exit(1);
  } catch (error) {
    console.error(`npm dependency audit failed: ${error.message}`);
    process.exit(1);
  }
}

const invokedPath = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : null;
if (invokedPath === import.meta.url) main();
