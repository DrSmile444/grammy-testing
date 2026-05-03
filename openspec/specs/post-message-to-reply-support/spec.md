# post-message-to-reply-support Specification

## Purpose

Defines the return-value behaviour and `reply_to_message` option for `channel.postMessageTo`,
making it consistent with all other send verbs in the library.

## Requirements

### Requirement: `channel.postMessageTo` returns the dispatched Message

`channel.postMessageTo(target, text, options?)` SHALL return `Promise<Message>` instead of
`Promise<void>`. The resolved value SHALL be the exact synthetic `Message` passed to
`bot.handleUpdate`, including the auto-assigned `message_id`, `date`, `chat`, `from`,
`sender_chat`, and `text` fields.

#### Scenario: Returns Message with correct message_id

- **WHEN** the test calls `const msg = await channel.postMessageTo(group, 'hello')`
- **THEN** `msg.message_id` is a positive integer
- **AND** `msg.text` equals `'hello'`
- **AND** `msg.chat.id` equals `group.id`

#### Scenario: options.messageId is reflected in the returned Message

- **WHEN** the test calls `const msg = await channel.postMessageTo(group, 'hello', { messageId: 55 })`
- **THEN** `msg.message_id` equals `55`

### Requirement: `postMessageTo` accepts a partial `reply_to_message` option

`channel.postMessageTo` options SHALL accept an optional `reply_to_message` field typed as
`Partial<Message> & { message_id: number }`. When provided, the dispatched message SHALL include
`reply_to_message` with the following auto-fill behaviour:

- `date` SHALL be set to the current Unix timestamp when absent from the caller's object
- `chat` SHALL be set to `target.toTelegramChat()` when absent from the caller's object
- All other fields explicitly supplied by the caller SHALL be preserved unchanged

#### Scenario: Auto-fills date and chat when reply_to_message has only message_id

- **WHEN** the test calls `await channel.postMessageTo(group, 'reply', { reply_to_message: { message_id: 10 } })`
- **AND** the bot handler reads `ctx.message.reply_to_message`
- **THEN** `reply_to_message.message_id` equals `10`
- **AND** `reply_to_message.chat.id` equals `group.id`
- **AND** `reply_to_message.date` is a positive integer (current Unix timestamp)

#### Scenario: Caller-supplied fields are preserved

- **WHEN** the caller provides `reply_to_message: { message_id: 7, text: 'original', from: { id: 777000, ... } }`
- **THEN** `reply_to_message.text` equals `'original'`
- **AND** `reply_to_message.from.id` equals `777000`

#### Scenario: Full Message object is accepted unchanged

- **WHEN** the caller passes a full `Message` returned from a prior `postRelayMessage` call as `reply_to_message`
- **THEN** the dispatched `reply_to_message.message_id` matches the prior relay message's `message_id`
