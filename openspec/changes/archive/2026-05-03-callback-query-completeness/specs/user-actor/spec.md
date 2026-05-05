## ADDED Requirements

### Requirement: `user.sendCallbackQuery` dispatches a callback_query update

The system SHALL provide `user.sendCallbackQuery(data, options?)` that constructs a synthetic
`Update` carrying a `callback_query` field and dispatches it via `bot.handleUpdate`. The method
SHALL resolve once the resulting middleware chain settles.

`data` (required) is the callback payload string set on `callback_query.data`.

`options.message` (optional) is a partial `Message` shape that populates `callback_query.message`.
When `options.message` is absent, the library SHALL synthesize a minimal message stub with
`chat` equal to the user's private chat (`type: 'private'`, `id: user.id`) and a
`message_id` from `IdGenerator.nextMessageId()`. This ensures grammY filters such as
`chatType('private')` evaluate correctly without any test boilerplate.

When `options.message` is provided but has no `message_id`, the library SHALL generate one via
`IdGenerator.nextMessageId()`. When `options.message` is provided but has no `chat`, the library
SHALL fill it with the user's private chat.

The synthesized `callback_query.from` SHALL be set to the user's profile. `callback_query.id`
SHALL be a stable synthetic string. `callback_query.chat_instance` SHALL be a stable synthetic
string.

#### Scenario: Bare dispatch without prior reply

- **WHEN** the test calls `await user.sendCallbackQuery('some-data')`
- **AND** the bot has a `bot.on('callback_query:data:some-data', ctx => ctx.answerCallbackQuery())` handler
- **THEN** the handler runs
- **AND** `ctx.callbackQuery.data === 'some-data'`
- **AND** `ctx.callbackQuery.from.id === user.id`

#### Scenario: chatType private filter passes with auto-synthesized message

- **WHEN** the bot wraps the handler with `bot.chatType('private').on('callback_query', ...)`
- **AND** the test calls `await user.sendCallbackQuery('data')`
- **THEN** the filter passes and the handler runs (auto-synthesized message has `chat.type === 'private'`)

#### Scenario: Explicit message shapes the callback_query.message

- **WHEN** the test calls `await user.sendCallbackQuery('data', { message: { text: 'prior text', reply_markup: keyboard } })`
- **THEN** `ctx.callbackQuery.message.text === 'prior text'`
- **AND** `ctx.callbackQuery.message.reply_markup` equals the supplied keyboard

#### Scenario: message_id auto-filled when message is partial

- **WHEN** the test calls `await user.sendCallbackQuery('data', { message: { text: 'hi' } })`
- **THEN** `ctx.callbackQuery.message.message_id` is a positive integer (auto-generated)

#### Scenario: Returns void

- **WHEN** the test calls `const result = await user.sendCallbackQuery('data')`
- **THEN** `result` is `undefined` (the method resolves with no value)
