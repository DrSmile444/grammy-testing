# relay-message-dispatch Specification

## Purpose

Defines the `postRelayMessage` verb on `Group` and `Supergroup` actors, which dispatches a
synthetic message update where `message.from` is the Telegram relay identity (id `777_000`).
Also defines the exported `TELEGRAM_RELAY` constant for use in test assertions.

## Requirements

### Requirement: `group.postRelayMessage` dispatches a Telegram relay message

The system SHALL provide `group.postRelayMessage(text, options?)` on both `Group` and `Supergroup`
that constructs a synthetic `message` update where `message.from` is the Telegram relay identity
(`id: 777_000`, `is_bot: true`, `first_name: 'Telegram'`, `username: 'telegram'`) and dispatches
it via `bot.handleUpdate`. The call SHALL resolve with the dispatched `Message` object.

`options.messageId` MAY override the auto-generated message ID.
`options.channel` MAY supply a `Channel` whose `toTelegramChat()` result is set as
`message.forward_origin.chat` (type `'channel'`) to simulate a relayed channel post.

#### Scenario: Bot receives relay message with from.id === 777_000

- **WHEN** the test calls `await group.postRelayMessage('channel post')`
- **AND** the bot has a handler that checks `ctx.message.from?.id`
- **THEN** the handler observes `ctx.message.from.id === 777_000`
- **AND** `ctx.message.text` equals `'channel post'`
- **AND** `ctx.message.chat.id` equals `group.id`

#### Scenario: Returns the dispatched Message with correct message_id

- **WHEN** the test calls `const relay = await group.postRelayMessage('channel post')`
- **THEN** `relay.message_id` is a positive integer
- **AND** `relay.from.id` equals `777_000`

#### Scenario: Returned Message is usable as reply_to_message

- **WHEN** the test calls `const relay = await group.postRelayMessage('channel post')`
- **AND** then calls `await user.sendText('my comment', { chat: group, reply_to_message: relay })`
- **THEN** the bot receives the user's message with `ctx.message.reply_to_message.message_id` equal to `relay.message_id`
- **AND** `ctx.message.reply_to_message.from.id` equals `777_000`

#### Scenario: options.messageId overrides the auto-generated ID

- **WHEN** the test calls `const relay = await group.postRelayMessage('channel post', { messageId: 100 })`
- **THEN** `relay.message_id` equals `100`

#### Scenario: options.channel sets forward_origin

- **WHEN** the test creates `const channel = chats.newChannel('My Channel')` and calls
  `await group.postRelayMessage('post text', { channel })`
- **AND** the bot reads `ctx.message.forward_origin`
- **THEN** `ctx.message.forward_origin.type` equals `'channel'`
- **AND** the chat ID in `forward_origin` equals `channel.id`

### Requirement: `TELEGRAM_RELAY` constant is exported for assertions

The system SHALL export a `TELEGRAM_RELAY` constant representing the relay user identity
(`{ id: 777_000, is_bot: true, first_name: 'Telegram', username: 'telegram' }`). Tests MAY
use this constant in `expect(ctx.message.from).toMatchObject(TELEGRAM_RELAY)` assertions
instead of hard-coding the magic number.

#### Scenario: TELEGRAM_RELAY matches the from field of a relay message

- **WHEN** the test calls `const relay = await group.postRelayMessage('post')`
- **THEN** `relay.from` matches the `TELEGRAM_RELAY` constant
