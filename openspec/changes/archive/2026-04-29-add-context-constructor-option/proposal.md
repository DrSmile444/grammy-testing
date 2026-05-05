## Why

`prepareComposer` and `prepareMiddleware` internally create `new Bot<TContext>('test-token')` with no config, so the `ContextConstructor` is always the base `Context` class at runtime. Bots that use a class-based custom context (registering a `ContextConstructor` in `BotConfig`) cannot use these two entry points — TypeScript says the right type but the wrong class is instantiated.

## What Changes

- Add an optional `ContextConstructor` field to the options accepted by `prepareComposer` and `prepareMiddleware`
- Both functions forward it when constructing the internal `Bot`
- Introduce a shared `PrepareWithConstructorOptions<TContext>` type that extends the existing `PrepareOptions`
- No changes to `prepareBot` (the bot is passed in, so `ContextConstructor` is already baked in)

## Capabilities

### New Capabilities

- `context-constructor-option`: `prepareComposer` and `prepareMiddleware` accept a `ContextConstructor` option, forwarded to the internal `Bot` construction so class-based custom contexts work at runtime

### Modified Capabilities

<!-- No existing spec-level requirement changes -->

## Impact

- `src/low-level/prepare-composer.ts` — new options type, forward `ContextConstructor`
- `src/low-level/prepare-middleware.ts` — same
- `src/index.ts` — export new options types
- Minor version bump: `0.4.1 → 0.5.0` (backward-compatible new feature)
