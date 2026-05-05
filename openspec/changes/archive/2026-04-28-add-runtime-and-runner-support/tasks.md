## 1. Build tooling (pre-implemented — verify and finalise)

- [x] 1.1 Verify `tsup.config.ts` produces correct ESM + CJS + `.d.ts` output for both entry points (`npm run build` passes without errors)
- [x] 1.2 Add `"files": ["dist"]` to `package.json` to limit npm publish scope
- [x] 1.3 Add `resolve.alias` override in `vitest.config.ts` so tests resolve `@grammyjs/testing` → `./src/index.ts` and `@grammyjs/testing/low-level` → `./src/low-level.ts` during development (keeps tests build-step-free)

## 2. CJS verification

- [x] 2.1 Add `test:cjs` script to `package.json` — Node one-liner that `require`s both CJS entry points and asserts key exports are functions (no test-framework dependency)
- [x] 2.2 Verify `npm run test:cjs` passes locally after `npm run build`

## 3. JSR scaffold

- [x] 3.1 Create `jsr.json` at repo root with `name`, `version` (match `package.json`), and exports pointing at `src/index.ts` and `src/low-level.ts`

## 4. GitHub Actions CI

- [x] 4.1 Create `.github/workflows/ci.yml` with:
  - Node matrix job: `[18, 20, 22]` — `npm ci`, `npm run test:run`
  - Build job: `npm run build` then run the Jest smoke test
  - Bun job: install latest Bun, `bun run test:run`
  - Triggers: `push` and `pull_request` to `main`

## 5. Verification

- [x] 5.1 Run `npm run build` locally and confirm all six `dist/` files are generated
- [x] 5.2 Run `npx vitest run` without `dist/` present and confirm all tests still pass (alias override working)
- [x] 5.3 Run `npm pack --dry-run` and confirm only `dist/` files (+ `package.json`, `README`, `LICENSE`) are included
