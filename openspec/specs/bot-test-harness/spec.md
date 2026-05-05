# bot-test-harness Specification

## Purpose

TBD - created by archiving change add-low-level-testing-primitives. Update Purpose after archive.

## Requirements

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

### Requirement: `chats` exposes the v0.2 orchestrator surface

In addition to the v0.1 `outgoing` and `idle` members, the `chats` value returned by every entry point (`prepareBot`, `prepareComposer`, `prepareMiddleware`) SHALL expose the v0.2 orchestrator surface — `newUser`, `newAdmin`, `newPrivateChat`, `newGroup`, `newSupergroup`, `newChannel` (per the `chats-orchestrator` capability) — as well as iteration accessors for participants and chats minted on this instance.

This requirement extends the v0.1 "All three entry points return the same shape" requirement; the existing v0.1 requirements (capture, idle, canned responses, entry-point parity) remain unchanged.

#### Scenario: Entry-point chats has v0.2 surface

- **WHEN** the test calls `await prepareBot(bot)` and inspects `chats`
- **THEN** `chats.newUser` is a function
- **AND** `chats.newAdmin` is a function
- **AND** `chats.newPrivateChat` is a function
- **AND** `chats.newGroup` is a function
- **AND** `chats.newSupergroup` is a function
- **AND** `chats.newChannel` is a function

#### Scenario: All three entry points yield the v0.2 surface uniformly

- **WHEN** the test calls each of `prepareBot`, `prepareComposer`, `prepareMiddleware` and inspects each returned `chats`
- **THEN** each `chats` exposes the same v0.2 orchestrator surface
- **AND** code that calls `chats.newUser()` works identically regardless of entry point

### Requirement: `IdGenerator` provides instance-scoped update IDs

`IdGenerator` SHALL expose a `nextUpdateId(): number` method that returns monotonically increasing integers drawn from a dedicated range (`1_000_000+`). This range SHALL be distinct from the message-ID range (starts at 1) to avoid collisions in test assertions.

All update IDs generated during dispatch — including `my_chat_member`, `chat_member`, service messages, channel posts, reaction counts, and business-account updates — SHALL be drawn from the `Chats`-instance's `IdGenerator` rather than from module-level counters.

#### Scenario: nextUpdateId returns unique values

- **WHEN** the test calls `ids.nextUpdateId()` multiple times on the same `IdGenerator` instance
- **THEN** each call returns a value greater than the previous
- **AND** no two calls return the same value

#### Scenario: Update IDs do not bleed between test runs

- **WHEN** two separate `Chats` instances are created in the same process (e.g., two test cases in the same file)
- **AND** each instance dispatches a `my_chat_member` update
- **THEN** both dispatches succeed
- **AND** the `update_id` values are independently monotonic per instance (the second test does not see values offset by the first test's dispatches)

### Requirement: Group, Supergroup, and Channel receive `ids` at construction

`Group`, `Supergroup`, and `Channel` SHALL accept an `ids: IdGenerator` parameter at construction time. `Chats.registerChat()` SHALL pass `this.ids` to each chat it registers. The `ids` instance SHALL be used exclusively for generating update IDs in dispatch calls originating from those chats, eliminating all module-level counters in `group.ts`, `supergroup.ts`, `channel.ts`, and `dispatch.ts`.

#### Scenario: Chats passes its IdGenerator to registered chats

- **WHEN** the test calls `chats.newGroup()`, `chats.newSupergroup()`, or `chats.newChannel()`
- **THEN** the returned chat holds a reference to the same `IdGenerator` as `chats.outgoing` (i.e., the one owned by the `Chats` instance)
- **AND** any subsequent dispatch from that chat uses `ids.nextUpdateId()` for the `update_id`

### Requirement: `IdGenerator` provides instance-scoped message IDs

`IdGenerator` SHALL expose a `nextMessageId(): number` method that returns monotonically increasing integers starting at `1`. This counter SHALL be independent of the update-ID counter (`nextUpdateId()`), so message IDs and update IDs do not share state.

#### Scenario: nextMessageId starts at 1 and increments independently

- **WHEN** a fresh `IdGenerator` is created
- **AND** the test calls `ids.nextMessageId()` followed by `ids.nextUpdateId()`
- **THEN** the first `nextMessageId()` call returns `1`
- **AND** the first `nextUpdateId()` call returns its own starting value (in the `1_000_000+` range)
- **AND** neither counter affects the other

### Requirement: `Chats.dispatchPollState` has no module-level or unused instance counter

The `dispatchPollState` method (and any helpers it delegates to) SHALL derive all IDs exclusively from the `Chats`-instance's `IdGenerator`. There SHALL be no module-level counter variable and no unused instance-level counter field associated with poll-state dispatch.

#### Scenario: Poll-state dispatch uses only the instance IdGenerator

- **WHEN** `chats.dispatchPollState(...)` is called on a `Chats` instance
- **THEN** the resulting `update_id` is produced by `this.ids.nextUpdateId()`
- **AND** no module-level counter is incremented as a side-effect
