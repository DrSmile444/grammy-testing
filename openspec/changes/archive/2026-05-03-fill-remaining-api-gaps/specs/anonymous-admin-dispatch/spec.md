## ADDED Requirements

### Requirement: `sendText` with `anonymous: true` dispatches GroupAnonymousBot wire format

`user.sendText(text, { chat, anonymous: true })` SHALL construct a message update where:

- `message.from` is set to the GroupAnonymousBot identity: `{ id: 1_087_968_824, is_bot: false, first_name: 'Group', username: 'GroupAnonymousBot' }`
- `message.sender_chat` is set to the result of `options.chat.toTelegramChat()`

This replicates the exact wire format Telegram sends when a group admin posts using the "Send as Group" (anonymous admin) feature. The `options.chat` parameter SHALL be a `Group` or `Supergroup`; supplying a `Channel`, `PrivateChat`, or omitting `chat` when `anonymous: true` SHALL throw a descriptive error.

#### Scenario: anonymous sendText sets from to GroupAnonymousBot

- **WHEN** the test calls `await user.sendText('hello', { chat: group, anonymous: true })`
- **THEN** the dispatched update's `message.from.id` equals `1_087_968_824`
- **AND** `message.from.username` equals `'GroupAnonymousBot'`
- **AND** `message.from.is_bot` equals `false`

#### Scenario: anonymous sendText sets sender_chat to the target group

- **WHEN** the test calls `await user.sendText('hello', { chat: group, anonymous: true })`
- **THEN** the dispatched update's `message.sender_chat.id` equals `group.id`
- **AND** `message.sender_chat.type` equals `'supergroup'` (or `'group'` depending on the chat type)

#### Scenario: anonymous sendText throws when chat is absent

- **WHEN** the test calls `await user.sendText('hello', { anonymous: true })`
- **THEN** the call rejects with an error indicating that `anonymous: true` requires a Group or Supergroup chat

#### Scenario: anonymous sendText throws when chat is a Channel

- **WHEN** the test calls `await user.sendText('hello', { chat: channel, anonymous: true })`
- **THEN** the call rejects with an error indicating that GroupAnonymousBot only exists in group contexts

#### Scenario: non-anonymous sendText is unaffected

- **WHEN** the test calls `await user.sendText('hello', { chat: group })` without `anonymous`
- **THEN** the dispatched update's `message.from.id` equals `user.id`
- **AND** `message.sender_chat` is absent

### Requirement: `sendCommand` with `anonymous: true` dispatches GroupAnonymousBot wire format

`user.sendCommand(command, args?, { chat, anonymous: true })` SHALL thread the `anonymous` flag through to `sendText`, producing the same GroupAnonymousBot wire format. The same chat-type validation and error conditions apply.

#### Scenario: anonymous sendCommand sets from to GroupAnonymousBot

- **WHEN** the test calls `await user.sendCommand('/role', 'admin', { chat: group, anonymous: true })`
- **THEN** the dispatched update's `message.from.id` equals `1_087_968_824`
- **AND** `message.from.username` equals `'GroupAnonymousBot'`
- **AND** the `bot_command` entity is still present at offset 0

#### Scenario: anonymous sendCommand sets sender_chat

- **WHEN** the test calls `await user.sendCommand('/role', 'admin', { chat: group, anonymous: true })`
- **THEN** the dispatched update's `message.sender_chat.id` equals `group.id`

### Requirement: `GROUP_ANONYMOUS_BOT` is exported as a named constant

The package SHALL export `GROUP_ANONYMOUS_BOT` as a `const` object with `id`, `is_bot`, `first_name`, and `username` fields. Test authors SHALL be able to import this constant and use it in assertions (`expect(update.from).toMatchObject(GROUP_ANONYMOUS_BOT)`) without hard-coding the magic number `136_817_688`.

#### Scenario: GROUP_ANONYMOUS_BOT is importable

- **WHEN** a test imports `{ GROUP_ANONYMOUS_BOT }` from `'grammy-testing'`
- **THEN** `GROUP_ANONYMOUS_BOT.id` equals `1_087_968_824`
- **AND** `GROUP_ANONYMOUS_BOT.username` equals `'GroupAnonymousBot'`
