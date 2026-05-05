## MODIFIED Requirements

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
