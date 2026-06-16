## Why

The grammY team confirmed that third-party plugins can be published first and migrated into the
official `@grammyjs/*` namespace later. The package currently claims the official name
`@grammyjs/testing` before any release exists, while the repository, docs URL, and logo are already
`grammy-testing`. Aligning the package identity with the established third-party convention
(`grammy-<name>`, e.g. `grammy-media-groups`) unblocks the first public npm release under a name we
actually own, and reserves `@grammyjs/testing` cleanly for the eventual official migration.

## What Changes

- **BREAKING** (pre-release): the npm package name becomes `grammy-testing` (was `@grammyjs/testing`).
  Consumers install `grammy-testing` and import from `grammy-testing` / `grammy-testing/low-level`.
- Build/dev aliases (`tsconfig.json` paths, `vitest.config.ts` resolve) and all 28 example imports
  are renamed in lockstep so example specs stay copy-paste-accurate and tests keep resolving to
  `src/`.
- **Path A (npm-only now):** JSR publishing stays deferred. `jsr.json` is kept dormant under the
  reserved `@grammyjs/testing` name; `deno.json` and the Deno CI type-check stay. The npm name
  (`grammy-testing`) and the reserved JSR name (`@grammyjs/testing`) intentionally differ during the
  third-party phase, and the build-and-publish spec documents this.
- README JSR badge and the `jsr add` install line are removed; the npm badge/links repoint to
  `grammy-testing`.
- `site/guide/with-deno.md` is reduced to a stub: import via `npm:grammy-testing`, with a note that
  native Deno/JSR support lands with the official release.
- Publish-readiness: add a `LICENSE` file (MIT, Dmytro Vakulenko); add `homepage` + `bugs` to
  `package.json` and normalize `repository.url` to `git+https://` form; add an `npm pack --dry-run`
  verification step. First publish is a manual post-merge step — no publish automation in CI.
- Version stays `0.26.0`: the rename is folded into the existing **unreleased** `0.26.0` changelog
  entry rather than minting a new version.
- All remaining `@grammyjs/testing` mentions across live specs, docs, and source comments are swept
  to `grammy-testing`. Archived changes under `openspec/changes/archive/**` are left untouched
  (historical record).

## Capabilities

### New Capabilities

<!-- None — this change renames an existing package and tightens publish-readiness; it introduces no new behavior. -->

### Modified Capabilities

- `build-and-publish`: npm package identity becomes `grammy-testing`; `jsr.json` kept dormant under
  `@grammyjs/testing` with the npm↔JSR name divergence documented; `LICENSE` must be present and
  shipped in the tarball; `npm pack --dry-run` verification; first publish is manual.
- `readme`: npm badge/links repoint to `grammy-testing`; the JSR badge and `npx jsr add` install
  requirement are removed for the third-party phase.
- `documentation-content`: install command becomes `grammy-testing`; the Deno page no longer
  requires a `jsr:@grammyjs/testing` import and instead shows `npm:grammy-testing`; low-level
  subpath references become `grammy-testing/low-level`.

## Impact

- **Published identity:** `package.json` `name`, badges, install/import instructions.
- **Build wiring (must move in lockstep):** `tsconfig.json` paths, `vitest.config.ts` aliases, 28
  example imports — renaming one without the others breaks the test suite.
- **Docs:** `README.md`, ~30 `site/**/*.md`, `site/.vitepress/config.ts`, `with-deno.md` stub.
- **Specs:** live `openspec/specs/**` swept; archived changes untouched.
- **New file:** `LICENSE`. **Regenerated:** `package-lock.json`.
- **No CI changes:** workflows carry no name references and no publish step; publishing stays manual.
- **Reserved for later:** the official `@grammyjs/testing` migration and JSR publishing remain
  out of scope and gated on grammY team approval.
