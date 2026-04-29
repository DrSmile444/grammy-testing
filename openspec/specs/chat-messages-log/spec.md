# chat-messages-log Specification

## Purpose
TBD - created by archiving change add-high-level-chats-api. Update Purpose after archive.
## Requirements
### Requirement: `chat.messages` is the canonical per-chat message log

For every captured outgoing API call whose payload targets a particular `Chat` (a `chat_id` equal to the chat's id), the system SHALL append the corresponding `Reply` object to `chat.messages` in capture order. The log includes ALL bot-originated messages into this chat, regardless of addressee — making `chat.messages` the canonical record at the chat granularity. This applies to ALL chat types: groups, supergroups, channels, and private chats.

`PrivateChat` SHALL expose a `messages: MessagesLog<TContext>` field. Messages sent to a private chat SHALL appear in both `privateChat.messages` and `user.replies`.

#### Scenario: Group broadcast lands in chat.messages

- **WHEN** the bot calls `ctx.api.sendMessage(group.id, 'announcement')`
- **THEN** `group.messages.last?.text` equals `'announcement'`
- **AND** `group.messages.length` is at least `1`

#### Scenario: Private DM lands in both privateChat.messages and user.replies

- **WHEN** the bot replies in a private chat between bot and `user`
- **THEN** the message appears in BOTH `privateChat.messages` AND `user.replies`
- **AND** `privateChat.messages.last?.text` equals the sent text

### Requirement: `chat.messages.last` and `chat.messages.byText` accessors

`chat.messages.last` SHALL return the most recent `Reply` posted to this chat or `undefined` if none. `chat.messages.byText(matcher)` SHALL return the first `Reply` whose `text` matches the supplied string (exact) or `RegExp`, or `undefined`.

#### Scenario: Latest message in chat

- **WHEN** the bot posts two messages to a group, the latest with text `'second'`
- **THEN** `group.messages.last?.text === 'second'`

#### Scenario: byText with regex

- **WHEN** the bot has posted a message with text `'Hello, world!'` to a group
- **AND** the test calls `group.messages.byText(/hello/i)`
- **THEN** the returned `Reply` has the matching text

### Requirement: `channel.postMessageTo` dispatches a sender_chat-bearing message

The system SHALL provide `channel.postMessageTo(targetGroup, text, options?)` that dispatches a synthetic `Update` whose message has:

- `chat` = the target group/supergroup
- `from` = the synthetic `Channel_Bot` user (id `136817688`, `username: 'Channel_Bot'`)
- `sender_chat` = the channel itself
- `text` = the supplied text

The call SHALL resolve once `bot.handleUpdate` settles. The resulting bot-side reaction (if any) SHALL appear in `targetGroup.messages` or `chats.outgoing` per normal capture rules.

#### Scenario: Posting from a channel into a group

- **WHEN** the test creates `const channel = chats.newChannel('Main')` and `const group = chats.newSupergroup('Discussion')`
- **AND** calls `await channel.postMessageTo(group, 'Channel announcement')`
- **THEN** the bot under test receives an update where `message.sender_chat.id === channel.id`
- **AND** `message.from.username === 'Channel_Bot'`
- **AND** `message.text === 'Channel announcement'`

