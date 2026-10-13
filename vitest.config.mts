import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const desde = (p: string) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@': desde('./src'),
      // `server-only` lanza fuera de React Server Components; en tests es un no-op.
      'server-only': desde('./tests/server-only-stub.ts'),
    },
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    env: { MOCK_LATENCY_MS: '0' },
  },
});
