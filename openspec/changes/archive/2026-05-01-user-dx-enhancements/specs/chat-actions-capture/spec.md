## ADDED Requirements

### Requirement: `chats.actionsFor(user)` returns a per-user chat-action log

The system SHALL provide `chats.actionsFor(user)` returning an `ActionsLog` that captures every `sendChatAction` API call routed to that user. Routing SHALL follow the same membership logic as `chats.repliesFor`: a `sendChatAction` targeted at a private chat is routed to the user whose `chat_id` matches; a `sendChatAction` targeted at a group or supergroup is routed to every active member of that chat. `ActionsLog` SHALL expose `.all` (read-only array of action strings), `.length` (number), and `.last` (`string | undefined`). Calling `chats.actionsFor(user)` for a user not minted by this `Chats` instance SHALL throw an `Error`.

#### Scenario: Captures typing indicator in private chat

- **WHEN** the bot calls `ctx.replyWithChatAction('typing')` in a private-chat handler
- **AND** the test has awaited `chats.idle()`
- **THEN** `chats.actionsFor(user).last` equals `'typing'`
- **AND** `chats.actionsFor(user).length` equals `1`

#### Scenario: Captures multiple actions in order

- **WHEN** the bot calls `sendChatAction('typing')` then `sendChatAction('upload_document')` sequentially
- **AND** the test has awaited `chats.idle()`
- **THEN** `chats.actionsFor(user).all` equals `['typing', 'upload_document']`

#### Scenario: Captures action for group member

- **WHEN** a user is an active member of a supergroup
- **AND** the bot sends `sendChatAction('typing')` to that supergroup
- **THEN** `chats.actionsFor(user).last` equals `'typing'`

#### Scenario: Does not capture action for user who left the group

- **WHEN** a user has left a supergroup
- **AND** the bot sends `sendChatAction('typing')` to that supergroup
- **THEN** `chats.actionsFor(user).length` equals `0`

#### Scenario: Throws for unknown user

- **WHEN** the test calls `chats.actionsFor(unknownUser)` where `unknownUser` was not minted by this `Chats` instance
- **THEN** an `Error` is thrown
