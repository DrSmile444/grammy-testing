# user-actor Specification

## Purpose
TBD - created by archiving change add-high-level-chats-api. Update Purpose after archive.
## Requirements
### Requirement: `user.sendText` dispatches a text message update

The system SHALL provide `user.sendText(text, options?)` that constructs a synthetic `Update` carrying a text message authored by this user, dispatches it via `bot.handleUpdate`, and resolves once the resulting middleware chain settles. The destination chat SHALL default to a private chat between the bot and this user (creating it lazily on first send if none was explicitly minted). `options.chat` MAY override the destination with any `Chat` minted via the orchestrator. `options` MAY also include `entities`, `parse_mode`, `reply_parameters`, or other text-message options that pass through to the constructed update.

#### Scenario: Sends text to a private chat by default

- **WHEN** a test creates `const user = chats.newUser()` and calls `await user.sendText('hello')`
- **AND** the bot under test has a `bot.on('message:text', ctx => ctx.reply('echo'))` handler
- **THEN** the bot's handler runs
- **AND** `chats.outgoing.getLast()?.method` equals `'sendMessage'`

#### Scenario: Honors entity overrides

- **WHEN** the test calls `await user.sendText('Hi @bob', { entities: [{ type: 'mention', offset: 3, length: 4 }] })`
- **THEN** the dispatched update's `message.entities` equals the supplied array

### Requirement: `user.sendMessage` is an alias for `sendText`

The system SHALL provide `user.sendMessage(text, options?)` as an alias of `user.sendText(text, options?)`. Behavior SHALL be identical.

#### Scenario: sendMessage dispatches identically to sendText

- **WHEN** the test calls `await user.sendMessage('hi')`
- **THEN** the resulting captured request method equals `'sendMessage'` (from the bot's reply, if any)
- **AND** the test could substitute `user.sendText('hi')` without observable difference

### Requirement: `user.sendCommand` auto-emits the bot_command entity

The system SHALL provide `user.sendCommand(command, args?, options?)` that dispatches a text message whose `text` is the command (with the optional `args` appended after a space) and whose `entities` array contains a `bot_command` entity at offset `0` with the command's length. The leading `/` SHALL be added automatically if not present in `command`. The optional `options.chat` parameter MAY override the default destination (the user's private chat) with any `Group` or `Supergroup` minted via the orchestrator.

#### Scenario: Builds /start command with bot_command entity

- **WHEN** the test calls `await user.sendCommand('/start')`
- **THEN** the dispatched update's `message.text` equals `'/start'`
- **AND** the dispatched update's `message.entities[0]` equals `{ type: 'bot_command', offset: 0, length: 6 }`

#### Scenario: Appends args after space

- **WHEN** the test calls `await user.sendCommand('/lang', 'en')`
- **THEN** the dispatched update's `message.text` equals `'/lang en'`
- **AND** the `bot_command` entity has `length: 5` (the `/lang` portion only)

#### Scenario: Adds leading slash when missing

- **WHEN** the test calls `await user.sendCommand('start')`
- **THEN** the dispatched update's `message.text` equals `'/start'`

#### Scenario: Dispatches into a non-private chat via options.chat

- **WHEN** the test creates `const group = chats.newSupergroup()` and calls `await user.sendCommand('/start', undefined, { chat: group })`
- **THEN** the dispatched update's `message.chat.id` equals `group.id`
- **AND** the dispatched update's `message.chat.type` equals `'supergroup'`
- **AND** the dispatched update's `message.entities[0]` equals `{ type: 'bot_command', offset: 0, length: 6 }`

#### Scenario: Honors args together with options.chat

- **WHEN** the test calls `await user.sendCommand('/lang', 'en', { chat: group })`
- **THEN** the dispatched update's `message.text` equals `'/lang en'`
- **AND** the dispatched update's `message.chat.id` equals `group.id`
- **AND** the `bot_command` entity has `length: 5`

### Requirement: User actions await full middleware settle

Every `user.send*` action SHALL return a Promise that resolves only after `bot.handleUpdate` has settled — every middleware in the chain has run, every awaited outgoing API call has been captured. This matches the v0.1 semantics for `bot.handleUpdate` and integrates naturally with `chats.idle()` for fire-and-forget API calls.

#### Scenario: Awaiting send waits for handler to finish

- **WHEN** the bot has `bot.on('message:text', async ctx => { await ctx.reply('hi'); await ctx.reply('twice'); })`
- **AND** the test calls `await user.sendText('trigger')`
- **THEN** `chats.outgoing.getMethods()` contains `'sendMessage'` twice already (no `chats.idle()` needed)

### Requirement: `user.joinChat` dispatches a `new_chat_members` service message

The system SHALL provide `user.joinChat(chat)` that constructs a synthetic `Update` carrying a service message in the target chat with `from = user`, `new_chat_members = [user]`, and dispatches it via `bot.handleUpdate`. The call SHALL resolve once the resulting middleware chain settles. The target SHALL be a `Group` or `Supergroup`; calling on private chats or channels SHALL throw a clear error.

#### Scenario: Bot's `message:new_chat_members` handler observes a self-join

- **WHEN** the test creates `const user = chats.newUser({ username: 'alice' })` and `const group = chats.newSupergroup()`
- **AND** the bot has `bot.on('message:new_chat_members', async (ctx) => { /* ... */ })` registered
- **AND** the test calls `await user.joinChat(group)`
- **THEN** the handler runs
- **AND** the dispatched update's `message.new_chat_members[0].id` equals `user.id`
- **AND** the dispatched update's `message.from.id` equals `user.id`

#### Scenario: Throws when target is a private chat

- **WHEN** the test calls `await user.joinChat(privateChat)`
- **THEN** the call rejects with an error indicating private chats do not support join service messages

### Requirement: `user.leaveChat` dispatches a `left_chat_member` service message

The system SHALL provide `user.leaveChat(chat)` that constructs a synthetic `Update` carrying a service message in the target chat with `from = user`, `left_chat_member = user`, and dispatches it via `bot.handleUpdate`. The call SHALL resolve once the resulting middleware chain settles. The target SHALL be a `Group` or `Supergroup`; calling on private chats or channels SHALL throw a clear error.

#### Scenario: Bot's `message:left_chat_member` handler observes a self-leave

- **WHEN** the test creates `const user = chats.newUser()` and `const group = chats.newSupergroup()`
- **AND** the bot has `bot.on('message:left_chat_member', async (ctx) => { /* ... */ })` registered
- **AND** the test calls `await user.leaveChat(group)`
- **THEN** the handler runs
- **AND** the dispatched update's `message.left_chat_member.id` equals `user.id`
- **AND** the dispatched update's `message.from.id` equals `user.id`

#### Scenario: Throws when target is a private chat or channel

- **WHEN** the test calls `await user.leaveChat(privateChat)` or `await user.leaveChat(channel)`
- **THEN** the call rejects with an error indicating that chat type does not support leave service messages

