## ADDED Requirements

### Requirement: `prepareBot` initializes a bot for in-process testing

The system SHALL expose `prepareBot(bot, options?)` that installs an outgoing-API transformer, sets a default `botInfo`, awaits `bot.init()`, and resolves to `{ chats }`. After resolution, the bot under test SHALL be ready to receive updates via `bot.handleUpdate` and the test author SHALL be able to access captured outgoing requests via `chats.outgoing`.

#### Scenario: Resolves with a chats handle after init

- **WHEN** the test calls `await prepareBot(bot)` on a fresh `Bot` instance
- **THEN** the returned object has a `chats` property
- **AND** `bot.botInfo` is populated with the default `genericUserBot` fixture
- **AND** the transformer captures any subsequent `bot.api.*` call

#### Scenario: Pre-populates botInfo without an extra getMe round-trip

- **WHEN** the test calls `await prepareBot(bot)` on a fresh `Bot` instance
- **THEN** `bot.botInfo` is populated with the default fixture
- **AND** `chats.outgoing.requests` is empty (no API calls made during setup, because pre-setting `botInfo` short-circuits `bot.init()`'s getMe)

#### Scenario: Accepts canned responses option

- **WHEN** the test calls `await prepareBot(bot, { responses: { getChat: { id: 1, type: "private" } } })`
- **AND** the bot subsequently calls `ctx.api.getChat(...)`
- **THEN** the call resolves with `{ id: 1, type: "private" }` without leaving the test process

### Requirement: `prepareComposer` initializes a single composer for in-process testing

The system SHALL expose `prepareComposer(composer, options?)` that wraps the composer in an internal `Bot`, performs the same setup as `prepareBot`, and resolves to `{ chats }`. The composer's middleware SHALL run when updates are dispatched.

#### Scenario: Drives a composer in isolation

- **WHEN** the test creates a `Composer` that registers a `command("ping")` handler
- **AND** calls `await prepareComposer(composer)`
- **AND** dispatches a private message update with text `"/ping"` and a `bot_command` entity
- **THEN** the registered handler runs and any `ctx.reply(...)` call lands in `chats.outgoing.requests`

### Requirement: `prepareMiddleware` initializes a single middleware function for in-process testing

The system SHALL expose `prepareMiddleware(middleware, options?)` that wraps the middleware function in an internal `Bot`, performs the same setup as `prepareBot`, and resolves to `{ chats }`. The middleware function SHALL run for every dispatched update.

#### Scenario: Drives a single middleware function

- **WHEN** the test calls `await prepareMiddleware(async (ctx, next) => { await ctx.reply("hi"); await next(); })`
- **AND** dispatches any update via `bot.handleUpdate`
- **THEN** `chats.outgoing.requests` contains a `sendMessage` entry whose payload `text` equals `"hi"`

### Requirement: `chats.idle()` resolves only after tracked transformer promises settle

The system SHALL expose `chats.idle()` that returns a `Promise<void>` resolving once every promise returned through the captured outgoing-API transformer has settled. Promises returned from `ctx.api.*` calls (whether awaited by the bot or fire-and-forget) SHALL be tracked. Work scheduled outside the transformer (e.g. `setTimeout`, `setImmediate`, raw promise creation) SHALL NOT be tracked.

#### Scenario: Awaiting handleUpdate is enough for awaited API calls

- **WHEN** middleware does `await ctx.reply("hi")`
- **AND** the test does `await bot.handleUpdate(update)`
- **THEN** `chats.outgoing.requests` already contains the `sendMessage` entry without calling `chats.idle()`

#### Scenario: chats.idle() catches unawaited API calls

- **WHEN** middleware does `void ctx.api.sendMessage(chat_id, "hi")` (no `await`)
- **AND** the test does `await bot.handleUpdate(update)`
- **AND** the test then does `await chats.idle()`
- **THEN** `chats.outgoing.requests` contains the `sendMessage` entry by the time `idle()` resolves

#### Scenario: chats.idle() does not wait for setTimeout-scheduled work

- **WHEN** middleware schedules `setTimeout(() => ctx.api.sendMessage(...), 60_000)` without using fake timers
- **AND** the test does `await bot.handleUpdate(update)` and `await chats.idle()`
- **THEN** the `sendMessage` entry is NOT in `chats.outgoing.requests` yet
- **AND** the test must combine `chats.idle()` with the runner's fake-timer advance to observe the call

### Requirement: All three entry points return the same shape

The system SHALL ensure that `prepareBot`, `prepareComposer`, and `prepareMiddleware` all resolve to a value with the same `{ chats }` shape, where `chats` exposes at minimum: `chats.outgoing` (the `OutgoingRequests` collector) and `chats.idle()` (the async settle helper).

#### Scenario: Identical surface across entry points

- **WHEN** the test calls each of `prepareBot`, `prepareComposer`, `prepareMiddleware`
- **THEN** the resolved `chats` value exposes `outgoing` and `idle` on each
- **AND** code that asserts against `chats.outgoing.requests` works identically regardless of entry point
