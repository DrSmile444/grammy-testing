# Changelog

## 0.26.0 — 2026-06-16

### First public release as `grammy-testing`

This is the first public npm release. The package is published under the third-party name
**`grammy-testing`** (previously scaffolded as `@grammyjs/testing`), following the grammY
third-party plugin convention (`grammy-<name>`). Install with `npm install --save-dev grammy-testing`
and import from `grammy-testing` / `grammy-testing/low-level`. JSR publishing is deferred for now;
the `@grammyjs/testing` name is reserved for a future official grammY release.

### grammY 1.44 / Bot API 10.0 + 10.1 support

Bumps the `grammy` peer and dev dependency to `^1.44.0` (Bot API 10.1, `@grammyjs/types@3.28.0`)
and adds first-class support for the new surfaces. All shapes were verified against the published
types.

- **New message-sending methods**: `sendRichMessage` and `sendLivePhoto` now return a synthetic
  `Message` and are routed into `chat.messages` / `user.replies`, like other senders.
- **Rich message accessor**: `reply.richMessage` exposes the sent `InputRichMessage`
  (`html` / `markdown` / `is_rtl` / `skip_entity_detection`) with a `plainText` convenience.
- **Message drafts**: `sendMessageDraft` / `sendRichMessageDraft` (both return `true`) are captured
  into a drafts projection — `user.drafts` and `chats.draftsFor(user)` — for streaming-sequence
  assertions.
- **Guest mode**: `user.sendGuestMessage(chat, text?)` dispatches a `guest_message` update and
  returns the generated `guest_query_id`. `answerGuestQuery` resolves with a synthetic
  `SentGuestMessage` (`{ inline_message_id }`) and is correlated to the originating user via
  `chats.guestQueryUser(queryId)`; it is not routed into `chat.messages`.
- **Join-request queries**: `user.requestJoin(group)` now emits and returns the
  `chat_join_request.query_id`.
- **Reaction removal**: `deleteMessageReaction` / `deleteAllMessageReactions` are captured into
  `chats.reactionRemovals`.
- **Managed-bot defaults**: synthetic defaults for `getManagedBotAccessSettings`,
  `setManagedBotAccessSettings`, `getManagedBotToken`, `replaceManagedBotToken`, and
  `getUserPersonalChatMessages`; `getChatAdministrators` honors `return_bots: false`.
- **Examples & docs**: new `24-guest-mode-bot`, `25-rich-message-bot`, and `26-reaction-removal-bot`
  examples plus a "Bot API 10 Features" documentation page.

## 0.25.0 — 2026-05-07

### Transformer infrastructure

- **`TerminalTransformer` type**: `createTransformer` in `src/low-level/transformer.ts` now returns
  an internal `TerminalTransformer` type whose signature omits `_previous`. A new `asTransformer`
  adapter in `prepare-bot.ts` converts it for `bot.api.config.use`. The 4-line prose comment
  explaining why `_previous` was never called is replaced by this compile-time invariant.
- **`respondNextRaw(method, response)`**: New method on `OutgoingRequests` (accessible as
  `chats.outgoing.respondNextRaw`) that injects a verbatim raw response for the next matching
  API call — bypassing the `{ ok: true, result }` wrapper. Use it to simulate rate-limit
  responses (`{ ok: false, error_code: 429, parameters: { retry_after: 0 } }`) that outer
  transformers such as `@grammyjs/auto-retry` can observe and act on.
- **Auto-retry retry-on-429 test**: `tests/plugins/auto-retry.spec.ts` now includes a test
  that verifies autoRetry retries a `sendMessage` call when `respondNextRaw` injects a 429
  raw response. Two `sendMessage` entries appear in `chats.outgoing.requests` (original + retry).

## 0.24.1 — 2026-05-07

### Code quality

- **`createTransformer` terminal-intent comment**: `_previous` in `src/low-level/transformer.ts`
  is now annotated with an inline comment explaining it is intentionally never called. This
  documents the invariant that the snapshot-and-reinstall pattern in `prepareBot` relies on.
