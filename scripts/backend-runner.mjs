import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const mode = process.argv[2] ?? 'dev';

const isBackendDir = (directory) =>
  fs.existsSync(path.join(directory, 'requirements.txt')) &&
  fs.existsSync(path.join(directory, 'app', 'main.py'));

const resolveBackendDir = () => {
  const candidates = [
    process.env.MONEYKAI_BACKEND_DIR,
    path.resolve(root, '..', 'MoneyKai-backend'),
    path.join(root, 'backend'),
  ].filter(Boolean);

  return candidates.find(isBackendDir) ?? null;
};

const backendDir = resolveBackendDir();

if (!backendDir) {
  console.error(
    'Unable to find the MoneyKai backend repository. Set MONEYKAI_BACKEND_DIR or create ../MoneyKai-backend.'
  );
  process.exit(1);
}

const commands = {
  dev: ['-m', 'uvicorn', 'app.main:app', '--reload', '--port', '8000'],
  test: ['-m', 'pytest', 'tests'],
  compile: ['-m', 'compileall', 'app', 'tests'],
};

const args = commands[mode];

if (!args) {
  console.error(`Unknown backend mode: ${mode}`);
  process.exit(1);
}

const pythonCandidates = [
  { command: path.join(backendDir, '.venv', 'Scripts', 'python.exe'), args: [] },
  { command: path.join(root, '.venv', 'Scripts', 'python.exe'), args: [] },
  { command: 'python', args: [] },
  { command: 'py', args: ['-3.12'] },
];

for (const candidate of pythonCandidates) {
  const isFileCandidate = candidate.command.endsWith('.exe');
  if (isFileCandidate && !fs.existsSync(candidate.command)) {
    continue;
  }

  const result = spawnSync(candidate.command, [...candidate.args, ...args], {
    cwd: backendDir,
    stdio: 'inherit',
  });

  if (result.error && result.error.code === 'ENOENT') {
    continue;
  }

  process.exit(result.status ?? 1);
}

console.error('Unable to find a usable Python interpreter for the MoneyKai backend.');
process.exit(1);
