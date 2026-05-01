# user-actor Specification

## Purpose

TBD - created by archiving change add-high-level-chats-api. Update Purpose after archive.

## Requirements

### Requirement: `user.sendText` dispatches a text message update

The system SHALL provide `user.sendText(text, options?)` that constructs a synthetic `Update` carrying a text message authored by this user, dispatches it via `bot.handleUpdate`, and resolves once the resulting middleware chain settles. The destination chat SHALL default to a private chat between the bot and this user (creating it lazily on first send if none was explicitly minted). `options.chat` MAY override the destination with any `Chat` minted via the orchestrator. `options` MAY also include `entities`, `parse_mode`, `reply_parameters`, or other text-message options that pass through to the constructed update.

#### Scenario: Sends text to a private chat by default

- **WHEN** a test creates `const user = chats.newUser()` and calls `await user.sendText('hello')`
- **AND** the bot under test has a `bot.on('message:text', ctx => ctx.reply('echo'))` handler
- **THEN** the bot's handler runs
- **AND** `chats.outgoing.getLast()?.method` equals `'sendMessage'`

#### Scenario: Honors entity overrides

- **WHEN** the test calls `await user.sendText('Hi @bob', { entities: [{ type: 'mention', offset: 3, length: 4 }] })`
- **THEN** the dispatched update's `message.entities` equals the supplied array

### Requirement: `user.sendMessage` is an alias for `sendText`

The system SHALL provide `user.sendMessage(text, options?)` as an alias of `user.sendText(text, options?)`. Behavior SHALL be identical.

#### Scenario: sendMessage dispatches identically to sendText

- **WHEN** the test calls `await user.sendMessage('hi')`
- **THEN** the resulting captured request method equals `'sendMessage'` (from the bot's reply, if any)
- **AND** the test could substitute `user.sendText('hi')` without observable difference

### Requirement: `user.sendCommand` auto-emits the bot_command entity

The system SHALL provide `user.sendCommand(command, args?, options?)` that dispatches a text message whose `text` is the command (with the optional `args` appended after a space) and whose `entities` array contains a `bot_command` entity at offset `0` with the command's length. The leading `/` SHALL be added automatically if not present in `command`. The optional `options.chat` parameter MAY override the default destination (the user's private chat) with any `Group` or `Supergroup` minted via the orchestrator.

#### Scenario: Builds /start command with bot_command entity

- **WHEN** the test calls `await user.sendCommand('/start')`
- **THEN** the dispatched update's `message.text` equals `'/start'`
- **AND** the dispatched update's `message.entities[0]` equals `{ type: 'bot_command', offset: 0, length: 6 }`

#### Scenario: Appends args after space

- **WHEN** the test calls `await user.sendCommand('/lang', 'en')`
- **THEN** the dispatched update's `message.text` equals `'/lang en'`
- **AND** the `bot_command` entity has `length: 5` (the `/lang` portion only)

#### Scenario: Adds leading slash when missing

- **WHEN** the test calls `await user.sendCommand('start')`
- **THEN** the dispatched update's `message.text` equals `'/start'`

#### Scenario: Dispatches into a non-private chat via options.chat

- **WHEN** the test creates `const group = chats.newSupergroup()` and calls `await user.sendCommand('/start', undefined, { chat: group })`
- **THEN** the dispatched update's `message.chat.id` equals `group.id`
- **AND** the dispatched update's `message.chat.type` equals `'supergroup'`
- **AND** the dispatched update's `message.entities[0]` equals `{ type: 'bot_command', offset: 0, length: 6 }`

#### Scenario: Honors args together with options.chat

- **WHEN** the test calls `await user.sendCommand('/lang', 'en', { chat: group })`
- **THEN** the dispatched update's `message.text` equals `'/lang en'`
- **AND** the dispatched update's `message.chat.id` equals `group.id`
- **AND** the `bot_command` entity has `length: 5`

### Requirement: User actions await full middleware settle

Every `user.send*` action SHALL return a Promise that resolves only after `bot.handleUpdate` has settled — every middleware in the chain has run, every awaited outgoing API call has been captured. This matches the v0.1 semantics for `bot.handleUpdate` and integrates naturally with `chats.idle()` for fire-and-forget API calls.

#### Scenario: Awaiting send waits for handler to finish

- **WHEN** the bot has `bot.on('message:text', async ctx => { await ctx.reply('hi'); await ctx.reply('twice'); })`
- **AND** the test calls `await user.sendText('trigger')`
- **THEN** `chats.outgoing.getMethods()` contains `'sendMessage'` twice already (no `chats.idle()` needed)