- **Plugin example context flavor types**: `examples/21-files-bot` now uses `FileFlavor<Context>`
  and `examples/22-hydrate-bot` uses `HydrateFlavor<Context>`, replacing `as unknown as` casts
  with proper plugin-exported flavor types.
- **Test helper cleanup**: Empty `/** */` JSDoc blocks removed from the four private helper
  functions in `tests/plugins/chat-members.spec.ts`.
- **ESLint examples alignment**: `examples/**/*.ts` JSDoc rules are no longer silenced — examples
  are now held to the same JSDoc standards as `src/`.

## 0.24.0 — 2026-05-07

### Plugin interop: `grammy-media-groups`

`mediaGroupTransformer(adapter)` installed via `bot.api.config.use()` before `prepareBot` now
runs correctly during tests and stores outgoing media group messages in the adapter.

- **`syntheticMediaGroup` response shape**: every message in the default `sendMediaGroup` response
  now includes a `chat` field (required by `storeMessages` for deduplication by `chat.id`) and a
  `media_group_id` string shared across all messages in the same call (required for adapter grouping).
  This is a minor additive change — bots reading `sendMediaGroup` return values in tests will see
  the additional fields.
- **`grammy-media-groups` added to plugin interop table**: install `mediaGroupTransformer(adapter)`
  before `prepareBot`, assert on `adapter.read(media_group_id)`.

See `tests/plugins/media-groups.spec.ts` and `site/plugins/media-groups.md`.

## 0.23.0 — 2026-05-07

### Plugin transformer support

Bot-level transformers installed via `bot.api.config.use()` are now correctly chained during
tests. Previously the library's mock transformer was installed last (outermost), silently
skipping all user-installed transformers. With this fix, the library transformer is always
innermost — every transformer you install runs normally and can process synthetic responses.

- **Transformer chain fix**: `prepareBot` now snapshots existing transformers, installs the
  library transformer first, then reinstalls user transformers on top. Uses only the public
  `installedTransformers()` / `use()` API — no private access.
- **Realistic `getFile` default**: `buildDefaultResponses` now returns a valid `File` shape
  for `getFile` (`file_id`, `file_unique_id`, `file_size`, `file_path`) instead of `true`, so
  `@grammyjs/files` can hydrate it without a custom `responses` override.
- **Synthetic message includes `chat`**: Default `sendMessage` / `sendPhoto` / etc. responses
  now include a `chat` field so `@grammyjs/hydrate` can attach `delete()` / `edit()` methods.

### New plugin interop: `@grammyjs/files`

`hydrateFiles(bot.token)` installed before `prepareBot` runs correctly. `ctx.getFile()` returns
a hydrated `File` with `getUrl()` and `download()` methods.

See `tests/plugins/files.spec.ts` and `examples/21-files-bot/`.

### New plugin interop: `@grammyjs/hydrate`

`hydrateApi()` (bot-level transformer) and `hydrate()` (context middleware) both work. Bot API
call results include `delete()` / `edit()` / `pin()` convenience methods. Context objects get
`ctx.message.delete()` and similar shortcuts.

See `tests/plugins/hydrate.spec.ts` and `examples/22-hydrate-bot/`.

### New plugin interop: `@grammyjs/auto-retry`

`autoRetry(options)` installed before `prepareBot` is now part of the transformer chain for
every API call. Normal bot operation is unaffected. `failNext` errors propagate through
`autoRetry` to the handler catch block (autoRetry does not retry thrown GrammyErrors).

See `tests/plugins/auto-retry.spec.ts` and `examples/23-auto-retry-bot/`.

### New plugin interop: `@grammyjs/chat-members` — `hydrateChatMember()`

`hydrateChatMember()` API transformer is now supported. Install via
`bot.api.config.use(hydrateChatMember())` before `prepareBot`. `getChatMember` and
`getChatAdministrators` results are augmented with an `.is(query)` method at test time, matching
production behaviour.

See `tests/plugins/chat-members.spec.ts` (new `hydrateChatMember()` describe block).

### Custom transformer chain support

