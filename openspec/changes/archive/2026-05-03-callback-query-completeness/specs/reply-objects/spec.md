## MODIFIED Requirements

### Requirement: `reply.clickButton` synthesizes a callback_query

`reply.clickButton(textOrSpec)` SHALL match either by button text (string argument) or by `{ data: string }` callback-data lookup. On match, the system SHALL synthesize an `Update` with a `callback_query` field — `from` = the user this reply was directed at, `message` = the captured outgoing payload **including `reply_markup`**, `data` = the matched button's `callback_data` — and dispatch it via `bot.handleUpdate`. The call SHALL resolve once the resulting middleware chain settles.

If the matched button has a `url` instead of `callback_data`, `clickButton` SHALL throw an error explaining that URL buttons do not produce callback_query updates.

`Reply.toCapturedMessage()` SHALL include `reply_markup` in the returned message shape when the
Reply stores a keyboard (i.e. `this.replyMarkup` is non-null). This ensures that
`ctx.callbackQuery.message.reply_markup` is populated in the handler and handlers that read
keyboard state (e.g. `ctx.callbackQuery.message.reply_markup.inline_keyboard`) work correctly.

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

#### Scenario: callback_query.message includes reply_markup

- **WHEN** the bot replies with an inline keyboard `keyboard`
- **AND** the test calls `await reply.clickButton('some button')`
- **THEN** `ctx.callbackQuery.message.reply_markup` is defined
- **AND** `ctx.callbackQuery.message.reply_markup` equals the keyboard the bot sent
