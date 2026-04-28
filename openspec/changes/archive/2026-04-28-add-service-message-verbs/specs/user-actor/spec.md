## ADDED Requirements

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
