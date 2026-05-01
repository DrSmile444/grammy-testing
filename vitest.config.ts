import path from 'node:path';

import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
    alias: {
      '@grammyjs/testing/low-level': path.resolve('./src/low-level.ts'),
      '@grammyjs/testing': path.resolve('./src/index.ts'),
    },
  },
  test: {
    globals: true,
    root: './',
    environment: 'node',
    include: ['**/*.spec.ts', '**/*.test.ts'],
    exclude: ['node_modules', 'dist'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.spec.ts',
        '**/*.test.ts',
        '**/*.interface.ts',
        '**/*.dto.ts',
        '**/*.entity.ts',
        '**/main.ts',
      ],
    },
    setupFiles: ['./tests/setup.ts'],
  },
});
