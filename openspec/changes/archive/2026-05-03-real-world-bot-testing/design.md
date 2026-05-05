## Context

grammy-testing is published to npm and JSR and CI-verified with Node, Bun, and Deno (type-check only). Its API surface has been exercised exclusively against ua-anti-spam-bot. Nine public grammY bots have been selected to widen coverage: five Node bots (vitest-native), two Deno bots (`deno test`), one monorepo bot, and one runtime-TBD. All use grammY; grammy-testing requires grammy `^1.42.0` as a peer dep.

## Goals / Non-Goals

**Goals:**

- Produce runnable tests for each bot's handler layer (composers, middleware, commands)
- Discover every pattern that cannot be expressed through grammy-testing's public API
- Record all findings in `docs/TODO.md` with enough context for a follow-up implementation change
- Validate that grammy-testing works under `deno test` (currently only `deno check` is CI-verified)

**Non-Goals:**

- Fixing grammy-testing source code (follow-up change)
- Achieving 100% line coverage in the target bots
- Testing business logic that depends on external services (DB, HTTP APIs)
- Modifying the target bots beyond a grammy version bump

## Decisions

### D1: One setup agent, nine test agents running in parallel

A single agent clones all repos, writes a shared README, and confirms each repo is accessible. Nine agents then run in parallel — one per bot. This avoids race conditions on the shared README and gives each agent isolated context.

**Alternatives considered:** All-in-one agent — slower and mixes concerns; would lose parallelism benefit.

### D2: Test only the handler layer; mock the service layer at its boundary

Agents target `composer`, `middleware`, and `command` files directly via `prepareComposer` / `prepareMiddleware`. Any call to a database, HTTP client, or external SDK is stubbed with `vi.fn()` (Node) or a simple stub object (Deno) injected via the bot's DI pattern or module-level mock. Agents do **not** spin up real services.

**Alternatives considered:** Integration tests with real services — defeats the purpose; findings would be about infra, not grammy-testing.

### D3: Raw `handleUpdate` is a finding signal, not a fallback

Agents are instructed: if a pattern requires `bot.handleUpdate`, document it in `docs/TODO.md` as a gap and write the test with `handleUpdate` as a temporary workaround. The test must still pass; the finding captures what API would replace the workaround.

### D4: Deno bots — bump grammy, skip if upgrade is destructive

For `show-json-bot` (grammy v1.31.3 → ^1.42.0): update `deps.ts` import URL. For `AnimeDB-tgbot` (v1.11.0): attempt bump; if the bot fails to typecheck after bump, mark as "too stale" in README and skip test writing.

Add `@grammyjs/testing` from JSR to each Deno bot's `deno.json`. Use `Deno.test` + `@std/expect` for assertions.

### D5: Findings format in docs/TODO.md

Each finding follows the existing TODO.md convention: a numbered heading, a code snippet showing the raw workaround, and a proposed API block showing what the ergonomic version would look like.

## Risks / Trade-offs

- **Bot repos may have been deleted or made private since selection** → setup agent confirms each URL is accessible before cloning; skips inaccessible repos with a note in README
- **Deno runtime incompatibility in grammy-testing** → first time `deno test` is actually exercised against grammy-testing; failures here are high-value findings
- **External-dependency bots (TorrentConverter, AnimeDB) may be hard to stub** → agents focus on the grammy handler layer only; if the handler is inseparable from the service layer, document as "untestable without refactor" and move on
- **Remoodle monorepo path depth** → agent must `cd apps/telegram-bot` before setup; confirm `package.json` exists there
