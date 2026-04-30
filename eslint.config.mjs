import { defineConfig } from 'eslint/config';

import nodeConfigs from './.eslint/node.eslint.mjs';
import vitestEslint from './.eslint/vitest.eslint.mjs';

export default defineConfig([
  // Ignore generated output and tooling artifacts
  {
    name: 'Ignored paths',
    ignores: ['dist/**', 'node_modules/**'],
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
  // Plugin source overrides — relax rules that fight library-author
  // patterns (typed overloads, Telegram payload field names, JSDoc
  // already covered by spec/design artifacts)
  {
    name: 'Plugin source overrides',
    files: ['src/**/*.ts'],
    rules: {
      'jsdoc/require-jsdoc': 'off',
      'jsdoc/require-description': 'off',
      'jsdoc/require-returns': 'off',
      'jsdoc/require-param-description': 'off',
      'jsdoc/require-returns-description': 'off',
      'jsdoc/empty-tags': 'off',
      'jsdoc/valid-types': 'off',
      '@typescript-eslint/no-unnecessary-type-parameters': 'off',
      '@typescript-eslint/naming-convention': 'off',
      '@typescript-eslint/no-redundant-type-constituents': 'off',
      '@typescript-eslint/no-unnecessary-condition': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/restrict-template-expressions': 'off',
      '@typescript-eslint/consistent-type-imports': 'off',
      'n/no-unsupported-features/es-syntax': 'off',
      'unicorn/prevent-abbreviations': 'off',
      'no-plusplus': 'off',
      'no-use-before-define': 'off',
      'no-barrel-files/no-barrel-files': 'off',
      camelcase: 'off',
    },
  },
  // Test overrides — testing framework specs have intentional idioms
  // (try/catch, Bot instances with single-letter names, void for
  // fire-and-forget, snake_case for Telegram payload fields).
  {
    name: 'Test overrides',
    files: ['tests/**/*.ts'],
    rules: {
      '@typescript-eslint/naming-convention': 'off',
      '@typescript-eslint/no-misused-promises': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-unnecessary-condition': 'off',
      '@typescript-eslint/no-unnecessary-type-assertion': 'off',
      '@typescript-eslint/no-redundant-type-constituents': 'off',
      'unicorn/prevent-abbreviations': 'off',
      'unicorn/consistent-function-scoping': 'off',
      'no-void': 'off',
      'sonarjs/void-use': 'off',
      'sonarjs/class-name': 'off',
      'sonarjs/assertions-in-tests': 'off',
      camelcase: 'off',
      'vitest/no-conditional-expect': 'off',
      'lintlord/no-inline-interface-object-types': 'off',
      'prefer-template': 'off',
      '@stylistic/padding-line-between-statements': 'off',
      'security/detect-object-injection': 'off',
    },
  },
]);
