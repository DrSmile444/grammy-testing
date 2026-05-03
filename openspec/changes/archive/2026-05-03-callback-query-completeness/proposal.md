## Why

Five of eight real-world bots tested during the integration run needed to dispatch a `callback_query`
update without a prior captured `Reply` — but `user.sendCallbackQuery()` doesn't exist. The only
current path, `reply.clickButton()`, also silently drops `reply_markup` from the embedded message,
breaking handlers that read keyboard state.

## What Changes

- Add `user.sendCallbackQuery(data, options?)` to `User` — dispatches a bare `callback_query` update
  without requiring a prior captured reply; accepts an optional `message` (with `reply_markup`) for
  handlers that gate on `ctx.update.callback_query.message.chat.type` or read keyboard state
- Fix `Reply.toCapturedMessage()` to include `reply_markup` — ensures `clickButton()` populates
  `ctx.callbackQuery.message.reply_markup` in the handler

## Capabilities

### New Capabilities

<!-- none -->

### Modified Capabilities

- `user-actor`: new `sendCallbackQuery(data, options?)` verb on `User`
- `reply-objects`: `toCapturedMessage()` includes `reply_markup` when present

## Impact

- `src/user.ts` — new `sendCallbackQuery` method
- `src/reply.ts` — `toCapturedMessage()` adds `reply_markup`
- `tests/` — new test coverage for both paths
- No breaking changes; additive only
