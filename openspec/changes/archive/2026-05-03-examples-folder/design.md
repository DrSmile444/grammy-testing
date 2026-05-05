## Context

The library currently ships no runnable usage examples. Newcomers must read the internal test suite — which imports from `../../src/index` and tests implementation details — or hunt through third-party bot repos to understand basic usage patterns. The upcoming README will link to an `examples/` folder as the canonical "how-to" reference.

The vitest configuration already has an `@grammyjs/testing` alias pointing at `src/index.ts`, so example test files can consume the library as published consumers would, with no additional tooling setup.

## Goals / Non-Goals

**Goals:**

- 20 self-contained, numbered example subfolders under `examples/`, each with `bot.ts` and `bot.spec.ts`.
- All example specs import from `@grammyjs/testing` (the package name) — making them copy-paste-ready for end users.
- Examples are included in the regular `vitest run` pass and in coverage.
- TypeScript type-checks the example bots without a build step.
- Examples progress from the trivial (echo bot) to the multi-actor (group + channel scenario).

**Non-Goals:**

- Publishing examples as a separate package or documentation site — they are source-only.
- Supporting Deno for the examples folder — Node + vitest only for now.
- Adding new library APIs for examples to consume — examples use the existing surface.
- Examples for `@grammyjs/conversations` plugin (requires a separate dependency not in devDependencies).

## Decisions

### D1 — Numbered folder names (`01-echo-bot/`)

**Decision:** Prefix each folder with a two-digit index.

**Rationale:** Ensures alphabetical order in file explorers and `ls` matches pedagogical order. URLs to specific examples remain stable once published; renaming would break README links.

**Alternative considered:** Flat names (`echo-bot/`) — rejected because ordering in file listings would be alphabetical by name rather than complexity.

---

### D2 — Bot factory function pattern

**Decision:** Each `bot.ts` exports a `create<Name>Bot()` factory function that returns a configured `Bot` instance (not a singleton).

**Rationale:** Tests instantiate fresh bots per-test or per-describe block. A module-level singleton would carry state between tests. The factory pattern mirrors what real-world bot code looks like when structured for testability.

**Alternative considered:** Module-level `bot` export — rejected because vitest module caching could cause test interference.

---

### D3 — Import from `@grammyjs/testing` in example specs

**Decision:** Example `.spec.ts` files use `import { ... } from '@grammyjs/testing'` (not a relative path).

**Rationale:** The examples are documentation. Showing `'../../src/index'` would confuse readers who are not working inside this repo. The vitest alias transparently resolves the package name to source during `vitest run`.

**Alternative considered:** Relative imports matching the existing test suite style — rejected to keep examples reader-friendly.

---

### D4 — `examples` added to `tsconfig.json` `include`

**Decision:** Add `"examples"` to the `include` array in `tsconfig.json`.

**Rationale:** `tsc --noEmit` (the `typecheck` script) must cover example files so type errors are caught in CI. Without this, the compiler silently skips them.

**Impact:** Minimal — no change to `src/`, no build output change (the `tsup` build reads from `src/` only).

---

### D5 — Coverage includes `examples/*/bot.ts`

**Decision:** Do not add `examples/*/bot.ts` to the coverage `exclude` list.

**Rationale:** Each bot file is fully exercised by its sibling spec file. Including them in the coverage report provides a concrete signal that the examples are genuinely tested. The 80 % thresholds are already safe given 100 % coverage on small bot files.

**Alternative considered:** Excluding examples from coverage — rejected; it would hide any untested code in bot files.

---

### D6 — 20 examples in ascending capability order

The progression maps directly to library API surface:

| #   | Folder                 | New API concept                                            |
| --- | ---------------------- | ---------------------------------------------------------- |
| 01  | `echo-bot`             | `prepareBot`, `sendText`, `user.replies`                   |
| 02  | `command-bot`          | `sendCommand`, multiple handlers                           |
| 03  | `greeting-bot`         | custom user profile `{ firstName }`                        |
| 04  | `chat-type-filter-bot` | `newSupergroup`, `group.own()`, no-reply assertion         |
| 05  | `inline-keyboard-bot`  | `reply.buttons`, `reply.clickButton()`, `chats.editsFor()` |
| 06  | `callback-query-bot`   | `user.sendCallbackQuery()` without prior message           |
| 07  | `session-counter-bot`  | `mockSession`, per-user state                              |
| 08  | `chat-settings-bot`    | `mockChatSession`, per-chat state                          |
| 09  | `photo-bot`            | `user.sendPhoto()`, asserting `sendPhoto` API call         |
| 10  | `document-bot`         | `user.sendDocument()`, `file_id` inspection                |
| 11  | `poll-bot`             | bot creates poll, `user.answerPoll()`                      |
| 12  | `group-welcome-bot`    | membership join dispatch, `newSupergroup`                  |
| 13  | `admin-guard-bot`      | `chats.newAdmin()`, rejection for non-admins               |
| 14  | `moderation-bot`       | `group.ban()`, outgoing `kickChatMember` assertion         |
| 15  | `channel-post-bot`     | `chats.newChannel()`, `Channel` actor                      |
| 16  | `reactions-bot`        | `user.reactTo()`                                           |
| 17  | `dice-game-bot`        | `user.sendDice()`                                          |
| 18  | `middleware-test`      | `prepareMiddleware`                                        |
| 19  | `composer-test`        | `prepareComposer`                                          |
| 20  | `multi-chat-scenario`  | multiple users + group + channel, full orchestration       |

## Risks / Trade-offs

**[Risk] ESLint may flag `@grammyjs/testing` imports in `examples/` as unresolved**
→ Mitigation: The import-alias plugin is already configured for `src/` paths; `@grammyjs/testing` is a real package name in `devDependencies`, so standard import resolution in eslint-plugin-import will find it. Validate after first example is linted.

**[Risk] tsconfig `include` addition may surface pre-existing type errors in unrelated files**
→ Mitigation: The change adds only new files to `include`; it does not alter compiler settings. Risk is low, but `npm run typecheck` should be run after the first batch of examples is added.

**[Risk] Coverage thresholds slip if a bot.ts has a branch not exercised by its spec**
→ Mitigation: Keep bot files small and single-purpose. Each `bot.ts` should have no dead branches; if a path exists, a test should exercise it.

**[Trade-off] 40 new files increases repo surface area**
→ Accepted: examples are documentation-first code; they are stable once written and require minimal ongoing maintenance.
