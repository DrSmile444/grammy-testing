## 1. Baseline bump

- [x] 1.1 Bump `grammy` dev dependency to `^1.44.0` in `package.json` and reinstall (pulls `@grammyjs/types@3.28.0`)
- [x] 1.2 Bump `peerDependencies.grammy` lower bound to `^1.44.0` (public API now references Bot API 10.x types)
- [x] 1.3 Bump version `0.25.0 → 0.26.0` in both `package.json` and `jsr.json`
- [x] 1.4 Run `npm run typecheck` and fix any signature drift from the widened `@grammyjs/types` (added `supports_join_request_queries`, `members_only`)
- [x] 1.5 Run `npm run test:run` to confirm the existing suite still passes against grammy 1.44 (466 pass)

## 2. managed_bot / ctx.from verification

- [x] 2.1 Add a test that dispatches `user.manageBot(...)` and asserts `ctx.from` resolves inside a handler
- [x] 2.2 No shape change needed — grammy resolves `ctx.from` from `managed_bot.user`, which `manageBot` already emits

## 3. New message-sending methods (synthetic-message-responses)

- [x] 3.1 Add `sendRichMessage` and `sendLivePhoto` to `MESSAGE_METHODS_GUARD` in `src/high-level/chats.ts`
- [x] 3.2 Add both to the synthetic response map (`syntheticMessage`) so they return a `Message` with `message_id` + `date`
- [x] 3.3 Confirm routing into `chat.messages` / active members' `user.replies` and `messageIdToReply` registration
- [x] 3.4 Tests: synthetic `Message`, logging, and user-supplied `responses` override for both methods

## 4. Drafts capture (drafts-capture)

- [x] 4.1 Add a drafts projection (`chats.draftsFor(user)` and `user.drafts`) capturing `sendMessageDraft` / `sendRichMessageDraft` in order with `method`, `chatId`, `payload`
- [x] 4.2 Route draft methods into `deriveFromCapture` so they populate the projection but NOT `chat.messages` / `user.replies`
- [x] 4.3 Ensure draft methods resolve with `true` by default (no synthetic `Message`) — global default already returns `true`
- [x] 4.4 Tests: single draft captured, streaming sequence order, drafts absent from messages log, `true` default

## 5. Rich message read ergonomics (rich-messages)

- [x] 5.1 Add `reply.richMessage` accessor returning the sent `InputRichMessage` (`{ html?, markdown?, is_rtl?, skip_entity_detection? }`) or `undefined`
- [x] 5.2 Add `reply.richMessage.plainText` that strips html tags / markdown markup; empty string when neither present
- [x] 5.3 Tests: `html` exposed, `undefined` for non-rich replies, `plainText` strips html and markdown

## 6. Guest mode (guest-mode)

- [x] 6.1 Add `user.sendGuestMessage(chat, text?, options?)` dispatching a `guest_message` update (a `Message` with `from`, `chat`, `text`, generated `guest_query_id`); return the `guest_query_id`
- [x] 6.2 Track `guest_query_id → user` correlation in the orchestrator (mirror `messageIdToReply`) and expose it via `chats.guestQueryUser(queryId)`
- [x] 6.3 Add synthetic `answerGuestQuery` default → `{ inline_message_id: <synthetic string> }`; ensure it is NOT routed into `chat.messages` / `user.replies`
- [x] 6.4 Tests: dispatch returns query id, text carried, synthetic `inline_message_id`, no chat.messages pollution, two-user correlation

## 7. Join-request queries (user-actor + modern-update-types)

- [x] 7.1 Update `user.requestJoin(group)` to emit `chat_join_request.query_id` and return it
- [x] 7.2 Synthetic defaults: `answerChatJoinRequestQuery` → `true` (global default); `sendChatJoinRequestWebApp` generic capture
- [x] 7.3 Tests: `requestJoin` returns query id and the update carries it; `answerChatJoinRequestQuery` captured + resolves true

## 8. Reaction removal (reaction-removal-capture)

- [x] 8.1 Add a reactions-removed projection (`chats.reactionRemovals`) modeled on `delete-message-capture`, capturing `deleteMessageReaction` / `deleteAllMessageReactions` with `method`, `chatId`, `messageId?`, `raw`
- [x] 8.2 Route both methods through `deriveFromCapture`; resolve with `true` by default (global default)
- [x] 8.3 Tests: `deleteMessageReaction` recorded with `messageId`; `deleteAllMessageReactions` recorded with `messageId` undefined; `true` default

## 9. Other new methods (auto-derived-api-responses)

- [x] 9.1 Add static synthetic defaults in `buildDefaultResponses()`: `getManagedBotAccessSettings` → `BotAccessSettings`, `setManagedBotAccessSettings` → `true`, `getManagedBotToken` / `replaceManagedBotToken` → token `string`
- [x] 9.2 Add `getUserPersonalChatMessages` → `[]` default
- [x] 9.3 Honor `return_bots: false` in the `getChatAdministrators` resolver (exclude `is_bot` admins)
- [x] 9.4 No poll-options minimum validation exists in the library — nothing to relax (generic capture)
- [x] 9.5 Tests: each default shape; `return_bots` retains human admins; user `responses` override wins

## 10. Examples + docs

- [x] 10.1 Add example bots: `24-guest-mode-bot`, `25-rich-message-bot` (covers drafts/streaming), `26-reaction-removal-bot` (with specs) under `examples/`
- [x] 10.2 Add a consolidated "Bot API 10 Features" VitePress doc page under `site/high-level/` and link it in the sidebar
- [x] 10.3 Add a `## 0.26.0 — 2026-06-14` entry to `docs/CHANGELOG.md` covering all user-visible changes

## 11. Quality gate + finalize

- [x] 11.1 Run the full quality gate in order: `lint:fix`, `format:md`, `typecheck`, `lint`, `test:run`, `test:coverage` (494 tests pass)
- [x] 11.2 Run `npm run test:cjs` to verify CJS build (CJS exports OK)
- [x] 11.3 Fix every error before marking complete
