## Context

The library installs its mock transformer via `bot.api.config.use()` inside `prepareBot`. In grammY, `use()` always appends to the transformer array, and the **last element is outermost** (called first). Because `prepareBot` runs after the user has already configured their bot, the library ends up outermost and its terminal mock never calls `_previous`, so user-installed transformers are skipped.

Key grammY internals confirmed from source inspection:

- `bot.api.config.installedTransformers()` returns a `.slice()` — a copy, not the live array.
- `bot.api.config.use(...t)` appends to the live array AND updates `client.call` (the accumulated chain function).
- Per update, grammY creates a fresh `Api`, calls `bot.api.config.installedTransformers()`, and reinstalls them in array order via `api.config.use(...t)`. The **last element in the array becomes the outermost transformer**.
- Therefore: to make the library innermost, it must be at **index 0** in `installedTransformers`.

## Goals / Non-Goals

**Goals:**

- Library transformer is always innermost regardless of when user transformers were installed
- All bot-level transformers (`hydrateFiles`, `hydrateApi`, `autoRetry`, etc.) execute and receive synthetic responses
- Default synthetic `getFile` response is a realistic `File` shape so hydrators have something to process
- Full test and documentation coverage for `@grammyjs/files`, `@grammyjs/hydrate`, `@grammyjs/auto-retry`
- VitePress Plugins section replaces the plugin entries currently in Recipes

**Non-Goals:**

- Supporting context-level `ctx.api.config.use()` ordering (already works correctly — hydrate middleware installs on top of the per-request chain which already includes the library)
- Upstreaming a `config.prepend()` API to grammY (desirable long-term, not in scope here)
- Changing the public `prepareBot` API signature

## Decisions

### Decision: Snapshot-and-reinstall approach for chain reordering

**Chosen:** At `prepareBot` time, snapshot existing transformers before installing the library's, then reinstall user transformers on top.

```ts
const existing = bot.api.config.installedTransformers(); // COPY [userT1, userT2]
bot.api.config.use(createTransformer(...));              // array: [libraryT]
if (existing.length > 0) {
  bot.api.config.use(...existing);                       // array: [libraryT, userT1, userT2]
}
```

Per update, grammY does `api.config.use(libraryT, userT1, userT2)` which builds:
`userT2 → userT1 → libraryT → HTTP` — library is innermost. ✅

**Alternatives considered:**

- **Prepend via `(bot as any)` internals**: accessing the private `client.installedTransformers` array to `unshift`. Works, but grammY internals may change without notice.
- **Replace `bot.api`**: construct a new `Api` instance with library at the bottom. Requires private access to `bot.clientConfig` and reassigning `bot.api`.
- **Custom fetch mock**: replace `options.client.fetch` with a mock at bot construction time. Cleanest theoretically but requires users to use a `createTestBot()` factory, which is a breaking API change.

Snapshot-and-reinstall uses only the public `use()` and `installedTransformers()` methods. It is robust, deterministic, and requires no private access.

### Decision: Add realistic `getFile` default response to `buildDefaultResponses`

**Chosen:** `buildDefaultResponses` returns a minimal but valid `File` object for `getFile`:

```ts
getFile: () => ({
  file_id: 'test_file_id',
  file_unique_id: 'test_file_unique_id',
  file_size: 1024,
  file_path: 'documents/test_file.pdf',
});
```

This lets `hydrateFiles` add `getUrl()` / `download()` without requiring users to provide a `responses` override for basic test cases.

**Alternatives considered:** Keeping `true` and documenting that users must supply `responses`. Rejected because it places unnecessary burden on every user of `@grammyjs/files`.

### Decision: Dedicated Plugins section in VitePress, not expanded Recipes

**Chosen:** Create `site/plugins/` with its own sidebar group. Move `conversations-plugin.md` and `menu-plugin.md` from `site/recipes/` into it. Add four new pages (files, hydrate, auto-retry, transformer-throttler).

Recipes section retains only general-pattern pages: Sessions, Keyboards, Error Simulation, Multi-Chat, Fire & Forget.

**Alternatives considered:** Keeping all plugin docs under Recipes. Rejected because with 6 plugin pages, Recipes would be dominated by plugin content and the section name would mislead users looking for general patterns.

### Decision: No example for `@grammyjs/transformer-throttler`

**Chosen:** Throttler gets a documentation page only. No example.

**Rationale:** The throttler queues and delays API calls. A meaningful example would need to show timing behaviour, which is flaky in test suites. The documentation page covers the key caveat: once chain ordering is fixed, throttler-related delays will affect `idle()` wait times and tests should account for this.

## Risks / Trade-offs

- **Re-installing transformers doubles the `use()` calls**: `client.use()` both pushes to the array AND re-runs `reduce` over the existing chain. After the snapshot-reinstall, `client.call` is `existing[-1]→...→existing[0]→libraryT→HTTP` which is correct. There is no double-application because each `use()` call wraps the current accumulated function — it is idempotent in structure.

- **`bot.api.config.installedTransformers()` returns a copy**: If a user installs a transformer on `bot.api` _after_ `prepareBot` is called, that transformer is appended to the array normally (outermost). It will call `_previous` which chains down to the library. This is correct behaviour — no regression.

- **`autoRetry` timing in tests**: After chain fix, `autoRetry` will retry on simulated errors. A test that uses `failNext(..., 429)` expecting to observe the error will instead observe a retry delay. Documentation must explain this caveat and show how to test retry behaviour intentionally (use `maxRetryAttempts: 1`, provide a second `respondNext` for the retry).
