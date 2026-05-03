## ADDED Requirements

### Requirement: `SendTextOptions.reply_to_message` accepts a partial Message shape

`SendTextOptions.reply_to_message` SHALL accept `Partial<Message> & { message_id: number }` —
only `message_id` is required. When `date` is absent, the library SHALL auto-fill it with the
current Unix timestamp (`Math.floor(Date.now() / 1000)`). When `chat` is absent, the library
SHALL auto-fill it with the resolved target chat (the same chat the message is being sent to).
All other fields from the supplied partial SHALL be spread into the constructed
`reply_to_message` as-is.

This change eliminates the need for `as any` casts when constructing `reply_to_message` shapes.
Callers that already supply a complete `Message` object SHALL be unaffected.

#### Scenario: Partial shape with only message_id is accepted without as any

- **WHEN** the test calls `await user.sendText('reply', { chat: group, reply_to_message: { message_id: 42 } })`
- **THEN** TypeScript compiles without error and without an `as any` cast
- **AND** the bot receives `ctx.message.reply_to_message.message_id === 42`
- **AND** `ctx.message.reply_to_message.chat.id` equals `group.id`

#### Scenario: date is auto-filled when absent

- **WHEN** the test calls `await user.sendText('reply', { reply_to_message: { message_id: 5 } })`
- **AND** the bot reads `ctx.message.reply_to_message.date`
- **THEN** the value is a positive Unix timestamp (approximately current time)

#### Scenario: Explicit fields in the partial are preserved

- **WHEN** the test calls:
  `await user.sendText('comment', { chat: group, reply_to_message: { message_id: 100, from: TELEGRAM_RELAY, text: 'original post' } })`
- **THEN** `ctx.message.reply_to_message.from.id` equals `777_000`
- **AND** `ctx.message.reply_to_message.text` equals `'original post'`

#### Scenario: Full Message object still accepted unchanged

- **WHEN** a test passes a complete `Message` object to `reply_to_message` (no `as any`)
- **THEN** it compiles and the bot receives the full shape without modification
