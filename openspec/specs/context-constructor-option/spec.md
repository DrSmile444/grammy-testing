### Requirement: `prepareComposer` and `prepareMiddleware` accept an optional `ContextConstructor`

`prepareComposer` and `prepareMiddleware` SHALL accept an optional `ContextConstructor` option (type: `new (...args: ConstructorParameters<typeof Context>) => TContext`) in their options parameter. When provided, the internal `Bot` SHALL be constructed with that `ContextConstructor`, so every update dispatched during the test instantiates the correct custom context class at runtime.

When `ContextConstructor` is omitted, behavior SHALL be identical to the current behavior (grammy uses the base `Context` class).

A shared exported type `PrepareWithConstructorOptions<TContext>` SHALL expose this option alongside the existing `responses` field from `PrepareOptions`.

#### Scenario: Class-based custom context is instantiated correctly via `prepareComposer`

- **WHEN** the user creates a `Composer<CustomCtx>` where `CustomCtx` has a property set in its class constructor
- **AND** calls `prepareComposer(composer, { ContextConstructor: CustomCtx })`
- **THEN** each update dispatched via the test user verbs (e.g. `user.sendText`) produces a context object that is an instance of `CustomCtx`
- **AND** the custom constructor-assigned property is accessible inside the middleware

#### Scenario: Class-based custom context is instantiated correctly via `prepareMiddleware`

- **WHEN** the user creates a `Middleware<CustomCtx>` relying on a class-based custom context
- **AND** calls `prepareMiddleware(middleware, { ContextConstructor: CustomCtx })`
- **THEN** each dispatched update produces a `CustomCtx` instance with constructor-assigned properties available

#### Scenario: Omitting `ContextConstructor` preserves existing behavior

- **WHEN** `prepareComposer` or `prepareMiddleware` is called without a `ContextConstructor` option
- **THEN** the function behaves identically to the current version — no runtime difference

#### Scenario: `responses` option still works alongside `ContextConstructor`

- **WHEN** `prepareComposer` is called with both `ContextConstructor` and `responses` options
- **THEN** both are applied: the custom constructor is used and the canned responses are returned
