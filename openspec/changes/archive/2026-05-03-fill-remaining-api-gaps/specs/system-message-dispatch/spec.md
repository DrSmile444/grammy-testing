## ADDED Requirements

### Requirement: `sendSystemMessage` dispatches a message update with no `from` field

`Group`, `Supergroup`, and `Channel` SHALL each provide `sendSystemMessage(text, options?)` that constructs a synthetic `Update` carrying a `message` with `text` set and `from` intentionally absent. This replicates the wire format Telegram sends for certain service and system messages (e.g. automatic system notifications, some pinned-message service messages) that have no sender identity. The method SHALL dispatch via `bot.handleUpdate` and resolve once the resulting middleware chain settles.

The optional `options.messageId` field SHALL be used as the `message_id` when supplied; otherwise a synthetic ID SHALL be auto-generated. No `sender_chat` is set (Telegram does not set it for the senderless pattern).

#### Scenario: Group.sendSystemMessage dispatches update with no from

- **WHEN** the test calls `await group.sendSystemMessage('no sender text')`
- **AND** the bot has a `bot.on('message', ctx => { ... })` handler
- **THEN** the handler runs
- **AND** `ctx.message.text` equals `'no sender text'`
- **AND** `ctx.message.from` is `undefined`

#### Scenario: Supergroup.sendSystemMessage dispatches update with no from

- **WHEN** the test calls `await supergroup.sendSystemMessage('system notice')`
- **THEN** the dispatched update's `message.from` is `undefined`
- **AND** `message.text` equals `'system notice'`

#### Scenario: Channel.sendSystemMessage dispatches update with no from

- **WHEN** the test calls `await channel.sendSystemMessage('channel notice')`
- **THEN** the dispatched update's `message.from` is `undefined`
- **AND** `message.text` equals `'channel notice'`

#### Scenario: options.messageId is reflected in the dispatched update

- **WHEN** the test calls `await group.sendSystemMessage('text', { messageId: 42 })`
- **THEN** the dispatched update's `message.message_id` equals `42`

#### Scenario: message_id is auto-generated when options.messageId is omitted

- **WHEN** the test calls `await group.sendSystemMessage('text')`
- **THEN** the dispatched update's `message.message_id` is a positive integer greater than zero

#### Scenario: chat field matches the sending chat

- **WHEN** the test calls `await group.sendSystemMessage('text')` where group has a specific id
- **THEN** the dispatched update's `message.chat.id` equals `group.id`

### Requirement: `SendSystemMessageOptions` is exported as a named type

The package SHALL export `interface SendSystemMessageOptions { messageId?: number; }` so test authors can reference the type when building helpers or fixtures.

#### Scenario: SendSystemMessageOptions is importable

- **WHEN** a test file imports `{ SendSystemMessageOptions }` from `'grammy-testing'`
- **THEN** the import resolves without error and the type can be used for variable annotations
