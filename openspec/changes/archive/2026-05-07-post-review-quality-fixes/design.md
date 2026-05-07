## Context

PR #6 review produced four concrete findings. Two were fixed immediately (ESLint JSDoc silencing for examples, empty JSDoc on new example factory functions). Three remain:

1. `src/low-level/transformer.ts` — `_previous` is intentionally never called inside `createTransformer`, but nothing in the code says so. The snapshot-and-reinstall logic in `prepareBot` depends on this being true forever: if `_previous` were ever called, the inner copy of each user transformer would execute against the real API.
2. `examples/21-files-bot/bot.ts` and `examples/22-hydrate-bot/bot.ts` — plugin example bots cast to `as unknown as { ... }` instead of using the context flavor types the plugins export (`FileFlavor`, `HydrateFlavor`). Example code is the primary teaching material for users.
3. `tests/plugins/chat-members.spec.ts` — four private test helpers carry `/** */` JSDoc blocks with `@param` tags but no descriptions. The test-file ESLint config turns off `jsdoc/require-jsdoc` so these were never flagged, but the empty blocks are worse than no JSDoc at all.

The `examples-catalog` spec also needs a sync pass: it still says "exactly 20 subfolders" and "grammy and @grammyjs/testing only" after PR #6 added three plugin example bots.

## Goals / Non-Goals

**Goals:**

- Make the terminal nature of the mock transformer explicit in code
- Example plugin bots demonstrate the idiomatic flavor-type pattern
- Test helper functions are either documented or undocumented — never half-documented
- `examples-catalog` spec reflects reality (23 examples, plugin imports)

**Non-Goals:**

- Changing runtime behaviour of anything
- Adding the untestable 429-retry test (autoRetry doesn't retry GrammyErrors; `failNext` only throws GrammyErrors)
- Refactoring the double-installation pattern in `prepareBot` (it works correctly; a comment is sufficient)

## Decisions

### D1 — Comment on `_previous`, not a lint rule or runtime guard

A lint rule (`@typescript-eslint/no-unused-vars`) could flag `_previous` if we renamed it from `_previous` to something else, but ESLint already allows underscore-prefixed ignored parameters. A runtime `if (previous !== undefined) throw` guard would be misleading (the parameter is always defined). A one-line comment is the right tool: it explains the invariant, survives grep, and costs nothing.

**Alternative considered:** Rename the parameter to `__intentionallyUnused_previous` — rejected as verbose and strange-looking.

### D2 — Use context flavors directly in example bot.ts files

`@grammyjs/files` exports `FileFlavor<C>` and `@grammyjs/hydrate` exports `HydrateFlavor<C>`. Both are designed to be used as the bot's context type parameter, giving full type safety without casts. The examples should use `Bot<FileFlavor<Context>>` and declare the right context type so that `file.getUrl()` and `sent.message_id` are typed without reaching for `as unknown as`.

**Alternative considered:** Keep casts and add a comment explaining why — rejected because casts in example code teach the wrong pattern.

### D3 — Remove empty JSDoc blocks from test helpers

Since `jsdoc/require-jsdoc` is off for test files, JSDoc is voluntary. A voluntary JSDoc block with empty descriptions and bare `@param` tags (no descriptions) is strictly worse than no JSDoc. Removing the blocks makes the intent clear: these are private test utilities that don't need documentation.

**Alternative considered:** Fill in descriptions — rejected because these are single-purpose 2-line helpers whose names (`makeUser`, `asMember`, `asLeft`) already explain them.

## Risks / Trade-offs

- **D2 changes the public interface of example bots**: `createFilesBot()` return type changes from `Bot<Context>` to `Bot<FileFlavor<Context>>`. Tests calling `prepareBot(createFilesBot())` are unaffected (grammY's types are covariant here), but if any test casts the returned bot, it may need a minor update. All three example spec files test behaviour, not types, so this is low risk.

- **D2 — `HydrateFlavor` on example 22**: `hydrateApi()` augments API call return values at runtime. Using `HydrateFlavor<Context>` on the bot context gives access to `ctx.message.delete()` etc. The `sent.message_id` field on the reply object is directly accessible as a number without a cast once the return type is `Message` (which `ctx.reply()` already returns). No cast needed, just remove the intermediate `String(...)` workaround or read `sent.message_id` directly.

## Open Questions

None — all decisions are straightforward for this scope.
