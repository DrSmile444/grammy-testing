## 1. Add relay identity to `dispatch.ts`

- [x] 1.1 Add `makeRelayUser()` factory function in `dispatch.ts` returning the `777_000` identity shape (`{ id: 777_000, is_bot: true, first_name: 'Telegram', username: 'telegram' }`)
- [x] 1.2 Export `TELEGRAM_RELAY` constant from `dispatch.ts` (re-uses `makeRelayUser()` output)
- [x] 1.3 Re-export `TELEGRAM_RELAY` from `src/index.ts`

## 2. Add `postRelayMessage` to `Group` and `Supergroup`

- [x] 2.1 Add `postRelayMessage(text, options?)` method to `Group` that constructs a `Message` with `from = makeRelayUser()`, dispatches via `bot.handleUpdate`, and returns the `Message`
- [x] 2.2 Add `options.messageId` override support (falls back to `this.ids.nextMessageId()`)
- [x] 2.3 Add `options.channel` support: when present, set `message.forward_origin` to `{ type: 'channel', chat: channel.toTelegramChat(), date: ..., message_id: options.messageId }`
- [x] 2.4 Mirror `postRelayMessage` on `Supergroup` with identical implementation

## 3. Loosen `reply_to_message` type in `SendTextOptions`

- [x] 3.1 Change `reply_to_message?: Message` to `reply_to_message?: Partial<Message> & { message_id: number }` in `SendTextOptions` in `user.ts`
- [x] 3.2 In `sendText`, when `options.reply_to_message` is present, build the full shape passed to `dispatchTextMessage` by spreading auto-fills for `date` and `chat` before the caller's partial: `{ date: Math.floor(Date.now() / 1000), chat: targetChat, ...options.reply_to_message }`
- [x] 3.3 Verify `dispatchTextMessage` receives and threads the constructed `reply_to_message` into the `message` object

## 4. Tests and docs

- [x] 4.1 Add tests for `group.postRelayMessage` covering the scenarios in `specs/relay-message-dispatch/spec.md`
- [x] 4.2 Add tests for the partial `reply_to_message` type covering the scenarios in `specs/user-actor/spec.md`
- [x] 4.3 Add test for the full relay flow: `postRelayMessage` → `sendText` with returned message as `reply_to_message`
- [x] 4.4 Update CHANGELOG and bump minor version
- [x] 4.5 Mark TODO.md item #27 as resolved (✅)
