import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rules = await readFile(path.join(root, 'firestore.backend-authority.rules'), 'utf8');
const migratedCollections = [
  'transactions',
  'notes',
  'savings',
  'badges',
  'notifications',
  'groups',
  'settings',
  'budgets',
  'backups',
  'linkedAccounts',
];

for (const collection of migratedCollections) {
  if (!rules.includes(`match /${collection}/`)) {
    throw new Error(`Staged authority rules omit ${collection}.`);
  }
}

if (/allow\s+(?:read,\s*)?write\s*:\s*if\s+isOwner/.test(rules)) {
  throw new Error('Staged authority rules still permit owner-scoped direct writes.');
}

const denyCount = rules.match(/allow write: if false;/g)?.length ?? 0;
if (denyCount < migratedCollections.length) {
  throw new Error('Staged authority rules do not deny every migrated client-write surface.');
}

console.log(`Verified backend-only client-write policy for ${migratedCollections.length} migrated surfaces.`);
