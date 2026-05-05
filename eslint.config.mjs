import { defineConfig } from 'eslint/config';

import nodeConfigs from './.eslint/node.eslint.mjs';
import vitestEslint from './.eslint/vitest.eslint.mjs';

export default defineConfig([
  // Ignore generated output and tooling artifacts
  {
    name: 'Ignored paths',
    ignores: ['dist/**', 'node_modules/**', 'site/**'],
  },
  // Apply this config to js and ts files only
  {
    name: 'Source Files to scan',
    files: ['**/*.{js,mjs,cjs,ts}'],
  },
  // Node config
  ...nodeConfigs,
  // Vitest rules for testing
  ...vitestEslint,
  // Library entry points are intentional barrel files — exempt them from the no-barrel-files rule.
  {
    name: 'Library entry points',
    files: ['src/index.ts', 'src/low-level.ts'],
    rules: {
      'no-barrel-files/no-barrel-files': 'off',
    },
  },
  // This is a testing library with no application logger — prefer-logger does not apply.
  {
    name: 'Source — no custom logger requirement',
    files: ['src/**/*.ts'],
    rules: {
      'lintlord/prefer-logger': 'off',
    },
  },
]);