Request-mutating and response-augmenting transformers installed via `bot.api.config.use()`
before `prepareBot` now run normally. Payload mutations are visible in
`chats.outgoing.requests`; response augmentations are visible to handlers.

See `tests/plugins/custom-transformer.spec.ts`.

### VitePress: new Plugins section

A dedicated **Plugins** sidebar group replaces the mixed plugin/recipe content in **Recipes**:

- `conversations` and `menu` pages moved from `site/recipes/` to `site/plugins/`
- Five new pages: Chat Members, Files, Hydrate, Auto-Retry, Transformer Throttler
- Recipes retains only general-pattern pages: Sessions, Keyboards, Error Simulation,
  Multi-Chat Scenarios, Fire & Forget

## 0.22.0 — 2026-05-05

### VitePress documentation site

Standalone documentation site under `site/` — 42 pages covering every public export.

- **Infrastructure**: `site/.vitepress/config.ts` with dynamic GitHub Pages base URL, full
  nav/sidebar, local search, social links, and version badge from `package.json`.
- **Logo**: `docs/Y.svg` (the grammY Y mark) copied to `site/public/logo.svg`.
- **Brand theme**: blue palette — `#0057b7` in light mode (6.9:1 on white, WCAG AA) /
  `#4d9eff` in dark mode (6.3:1 on dark background, WCAG AA).
- **Guide section** (6 pages): Introduction, Getting Started, How It Works, With Vitest,
  With Jest, With Deno.
- **High-Level API section** (9 pages): Chats, User, Group & Supergroup, Channel, PrivateChat,
  BusinessAccount, Reply, Logs, Overview.
- **Low-Level API section** (5 pages): Outgoing Requests, Session Mocking, Update Builders,
  Response Mocking, Overview.
- **Recipes section** (7 pages): Sessions & State, Keyboards & Buttons, Error Simulation,
  Multi-Chat Scenarios, Conversations Plugin, Menu Plugin, Fire & Forget.
- **API Reference section** (14 pages): full typed signatures for every exported symbol.
- **Reference**: Changelog page linked to `docs/CHANGELOG.md`.
- **GitHub Actions workflow** (`.github/workflows/docs.yml`): builds and deploys to GitHub
  Pages at `https://drsmile444.github.io/grammy-testing/` on every push to `main`.

## 0.21.0 — 2026-05-05

### README rewrite

`README.md` has been completely replaced. The previous file was a TypeScript Boilerplate
placeholder with no relation to the library. The new README is production-grade and
client-facing:

- Logo (`docs/Y.svg` — the grammY Y mark) with yellow `#ffd700` brand color across all badges
- Why section with bold hook sentence and problem/solution statement
- Quick Start with npm + JSR install commands and a `/start` command bot example
- Features section covering high-level actors, dispatch verbs, assertions, session injection,
  and isolation utilities
- Examples table linking all 20 examples in `examples/`
- Documentation placeholder pointing to the planned VitePress site
- Credits section acknowledging `grammy_tests` and `ua-anti-spam-bot`

## 0.20.0 — 2026-05-03

### 20 runnable examples added under `examples/`

A new `examples/` directory ships 20 self-contained bots with matching test files, covering a wide range of testing patterns:

| #   | Scenario                                                |
| --- | ------------------------------------------------------- |
| 01  | Echo bot — simplest possible text-echo handler          |
| 02  | Start command — `/start` reply                          |
| 03  | Greeting bot — per-user name with fallback              |
| 04  | Chat-type filter — private vs. group routing            |
| 05  | Regex handler — pattern-matched messages                |
| 06  | Callback query — inline keyboard responses              |
| 07  | Session counter — persistent per-user state             |
| 08  | Chat settings — `mockChatSession` usage                 |
| 09  | Photo bot — caption extraction                          |
| 10  | Document bot — file-ID and MIME type reply              |
| 11  | Poll bot — quiz creation and answer scoring             |
| 12  | Group welcome — `new_chat_members` service event        |
| 13  | Admin guard — `getChatMember` status check              |
| 14  | Moderation bot — `banChatMember` / `restrictChatMember` |
| 15  | Channel post bot — `channel_post` handler               |
| 16  | Reactions bot — `message_reaction` handler              |
| 17  | Dice game — incoming dice value evaluation              |
| 18  | Middleware test — `prepareMiddleware` isolation         |
| 19  | Composer test — `prepareComposer` isolation             |
| 20  | Multi-chat scenario — cross-chat summary posting        |

