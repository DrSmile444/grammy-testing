## Why

PR #6 review surfaced three code-quality gaps that passed the quality gate only because of silenced rules or untested invariants: an undocumented implicit contract in the mock transformer, `as unknown as` casts in plugin example bots where idiomatic context flavors are available, and empty `@param` JSDoc blocks in test helpers that the linter ignores for test files. These are not blocking but will confuse future contributors if left unaddressed.

## What Changes

- **`src/low-level/transformer.ts`** — add an inline comment to the `_previous` parameter making its intentional non-use explicit; this protects the double-installation assumption in `prepareBot` from silent breakage.
- **`examples/21-files-bot/bot.ts`** — replace `as unknown as { getUrl: () => string }` with `FileFlavor<Context>` from `@grammyjs/files`.
- **`examples/22-hydrate-bot/bot.ts`** — replace the `as unknown as { message_id?: number }` cast on the sent message with a direct property read; `hydrateApi()` returns a hydrated `Message` with `message_id` accessible without a cast.
- **`tests/plugins/chat-members.spec.ts`** — remove empty `/** */` JSDoc blocks from the four private test-helper functions (`makeUser`, `asMember`, `asLeft`, `makeChatMemberUpdate`); JSDoc is not required for test-file helpers and empty blocks are noise.
- **`openspec/specs/examples-catalog/spec.md`** — update "exactly 20 subfolders" to 23, replace "grammy and @grammyjs/testing only" with "grammy, @grammyjs/testing, and devDependency plugins under test", and add a requirement that plugin example `bot.ts` files use the plugin's published context flavor type rather than runtime casts.

## Capabilities

### New Capabilities

- `mock-transformer-terminal-intent`: The library transformer must never call `_previous`. This invariant enables the snapshot-and-reinstall approach in `prepareBot` (user transformers are re-installed above the library transformer; without this contract the inner copy of each user transformer would execute). The code SHALL express this intent with a comment on the `_previous` parameter.

### Modified Capabilities

- `examples-catalog`: Update folder-count requirement from 20 to 23; allow plugin devDependency imports in example `bot.ts` files; add requirement that plugin examples use the plugin's context flavor type (e.g. `FileFlavor<Context>`, `HydrateFlavor<Context>`) rather than `as unknown as` casts.

## Impact

- `src/low-level/transformer.ts` — comment-only change, no runtime effect
- `examples/21-files-bot/bot.ts`, `examples/22-hydrate-bot/bot.ts` — type-level change; runtime behaviour identical
- `tests/plugins/chat-members.spec.ts` — JSDoc removal only; test logic unchanged
- `openspec/specs/examples-catalog/spec.md` — spec update; no production code changes
