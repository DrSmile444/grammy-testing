# reaction-removal-capture Specification

## Purpose

TBD - created by archiving change support-bot-api-10. Update Purpose after archive.

## Requirements

### Requirement: Reaction-removal calls are captured into a reactions-removed projection

The system SHALL record each `deleteMessageReaction` / `deleteAllMessageReactions` call into a
reactions-removed projection in dispatch order, modeled on the existing `delete-message-capture`
projection. The projection SHALL be readable via `chats.reactionRemovals` and SHALL expose at
minimum the `method`, the target `chat_id`, and the full `raw` payload for each entry.
`deleteMessageReaction` entries SHALL carry the target `message_id`; `deleteAllMessageReactions`
entries SHALL have `messageId` as `undefined` (that method removes all reactions by a user/chat
and carries no `message_id`).

#### Scenario: deleteMessageReaction is recorded with its message_id

- **WHEN** the bot calls `ctx.api.raw.deleteMessageReaction({ chat_id, message_id: 100 })`
- **THEN** `chats.reactionRemovals.length` increases by `1`
- **AND** `chats.reactionRemovals.last.messageId` equals `100`
- **AND** `chats.reactionRemovals.last.method` equals `'deleteMessageReaction'`

#### Scenario: deleteAllMessageReactions is recorded without a message_id

- **WHEN** the bot calls `ctx.api.raw.deleteAllMessageReactions({ chat_id, user_id: 5 })`
- **THEN** `chats.reactionRemovals.last.method` equals `'deleteAllMessageReactions'`
- **AND** `chats.reactionRemovals.last.messageId` is `undefined`

### Requirement: Reaction-removal methods resolve with `true` by default

The transformer SHALL resolve `deleteMessageReaction` and `deleteAllMessageReactions` with `true`
by default when no user-supplied `responses` entry is present, matching the Telegram Bot API
return type.

#### Scenario: deleteAllMessageReactions resolves with true

- **WHEN** the bot calls `ctx.api.raw.deleteAllMessageReactions({ chat_id, user_id: 5 })`
- **AND** no `responses.deleteAllMessageReactions` entry is configured
- **THEN** the resolved result is `true`
