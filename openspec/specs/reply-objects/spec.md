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
- `reply.replyMarkup`: the raw `reply_markup` object from the captured payload (`Record<string, unknown> | undefined`); escape hatch for markup types not covered by `reply.buttons`.
- `reply.chat`: the destination chat (the `Chat` object from the `chats` orchestrator if known, else the captured payload's chat).
- `reply.replyingTo`: the `Reply` object this is in reply to, if the captured payload had `reply_to_message_id`/`reply_parameters` pointing to a previously-captured outgoing reply; `undefined` when no matching Reply is found (including when replying to an incoming user message).
- `reply.raw`: the original captured outgoing payload (escape hatch for anything not normalized).

`Reply` instances SHALL be plain values (not proxies), safe to snapshot, log, and pass around.

#### Scenario: text accessor for sendMessage

- **WHEN** the bot calls `ctx.reply('welcome')`
- **THEN** the corresponding `Reply` has `reply.text === 'welcome'`

#### Scenario: parseMode accessor

- **WHEN** the bot calls `ctx.reply('<b>bold</b>', { parse_mode: 'HTML' })`
- **THEN** the corresponding `Reply.parseMode === 'HTML'`

#### Scenario: replyMarkup accessor exposes raw markup

- **WHEN** the bot sends a message with an inline keyboard via `ctx.reply('pick', { reply_markup: keyboard })`
- **THEN** `reply.replyMarkup` is a non-null object
- **AND** `reply.replyMarkup` equals the raw `reply_markup` value from the captured payload

#### Scenario: replyMarkup is undefined for plain text replies

- **WHEN** the bot calls `ctx.reply('hello')` with no reply_markup
- **THEN** `reply.replyMarkup` is `undefined`

#### Scenario: replyingTo resolves to the referenced Reply

- **WHEN** the bot sends reply A (e.g. a message with `message_id` X)
- **AND** the bot sends reply B with `reply_parameters: { message_id: X }`
- **THEN** `replyB.replyingTo` is the same object as reply A
- **AND** `replyB.replyingTo?.messageId` equals `replyA.messageId`

#### Scenario: replyingTo is undefined when replying to an incoming user message

- **WHEN** the bot calls `ctx.reply('hi')` in response to a user's incoming message
- **THEN** `reply.replyingTo` is `undefined` (the user's incoming message is not a captured Reply)

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

### Requirement: `reply.media` exposes the file reference for outgoing media calls

For captured outgoing calls whose payload contains a media field (`photo`, `document`, `video`, `audio`, `voice`, `animation`, `sticker`, or `video_note`), the system SHALL expose a `reply.media` accessor returning `{ type: MediaType, fileId: string }`. For calls with no media field (e.g. `sendMessage`), `reply.media` SHALL return `undefined`.

`fileId` is derived by converting the payload's media field value to a string. When the bot passed a string `file_id` directly (the common test case), this returns the original string. When the bot passed an `InputFile` object, the result is implementation-defined and may not be useful — callers should pass string file IDs in tests to get reliable results.

`MediaType` is a string union of the supported media field names: `'photo' | 'document' | 'video' | 'audio' | 'voice' | 'animation' | 'sticker' | 'video_note'`.

#### Scenario: reply.media reflects the file_id used by the bot

- **WHEN** the bot handles an incoming photo and replies with `ctx.replyWithPhoto(ctx.message.photo[0].file_id)`
- **AND** `ctx.message.photo[0].file_id` was `'img-001'` (produced by `user.sendPhoto('img-001')`)
- **THEN** `chats.repliesFor(user).last?.media?.type` equals `'photo'`
- **AND** `chats.repliesFor(user).last?.media?.fileId` equals `'img-001'`

#### Scenario: reply.media is undefined for text-only replies

- **WHEN** the bot replies with `ctx.reply('hello')`
- **THEN** the corresponding `Reply.media` is `undefined`
