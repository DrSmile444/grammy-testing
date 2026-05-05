## Context

The build chain is: TypeScript source → tsup → `dist/` (ESM `.js` + CJS `.cjs` + declarations `.d.ts`). tsup is already configured. The key question after adding a build step is keeping the internal test suite working, since Vitest currently resolves the package's own exports through `tsconfigPaths` (which maps TypeScript paths directly). Once `package.json` exports point at `dist/`, Node's resolver sees `dist/`; we need Vitest to continue seeing `src/` during development.

## Goals / Non-Goals

**Goals:**

- `npm run build` produces a correct dual-format `dist/` that consumers can `import` (ESM) and `require` (CJS).
- Internal test suite (`vitest run`) still works without a prior build step.
- CI matrix proves Node 18/20/22 pass on every commit.
- A Jest smoke test proves the built package is importable from a Jest environment.
- Bun passes `vitest run` (Bun ships with a Vite-compatible runtime; Vitest runs on Bun natively).
- `jsr.json` scaffold is in place for when the grammY team grants `@grammyjs` JSR scope access.

**Non-Goals:**

- Full Jest test suite parity (one smoke test suffices to prove runner-agnosticism).
- Deno publish (blocked on `@grammyjs` JSR scope; scaffold only).
- npm publish automation — `prepublishOnly` hook covers manual `npm publish`; a publish workflow is post-v1.0.

## Decisions

**Decision 1: tsup for dual-format build.**

tsup (esbuild-based) is already wired up and produces ESM + CJS in a single command. Alternative (tsc composite) requires manual CJS shim and is slower. tsup is the defacto standard for TypeScript library dual-publish.

**Decision 2: `resolve.alias` in `vitest.config.ts` to keep tests pointing at source.**

After `package.json` exports switch to `dist/`, Vitest's Node resolver would try to load `dist/index.js`. Since `dist/` doesn't exist in the repo (gitignored), this breaks `vitest run` without a prior build. Solution: add explicit Vite `resolve.alias` entries in `vitest.config.ts` to override `@grammyjs/testing` → `./src/index.ts` and `@grammyjs/testing/low-level` → `./src/low-level.ts`. This keeps the development loop build-free.

Note: `tsconfigPaths` alone won't override the `exports` map — we need a `resolve.alias`, not just path remapping.

**Decision 3: Jest smoke test using `@jest/globals` + built `dist/`.**

The internal test suite imports from `vitest`. Rather than rewriting tests or adding a jest-compat shim, we create a minimal `tests/jest/smoke.test.cjs` that imports the CJS build and asserts the basic `prepareBot` flow works. This proves the CJS export is correct without duplicating the full test suite.

**Decision 4: Bun via `bun run test:run` — no separate Bun config.**

Bun supports Vitest out of the box. Adding a CI step that installs Bun and runs `bun run test:run` is sufficient. No separate `bun.config.ts` needed.

**Decision 5: `jsr.json` points at `src/` (TypeScript source).**

JSR publishes TypeScript source directly; no build step needed for Deno consumers. The JSR config uses the `src/` entry points, not `dist/`. This is intentional and correct for JSR.

## Risks / Trade-offs

- `resolve.alias` in vitest config is a dev-env override — if it drifts from the real exports map, tests could pass while the package is broken. Mitigation: the Jest smoke test CI job validates the built `dist/` on every commit.
- tsup's CJS output wraps ESM in a compatibility shim. For packages that use top-level `await` or ESM-only APIs, this can fail silently. This package has no top-level `await`; risk is low.
- JSR `@grammyjs` scope requires team approval. The scaffold is ready but the actual publish is gated. Document this clearly in `jsr.json` as a comment (or README).