### Requirement: `user.joinChat` dispatches a `new_chat_members` service message

The system SHALL provide `user.joinChat(chat)` that constructs a synthetic `Update` carrying a service message in the target chat with `from = user`, `new_chat_members = [user]`, and dispatches it via `bot.handleUpdate`. The call SHALL resolve once the resulting middleware chain settles. The target SHALL be a `Group` or `Supergroup`; calling on private chats or channels SHALL throw a clear error.

#### Scenario: Bot's `message:new_chat_members` handler observes a self-join

- **WHEN** the test creates `const user = chats.newUser({ username: 'alice' })` and `const group = chats.newSupergroup()`
- **AND** the bot has `bot.on('message:new_chat_members', async (ctx) => { /* ... */ })` registered
- **AND** the test calls `await user.joinChat(group)`
- **THEN** the handler runs
- **AND** the dispatched update's `message.new_chat_members[0].id` equals `user.id`
- **AND** the dispatched update's `message.from.id` equals `user.id`

#### Scenario: Throws when target is a private chat

- **WHEN** the test calls `await user.joinChat(privateChat)`
- **THEN** the call rejects with an error indicating private chats do not support join service messages

### Requirement: `user.leaveChat` dispatches a `left_chat_member` service message

The system SHALL provide `user.leaveChat(chat)` that constructs a synthetic `Update` carrying a service message in the target chat with `from = user`, `left_chat_member = user`, and dispatches it via `bot.handleUpdate`. The call SHALL resolve once the resulting middleware chain settles. The target SHALL be a `Group` or `Supergroup`; calling on private chats or channels SHALL throw a clear error.

#### Scenario: Bot's `message:left_chat_member` handler observes a self-leave

- **WHEN** the test creates `const user = chats.newUser()` and `const group = chats.newSupergroup()`
- **AND** the bot has `bot.on('message:left_chat_member', async (ctx) => { /* ... */ })` registered
- **AND** the test calls `await user.leaveChat(group)`
- **THEN** the handler runs
- **AND** the dispatched update's `message.left_chat_member.id` equals `user.id`
- **AND** the dispatched update's `message.from.id` equals `user.id`

#### Scenario: Throws when target is a private chat or channel

- **WHEN** the test calls `await user.leaveChat(privateChat)` or `await user.leaveChat(channel)`
- **THEN** the call rejects with an error indicating that chat type does not support leave service messages

### Requirement: `user.sendForwarded` dispatches a message with forward_origin set

The system SHALL provide `user.sendForwarded(text, options)` where `options.forwardOrigin` is a `MessageOrigin` value (required) and `options.chat` optionally overrides the destination chat. The verb SHALL construct a synthetic text message `Update` with `message.forward_origin` populated to the supplied value and dispatch it via `bot.handleUpdate`. The destination SHALL default to the user's private chat when `options.chat` is omitted.

#### Scenario: Bot detects forward_origin and reacts

- **WHEN** the test calls `await user.sendForwarded('some text', { forwardOrigin: { type: 'user', sender_user: { id: 99, is_bot: false, first_name: 'Orig' }, date: 1_000_000 } })`
- **AND** the bot has a handler that checks `context.message.forward_origin`
- **THEN** the handler observes `forward_origin.type` equals `'user'`
- **AND** the handler observes `forward_origin.sender_user.id` equals `99`

#### Scenario: Dispatches into a non-private chat via options.chat

- **WHEN** the test creates `const group = chats.newSupergroup()` and calls `await user.sendForwarded('text', { forwardOrigin: ..., chat: group })`
- **THEN** the dispatched update's `message.chat.id` equals `group.id`

### Requirement: `user.editMessage` dispatches an edited_message update

The system SHALL provide `user.editMessage(messageId, text, options?)` that constructs a synthetic `Update` with the `edited_message` field populated (not `message`). The `edited_message` SHALL carry the supplied `messageId`, the new `text`, and the user as `from`. The optional `options.chat` MAY override the destination; it SHALL default to the user's private chat. The call SHALL resolve once the resulting middleware chain settles.

#### Scenario: Bot's edited_message handler observes the new text

- **WHEN** the test calls `await user.editMessage(50, 'edited content', { chat: dm })`
- **AND** the bot has `bot.on('edited_message', ctx => { ... })` registered
- **THEN** the handler runs
- **AND** `ctx.editedMessage.text` equals `'edited content'`
- **AND** `ctx.editedMessage.message_id` equals `50`

