## MODIFIED Requirements

### Requirement: `prepareComposer` initializes a single composer for in-process testing

The system SHALL expose `prepareComposer(composer, options?)` that wraps the composer in an internal `Bot`, performs the same setup as `prepareBot`, and resolves to `{ chats }`. The composer's middleware SHALL run when updates are dispatched.

When `options.state` is provided, a `mockState(options.state)` middleware SHALL be inserted into the internal bot BEFORE `bot.use(composer)` so that `ctx.state` is pre-populated for all updates handled by the composer.

#### Scenario: Drives a composer in isolation

- **WHEN** the test creates a `Composer` that registers a `command("ping")` handler
- **AND** calls `await prepareComposer(composer)`
- **AND** dispatches a private message update with text `"/ping"` and a `bot_command` entity
- **THEN** the registered handler runs and any `ctx.reply(...)` call lands in `chats.outgoing.requests`

#### Scenario: State is pre-populated before the composer runs

- **WHEN** `prepareComposer(composer, { state: { isRussian: true } })` is called
- **AND** the composer reads `ctx.state.isRussian` in its handler
- **THEN** `ctx.state.isRussian` equals `true`

### Requirement: `prepareMiddleware` initializes a single middleware function for in-process testing

The system SHALL expose `prepareMiddleware(middleware, options?)` that wraps the middleware function in an internal `Bot`, performs the same setup as `prepareBot`, and resolves to `{ chats }`. The middleware function SHALL run for every dispatched update.

When `options.state` is provided, a `mockState(options.state)` middleware SHALL be inserted into the internal bot BEFORE `bot.use(middleware)` so that `ctx.state` is pre-populated for all updates handled by the middleware.

#### Scenario: Drives a single middleware function

- **WHEN** the test calls `await prepareMiddleware(async (ctx, next) => { await ctx.reply("hi"); await next(); })`
- **AND** dispatches any update via `bot.handleUpdate`
- **THEN** `chats.outgoing.requests` contains a `sendMessage` entry whose payload `text` equals `"hi"`

#### Scenario: State is pre-populated before the middleware runs

- **WHEN** `prepareMiddleware(middleware, { state: { score: 42 } })` is called
- **AND** the middleware reads `ctx.state.score` during handling
- **THEN** `ctx.state.score` equals `42`
