# Changelog

## 0.11.0 — 2026-05-01

### `chats.clear()` — single-call state reset

- Added `chats.clear()` method that atomically resets all captured state: `outgoing` requests, per-user `replies`, `actions`, and `edits` logs, per-chat `messages` and `deletions` logs, and internal routing registries (`messageIdToReply`, `clickers`). User/chat registries and membership state are preserved, so existing `user` and `group` references remain valid. Replaces the previous 4–5 individual `clear()` calls required in `beforeEach` blocks.

### `warnOnUnregisteredChats` — developer warning for silent misses

- Bot calls to `sendMessage`, `sendPhoto`, and other message-sending methods, `sendChatAction`, and `deleteMessage` targeting a chat ID not registered with the `Chats` orchestrator now emit a `console.warn` by default. The warning includes the method name, the unregistered chat ID, and guidance on how to register the chat or suppress the warning.
- Pass `{ warnOnUnregisteredChats: false }` to `prepareBot`, `prepareComposer`, or `prepareMiddleware` to suppress the warning (useful for bots that intentionally fan out to external log channels).

### Fix: `postinstall` script no longer breaks consumer installs

- Removed the `postinstall` entry from `package.json`. The `./scripts/link-codex-skills.sh` hook is a local development convenience and is not present in the published package. Consumers no longer need `npm install --ignore-scripts` to work around the missing script error.

---

## 0.10.0 — 2026-05-01

### Deletion tracking

- Added `DeletionsLog` per-chat log of `deleteMessage` calls, accessible via `chats.deletionsFor(chat)`
- Each deletion entry carries the synthetic `message_id` and a back-reference to the original `Reply` object (if the message was sent during the test)
- Exported new `Deletion` type

### copyMessage and forwardMessage fixes

- `copyMessage` now returns a synthetic `MessageId` (`{ message_id }`) instead of `true`
- `forwardMessage` now returns a synthetic `Message` (`{ message_id, date }`) instead of `true`
- Both methods are now tracked by the `Chats` pipeline and produce `Reply` objects that appear in `chat.messages` and `user.replies`

---

## 0.9.0 — 2026-05-01

### Synthetic Message responses

- All message-sending methods (`sendMessage`, `sendPhoto`, `sendDocument`, `sendVideo`, `sendAudio`, `sendVoice`, `sendVideoNote`, `sendAnimation`, `sendSticker`, `sendLocation`, `sendContact`, `sendVenue`, `sendPoll`, `sendDice`, `sendMediaGroup`) now return a real `Message` (or `Message[]` for `sendMediaGroup`) by default, using the synthetic `message_id` already assigned to the captured `Reply`
- User-supplied `responses` entries continue to override the defaults

### State injection

- `PrepareOptions` gains an optional `state` field
- When provided, a `mockState` middleware is automatically inserted before the bot/composer under test so `ctx.state` is pre-populated for every dispatched update
- Compatible with `prepareBot`, `prepareComposer`, and `prepareMiddleware`

---

## 0.8.0 — 2026-05-01

### User DX enhancements

- Added `user.replies` getter returning the user's `RepliesInbox` directly — no more `chats.repliesFor(user)` at every assertion site
- Added `RepliesInbox.lastOrThrow()` returning `Reply<TContext>` (non-nullable), throwing with a descriptive message when the inbox is empty
- Added `chats.actionsFor(user)` returning an `ActionsLog` that captures `sendChatAction` payloads for that user
- Added `chats.editsFor(user)` returning an `EditsLog` that captures `editMessageText`, `editMessageCaption`, and `editMessageMedia` calls resolved to that user

### ID and counter fixes

- Fixed `joinChat`/`leaveChat` using hardcoded constants for `update_id`; all user actor dispatches now use `nextUpdateId()`
- Fixed `sendText`, `sendForwarded`, and `editMessage` deriving `updateId` from `nextMessageId()` instead of `nextUpdateId()`
- Implemented `IdGenerator`-scoped message IDs; removed all module-level counters to eliminate counter bleed between test runs in the same process

### JSDoc coverage

- Added JSDoc to all public and non-trivial internal methods and constructors across `src/`
- Enabled `jsdoc/require-jsdoc` for class methods and constructors in ESLint config

