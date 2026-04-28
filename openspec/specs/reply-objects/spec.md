# reply-objects Specification

## Purpose
TBD - created by archiving change add-high-level-chats-api. Update Purpose after archive.
## Requirements
### Requirement: `Reply` is a normalized object derived from each message-shape outgoing call

For every captured outgoing API call whose method produces a message in a chat (`sendMessage`, `sendPhoto`, `sendDocument`, etc., or any call that produces a `Message` shape), the system SHALL derive a `Reply<TContext>` object exposing normalized accessors:

- `reply.text`: message text or caption, whichever is present.
- `reply.parseMode`: `'HTML' | 'Markdown' | 'MarkdownV2' | undefined`.
- `reply.entities`: normalized entity array.
- `reply.buttons`: flat array of inline-keyboard buttons; each entry has `text` and either `callbackData` or `url` (other button types as appropriate).
- `reply.replyMarkup`: the raw markup object (escape hatch).
- `reply.chat`: the destination chat (the `Chat` object from the `chats` orchestrator if known, else the captured payload's chat).
- `reply.replyingTo`: the `Reply` object this is in reply to, if the captured payload had `reply_to_message_id`/`reply_parameters` (else `undefined`).
- `reply.raw`: the original captured outgoing payload (escape hatch for anything not normalized).

`Reply` instances SHALL be plain values (not proxies), safe to snapshot, log, and pass around.

#### Scenario: text accessor for sendMessage

- **WHEN** the bot calls `ctx.reply('welcome')`
- **THEN** the corresponding `Reply` has `reply.text === 'welcome'`

#### Scenario: parseMode accessor

- **WHEN** the bot calls `ctx.reply('<b>bold</b>', { parse_mode: 'HTML' })`
- **THEN** the corresponding `Reply.parseMode === 'HTML'`

#### Scenario: buttons accessor flattens inline keyboard

- **WHEN** the bot replies with an `InlineKeyboard().text('OK', 'cb-ok').url('Open', 'https://example.com')`
- **THEN** `reply.buttons` is an array of two entries
- **AND** entry 0 has `text === 'OK'` and `callbackData === 'cb-ok'`
- **AND** entry 1 has `text === 'Open'` and `url === 'https://example.com'`

### Requirement: `reply.clickButton` synthesizes a callback_query

`reply.clickButton(textOrSpec)` SHALL match either by button text (string argument) or by `{ data: string }` callback-data lookup. On match, the system SHALL synthesize an `Update` with a `callback_query` field — `from` = the user this reply was directed at, `message` = the captured outgoing payload, `data` = the matched button's `callback_data` — and dispatch it via `bot.handleUpdate`. The call SHALL resolve once the resulting middleware chain settles.

If the matched button has a `url` instead of `callback_data`, `clickButton` SHALL throw an error explaining that URL buttons do not produce callback_query updates.

#### Scenario: Click by text matches and dispatches

- **WHEN** the bot replies with an inline keyboard containing a `'confirm'` button with callback_data `'cb-confirm'`
- **AND** the test calls `await reply.clickButton('confirm')`
- **THEN** the bot under test receives a `callback_query` update with `data === 'cb-confirm'` and `from.id === user.id`

#### Scenario: Click by callback_data spec

- **WHEN** the test calls `await reply.clickButton({ data: 'cb-confirm' })`
- **THEN** the same dispatch occurs as the by-text form

#### Scenario: Click on URL button throws

- **WHEN** the bot replies with a button whose only attribute is a `url`
- **AND** the test calls `reply.clickButton('that button')`
- **THEN** the call throws an error referencing URL buttons

### Requirement: `replies.last` and `replies.byText` accessors

The system SHALL provide convenience accessors on `user.replies`:

- `replies.last`: the most recent reply directed at this user, or `undefined` if none exist.
- `replies.byText(matcher)`: the first reply whose `text` matches the supplied string (exact) or `RegExp`. Returns `undefined` if no match.

#### Scenario: replies.last returns latest

- **WHEN** the bot has sent two replies directed at this user, the latest with text `'second'`
- **THEN** `user.replies.last?.text === 'second'`

#### Scenario: replies.byText finds by string

- **WHEN** the bot has sent replies with texts `['hello world', 'goodbye']`
- **AND** the test calls `user.replies.byText('goodbye')`
- **THEN** the returned reply has `text === 'goodbye'`

#### Scenario: replies.byText finds by regex

- **WHEN** the bot has sent a reply with text `'Welcome, alice!'`
- **AND** the test calls `user.replies.byText(/welcome/i)`
- **THEN** the returned reply has the welcome text

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