#### Scenario: Defaults to the user's private chat when chat is omitted

- **WHEN** the test calls `await user.editMessage(10, 'new text')` without specifying a chat
- **THEN** the dispatched update's `edited_message.chat.id` equals the user's private chat id

### Requirement: `user.sendPhoto` dispatches a photo update with a populated PhotoSize stub

The system SHALL provide `user.sendPhoto(file?, options?)` that constructs a synthetic `Update` with `message.photo` set to a one-element `PhotoSize[]` stub. If `file` is supplied, it is used as the `file_id`; otherwise a stable `'stub-file-<n>'` ID is generated. `options.caption` MAY set the message caption. `options.chat` MAY override the destination (defaults to the user's private chat). The call SHALL resolve once the middleware chain settles.

#### Scenario: Bot reads photo file_id from sendPhoto dispatch

- **WHEN** the test calls `await user.sendPhoto('img-001')`
- **AND** the bot has a `bot.on('message:photo', ctx => { ... })` handler
- **THEN** the handler observes `ctx.message.photo[0].file_id === 'img-001'`

#### Scenario: Auto-generates stable file_id when none supplied

- **WHEN** the test calls `await user.sendPhoto()` without a file argument
- **THEN** the dispatched `message.photo[0].file_id` matches the pattern `'stub-file-<n>'`

#### Scenario: Caption is carried on the message

- **WHEN** the test calls `await user.sendPhoto('img-001', { caption: 'my photo' })`
- **THEN** the dispatched `message.caption` equals `'my photo'`

#### Scenario: Dispatches into a non-private chat via options.chat

- **WHEN** the test creates `const group = chats.newSupergroup()` and calls `await user.sendPhoto('img-001', { chat: group })`
- **THEN** the dispatched update's `message.chat.id` equals `group.id`

### Requirement: `user.sendDocument` dispatches a document update with a populated Document stub

The system SHALL provide `user.sendDocument(file?, options?)` that constructs a synthetic `Update` with `message.document` set to a `Document` stub. If `file` is supplied, it is used as the `file_id` and `file_name`; otherwise a stable `'stub-file-<n>'` ID is generated. `options.caption` and `options.chat` follow the same rules as `sendPhoto`.

#### Scenario: Bot reads document file_id from sendDocument dispatch

- **WHEN** the test calls `await user.sendDocument('doc-001')`
- **AND** the bot has a `bot.on('message:document', ctx => { ... })` handler
- **THEN** the handler observes `ctx.message.document.file_id === 'doc-001'`

#### Scenario: Dispatches into a group via options.chat

- **WHEN** the test calls `await user.sendDocument('doc-001', { chat: group })`
- **THEN** the dispatched update's `message.chat.id` equals `group.id`

### Requirement: `user.sendVideo` dispatches a video update with a populated Video stub

The system SHALL provide `user.sendVideo(file?, options?)` that constructs a synthetic `Update` with `message.video` set to a `Video` stub (`file_id`, `file_unique_id`, `width: 1280`, `height: 720`, `duration: 0`). The `file` and `options` follow the same rules as `sendPhoto`.

#### Scenario: Bot reads video file_id from sendVideo dispatch

- **WHEN** the test calls `await user.sendVideo('vid-001')`
- **AND** the bot has a `bot.on('message:video', ctx => { ... })` handler
- **THEN** the handler observes `ctx.message.video.file_id === 'vid-001'`

### Requirement: `user.reactTo` is a verb on the User actor

`user.reactTo(reply, reaction)` SHALL be available on every `User` instance. See the `modern-update-types` capability spec for the full behavioral requirement and scenarios.

#### Scenario: reactTo is callable on a User

- **WHEN** a `User` is minted via `chats.newUser()`
- **THEN** `user.reactTo` is a callable async method

### Requirement: `user.answerPoll` is a verb on the User actor

`user.answerPoll(reply, optionIndices)` SHALL be available on every `User` instance.

#### Scenario: answerPoll is callable on a User

- **WHEN** a `User` is minted via `chats.newUser()`
- **THEN** `user.answerPoll` is a callable async method

### Requirement: `user.requestJoin` is a verb on the User actor

`user.requestJoin(group)` SHALL be available on every `User` instance for `Group` and `Supergroup` targets.

#### Scenario: requestJoin is callable on a User

- **WHEN** a `User` is minted via `chats.newUser()`
- **THEN** `user.requestJoin` is a callable async method

### Requirement: `user.boostChat` and `user.removeBoost` are verbs on the User actor

`user.boostChat(chat)` SHALL return `Promise<string>` (the boost_id). `user.removeBoost(chat, boostId)` SHALL return `Promise<void>`.

#### Scenario: boostChat returns a string boost_id

- **WHEN** `await user.boostChat(group)` is called
- **THEN** the return value is a non-empty string

### Requirement: `user.purchasePaidMedia` dispatches a purchased_paid_media update

The system SHALL provide `user.purchasePaidMedia(payload, options?)` that constructs a `purchased_paid_media` update with `from` set to the calling user and `paid_media_payload` set to the supplied `payload` string. The method SHALL dispatch via `bot.handleUpdate` and resolve once the middleware chain settles.

#### Scenario: Bot receives purchased_paid_media update

- **WHEN** the test calls `await user.purchasePaidMedia('payload-token-abc')`
- **THEN** the bot receives a `purchased_paid_media` update with `purchased_paid_media.paid_media_payload === 'payload-token-abc'`
- **AND** `purchased_paid_media.from.id === user.id`

### Requirement: `user.manageBot` dispatches a managed_bot update

The system SHALL provide `user.manageBot(botUser, options?)` that constructs a `managed_bot` update. `botUser` SHALL be a plain object with at minimum `id` and `first_name` fields. The synthesized update SHALL set `managed_bot.user` to the calling user's profile and `managed_bot.bot` to a bot user derived from `botUser` (with `is_bot: true`).

#### Scenario: Bot receives managed_bot update

- **WHEN** the test calls `await user.manageBot({ id: 99999, first_name: 'MyBot' })`
- **THEN** the bot receives a `managed_bot` update with `managed_bot.user.id === user.id`
- **AND** `managed_bot.bot.id === 99999`
- **AND** `managed_bot.bot.is_bot === true`

### Requirement: All dispatched updates use `IdGenerator.nextUpdateId()` for `update_id`

Every synthetic `Update` constructed by any `User` action (`sendText`, `sendForwarded`, `editMessage`, `joinChat`, `leaveChat`, and all other send verbs) SHALL obtain its `update_id` exclusively from `this.ctx.ids.nextUpdateId()`. Hardcoded numeric constants and expressions derived from other ID counters (e.g., `nextMessageId() + offset`) SHALL NOT be used as `update_id` values.

This ensures that repeated calls to any verb within a single test produce unique, monotonically increasing `update_id` values and that update IDs do not collide with message IDs or other synthetic identifiers.

#### Scenario: Repeated joinChat calls produce distinct update_ids

- **WHEN** the test calls `await user.joinChat(group)` twice in succession
- **THEN** the two dispatched updates have different `update_id` values
- **AND** both `update_id` values are greater than zero

#### Scenario: Repeated leaveChat calls produce distinct update_ids

- **WHEN** the test calls `await user.leaveChat(group)` twice in succession
- **THEN** the two dispatched updates have different `update_id` values

#### Scenario: sendText update_id does not equal the message_id

- **WHEN** the test calls `await user.sendText('hello')`
- **THEN** the dispatched update's `update_id` does not equal the dispatched update's `message.message_id`

### Requirement: `user.replies` shorthand delegates to the user's inbox

The system SHALL expose a `replies` getter on `User<TContext>` that returns the `RepliesInbox<TContext>` associated with this user. The inbox SHALL be the same live object that `chats.repliesFor(user)` returns; accessing `user.replies` multiple times SHALL return the same reference. The getter SHALL be available immediately after the user is minted via `chats.newUser()`.

#### Scenario: user.replies returns the same inbox as chats.repliesFor

- **WHEN** the test mints `const user = chats.newUser()`
- **THEN** `user.replies` is strictly equal to `chats.repliesFor(user)`

#### Scenario: user.replies reflects replies captured after minting

- **WHEN** the test sends a message that causes the bot to reply
- **AND** the test has awaited `chats.idle()`
- **THEN** `user.replies.length` equals the number of replies the bot sent to that user
- **AND** `user.replies.last` is the most recently captured reply

#### Scenario: user.replies.all returns all replies in dispatch order

- **WHEN** the bot sends two replies to the same user
- **THEN** `user.replies.all` has length 2
- **AND** `user.replies.all[0]` is the first reply sent
- **AND** `user.replies.all[1]` is the second reply sent
