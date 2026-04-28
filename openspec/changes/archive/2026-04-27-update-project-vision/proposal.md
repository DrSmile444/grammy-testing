## Why

`docs/project.md` was written before a late-stage exploration that produced four strategic shifts: (1) ua-anti-spam-bot is an **inspiration corpus, not a migration target**; (2) v1 is split into **v0.1 / v0.2 / v0.3** phases; (3) the validation gate is a reference suite in this repo, not a PR against the bot; (4) several API-shape decisions (three explicit entry points, transformer-promise async tracking, web-platform public types, layered subpath exports, error-simulation sugar, canned responses as static-or-function) are now locked in through the v0.1 implementation. The doc currently contradicts those shifts in multiple sections — until it's updated, every future proposal inherits outdated framing and external readers see a vision document that no longer describes the project.

## What Changes

- **Rewrite §"Migration milestone: replace ua-anti-spam-bot's in-repo testing framework"** as §"Reference test suite: prove parity using anti-spam patterns" — drop the "delete `src/testing/`" + "find-and-replace migration" framing; explicitly state that the bot is an inspiration corpus and that parity is proven by re-implementing its patterns in this repo's `tests/reference/`.
- **Soften §"Goals" item 2** from "delete the in-repo `src/testing/` once parity is proven" to "every pattern from the anti-spam suite is expressible cleanly in `@grammyjs/testing` and demonstrated in this repo's reference suite".
- **Replace §"Versioning & release plan" item 1** ("ua-anti-spam-bot migration is merged and green") with "every reference-suite test passes against the patterns audited in §Coverage audit".
- **Add §"Phase plan (v0.1 / v0.2 / v0.3)"** capturing the three-phase sequencing: v0.1 = low-level primitives (now archived), v0.2 = high-level Chats/User/Admin, v0.3 = plugin interop + multi-runtime publish + grammY pitch.
- **Update §"API surface (v1)"** to record decisions made during v0.1 design exploration:
  - Three explicit entry points (`prepareBot` / `prepareComposer` / `prepareMiddleware`), not one polymorphic.
  - Transformer-promise async tracking ("Strategy 2") with documented non-coverage of `setTimeout`.
  - Web-platform public types (`Uint8Array` over `Buffer`, `ReadableStream` over `node:stream`).
  - Layered subpath exports: `@grammyjs/testing` (curated) and `@grammyjs/testing/low-level` (escape hatch).
  - Error-simulation sugar spec: `failNext('sendMessage', { code, description })` upgrades to a real `GrammyError` internally.
  - Canned responses accept static value OR `(payload, method) => result` function.
  - `Admin` is NOT an identity class — `chats.newUser()` + `group.promote(user, perms)`; `chats.newAdmin()` stays as sugar.
  - Reply ownership three-layered: `chat.messages` (canonical log) / `user.replies` (filtered view) / `chats.outgoing` (raw API capture).
  - File capture: eager for buffer/string sources, tee for streams, URL stays as-string (no fetch).
  - Conversations plugin interop: plugin stays conversations-blind; docs ship a `MemorySession` recipe page (Option B).
- **Trim §"Reference implementation: ua-anti-spam-bot"** to remove migration-target language while keeping it as the inspiration corpus.
- **Update §"Migration milestone"** cross-references throughout the doc (Goals, Documentation strategy, Versioning, Plugin's own test strategy) to point at the new reference-suite framing.

## Capabilities

### New Capabilities

- `project-vision`: the canonical record of this plugin's strategic direction — relationship to ua-anti-spam-bot, validation strategy, phase plan, and the locked-in API-shape decisions that drive v0.2+ proposals. Lives in `docs/project.md`. This capability formalizes the doc as a load-bearing artifact: future proposals MUST be consistent with it, and updates to it require a separate change.

### Modified Capabilities

None. None of the v0.1 spec capabilities (`bot-test-harness`, `outgoing-requests-capture`, `context-field-mocking`, `update-builders`) are affected by this doc rewrite — their requirements stay unchanged.

## Impact

- **`docs/project.md`** rewritten in-place. ~7 sections touched, no new sections beyond the Phase plan addition.
- **No code changes.** Source, tests, configs, and `package.json` untouched.
- **Cross-references**: the new `project-vision` spec at `openspec/specs/project-vision/spec.md` becomes the durable record; the prose doc remains the human-readable surface.
- **Out of scope**: README rewrite, contributor docs, examples folder, VitePress site setup — those are deferred to other proposals (notably `add-runtime-and-runner-support` for v0.3 which is when the docs site actually ships).
