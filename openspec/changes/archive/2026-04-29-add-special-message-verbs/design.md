## Context

Two categories of update are missing from `User`:

**Message-type updates** (dispatch `update.message`): `web_app_data` and `successful_payment`. These flow through the Reply system the same way `sendPhoto` does — the captured message lands in `user.replies` and `chat.messages`.

**Non-message update types** (own top-level Update field): `inline_query`, `chosen_inline_result`, `pre_checkout_query`, `shipping_query`. These do NOT produce a `message` field — they carry their own top-level field. They bypass the Reply system entirely and call `bot.handleUpdate` directly with the appropriate shaped update.

## Goals / Non-Goals

**Goals:**
- Add `user.sendWebAppData(data, buttonText, options?)` — message-type update with `web_app_data`
- Add `user.sendSuccessfulPayment(invoicePayload, currency, totalAmount, options?)` — message-type update with `successful_payment`; stubs the required `telegram_payment_charge_id` and `provider_payment_charge_id` fields with placeholder strings
- Add `user.sendInlineQuery(query, options?)` — dispatches `update.inline_query`; `options.chatType` sets `chat_type` (defaults to `'sender'`)
- Add `user.sendChosenInlineResult(resultId, query, options?)` — dispatches `update.chosen_inline_result`
- Add `user.sendPreCheckoutQuery(invoicePayload, currency, totalAmount, options?)` — dispatches `update.pre_checkout_query`; auto-generates `id`
- Add `user.sendShippingQuery(invoicePayload, shippingAddress, options?)` — dispatches `update.shipping_query`; auto-generates `id`; `shippingAddress` is a full `ShippingAddress` object passed through directly

**Non-Goals:**
- Simulating Telegram's payment provider round-trip
- `sendGame` (games are sent by bots, not dispatched by users in tests)
- `passport_data` (Telegram Passport — extremely niche)

## Decisions

### Message-type verbs follow the existing pattern

`sendWebAppData` and `sendSuccessfulPayment` build a `Message` inline and call `bot.handleUpdate({ update_id, message })`, identical to `sendLocation`. No new helpers in `media-stubs.ts` are needed — these types carry structured data, not file references.

`SuccessfulPayment` has two required charge ID fields (`telegram_payment_charge_id`, `provider_payment_charge_id`). They are stubs (`'charge-tg-stub'`, `'charge-provider-stub'`) — tests that need specific values can use `sendWebAppData` or raw `handleUpdate`.

### Non-message verbs dispatch the update type directly

`sendInlineQuery`, `sendChosenInlineResult`, `sendPreCheckoutQuery`, `sendShippingQuery` each build the appropriate typed object and dispatch `{ update_id, <field>: ... }`. The `update_id` is derived from `ids.nextMessageId()` with a unique offset per verb to avoid collisions.

### `shippingAddress` passed through as-is

The `ShippingAddress` shape (`country_code`, `city`, `street_line1`, `post_code`, optional `state`/`street_line2`) is passed directly from the caller. No stub defaults are generated — the caller must supply a complete address. This matches the design of `sendVenue` (positional args for required fields).

### Option interfaces for chat override

`sendWebAppData` and `sendSuccessfulPayment` accept `options.chat` (defaults to user's private chat), matching all other message-type verbs. The non-message verbs (`sendInlineQuery` etc.) do not accept `options.chat` — inline queries and payment queries are not tied to a specific chat context in the same way.

## Risks / Trade-offs

- `SuccessfulPayment.telegram_payment_charge_id` and `provider_payment_charge_id` are stubbed. Tests that assert on these specific values will need raw `handleUpdate`.
- `PreCheckoutQuery` and `ShippingQuery` require an `id` — auto-generated with `'pcq-<n>'` and `'shq-<n>'` prefixes using `ids.nextMessageId()`.
