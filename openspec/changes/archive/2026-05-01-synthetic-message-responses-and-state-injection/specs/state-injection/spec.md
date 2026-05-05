## ADDED Requirements

### Requirement: `prepareComposer` and `prepareMiddleware` accept a `state` option

`PrepareWithConstructorOptions` SHALL include an optional `state` field. When the context type `TContext` carries a `state` property, the field's type SHALL be `Partial<TContext['state']>`; when `TContext` has no `state`, the field SHALL be typed as `never` so that passing it is a TypeScript compile error.

When `state` is provided, a `mockState(state)` middleware SHALL be inserted before the composer or middleware under test so that `ctx.state` is pre-populated for every update dispatched in the test.

#### Scenario: ctx.state is accessible in the composer under test

- **WHEN** `prepareComposer(composer, { state: { isRussian: true } })` is called
- **AND** the composer reads `ctx.state.isRussian` during update handling
- **THEN** `ctx.state.isRussian` equals `true`

#### Scenario: ctx.state is accessible in the middleware under test

- **WHEN** `prepareMiddleware(middleware, { state: { score: 42 } })` is called
- **AND** the middleware reads `ctx.state.score` during update handling
- **THEN** `ctx.state.score` equals `42`

#### Scenario: State value is mutable and shared across updates

- **WHEN** `prepareComposer(composer, { state: { count: 0 } })` is called
- **AND** the test mutates the returned state reference between updates
- **THEN** each update receives the current value of the state object

#### Scenario: TypeScript rejects `state` when context type has no state field

- **WHEN** `prepareComposer<Context>(composer, { state: { anything: 1 } })` is called with the base `Context` type (no `state`)
- **THEN** the TypeScript compiler emits a type error

### Requirement: `prepareBot` does NOT accept a `state` option

`PrepareOptions` (used exclusively by `prepareBot`) SHALL NOT include a `state` field. Bot test authors who need state injection SHALL insert a `mockState` middleware manually before any bot handlers are registered.

#### Scenario: TypeScript rejects `state` in prepareBot options

- **WHEN** `prepareBot(bot, { state: { anything: 1 } } as any)` is attempted
- **THEN** the TypeScript compiler emits a type error (field does not exist on `PrepareOptions`)
