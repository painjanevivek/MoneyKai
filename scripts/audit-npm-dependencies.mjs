import { execFileSync } from 'node:child_process';
import { appendFileSync } from 'node:fs';
import process from 'node:process';

const SEVERITIES = ['critical', 'high', 'moderate', 'low', 'info'];

function runNpmAudit() {
  const npmArguments = ['audit', '--json'];
  const useNpmCliEntrypoint = process.platform === 'win32' && process.env.npm_execpath;
  const command = useNpmCliEntrypoint ? process.execPath : process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const commandArguments = useNpmCliEntrypoint ? [process.env.npm_execpath, ...npmArguments] : npmArguments;

  try {
    return execFileSync(command, commandArguments, {
      encoding: 'utf8',
      maxBuffer: 10 * 1024 * 1024,
      shell: process.platform === 'win32' && !useNpmCliEntrypoint,
      timeout: 120_000,
    });
  } catch (error) {
    if (typeof error.stdout === 'string' && error.stdout.trim()) {
      return error.stdout;
    }

    throw new Error(`npm audit could not complete: ${error.message}`);
  }
}

function countVulnerabilities(report) {
  const metadata = report.metadata?.vulnerabilities;

  if (metadata) {
    return Object.fromEntries(SEVERITIES.map((severity) => [severity, metadata[severity] ?? 0]));
  }

  return Object.values(report.vulnerabilities ?? {}).reduce(
    (counts, vulnerability) => {
      const severity = vulnerability.severity;
      if (SEVERITIES.includes(severity)) {
        counts[severity] += 1;
      }
      return counts;
    },
    Object.fromEntries(SEVERITIES.map((severity) => [severity, 0])),
  );
}

function ensureCompleteReport(report) {
  const error = report.error;

  if (error) {
    const description = error.summary ?? error.message ?? error.code ?? JSON.stringify(error);
    throw new Error(`npm audit returned an incomplete report: ${description}`);
  }

  if (!report.metadata?.vulnerabilities && !report.vulnerabilities) {
    throw new Error('npm audit returned no vulnerability metadata.');
  }
}

function listHighRiskPackages(report) {
  return Object.entries(report.vulnerabilities ?? {})
    .filter(([, vulnerability]) => ['critical', 'high'].includes(vulnerability.severity))
    .map(([name, vulnerability]) => `- ${vulnerability.severity}: ${name}`)
    .sort();
}

function writeSummary(lines) {
  const output = `${lines.join('\n')}\n`;
  console.log(output);

  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, output);
  }
}

try {
  const report = JSON.parse(runNpmAudit());
  ensureCompleteReport(report);
  const counts = countVulnerabilities(report);
  const highRiskPackages = listHighRiskPackages(report);
  const highRiskTotal = counts.critical + counts.high;

  writeSummary([
    '## npm dependency audit',
    `- Critical: ${counts.critical}`,
    `- High: ${counts.high}`,
    `- Moderate: ${counts.moderate}`,
    `- Low: ${counts.low}`,
    `- Info: ${counts.info}`,
    ...(highRiskPackages.length > 0 ? ['', '### High-risk packages', ...highRiskPackages] : []),
  ]);

  if (highRiskTotal > 0) {
    console.error(
      `npm dependency audit found ${highRiskTotal} high or critical ${highRiskTotal === 1 ? 'advisory' : 'advisories'}.`,
    );
    process.exit(1);
  }
} catch (error) {
  console.error(`npm dependency audit failed: ${error.message}`);
  process.exit(1);
}
