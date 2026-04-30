## Why

The ESLint config was built with a strong set of rules intentionally, but two override blocks (`Plugin source overrides` and `Test overrides`) were added during development to silence rules rather than fix violations. This accumulates debt, defeats the purpose of the linter, and silently allows quality drift in both source and test code. JSDoc enforcement is especially important: consumers of the published npm package rely on IDE docs from `node_modules`, and suppressing JSDoc rules means that documentation is missing.

## What Changes

- Remove the `Plugin source overrides` block from `eslint.config.mjs` (covers `src/**/*.ts`)
- Remove the `Test overrides` block from `eslint.config.mjs` (covers `tests/**/*.ts`)
- Add `ctx`, `Ref`, `params`, `prop`, `args`, `cbData` to the unicorn `allowList` in `.eslint/node/unicorn.eslint.mjs` (grammy ecosystem convention)
- Add `src/index.ts` and `src/low-level.ts` to a barrel-file ignore in the no-barrel-files config (published library entry points are intentionally barrel files)
- Fix all ~455 violations surfaced by the removal across source and test files:
  - Write JSDoc for all exported and non-trivial internal functions
  - Replace `counter++` with `counter += 1`
  - Fix template literal expressions with explicit `String()` wraps where needed
  - Rename variables violating naming conventions (except grammy-ecosystem names handled by allowList)
  - Reorder functions to satisfy `no-use-before-define`
  - Replace `!` non-null assertions in tests with proper narrowing
  - Fix `vitest/no-conditional-expect` violations

## Capabilities

### New Capabilities

- `eslint-compliance`: ESLint runs clean with zero errors across all source and test files, with no override blocks suppressing rules

### Modified Capabilities

- `type-safety`: The `@typescript-eslint` rules now fully enforced; no non-null assertions remain in source

## Impact

- `eslint.config.mjs`: two blocks removed
- `.eslint/node/unicorn.eslint.mjs`: allowList extended
- `.eslint/node/no-barrel-files.eslint.mjs`: entry-point files ignored
- All `src/**/*.ts` files: JSDoc added, naming/style fixes applied
- All `tests/**/*.ts` files: non-null assertions replaced, naming aligned
- No behavior changes; this is a pure code-quality and documentation pass