### CI improvements

- Dropped Node 18 from the test matrix; raised minimum engine to `>=20.0.0`
- Fixed `verify-cjs.cjs` require paths to resolve from project root
- Fixed npm/corepack CI workflow issues; switched to direct `npm install`

---

## 0.7.2 — 2026-04-30

### Fixes and internal improvements

- Fixed `recordClick` not including `chat_id` in the callback routing record, causing button clicks in one chat to route replies globally
- Added `nextUpdateId()` method to `IdGenerator`
- Refactored `OutgoingRequests.requests` from a public mutable field to a read-only getter backed by a private array
- Extracted CJS verification to `scripts/verify-cjs.cjs`; lowered Node.js engine requirement to `>=18.0.0`
- Raised `OutgoingRequests.getAll()` typed overloads from 6 to 10 type parameters

---

## 0.7.1 — 2026-04-30

### Type safety improvements

- Replaced hand-copied `ParseMode` union with a re-export from grammy, keeping it in sync with upstream automatically
- Converted `MediaType` union to a derived `(typeof MEDIA_FIELDS)[number]` type so adding a new media field is a compile-time error if the union is not updated
- Added exhaustiveness guard to `makeChatMember` switch so new grammy `ChatMemberStatus` variants produce a TypeScript error rather than silently falling through to `'kicked'`

### ESLint compliance

- Removed `Plugin source overrides` and `Test overrides` blocks from `eslint.config.mjs`; all violations in `src/` and `tests/` have been fixed instead
- Zero ESLint overrides in source and test code

---

## 0.7.0 — 2026-04-30

### Business account API

- Added `BusinessAccount` high-level actor with verbs for all Telegram Business API update types:
  - `connect(options?)` → `business_connection` (is_enabled: true)
  - `disconnect(options?)` → `business_connection` (is_enabled: false)
  - `sendMessage(text, options?)` → `business_message`
  - `editMessage(messageId, newText, options?)` → `edited_business_message`
  - `deleteMessages(messageIds, options?)` → `deleted_business_messages`
- Added `user.manageBot(botUser, options?)` → `managed_bot`

### Previously excluded update types

- Added `user.purchasePaidMedia(payload, options?)` → `purchased_paid_media`
- Added `chat.dispatchReactionCount(messageId, reactions, options?)` on `Group`, `Supergroup`, and `Channel` → `message_reaction_count`
- Added `chats.dispatchPollState(poll, options?)` → `poll`
- Removed all newly-covered types from the "Not covered" section in README

---

## 0.6.0 — 2026-04-30

### Modern update types

- Added `user.reactTo(reply, reaction)` → `message_reaction`
- Added `user.answerPoll(reply, optionIndices)` → `poll_answer`
- Added `user.requestJoin(group)` → `chat_join_request`
- Added `group.dispatchMemberUpdate(adminUser, targetUser, newStatus, options?)` on `Group` and `Supergroup` → `chat_member`
- Added `channel.editPost(messageId, newText, options?)` → `edited_channel_post`
- Added `user.boostChat(chat)` → `chat_boost`
- Added `user.removeBoost(chat, boostId)` → `removed_chat_boost`

---

## 0.5.1 — 2026-04-29

### Reply accessors

- Added `reply.replyingTo` — the earlier `Reply` object that this message is replying to
- Added `reply.replyMarkup` — raw `reply_markup` escape hatch for inspecting non-inline-keyboard markup

### Private chat message log

- `PrivateChat` now exposes a `messages` log consistent with `Group` and `Supergroup`, capturing every bot message sent to a private DM

### Context constructor option

- `prepareComposer` and `prepareMiddleware` now accept a `ContextConstructor` option in `PrepareOptions`, enabling bots with class-based custom context types to instantiate the correct runtime class

---

## 0.4.0 — 2026-04-29

### Special message verbs

- Added `user.sendInlineQuery(query, options?)` → `inline_query`
- Added `user.chooseInlineResult(resultId, options?)` → `chosen_inline_result`
- Added `user.sendWebAppData(data, buttonText, options?)` → `web_app_data`
- Added `user.completePurchase(options?)` → `successful_payment`
- Added `user.sendPreCheckoutQuery(options?)` → `pre_checkout_query`
- Added `user.sendShippingQuery(options?)` → `shipping_query`

