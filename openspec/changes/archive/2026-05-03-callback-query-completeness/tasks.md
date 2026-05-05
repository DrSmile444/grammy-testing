## 1. Fix `Reply.toCapturedMessage()` — include `reply_markup`

- [x] 1.1 Locate `toCapturedMessage()` in `src/reply.ts` and add `reply_markup: this.replyMarkup` to the returned object (when `this.replyMarkup` is non-null)
- [x] 1.2 Write a `reply.spec.ts` test: bot sends a reply with an inline keyboard, test calls `clickButton`, asserts `ctx.callbackQuery.message.reply_markup` equals the keyboard

## 2. Add `user.sendCallbackQuery`

- [x] 2.1 Add `SendCallbackQueryOptions` interface to `src/user.ts` (fields: `message?: Partial<Message> & { message_id?: number }`, `chat?: PrivateChat | Group | Supergroup`)
- [x] 2.2 Implement `sendCallbackQuery(data: string, options?: SendCallbackQueryOptions): Promise<void>` on `User`:
  - Synthesize `callback_query.message`: merge `options.message` with auto-filled `chat` (private chat default) and `message_id` (via `nextMessageId()` when absent)
  - Set `callback_query.from` to the user's profile, `callback_query.id` to a stable synthetic string, `callback_query.chat_instance` to a stable synthetic string
  - Dispatch via `this.ctx.bot.handleUpdate({ update_id: nextUpdateId(), callback_query: ... })`
- [x] 2.3 Export `SendCallbackQueryOptions` from `src/index.ts`
- [x] 2.4 Write tests covering the five spec scenarios:
  - Bare dispatch (no prior reply) — handler fires, `data` and `from.id` correct
  - `chatType('private')` filter passes with auto-synthesized message
  - Explicit `message` option populates `callback_query.message`
  - `message_id` auto-filled when partial message has none
  - Return value is `undefined`

## 3. Changelog, version bump, quality gate

- [x] 3.1 Add entry to `docs/CHANGELOG.md` under a new `## 0.19.0 — 2026-05-03` heading:
  - `user.sendCallbackQuery(data, options?)` — dispatch a `callback_query` update without requiring a prior captured reply
  - `Reply.toCapturedMessage()` now includes `reply_markup` — `ctx.callbackQuery.message.reply_markup` is no longer `undefined` after `clickButton()`
- [x] 3.2 Bump version to `0.19.0` in both `package.json` and `jsr.json`
- [x] 3.3 Run `npm run lint:fix`
- [x] 3.4 Run `npm run format:md`
- [x] 3.5 Run `npm run typecheck`
- [x] 3.6 Run `npm run lint`
- [x] 3.7 Run `npm run test:run`
- [x] 3.8 Run `npm run test:coverage`
