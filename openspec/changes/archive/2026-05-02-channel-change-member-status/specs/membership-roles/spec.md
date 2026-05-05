## MODIFIED Requirements

### Requirement: `chat.changeMemberStatus` dispatches `my_chat_member`

The system SHALL provide `chat.changeMemberStatus(fromUser, transition)` on `Group`, `Supergroup`, and `Channel` that:

1. Reads the current **bot** membership in `chat.members` (keyed by `bot.botInfo.id`), or assumes `'left'` if no record.
2. Constructs a `my_chat_member` update with:
   - `from` = `fromUser` (the actor who triggered the change)
   - `old_chat_member.user` = `bot.botInfo` (the bot whose membership changed)
   - `old_chat_member.status` = current/`from` status
   - `new_chat_member.user` = `bot.botInfo`
   - `new_chat_member.status` = `transition.to` + supplied permissions + optional `untilDate`
3. Dispatches the update via `bot.handleUpdate`.
4. Stores the new bot membership in `chat.members` keyed by `bot.botInfo.id` after dispatch.

`transition` SHALL accept `{ from?, to, permissions?, untilDate? }`. If `from` is omitted, the current bot map entry is used (defaulting to `'left'`). `fromUser` (the trigger actor) SHALL NOT have their own membership entry changed.

#### Scenario: Dispatches my_chat_member with correct old and new status

- **WHEN** the test calls `await chat.changeMemberStatus(triggerUser, { from: 'member', to: 'restricted', permissions: { can_send_messages: false } })`
- **THEN** the bot receives a `my_chat_member` update via `bot.handleUpdate`
- **AND** `ctx.myChatMember.old_chat_member.status` equals `'member'`
- **AND** `ctx.myChatMember.new_chat_member.status` equals `'restricted'`

#### Scenario: from field carries the trigger user, not the bot

- **WHEN** the test calls `await chat.changeMemberStatus(triggerUser, { from: 'left', to: 'administrator' })`
- **THEN** `ctx.myChatMember.from.id` equals `triggerUser.id`
- **AND** `ctx.myChatMember.new_chat_member.user.id` equals `bot.botInfo.id`

#### Scenario: getChatAdministrators reflects the bot after promotion

- **WHEN** the test calls `await chat.changeMemberStatus(triggerUser, { to: 'administrator' })`
- **AND** the auto-derived `getChatAdministrators` is called for the chat
- **THEN** the result includes an entry with `user.id === bot.botInfo.id` and `status === 'administrator'`

#### Scenario: Trigger actor membership is not affected

- **WHEN** the test calls `await chat.changeMemberStatus(triggerUser, { to: 'administrator' })`
- **THEN** `triggerUser.in(chat)` is unaffected (unchanged from before the call)
