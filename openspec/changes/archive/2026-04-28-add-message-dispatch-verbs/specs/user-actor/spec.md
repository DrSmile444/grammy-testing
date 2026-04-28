## ADDED Requirements

### Requirement: `user.sendForwarded` dispatches a message with forward_origin set

The system SHALL provide `user.sendForwarded(text, options)` where `options.forwardOrigin` is a `MessageOrigin` value (required) and `options.chat` optionally overrides the destination chat. The verb SHALL construct a synthetic text message `Update` with `message.forward_origin` populated to the supplied value and dispatch it via `bot.handleUpdate`. The destination SHALL default to the user's private chat when `options.chat` is omitted.

#### Scenario: Bot detects forward_origin and reacts

- **WHEN** the test calls `await user.sendForwarded('some text', { forwardOrigin: { type: 'user', sender_user: { id: 99, is_bot: false, first_name: 'Orig' }, date: 1_000_000 } })`
- **AND** the bot has a handler that checks `context.message.forward_origin`
- **THEN** the handler observes `forward_origin.type` equals `'user'`
- **AND** the handler observes `forward_origin.sender_user.id` equals `99`

#### Scenario: Dispatches into a non-private chat via options.chat

- **WHEN** the test creates `const group = chats.newSupergroup()` and calls `await user.sendForwarded('text', { forwardOrigin: ..., chat: group })`
- **THEN** the dispatched update's `message.chat.id` equals `group.id`

### Requirement: `user.editMessage` dispatches an edited_message update

The system SHALL provide `user.editMessage(messageId, text, options?)` that constructs a synthetic `Update` with the `edited_message` field populated (not `message`). The `edited_message` SHALL carry the supplied `messageId`, the new `text`, and the user as `from`. The optional `options.chat` MAY override the destination; it SHALL default to the user's private chat. The call SHALL resolve once the resulting middleware chain settles.

#### Scenario: Bot's edited_message handler observes the new text

- **WHEN** the test calls `await user.editMessage(50, 'edited content', { chat: dm })`
- **AND** the bot has `bot.on('edited_message', ctx => { ... })` registered
- **THEN** the handler runs
- **AND** `ctx.editedMessage.text` equals `'edited content'`
- **AND** `ctx.editedMessage.message_id` equals `50`

#### Scenario: Defaults to the user's private chat when chat is omitted

- **WHEN** the test calls `await user.editMessage(10, 'new text')` without specifying a chat
- **THEN** the dispatched update's `edited_message.chat.id` equals the user's private chat id
