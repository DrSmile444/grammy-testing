# build-and-publish Specification

## Purpose

Requirements for the npm build pipeline, dual-format output, and CI verification matrix for `@grammyjs/testing`.

## Requirements

### Requirement: Package builds to a dual-format dist/

The system SHALL produce a `dist/` directory containing ESM (`.js`), CJS (`.cjs`), and TypeScript declaration (`.d.ts`) files for both entry points (`index` and `low-level`) when `npm run build` is executed. The build SHALL be reproducible and SHALL complete without errors on Node 18, 20, and 22.

#### Scenario: Build produces all required files

- **WHEN** `npm run build` is run in a clean checkout
- **THEN** `dist/index.js`, `dist/index.cjs`, `dist/index.d.ts` exist
- **AND** `dist/low-level.js`, `dist/low-level.cjs`, `dist/low-level.d.ts` exist

### Requirement: ESM and CJS consumers can import the package

The built `dist/` SHALL be importable from both ESM (`import`) and CommonJS (`require`) environments. The `exports` map in `package.json` SHALL provide `import`, `require`, and `types` conditions for both `.` and `./low-level` entry points.

#### Scenario: CJS require succeeds

- **WHEN** a Node.js script uses `const { prepareBot } = require('@grammyjs/testing')`
- **THEN** the import resolves without error
- **AND** `prepareBot` is a function

#### Scenario: ESM import succeeds

- **WHEN** a Node.js script uses `import { prepareBot } from '@grammyjs/testing'`
- **THEN** the import resolves without error

### Requirement: Internal tests run without a prior build step

The development test suite (`vitest run`) SHALL resolve `@grammyjs/testing` to the TypeScript source (`src/index.ts`) rather than the built `dist/`, so that tests can be run without running `npm run build` first.

#### Scenario: Tests pass with no dist/ present

- **WHEN** `dist/` does not exist and `vitest run` is executed
- **THEN** all tests pass
- **AND** no module-not-found errors occur

### Requirement: CI validates Node 18, 20, and 22

A GitHub Actions workflow SHALL run `vitest run` on Node.js versions 18, 20, and 22 on every push and pull request to `main`. All matrix jobs SHALL pass before a change is considered mergeable.

#### Scenario: CI matrix runs on all three Node versions

- **WHEN** a commit is pushed to main
- **THEN** three CI jobs run in parallel: Node 18, Node 20, Node 22
- **AND** each job installs dependencies and runs `npm run test:run`
- **AND** all three jobs pass

### Requirement: CJS build is verified after every build

A `test:cjs` script SHALL verify the built CJS output by `require`-ing both entry points from `dist/` and asserting that key exports are functions. The script SHALL use only Node.js built-ins (no test-framework dependency). The CI `build-and-verify` job SHALL run this script after `npm run build`.

#### Scenario: CJS verification passes after build

- **WHEN** `npm run build` has completed and `npm run test:cjs` is executed
- **THEN** the script exits with code 0
- **AND** `prepareBot`, `OutgoingRequests`, `mockSession`, and `MessagePrivateMockUpdate` are confirmed to be functions from the CJS build

### Requirement: Bun CI step passes vitest run

A CI step SHALL install the latest Bun release and run `bun run test:run`. All tests SHALL pass, verifying that the library works in the Bun runtime.

#### Scenario: Bun passes all tests

- **WHEN** the Bun CI step runs
- **THEN** `bun run test:run` exits with code 0
- **AND** all 136+ tests pass

### Requirement: jsr.json scaffold is present

A `jsr.json` file SHALL exist at the repo root with the correct package name, version, and TypeScript source entry points. It SHALL NOT require a build step. Publishing to the `@grammyjs` JSR scope is gated on grammY team approval and is NOT performed by this change.

#### Scenario: jsr.json is valid

- **WHEN** `jsr.json` is read
- **THEN** it contains `name: "@grammyjs/testing"`, a version matching `package.json`, and exports pointing at `src/index.ts` and `src/low-level.ts`
