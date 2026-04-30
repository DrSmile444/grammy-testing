## ADDED Requirements

### Requirement: ESLint runs clean with no override blocks

The system SHALL have no `Plugin source overrides` or `Test overrides` blocks in `eslint.config.mjs`. `npm run lint` SHALL exit 0 with zero errors across all `src/**/*.ts` and `tests/**/*.ts` files.

#### Scenario: Clean lint on source files

- **WHEN** `npm run lint` is run against the repository
- **THEN** no errors are reported in any file under `src/`

#### Scenario: Clean lint on test files

- **WHEN** `npm run lint` is run against the repository
- **THEN** no errors are reported in any file under `tests/`

### Requirement: Every exported function and class has JSDoc

Every exported function, class, and non-trivial internal function in `src/` SHALL have a JSDoc comment with a description sentence. Every `@param` SHALL have a description. Every non-void function SHALL have `@returns`.

#### Scenario: IDE hover docs on public API

- **WHEN** a consumer installs the package and hovers over an exported symbol in their IDE
- **THEN** the IDE displays a description of what the symbol does

#### Scenario: Param descriptions visible in IDE

- **WHEN** a consumer fills in arguments to an exported function
- **THEN** each parameter shows a description in the IDE tooltip

### Requirement: Grammy ecosystem abbreviations are in the unicorn allowList

`ctx`, `Ref`, `params`, `prop`, `args`, and `cbData` SHALL be listed in the unicorn `allowList` in `.eslint/node/unicorn.eslint.mjs`. These are standard vocabulary in the grammy ecosystem and SHALL NOT be flagged by `unicorn/prevent-abbreviations`.

#### Scenario: ctx is allowed in source and tests

- **WHEN** a developer uses `ctx` as a variable name in `src/` or `tests/`
- **THEN** ESLint does not report a `unicorn/prevent-abbreviations` error

### Requirement: Library entry points are exempt from no-barrel-files

`src/index.ts` and `src/low-level.ts` SHALL be exempt from the `no-barrel-files/no-barrel-files` rule. All other files SHALL still be subject to the rule.

#### Scenario: Entry point re-exports are not flagged

- **WHEN** ESLint runs on `src/index.ts`
- **THEN** no `no-barrel-files` error is reported

#### Scenario: Internal barrel files are still flagged

- **WHEN** ESLint runs on a non-entry-point file that re-exports from another module
- **THEN** the `no-barrel-files` error is still reported

### Requirement: Tests use narrowing instead of non-null assertions

Test files SHALL NOT use the `!` non-null assertion operator. Where a value might be `undefined`, the test SHALL assert with `expect(value).toBeDefined()` followed by an explicit `if (!value) return` guard to narrow the type for subsequent assertions.

#### Scenario: Missing reply produces clear test failure

- **WHEN** `chats.repliesFor(user).last` is `undefined` (bot sent no reply)
- **THEN** the test fails with a `toBeDefined()` assertion message, not a TypeError from a `!` assertion
