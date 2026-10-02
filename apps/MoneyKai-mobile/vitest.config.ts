import { configDefaults, defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    tsconfigPaths: true,
  },
  test: {
    environment: 'node',
    maxWorkers: 4,
    exclude: [...configDefaults.exclude, 'scripts/verify-production-firebase-config.test.mjs'],
  },
});
