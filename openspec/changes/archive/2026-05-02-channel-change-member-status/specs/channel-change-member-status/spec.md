## ADDED Requirements

### Requirement: `Channel.changeMemberStatus` dispatches `my_chat_member` for the channel

The system SHALL provide `channel.changeMemberStatus(fromUser, transition)` on `Channel` that:

1. Reads the current bot membership in `channel.members` (keyed by `bot.botInfo.id`), or assumes `'left'` if no record.
2. Constructs a `my_chat_member` update with `chat.type === 'channel'`, `from` = `fromUser`, `old_chat_member.user` = `bot.botInfo`, `new_chat_member.user` = `bot.botInfo`, and status/permissions from the transition.
3. Dispatches the update via `bot.handleUpdate`.
4. Stores the new bot membership in `channel.members` keyed by `bot.botInfo.id`.

`transition` SHALL accept `{ from?, to, permissions?, untilDate? }`. If `from` is omitted, the current bot map entry is used (defaulting to `'left'`). `fromUser`'s own membership entry SHALL NOT be affected.

#### Scenario: Dispatches my_chat_member with channel chat type

- **WHEN** the test calls `await channel.changeMemberStatus(triggerUser, { from: 'left', to: 'administrator' })`
- **THEN** the bot receives a `my_chat_member` update
- **AND** `ctx.myChatMember.chat.type` equals `'channel'`
- **AND** `ctx.myChatMember.chat.id` equals `channel.id`

#### Scenario: from field carries the trigger user

- **WHEN** the test calls `await channel.changeMemberStatus(triggerUser, { from: 'member', to: 'administrator' })`
- **THEN** the dispatched update's `my_chat_member.from.id` equals `triggerUser.id`

#### Scenario: old and new chat_member user is the bot

- **WHEN** the test calls `await channel.changeMemberStatus(triggerUser, { from: 'member', to: 'administrator' })`
- **THEN** `ctx.myChatMember.old_chat_member.user.id` equals `bot.botInfo.id`
- **AND** `ctx.myChatMember.new_chat_member.user.id` equals `bot.botInfo.id`

#### Scenario: getChatAdministrators reflects the bot after promotion

- **WHEN** the test calls `await channel.changeMemberStatus(triggerUser, { from: 'left', to: 'administrator' })`
- **AND** the auto-derived `getChatAdministrators` is called for the channel
- **THEN** the result includes an entry with `user.id === bot.botInfo.id` and `status === 'administrator'`

#### Scenario: trigger actor membership is not affected

- **WHEN** the test calls `await channel.changeMemberStatus(triggerUser, { to: 'administrator' })`
- **THEN** `triggerUser.in(channel)` is `undefined`

### Requirement: `Channel.changeMemberStatus` uses `CHANNEL_ADMIN_RIGHTS` as permission defaults

When `transition.permissions` is omitted or partial, the system SHALL fill missing fields from `CHANNEL_ADMIN_RIGHTS`, which includes `can_post_messages: true` and excludes group-only fields (`can_manage_video_chats`, `can_manage_topics`). Supplied permissions SHALL override the defaults.

#### Scenario: Default permissions include can_post_messages

- **WHEN** the test calls `await channel.changeMemberStatus(triggerUser, { to: 'administrator' })` with no permissions
- **THEN** `ctx.myChatMember.new_chat_member.can_post_messages` is `true`

#### Scenario: Supplied permissions override defaults

- **WHEN** the test calls `await channel.changeMemberStatus(triggerUser, { to: 'administrator', permissions: { can_post_messages: false } })`
- **THEN** `ctx.myChatMember.new_chat_member.can_post_messages` is `false`
