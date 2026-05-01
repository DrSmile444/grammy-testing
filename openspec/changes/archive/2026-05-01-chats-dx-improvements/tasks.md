## 1. Fix #15 — Remove postinstall script

- [x] 1.1 Remove the `"postinstall": "./scripts/link-codex-skills.sh"` line from `package.json`
- [x] 1.2 Verify `npm install` (or `npm ci`) completes without errors in a clean run

## 2. Implement #13 — `chats.clear()`

- [x] 2.1 Add a `clear()` method to the `Chats` class in `src/high-level/chats.ts` that resets: `outgoing`, all per-user `replies`/`actions`/`edits`, all per-chat `messages`, all `chatDeletions` log entries, `messageIdToReply`, `clickers`, and `lastCapturedReply`
- [x] 2.2 Export or expose `clear()` as a public method (no type export changes needed — it appears on the existing `Chats<TContext>` type)
- [x] 2.3 Write tests covering: single-call reset of all logs, user/chat references still valid after clear, individual log clears still work

## 3. Implement #14 — Warn on unregistered chat

- [x] 3.1 Add `warnOnUnregisteredChats: boolean` field to the `Chats` class (stored as an instance property, default `true`)
- [x] 3.2 Add `warnOnUnregisteredChats?: boolean` to `PrepareOptions` in `src/low-level/prepare-bot.ts`; pass it to the `Chats` constructor (or via a setter after construction)
- [x] 3.3 Emit `console.warn('[grammy-testing] Bot called <method> to unregistered chat <chatId>. Register it with chats.newChannel() / newSupergroup() / newGroup(), or pass { warnOnUnregisteredChats: false } to suppress.')` in `deriveFromCapture` when `findChatByTelegramId` returns `undefined` for message-method calls
- [x] 3.4 Emit the same warning in `deriveChatAction` when the chat is not found
- [x] 3.5 Emit the same warning in `deriveDelete` when `chatDeletions.get(chatId)` returns `undefined`
- [x] 3.6 Write tests covering: warning fires by default for unknown chat, warning suppressed when `warnOnUnregisteredChats: false`, no warning for unknown message ID in `editMessage*`, warning for `sendChatAction` and `deleteMessage` to unknown chats

## 4. Documentation and versioning

- [x] 4.1 Update `CHANGELOG.md` with user-visible entries for all three fixes: `postinstall` removal, `chats.clear()`, and `warnOnUnregisteredChats`
- [x] 4.2 Bump version (patch release — all changes are additive or removals of unintended behavior)
