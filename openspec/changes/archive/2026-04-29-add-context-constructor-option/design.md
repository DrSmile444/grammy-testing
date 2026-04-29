## Context

`prepareComposer` and `prepareMiddleware` are convenience entry points that wrap a composer/middleware in an internal bot. They currently call `new Bot<TContext>('test-token')` with no `BotConfig`, so grammy always uses the base `Context` constructor. Users with class-based custom contexts — those that register a `ContextConstructor` in grammy's `BotConfig` — get incorrect runtime behavior: TypeScript sees `TContext` but the actual context object is a plain `Context` instance.

`prepareBot` is unaffected: the caller supplies the already-configured bot.

## Goals / Non-Goals

**Goals:**
- Allow `prepareComposer` and `prepareMiddleware` to accept a `ContextConstructor` and forward it to the internal bot
- Keep the API minimal and backward-compatible — no new required parameters
- Share a single options type between both functions

**Non-Goals:**
- Exposing other `BotConfig` fields (`client`, `botInfo`) — `botInfo` is overridden by the test harness anyway; `client` has no meaning in tests
- Changing `prepareBot` — the bot is passed in, so the constructor is already baked in

## Decisions

### Single shared options type: `PrepareWithConstructorOptions<TContext>`

Introduce one new exported type that extends `PrepareOptions`:

```typescript
export interface PrepareWithConstructorOptions<TContext extends Context = Context>
  extends PrepareOptions {
  ContextConstructor?: new (...args: ConstructorParameters<typeof Context>) => TContext;
}
```

**Why not add `ContextConstructor` directly to `PrepareOptions`?**  
`PrepareOptions` is non-generic and used by `prepareBot` too. Making it generic would be a breaking type-level change for all callers that import `PrepareOptions`. A separate type is cleaner.

**Why not accept full `BotConfig<TContext>`?**  
`BotConfig` exposes `botInfo` (silently overridden in the harness) and `client` (irrelevant in tests). Exposing them invites confusion. Pinning to just `ContextConstructor` keeps the surface honest.

### Constraint mirrors grammy exactly

The type constraint `new (...args: ConstructorParameters<typeof Context>) => TContext` is copied verbatim from `BotConfig<C>`. This ensures any class that grammy accepts will also be accepted here — no weaker or stronger constraint.

### Forward via BotConfig argument

Inside both functions:
```typescript
const bot = new Bot<TContext>('test-token', {
  ContextConstructor: options.ContextConstructor,
});
```

Only pass `ContextConstructor` — do not forward other fields from `PrepareWithConstructorOptions`.

## Risks / Trade-offs

- **No risk to existing callers** — new field is optional, functions' signatures remain source-compatible
- **`prepareMiddleware`/`prepareComposer` still can't support context constructors with a non-standard signature** — but `ContextConstructor` in grammy is already constrained to `ConstructorParameters<typeof Context>`, so any valid grammy custom context is covered
