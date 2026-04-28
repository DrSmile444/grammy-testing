## Why

The package currently exports TypeScript source files directly (`./src/index.ts`), which means it cannot be published to npm for consumption by real users. Reaching v0.3 and initiating the grammY team pitch requires a proper build pipeline, multi-runtime verification, and a CI matrix that proves the library works across Node versions and test runners.

## What Changes

**Already done (pre-implemented in working tree):**
- `tsup.config.ts` — ESM + CJS dual-format build with `.d.ts` declarations
- `package.json` exports updated from `./src/*.ts` → `./dist/*.{js,cjs,d.ts}`
- `package.json` scripts: `build` (`tsup`), `prepublishOnly` (`npm run build`)
- `tsup` added to devDependencies
- ESLint ignores `dist/**`; `.gitignore` ignores `dist/`
- `tsconfig.json` includes `tsup.config.ts`, adds `ignoreDeprecations: "6.0"` for TypeScript 6

**Remaining work:**
- Add `"files": ["dist"]` to `package.json` to limit what is published to npm
- Verify `npm run build` produces a correct `dist/` with both entry points and declaration files
- Fix `vitest.config.ts` so tests continue to resolve source via `tsconfigPaths` even after exports point at `dist/` — add an explicit `resolve.alias` override for the test environment
- Add GitHub Actions CI workflow: Node 18 / 20 / 22 × `vitest run` matrix
- Add a Jest smoke-test CI job demonstrating runner-agnosticism: install `jest` + `@jest/globals`, run a minimal Jest test that imports `@grammyjs/testing` from the built `dist/`
- Add Bun CI step: `bun run test:run` on the latest Bun release
- Add `jsr.json` scaffold for Deno/JSR publish readiness (actual publish requires `@grammyjs` scope access from the grammY team — out of scope here)
- Update `docs/handoff-state.md` gap catalog for v0.3 build status

## Capabilities

### New Capabilities

- `build-and-publish`: Requirements for the npm build pipeline — what `dist/` must contain, what `package.json` fields must be set, what CI jobs must pass before publish.

### Modified Capabilities

None — no existing spec-level behavior changes. This change is entirely about the delivery infrastructure.

## Impact

- `package.json` — `files`, exports, scripts
- `tsup.config.ts` — existing, verified/adjusted
- `vitest.config.ts` — alias override for tests resolving src
- `.github/workflows/ci.yml` — new CI file
- `jsr.json` — new scaffold file
- `docs/handoff-state.md` — v0.3 status update
- No public API changes; no breaking changes
