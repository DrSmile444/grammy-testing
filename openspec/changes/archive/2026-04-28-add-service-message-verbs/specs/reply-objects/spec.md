## MODIFIED Requirements

### Requirement: `user.replies` filters per the documented rule

A captured message-shape outgoing call SHALL appear in `user.replies` if and only if both of:

1. The captured `chat_id` matches a chat this user is a participant of, where "participant of" means:
   - The chat is private with this user (`chat.type === 'private'` and `chat.id === user.id`), OR
   - The chat is a group/supergroup/channel AND `chat.members.get(user.id)?.status` is one of `'creator'`, `'administrator'`, `'member'`, or `'restricted'`. Statuses `'left'` and `'kicked'` are NOT participants — a user who has left or been removed from a chat does not receive subsequent broadcasts in their `user.replies` even if their entry remains in the chat's members map.
2. ANY of:
   - The chat is private with this user.
   - The captured payload has `reply_to_message_id`/`reply_parameters` whose target's `from.id` equals this user's `id`.
   - The captured `text` contains a `mention` entity whose body equals `'@' + user.username` (when `username` is set).
   - The captured payload is the immediate response to a `callback_query` synthesized by this user via `clickButton`.

A captured message-shape call that fails the rule but matches condition 1 SHALL still appear in `chat.messages` (see `chat-messages-log` capability) — `user.replies` is the filtered view, not the canonical log.

#### Scenario: DM reply lands in user.replies

- **WHEN** the bot sends a message to `chats.newPrivateChat(user)`
- **THEN** the corresponding `Reply` is in `user.replies`

#### Scenario: Group broadcast does NOT land in user.replies

- **WHEN** the bot sends a message to a `group` (where `user` is a member) with no `reply_to_message_id` and no `@user.username` mention and no callback-association
- **THEN** the corresponding `Reply` is NOT in `user.replies`
- **AND** the `Reply` IS in `group.messages` (per `chat-messages-log` capability)

#### Scenario: Reply-to addresses the original sender

- **WHEN** the bot replies to `user`'s message in a group via `ctx.reply(...)` with `reply_parameters.message_id`
- **THEN** the corresponding `Reply` lands in `user.replies`

#### Scenario: Click-then-respond chain

- **WHEN** `user` calls `await reply.clickButton('confirm')`
- **AND** the bot's callback handler responds with `ctx.reply('done')` to the same chat
- **THEN** the new `'done'` reply lands in `user.replies`

#### Scenario: User who has left the group does NOT receive subsequent broadcasts

- **WHEN** a user is a member of a group (e.g. via `group.promote(user)` or `user.joinChat(group)`)
- **AND** the user calls `await user.leaveChat(group)` (status becomes `'left'`)
- **AND** the bot subsequently broadcasts a message in the same group that mentions `@user.username` or replies to a different message
- **THEN** the `Reply` does NOT land in `user.replies`
- **AND** the `Reply` DOES land in `group.messages`
