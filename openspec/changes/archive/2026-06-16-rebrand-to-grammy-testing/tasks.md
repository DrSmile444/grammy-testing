## 1. Package identity

- [x] 1.1 Set `package.json` `name` to `grammy-testing`
- [x] 1.2 Add `homepage` (docs site) and `bugs` (GitHub issues) to `package.json`; normalize `repository.url` to `git+https://github.com/DrSmile444/grammy-testing.git`
- [x] 1.3 Add a `LICENSE` file at repo root (MIT, copyright Dmytro Vakulenko); confirm `files` already lists `LICENSE`
- [x] 1.4 Regenerate `package-lock.json` via `npm install --package-lock-only` (do not hand-edit the name)
- [x] 1.5 Leave `jsr.json` name as `@grammyjs/testing` (dormant, reserved). NOTE: `jsr.json` is strict JSON (no comments), so the reserved-identity rationale is documented in the build-and-publish spec instead of an inline comment.

## 2. Build wiring + examples (lockstep)

- [x] 2.1 Rename `tsconfig.json` `paths`: `@grammyjs/testing` → `grammy-testing` and `@grammyjs/testing/low-level` → `grammy-testing/low-level`
- [x] 2.2 Rename `vitest.config.ts` `resolve.alias` entries for both `grammy-testing` and `grammy-testing/low-level`
- [x] 2.3 Update all 28 example imports under `examples/**` (`bot.spec.ts` + the two `bot.ts`) from `@grammyjs/testing` → `grammy-testing`
- [x] 2.4 Update the JSDoc comment in `src/low-level/updates/generic-mock.update.ts` (`@grammyjs/testing/low-level` → `grammy-testing/low-level`)

## 3. README + docs

- [x] 3.1 README: repoint npm badge/links to `grammy-testing`; remove the JSR badge and the `npx jsr add` install line; swap install/import/prose references
- [x] 3.2 Stub `site/guide/with-deno.md`: import via `npm:grammy-testing`, with a note that native Deno/JSR support lands with the official release
- [x] 3.3 Sweep remaining `site/**/*.md` (install commands, imports, low-level subpath, prose) from `@grammyjs/testing` → `grammy-testing`; `getting-started.md` + `index.md` Deno tabs switched to the `npm:` specifier
- [x] 3.4 Update `site/.vitepress/config.ts` npm link to `grammy-testing`
- [x] 3.5 Amend the existing **unreleased** `0.26.0` entry in `docs/CHANGELOG.md` with a note about the first public release as `grammy-testing` (no new version)
- [x] 3.6 Update `tests/reference/README.md` reference

## 4. Live specs sweep (NOT archives)

- [x] 4.1 Sweep incidental `@grammyjs/testing` mentions in `openspec/specs/**` not covered by the three delta specs (`examples-catalog`, `update-builders`, `vitepress-site`, `project-vision`, `changelog`, `real-bot-integration-suite`, `reference-suite`, and the build-and-publish `## Purpose` line). Requirement bodies in the three delta'd specs are left for the archive merge.
- [x] 4.2 Confirm `openspec/changes/archive/**` is left untouched (historical record)

## 5. Verification

- [x] 5.1 Run the CLAUDE.md quality gate in order: `lint:fix`, `format:md`, `typecheck`, `lint`, `test:run`, `test:coverage` — all green (0 errors; 7 pre-existing warnings; 494 tests pass; 94% coverage)
- [x] 5.2 Run `npm run build` then `npm run test:cjs` to confirm the dual-format build still imports — build OK, "CJS exports OK"
- [x] 5.3 Run `npm pack --dry-run` and confirm the tarball contains `dist/`, `README.md`, `LICENSE` and excludes `src/`, `tests/`, `examples/`, `openspec/` — `grammy-testing-0.26.0.tgz`, 11 files, correct contents
- [x] 5.4 Repo-wide grep returns zero `@grammyjs/testing` hits except the intentional `jsr.json` name, the with-deno/CHANGELOG reserved-identity notes, and the delta-spec bodies merged at archive
