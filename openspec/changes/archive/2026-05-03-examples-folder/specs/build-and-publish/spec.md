## MODIFIED Requirements

### Requirement: Internal tests run without a prior build step

The development test suite (`vitest run`) SHALL resolve `@grammyjs/testing` to the TypeScript source (`src/index.ts`) rather than the built `dist/`, so that tests can be run without running `npm run build` first. This resolution SHALL also apply to all files under `examples/` so example specs execute against live source.

#### Scenario: Tests pass with no dist/ present

- **WHEN** `dist/` does not exist and `vitest run` is executed
- **THEN** all tests pass, including `examples/**/*.spec.ts`
- **AND** no module-not-found errors occur

#### Scenario: Examples resolve @grammyjs/testing to source

- **WHEN** `vitest run` is executed with `dist/` absent
- **THEN** `import { prepareBot } from '@grammyjs/testing'` in any example spec resolves to `src/index.ts`
- **AND** no build step is required before running examples