All examples are included in the test run and pass the full quality gate.

## 0.19.0 — 2026-05-03

### `user.sendCallbackQuery` and `clickButton` reply_markup fix

**`user.sendCallbackQuery(data, options?)` is now available.** Dispatches a `callback_query` update from the user without requiring a prior captured reply. Useful for cross-feature tests where the keyboard lives in a different composer.

```ts
await user.sendCallbackQuery('button-data');

// With explicit message context (for chatType filters or handlers that read keyboard state):
const msg = await user.sendCommand('/menu');
await user.sendCallbackQuery('language:en', { message: msg });
```

When `options.message` is omitted, a minimal private-chat stub is synthesized automatically so grammY filters like `chatType('private')` evaluate correctly without boilerplate.

**`clickButton` now populates `callback_query.message.reply_markup`.** `Reply.toCapturedMessage()` previously omitted `reply_markup`, leaving `ctx.callbackQuery.message.reply_markup` as `undefined` in the handler. Handlers that read keyboard state (e.g. `ctx.callbackQuery.message.reply_markup.inline_keyboard`) now receive the full keyboard.

## 0.18.0 — 2026-05-03

### Internal fixes: `update_id` counter independence, `sendMediaGroup` response shape, `GROUP_ANONYMOUS_BOT` documentation

**`update_id` counter is now independent from message IDs.** All `User` dispatch methods (`sendPhoto`, `sendDocument`, `sendVideo`, `sendAudio`, `sendVoice`, `sendVideoNote`, `sendAnimation`, `sendSticker`, `sendLocation`, `sendContact`, `sendVenue`, `sendPoll`, `sendDice`, `sendWebAppData`, `sendSuccessfulPayment`, `sendInlineQuery`, `sendChosenInlineResult`, `sendPreCheckoutQuery`, `sendShippingQuery`, `reactTo`, `answerPoll`, `requestJoin`, `boostChat`, `removeBoost`, `manageBot`, `purchasePaidMedia`, `sendMediaGroup`) and `Reply.clickButton` now draw `update_id` from `IdGenerator.nextUpdateId()` rather than `nextMessageId() + offset`. Message IDs and update IDs no longer share a counter.

**`sendMediaGroup` auto-response returns N messages.** The default `buildDefaultResponses` resolver for `sendMediaGroup` now returns an array whose length matches the number of items in the bot's `media` payload. Previously it always returned a single-element array regardless of how many media items were sent.

**`GROUP_ANONYMOUS_BOT.is_bot: false` is intentional.** An inline comment documents that Telegram sends `is_bot: false` for this identity in real update payloads, consistent with `Channel_Bot` (id: 136 817 688).

## 0.17.0 — 2026-05-03

### `channel.postMessageTo` returns `Message` and accepts `reply_to_message`

`channel.postMessageTo(target, text, options?)` now returns `Promise<Message>` (previously
`Promise<void>`), consistent with all other send verbs since v0.15.0. The returned value can be
used immediately as `reply_to_message` in a follow-up `user.sendText`:

```ts
const post = await channel.postMessageTo(group, 'announcement');
await user.sendText('nice post', { chat: group, reply_to_message: post });
```

A new `reply_to_message` option is also accepted. It follows the same partial-shape semantics
as `user.sendText`: `date` and `chat` are auto-filled when absent, and all explicitly supplied
fields are preserved:

```ts
await channel.postMessageTo(group, 'reply', {
  reply_to_message: { message_id: 10 },
  // date and chat are auto-filled from context
});
```

## 0.16.0 — 2026-05-03

### Relay message support (`group.postRelayMessage`, `TELEGRAM_RELAY`)

Groups and supergroups now have a dedicated `postRelayMessage` verb that dispatches the
synthetic `message` update Telegram produces when a channel post is forwarded into a linked
group (`from.id === 777_000`). The returned `Message` can be passed directly as
`reply_to_message` in a follow-up `user.sendText`:

