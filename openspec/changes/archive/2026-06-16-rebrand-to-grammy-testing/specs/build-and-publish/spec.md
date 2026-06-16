## ADDED Requirements

### Requirement: Package is published under the third-party name `grammy-testing`

The package SHALL be published to npm under the unscoped third-party name `grammy-testing`,
following the established grammY third-party plugin convention (`grammy-<name>`). `package.json#name`
SHALL be `grammy-testing`. The npm name (`grammy-testing`) and the reserved JSR name
(`@grammyjs/testing`) MAY differ during the third-party phase; the official `@grammyjs/testing`
migration and JSR publishing remain gated on grammY team approval. The first publish SHALL be
performed manually; CI SHALL NOT contain a publish step.

#### Scenario: package.json declares the third-party name

- **WHEN** `package.json` is read
- **THEN** its `name` field is `grammy-testing`
- **AND** consumers install it with `npm install --save-dev grammy-testing`

#### Scenario: no publish automation in CI

- **WHEN** the GitHub Actions workflows are inspected
- **THEN** no job runs `npm publish` or `jsr publish`

### Requirement: package.json carries discoverability metadata

`package.json` SHALL include a `homepage` field pointing at the documentation site, a `bugs` field
pointing at the GitHub issue tracker, and a `repository.url` in `git+https://` form so npm renders
the repository and issues links on the package page.

#### Scenario: metadata fields are present and well-formed

- **WHEN** `package.json` is read
- **THEN** `homepage`, `bugs`, and `repository.url` are present
- **AND** `repository.url` begins with `git+https://`

### Requirement: A LICENSE file is present and shipped

A `LICENSE` file containing the MIT license (copyright Dmytro Vakulenko) SHALL exist at the
repository root and SHALL be included in the published tarball via the `files` array.

#### Scenario: LICENSE is published

- **WHEN** the package tarball is produced
- **THEN** it contains a top-level `LICENSE` file

### Requirement: Published tarball is verified before publishing

`npm pack --dry-run` SHALL be used to verify the tarball contents before publishing. The tarball
SHALL contain `dist/`, `README.md`, and `LICENSE`, and SHALL NOT contain `src/`, `tests/`,
`examples/`, or `openspec/`.

#### Scenario: tarball contains only intended files

- **WHEN** `npm pack --dry-run` is run
- **THEN** the listed files include `dist/`, `README.md`, and `LICENSE`
- **AND** they exclude `src/`, `tests/`, `examples/`, and `openspec/`

## MODIFIED Requirements

### Requirement: ESM and CJS consumers can import the package

The built `dist/` SHALL be importable from both ESM (`import`) and CommonJS (`require`) environments. The `exports` map in `package.json` SHALL provide `import`, `require`, and `types` conditions for both `.` and `./low-level` entry points.

#### Scenario: CJS require succeeds

- **WHEN** a Node.js script uses `const { prepareBot } = require('grammy-testing')`
- **THEN** the import resolves without error
- **AND** `prepareBot` is a function

#### Scenario: ESM import succeeds

- **WHEN** a Node.js script uses `import { prepareBot } from 'grammy-testing'`
- **THEN** the import resolves without error

### Requirement: Internal tests run without a prior build step

The development test suite (`vitest run`) SHALL resolve `grammy-testing` to the TypeScript source (`src/index.ts`) rather than the built `dist/`, so that tests can be run without running `npm run build` first. This resolution SHALL also apply to all files under `examples/` so example specs execute against live source.

#### Scenario: Tests pass with no dist/ present

- **WHEN** `dist/` does not exist and `vitest run` is executed
- **THEN** all tests pass
- **AND** no module-not-found errors occur

### Requirement: Package installs cleanly in consumer projects

The published `grammy-testing` package SHALL NOT include a `postinstall` script in its `package.json`. Consumer projects running `npm install grammy-testing` SHALL complete without errors and SHALL NOT require `--ignore-scripts`.

#### Scenario: Consumer npm install succeeds without flags

- **WHEN** a consumer project runs `npm install grammy-testing`
- **THEN** the installation completes with exit code 0
- **AND** no error about a missing `link-codex-skills.sh` or any other postinstall script is reported

### Requirement: jsr.json scaffold is present

A `jsr.json` file SHALL exist at the repo root with the reserved official package name, version, and TypeScript source entry points. It SHALL NOT require a build step. The file is kept dormant during the third-party phase: publishing to the `@grammyjs` JSR scope is gated on grammY team approval and is NOT performed by this change. The JSR name intentionally differs from the npm name (`grammy-testing`) and remains the reserved official identity.

#### Scenario: jsr.json is valid

- **WHEN** `jsr.json` is read
- **THEN** it contains `name: "@grammyjs/testing"`, a version matching `package.json`, and exports pointing at `src/index.ts` and `src/low-level.ts`
