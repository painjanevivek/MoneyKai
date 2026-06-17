import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '..');
const iconName = 'MaterialCommunityIcons';
const importPattern = /import\s+\{\s*MaterialCommunityIcons\s*\}\s+from\s+['"]@expo\/vector-icons['"]/;
const failures = [];

const guardedFiles = [
  'apps/MoneyKai-web/src/app/(auth)/login.tsx',
];

for (const file of guardedFiles) {
  const source = readFileSync(path.join(repoRoot, file), 'utf8');
  const nonImportMentions = source
    .split(/\r?\n/)
    .some((line) => line.includes(iconName) && !line.includes("from '@expo/vector-icons'") && !line.includes('from "@expo/vector-icons"'));

  if (nonImportMentions && !importPattern.test(source)) {
    failures.push(file);
  }
}

if (failures.length > 0) {
  console.error(`${iconName} is used without importing it from @expo/vector-icons:`);
  for (const file of failures) {
    console.error(`- ${file}`);
  }
  process.exit(1);
}

console.log('web icon import guard ok');
