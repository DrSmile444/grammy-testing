## Context

The package was scaffolded under the official-looking name `@grammyjs/testing`, but nothing has
ever been published to npm or JSR under either that name or `grammy-testing` (both return 404). The
repository (`DrSmile444/grammy-testing`), docs URL (`drsmile444.github.io/grammy-testing/`), and
logo (`docs/grammy-testing-logo.svg`) are already `grammy-testing` — only the package identity
jumped ahead. The grammY team confirmed third-party-first publishing is fine and migration into the
official namespace can happen later. `grammy-testing` is free on npm and matches the established
third-party convention (`grammy-media-groups`, `grammy-guard`, `grammy-i18n`, `grammy-inline-menu`).

## Goals / Non-Goals

**Goals:**

- Rename the npm package identity to `grammy-testing` and align every install/import surface.
- Reach publish-readiness for a first manual npm release (LICENSE, metadata, tarball verification).
- Keep the test suite green throughout by moving build aliases and example imports in lockstep.
- Preserve `@grammyjs/testing` as the cleanly-reserved future official identity.

**Non-Goals:**

- Actually running `npm publish` (manual, post-merge).
- JSR publishing or Deno runtime test execution (Path A — deferred until official migration).
- Rewriting archived OpenSpec changes (`openspec/changes/archive/**`) — historical record.
- Any change to library behavior, exports, or the public API surface.

## Decisions

### D1 — npm name `grammy-testing`, JSR name stays `@grammyjs/testing` (Path A)

npm allows unscoped names; JSR requires a scope we do not own. Rather than invent a personal JSR
scope, JSR publishing is deferred. `jsr.json` is kept dormant under the reserved `@grammyjs/testing`
name, and `deno.json` + the Deno CI type-check stay (they prove the source remains Deno-ready). The
npm↔JSR name divergence is intentional and documented in the build-and-publish spec.
_Alternative considered:_ publish `@drsmile444/grammy-testing` to JSR now — rejected because it
serves Deno users a name different from the eventual official one and adds maintenance for little
gain.

### D2 — Alias + example imports move in lockstep

`tsconfig.json` (`paths`) and `vitest.config.ts` (`resolve.alias`) map `@grammyjs/testing` →
`src/`, and all 28 example imports resolve through that alias. The rename touches all three
together; renaming any subset breaks resolution. The post-rename aliases (`grammy-testing`,
`grammy-testing/low-level`) also make example specs copy-paste-accurate for real users.

### D3 — Version stays 0.26.0; amend the unreleased entry

`0.26.0` already exists in `docs/CHANGELOG.md` (Bot API 10 work) but was never published. The rename
folds into that same unreleased entry rather than minting `0.27.0`, so the first public release
carries one coherent changelog section. _Alternative considered:_ reset to `0.1.0` — rejected; it
discards real changelog history.

### D4 — Spec deltas only where requirements change in substance

Three capabilities carry substantive requirement changes (`build-and-publish` adds publish-readiness
rules and reframes jsr.json; `readme` drops the JSR badge/install requirement; `documentation-content`
changes the Deno-import and low-level-subpath requirements). Every other `@grammyjs/testing` mention
across live specs, docs, source comments, and examples is a mechanical token swap with unchanged
intent, handled as a sweep in the apply phase rather than as delta noise.

### D5 — Forward-notice deferred

No "this may move to @grammyjs/testing later" note is added to docs yet (Q6). Revisit at the official
migration.

## Risks / Trade-offs

- **Stale `@grammyjs/testing` references left behind** → Mitigation: a final repo-wide grep
  (excluding `node_modules`, `dist`, `.git`, and `openspec/changes/archive/`) must return zero hits
  before the quality gate is considered complete.
- **Tests break from a partial alias rename** → Mitigation: D2 lockstep; `vitest run` is part of the
  quality gate and will fail loudly on any missed import.
- **`package-lock.json` name drift** → Mitigation: regenerate via `npm install` after the
  `package.json` rename rather than hand-editing.
- **Tarball ships unintended files** → Mitigation: `npm pack --dry-run` verification (new
  build-and-publish requirement).

## Migration Plan

1. Add `LICENSE`; rename `package.json` (name + metadata) and regenerate the lockfile.
2. Rename `tsconfig.json` + `vitest.config.ts` aliases and all 28 example imports in one pass.
3. Sweep README, `site/**`, live specs, and the one `src/` JSDoc comment; stub `with-deno.md`.
4. Amend the `0.26.0` changelog entry.
5. Run the full quality gate + `npm pack --dry-run`; grep for residual old-name references.

Rollback: the change is confined to one branch/PR; reverting the branch restores the prior identity.

## Open Questions

None — all decisions from exploration (Path A, jsr.json dormant, badge removal, version, publish
mechanics, forward-notice, scope) are resolved and captured above.
