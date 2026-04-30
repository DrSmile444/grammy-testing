# ci-npm-version Specification

## Purpose

Ensure that the exact npm version used to manage this project is pinned in `package.json` and that CI installs that same version before running `npm ci`, preventing lockfile-sync errors across Node.js matrix versions.

**Why not corepack:** `actions/setup-node` places its bundled npm earlier in PATH than corepack's shims, so `corepack enable` does not reliably override the active npm on GitHub Actions runners. A direct `npm install -g npm@<version>` replaces the global npm at the same PATH location and is unconditionally reliable.

## Requirements

### Requirement: `packageManager` field documents the npm version

`package.json` SHALL declare a `"packageManager"` field specifying the exact npm version used to manage this project (e.g., `"npm@11.9.0"`). This field SHALL match the npm version used to generate `package-lock.json`. Its purpose is documentation and local tooling (corepack, editors) — CI enforcement is achieved separately via explicit global install.

#### Scenario: packageManager field exists in package.json

- **WHEN** a contributor opens `package.json`
- **THEN** a `"packageManager"` field is present with a value of the form `"npm@<major>.<minor>.<patch>"`

### Requirement: CI installs the pinned npm version before running npm ci

CI jobs that run `npm ci` on Node 20 and 22 SHALL include a `npm install -g npm@<version>` step immediately before `npm ci`, where `<version>` matches the `packageManager` field in `package.json`. Node 18 SHALL skip this step because `npm@11.x` requires Node `^20.17.0 || >=22.9.0` and is incompatible with Node 18; the bundled npm on Node 18 is sufficient to run `npm ci` with the lockfile.

#### Scenario: Node 20 and 22 use the pinned npm

- **WHEN** CI runs the `test` job on Node 20 or 22
- **THEN** `npm install -g npm@<pinned-version>` has run before `npm ci`
- **AND** the npm version active during install matches the `packageManager` field in `package.json`

#### Scenario: Node 18 skips the npm upgrade

- **WHEN** CI runs the `test` job on Node 18
- **THEN** the `npm install -g npm@<pinned-version>` step is skipped
- **AND** `npm ci` runs with the bundled npm that ships with Node 18

#### Scenario: build-and-verify job uses the pinned npm

- **WHEN** CI runs the `build-and-verify` job
- **THEN** `npm install -g npm@<pinned-version>` has run before `npm ci`

#### Scenario: npm ci does not fail with lockfile-sync error

- **WHEN** the CI workflow runs on any supported Node version
- **THEN** `npm ci` completes successfully without the error "package.json and package-lock.json are out of sync"
