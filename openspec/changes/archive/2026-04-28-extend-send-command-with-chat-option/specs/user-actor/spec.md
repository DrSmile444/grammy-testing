## MODIFIED Requirements

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
