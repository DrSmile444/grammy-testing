## ADDED Requirements

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

The system SHALL provide `user.sendCommand(command, args?)` that dispatches a text message whose `text` is the command (with the optional `args` appended after a space) and whose `entities` array contains a `bot_command` entity at offset `0` with the command's length. The leading `/` SHALL be added automatically if not present in `command`.

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

### Requirement: User actions await full middleware settle

Every `user.send*` action SHALL return a Promise that resolves only after `bot.handleUpdate` has settled — every middleware in the chain has run, every awaited outgoing API call has been captured. This matches the v0.1 semantics for `bot.handleUpdate` and integrates naturally with `chats.idle()` for fire-and-forget API calls.

#### Scenario: Awaiting send waits for handler to finish

- **WHEN** the bot has `bot.on('message:text', async ctx => { await ctx.reply('hi'); await ctx.reply('twice'); })`
- **AND** the test calls `await user.sendText('trigger')`
- **THEN** `chats.outgoing.getMethods()` contains `'sendMessage'` twice already (no `chats.idle()` needed)
