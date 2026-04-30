# ci-npm-version Specification

## Purpose

Ensure that the exact npm version used to manage this project is pinned in `package.json` and that CI enforces that version via corepack, preventing lockfile-sync errors across Node.js matrix versions.

## Requirements

### Requirement: `packageManager` field pins the npm version

`package.json` SHALL declare a `"packageManager"` field specifying the exact npm version used to manage this project (e.g., `"npm@11.9.0"`). This field SHALL match the npm version used to generate `package-lock.json`.

#### Scenario: packageManager field exists in package.json

- **WHEN** a contributor opens `package.json`
- **THEN** a `"packageManager"` field is present with a value of the form `"npm@<major>.<minor>.<patch>"`

### Requirement: CI uses corepack to enforce the pinned npm version

All CI jobs that run `npm ci` SHALL include a `corepack enable` step before any `npm` invocation. This ensures the pinned npm version from `packageManager` is active regardless of which npm version is bundled with the job's Node.js image.

#### Scenario: All test matrix nodes use the pinned npm

- **WHEN** CI runs the `test` job on any Node matrix version (18, 20, 22)
- **THEN** `corepack enable` has run before `npm ci`
- **AND** the npm version active during install matches the `packageManager` field in `package.json`

#### Scenario: build-and-verify job uses the pinned npm

- **WHEN** CI runs the `build-and-verify` job
- **THEN** `corepack enable` has run before `npm ci`

#### Scenario: npm ci does not fail with lockfile-sync error

- **WHEN** the CI workflow runs on any supported Node version
- **THEN** `npm ci` completes successfully without the error "package.json and package-lock.json are out of sync"