---

## 0.3.0 — 2026-04-28

### Remaining dispatch verbs

- Added `user.sendAudio(options?)` → `audio` message
- Added `user.sendVoice(options?)` → `voice` message
- Added `user.sendVideoNote(options?)` → `video_note` message
- Added `user.sendAnimation(options?)` → `animation` message
- Added `user.sendSticker(options?)` → `sticker` message
- Added `user.sendLocation(options?)` → `location` message
- Added `user.sendContact(options?)` → `contact` message
- Added `user.sendVenue(options?)` → `venue` message
- Added `user.sendPoll(question, options?, options2?)` → `poll` message
- Added `user.sendDice(options?)` → `dice` message

---

## 0.2.0 — 2026-04-28

### Media send verbs

- Added `user.sendPhoto(options?)` → single `photo` message
- Added `user.sendDocument(options?)` → `document` message
- Added `user.sendVideo(options?)` → `video` message
- Added `user.sendMediaGroup(items)` → dispatches N updates sharing a `media_group_id`, each with realistic `file_id` fields

---

## 0.1.1 — 2026-04-28

### Plugin interop

- Added `tests/plugins/` reference suite demonstrating `@grammyjs/testing` usage alongside:
  - `@grammyjs/conversations` — multi-step conversation flows
  - `@grammyjs/menu` — inline menu navigation and callback routing
  - `@grammyjs/parse-mode` — `ctx.replyWithHTML()` / `ctx.replyFmt()` and `parseMode` assertions
  - `@grammyjs/hydrate` — hydrated message objects
  - `@grammyjs/chat-members` — member status tracking

---

## 0.1.0 — 2026-04-27

### Low-level testing primitives

- Added `prepareBot(bot, options?)` entry point — sets up an in-process grammY bot with a captured transformer and returns `{ chats, bot }`
- Added `prepareComposer(composer, options?)` and `prepareMiddleware(middleware, options?)` entry points for testing composers and middleware in isolation
- Added error simulation via `options.responses` — supply per-method canned responses or a function to produce them
- Added `OutgoingRequests` capture surface (`outgoing.requests`, `outgoing.getAll()`, `outgoing.getLast()`, `outgoing.idle()`)
- Added low-level update builders: `buildTextMessage`, `buildCallbackQuery`, `buildInlineQuery`, `buildMyChatMember`, and others

### High-level Chats/User/Admin API

- Added `Chats<TContext>` orchestrator with `newUser(profile?)`, `newGroup(name?)`, `newSupergroup(name?)`, `newChannel(name?)`, `newPrivateChat(user)` factory methods
- Added `User<TContext>` actor as the primary test subject driver
- Added `Admin` role via `group.promote(user, perms?)` and `group.restrict(user, perms?)`
- Added `Reply<TContext>` normalized object with `text`, `parseMode`, `entities`, `buttons`, `replyMarkup`, `chat`, `replyingTo`, `raw`, and `clickButton(textOrCallbackData)` for synthesizing callback queries
- Added `user.replies` and `chat.messages` inbox/log as the primary assertion surfaces
- Added `chats.outgoing` for raw outgoing request inspection

### User dispatch verbs

- Added `user.sendText(text, options?)` and `user.sendMessage(text, options?)` (alias)
- Added `user.sendCommand(command, args?, options?)` with auto-emitted `bot_command` entity and optional `chat` target for group commands
- Added `user.sendForwarded(reply, options?)` and `user.editMessage(reply, newText, options?)`
- Added `user.joinChat(chat, options?)` and `user.leaveChat(chat, options?)` service-message verbs
- Added `channel.postMessageTo(group, text, options?)` for channel-as-author (`sender_chat`) scenarios

### Build and CI

- Configured dual ESM + CJS exports with subpath export map (`./`, `./low-level`, `./high-level`)
- Added GitHub Actions CI matrix covering Node 20 and Node 22, CJS verification, and Bun
- Added `jsr.json` scaffold for future Deno/JSR publishing
