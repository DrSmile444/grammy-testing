## 1. Option interfaces in user.ts

- [x] 1.1 Add `SendWebAppDataOptions<TContext>` interface (`chat?`)
- [x] 1.2 Add `SendSuccessfulPaymentOptions<TContext>` interface (`chat?`)
- [x] 1.3 Add `SendInlineQueryOptions` interface (`chatType?: 'sender' | 'private' | 'group' | 'supergroup' | 'channel'`)
- [x] 1.4 Add `SendChosenInlineResultOptions` interface (empty — no optional fields yet)
- [x] 1.5 Add `SendPreCheckoutQueryOptions` interface (empty — no optional fields yet)
- [x] 1.6 Add `SendShippingQueryOptions` interface (empty — no optional fields yet)

## 2. Message-type dispatch verbs in user.ts

- [x] 2.1 Add `user.sendWebAppData(data, buttonText, options?)` building `message.web_app_data` inline
- [x] 2.2 Add `user.sendSuccessfulPayment(invoicePayload, currency, totalAmount, options?)` building `message.successful_payment` inline with stub charge IDs

## 3. Non-message update type verbs in user.ts

- [x] 3.1 Add `user.sendInlineQuery(query, options?)` dispatching `update.inline_query`
- [x] 3.2 Add `user.sendChosenInlineResult(resultId, query, options?)` dispatching `update.chosen_inline_result`
- [x] 3.3 Add `user.sendPreCheckoutQuery(invoicePayload, currency, totalAmount, options?)` dispatching `update.pre_checkout_query` with auto-generated id `'pcq-<n>'`
- [x] 3.4 Add `user.sendShippingQuery(invoicePayload, shippingAddress, options?)` dispatching `update.shipping_query` with auto-generated id `'shq-<n>'`; import `ShippingAddress` type from `grammy/types`

## 4. Exports in src/index.ts

- [x] 4.1 Export all six new option interfaces from `src/index.ts`

## 5. Tests

- [x] 5.1 Create `tests/reference/special-message-verbs.spec.ts` covering all six verbs: happy path per verb (bot receives the update, key fields observable), plus `chatType` override for `sendInlineQuery`

## 6. Quality gate

- [x] 6.1 Run `npm run typecheck` — passes
- [x] 6.2 Run `npm run lint` — passes
- [x] 6.3 Run `npm run test:run` — passes
- [x] 6.4 Run `npm run test:coverage` — passes at 80%+

## 7. Versioning

- [x] 7.1 Bump `version` in `package.json` from `0.3.0` to `0.4.0` (minor — new public API)