```ts
const relay = await group.postRelayMessage('channel post');
await user.sendText('my comment', { chat: group, reply_to_message: relay });
```

To simulate a relayed post with channel attribution, pass `options.channel`:

```ts
const channel = chats.newChannel('My Channel');
const relay = await group.postRelayMessage('post text', { channel });
// ctx.message.forward_origin.type === 'channel'
```

A `TELEGRAM_RELAY` constant is exported for assertions:

```ts
import { TELEGRAM_RELAY } from 'grammy-testing';
expect(ctx.message.from).toMatchObject(TELEGRAM_RELAY);
```

### Partial `reply_to_message` in `SendTextOptions`

`SendTextOptions.reply_to_message` now accepts `Partial<Message> & { message_id: number }` —
only `message_id` is required. `date` and `chat` are auto-filled when absent:

```ts
// No more `as any` casts or manual date/chat construction
await user.sendText('reply', { chat: group, reply_to_message: { message_id: 42 } });
```

Callers that already pass a full `Message` are unaffected.

## 0.15.0 — 2026-05-03

### Actor send verbs return the dispatched `Message`

All `User` send verbs that produce a `message` update now return `Promise<Message>` instead of
`Promise<void>`. The returned object is the exact synthetic `Message` dispatched to
`bot.handleUpdate`, giving tests direct access to `message_id`, `chat`, `from`, and content
fields without magic numbers or private state access:

```ts
const msg = await user.sendText('not a card');
await user.editMessage(msg.message_id, '4111 1111 1111 1111');
// or chain with reply_to_message:
await user.sendText('reply', { chat: group, reply_to_message: msg });
```

`user.sendMediaGroup(items)` returns `Promise<Message[]>` — one `Message` per dispatched item
in order, all sharing the same `media_group_id`:

```ts
const [first, second] = await user.sendMediaGroup([{ photo: 'a' }, { photo: 'b' }]);
expect(first.media_group_id).toBe(second.media_group_id);
```

Existing callers that ignore the return value are unaffected — the change is fully
backward-compatible.

**Affected verbs:** `sendText`, `sendMessage`, `sendCommand`, `sendForwarded`, `sendPhoto`,
`sendDocument`, `sendVideo`, `sendAudio`, `sendVoice`, `sendVideoNote`, `sendAnimation`,
`sendSticker`, `sendLocation`, `sendContact`, `sendVenue`, `sendPoll`, `sendDice`,
`sendWebAppData`, `sendSuccessfulPayment`, `sendMediaGroup`.

---

## 0.14.0 — 2026-05-03

### `ChatProfile` — chat factory methods accept a caller-supplied ID

`chats.newGroup`, `chats.newSupergroup`, and `chats.newChannel` now accept an optional object
profile `{ id?, title? }` in addition to the existing string/undefined forms, mirroring the
`UserProfile` pattern used by `chats.newUser`. Any integer ID is accepted without validation —
use this to register chats whose IDs are fixed at configuration time (log channels, training
chats, etc.):

```ts
const logsGroup = chats.newSupergroup({ id: 1_234_567, title: 'Logs' });
// title defaults to 'Supergroup1234567' when omitted
const alerts = chats.newChannel({ id: -500, title: 'Alerts' });
```

`getChat` and `getChatAdministrators` auto-derivation work normally for specific-ID chats,
eliminating the need for `respondNext('getChat', ...)` workarounds.

### `anonymous` option — `sendText` / `sendCommand` dispatch as GroupAnonymousBot

`SendTextOptions` gains `anonymous?: boolean`. When `true`, the dispatched message's `from`
is replaced with the GroupAnonymousBot identity and `sender_chat` is set to the target group,
matching Telegram's wire format for the "Send as Group" admin feature:

```ts
await user.sendText('/role user', { chat: group, anonymous: true });
await user.sendCommand('/role', 'user', { chat: group, anonymous: true });
```

Requires `options.chat` to be a `Group` or `Supergroup`; throws a descriptive error otherwise.

