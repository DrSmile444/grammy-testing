## ADDED Requirements

### Requirement: `user.sendWebAppData` dispatches a Web App data message

The system SHALL provide `user.sendWebAppData(data, buttonText, options?)` that constructs a synthetic `Update` with `message.web_app_data` set to `{ data, button_text: buttonText }`. `options.chat` MAY override the destination (defaults to the user's private chat). The call SHALL resolve once the middleware chain settles.

#### Scenario: Bot reads web_app_data from sendWebAppData dispatch

- **WHEN** the test calls `await user.sendWebAppData('{"action":"submit"}', 'Open App')`
- **AND** the bot has a `bot.on('message:web_app_data', ctx => { ... })` handler
- **THEN** the handler observes `ctx.message.web_app_data.data === '{"action":"submit"}'`
- **AND** the handler observes `ctx.message.web_app_data.button_text === 'Open App'`

### Requirement: `user.sendSuccessfulPayment` dispatches a successful payment message

The system SHALL provide `user.sendSuccessfulPayment(invoicePayload, currency, totalAmount, options?)` that constructs a synthetic `Update` with `message.successful_payment` set to a `SuccessfulPayment` stub. The stub SHALL carry the supplied `invoice_payload`, `currency`, and `total_amount`, with `telegram_payment_charge_id` and `provider_payment_charge_id` set to stub strings. `options.chat` MAY override the destination.

#### Scenario: Bot reads payment info from sendSuccessfulPayment dispatch

- **WHEN** the test calls `await user.sendSuccessfulPayment('order-123', 'USD', 1000)`
- **AND** the bot has a `bot.on('message:successful_payment', ctx => { ... })` handler
- **THEN** the handler observes `ctx.message.successful_payment.invoice_payload === 'order-123'`
- **AND** the handler observes `ctx.message.successful_payment.currency === 'USD'`
- **AND** the handler observes `ctx.message.successful_payment.total_amount === 1000`

### Requirement: `user.sendInlineQuery` dispatches an inline_query update

The system SHALL provide `user.sendInlineQuery(query, options?)` that constructs a synthetic `Update` with `update.inline_query` populated. The `inline_query.from` SHALL be the user, `inline_query.query` SHALL be the supplied string, `inline_query.offset` SHALL default to `''`, and `inline_query.chat_type` SHALL default to `'sender'`. `options.chatType` MAY override `chat_type`. The call SHALL resolve once the middleware chain settles.

#### Scenario: Bot's inline_query handler receives the query text

- **WHEN** the test calls `await user.sendInlineQuery('cats')`
- **AND** the bot has a `bot.on('inline_query', ctx => { ... })` handler
- **THEN** the handler observes `ctx.inlineQuery.query === 'cats'`
- **AND** the handler observes `ctx.inlineQuery.from.id === user.id`

#### Scenario: chatType option is reflected in the dispatched update

- **WHEN** the test calls `await user.sendInlineQuery('dogs', { chatType: 'group' })`
- **THEN** the handler observes `ctx.inlineQuery.chat_type === 'group'`

### Requirement: `user.sendChosenInlineResult` dispatches a chosen_inline_result update

The system SHALL provide `user.sendChosenInlineResult(resultId, query, options?)` that constructs a synthetic `Update` with `update.chosen_inline_result` set to `{ result_id: resultId, from: user, query }`. The call SHALL resolve once the middleware chain settles.

#### Scenario: Bot's chosen_inline_result handler receives the result

- **WHEN** the test calls `await user.sendChosenInlineResult('result-1', 'cats')`
- **AND** the bot has a `bot.on('chosen_inline_result', ctx => { ... })` handler
- **THEN** the handler observes `ctx.chosenInlineResult.result_id === 'result-1'`
- **AND** the handler observes `ctx.chosenInlineResult.query === 'cats'`

### Requirement: `user.sendPreCheckoutQuery` dispatches a pre_checkout_query update

The system SHALL provide `user.sendPreCheckoutQuery(invoicePayload, currency, totalAmount, options?)` that constructs a synthetic `Update` with `update.pre_checkout_query` set to a `PreCheckoutQuery` stub. The stub SHALL carry the supplied `invoice_payload`, `currency`, `total_amount`, and `from: user`. A unique `id` SHALL be auto-generated with the prefix `'pcq-'`. The call SHALL resolve once the middleware chain settles.

#### Scenario: Bot's pre_checkout_query handler receives the query

- **WHEN** the test calls `await user.sendPreCheckoutQuery('order-456', 'EUR', 2000)`
- **AND** the bot has a `bot.on('pre_checkout_query', ctx => { ... })` handler
- **THEN** the handler observes `ctx.preCheckoutQuery.invoice_payload === 'order-456'`
- **AND** the handler observes `ctx.preCheckoutQuery.currency === 'EUR'`
- **AND** the handler observes `ctx.preCheckoutQuery.total_amount === 2000`
- **AND** the handler observes `ctx.preCheckoutQuery.from.id === user.id`

### Requirement: `user.sendShippingQuery` dispatches a shipping_query update

The system SHALL provide `user.sendShippingQuery(invoicePayload, shippingAddress, options?)` that constructs a synthetic `Update` with `update.shipping_query` set to a `ShippingQuery` stub. The `invoice_payload` and `shipping_address` SHALL be passed through from arguments; `from` SHALL be the user. A unique `id` SHALL be auto-generated with the prefix `'shq-'`. The call SHALL resolve once the middleware chain settles.

#### Scenario: Bot's shipping_query handler receives payload and address

- **WHEN** the test calls `await user.sendShippingQuery('order-789', { country_code: 'US', city: 'New York', street_line1: '123 Main St', post_code: '10001' })`
- **AND** the bot has a `bot.on('shipping_query', ctx => { ... })` handler
- **THEN** the handler observes `ctx.shippingQuery.invoice_payload === 'order-789'`
- **AND** the handler observes `ctx.shippingQuery.shipping_address.city === 'New York'`
- **AND** the handler observes `ctx.shippingQuery.from.id === user.id`
