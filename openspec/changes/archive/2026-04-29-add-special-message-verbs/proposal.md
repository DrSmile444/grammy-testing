## Why

After adding all core message-type verbs, six Telegram update types that a user can trigger have no dispatch verb on `User`: inline queries, chosen inline results, Web App data, successful payments, pre-checkout queries, and shipping queries. Without these, tests for bots that handle payments, Web Apps, or inline mode must fall back to raw `bot.handleUpdate` calls and construct the full update shape by hand.

## What Changes

- Add `user.sendInlineQuery(query, options?)` — dispatches an `inline_query` update
- Add `user.sendChosenInlineResult(resultId, query, options?)` — dispatches a `chosen_inline_result` update
- Add `user.sendWebAppData(data, buttonText, options?)` — dispatches a `message` update with `web_app_data`
- Add `user.sendSuccessfulPayment(invoicePayload, currency, totalAmount, options?)` — dispatches a `message` update with `successful_payment`
- Add `user.sendPreCheckoutQuery(invoicePayload, currency, totalAmount, options?)` — dispatches a `pre_checkout_query` update
- Add `user.sendShippingQuery(invoicePayload, shippingAddress, options?)` — dispatches a `shipping_query` update

## Capabilities

### New Capabilities

- `special-message-verbs`: All six new `user.send*` verbs for inline mode, Web App, and payment update types

### Modified Capabilities

- `user-actor`: New verbs added to the actor surface

## Impact

- `src/high-level/user.ts` — six new methods and six new option interfaces
- `src/index.ts` — new option types exported
- `tests/reference/special-message-verbs.spec.ts` — new reference suite spec file
- Minor version bump (`0.3.0 → 0.4.0`)