### `GROUP_ANONYMOUS_BOT` — exported constant for assertions

```ts
import { GROUP_ANONYMOUS_BOT } from 'grammy-testing';
// { id: 1_087_968_824, username: 'GroupAnonymousBot', is_bot: false, first_name: 'Group' }
expect(ctx.message.from).toMatchObject(GROUP_ANONYMOUS_BOT);
```

### `sendSystemMessage` — dispatch a from-absent message update

`Group`, `Supergroup`, and `Channel` each gain `sendSystemMessage(text, options?)` which
dispatches a `message` update with the `from` field intentionally absent. Tests the common
`if (!ctx.from) return next()` guard path without raw `handleUpdate` calls:

```ts
await group.sendSystemMessage('no sender text');
await channel.sendSystemMessage('notice', { messageId: 42 });
```

---

## 0.13.0 — 2026-05-02

### `Channel.changeMemberStatus` — dispatch `my_chat_member` for channels

- Added `channel.changeMemberStatus(fromUser, transition)` to `Channel`. Dispatches a `my_chat_member` update with `chat.type === 'channel'`, updates the bot's membership in `channel.members`, and enables `getChatAdministrators` auto-derivation for channels. This closes the last remaining raw `handleUpdate` gap — all `my_chat_member` scenarios across `Group`, `Supergroup`, and `Channel` now use the same actor-verb API.
- Added `CHANNEL_ADMIN_RIGHTS` constant providing channel-appropriate defaults (`can_post_messages: true`; excludes `can_manage_video_chats` and `can_manage_topics`). Permissions supplied in the transition override the defaults.

### Fix: `changeMemberStatus` now correctly tracks the bot's membership

**Breaking (minor):** `group.changeMemberStatus(user, transition)` and `supergroup.changeMemberStatus(user, transition)` previously stored the trigger actor (`user`) in the chat's members map and used that same user for `old/new_chat_member.user` in the dispatched update. Both were wrong — `my_chat_member` always describes the **bot's** status change, and `from` is the actor who triggered it.

After this fix:

- `old/new_chat_member.user` in the dispatched update is `bot.botInfo` (the bot), not the trigger user.
- The bot's membership is stored in the members map, keyed by `bot.botInfo.id`.
- `getChatAdministrators` auto-derivation now returns the bot after a promotion transition, not the trigger actor.
- The trigger user's own membership entry is not affected by `changeMemberStatus`.

Tests that called `user.in(group)` after `changeMemberStatus` to verify the new status should switch to `group.members.get(bot.botInfo.id)?.status`.

---

## 0.12.0 — 2026-05-01

### `group.own()` and `group.join()` — pure-state membership setters

- Added `group.own(user)` and `supergroup.own(user)` — sets `status: 'creator'` in the members map with no Telegram update dispatched. Mirrors the existing `promote()` / `restrict()` pattern.
- Added `group.join(user)` and `supergroup.join(user)` — sets `status: 'member'` in the members map with no Telegram update dispatched.
- Added `chats.newOwner(profile?)` — convenience factory that creates a new user and calls `defaultGroup.own(user)`, mirroring `chats.newAdmin()`.

### Auto-derived `getChatMember`, `getChatAdministrators`, `getChat`

- `getChatMember` now resolves from the registered chat's members map via a `Membership → ChatMember` converter. Returns the appropriate discriminated union shape (`'creator'`, `'administrator'`, `'member'`, `'restricted'`, `'left'`, `'kicked'`). Falls back to `{ status: 'left', user }` for users not in the map, and to `true` for unregistered chats.
- `getChatAdministrators` now resolves by filtering `chat.members` for `'creator'` and `'administrator'` entries. Returns `[]` for unregistered chats.
- `getChat` now resolves from `chat.toTelegramChat()` enriched with `invite_link: ''`. Returns `true` for unregistered chats.
- All three are populated automatically in `buildDefaultResponses()`. User-supplied `responses` entries always take precedence — existing overrides are unaffected.

---

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

- Added `tests/plugins/` reference suite demonstrating `grammy-testing` usage alongside:
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
