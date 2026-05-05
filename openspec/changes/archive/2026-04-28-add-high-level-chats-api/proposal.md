## Why

v0.1 shipped the low-level primitives — entry points, transformer-promise capture, error simulation, mock helpers, and update builders. They work, but they speak Telegram's wire format. Tests that drive a real bot end-to-end still have to construct `Update` objects by hand, dispatch them via `bot.handleUpdate`, and assert against raw API method names. The headline ergonomic bar from `docs/project.md` (the [Quickstart](#quickstart) — "ten lines, zero boilerplate") is unmet without a high-level layer that speaks in users and chats.

This proposal lands the v0.2 high-level API on top of v0.1: a `Chats` orchestrator that mints users and chats, a `User` actor with verbs that map onto the Telegram update vocabulary, a per-chat `Membership` role model (admin-as-role, not identity), a normalized `Reply` object that hides Telegram payload shape, and the three-layered assertion model (`user.replies` / `chat.messages` / `chats.outgoing`) the project-vision spec commits us to.

## What Changes

- `Chats<TContext>` orchestrator returned from `prepareBot` (today returns `{ chats }` where `chats` exposes only `outgoing` + `idle()`). v0.2 extends `chats` with: `newUser(profile?)`, `newAdmin(profile?, perms?)` (sugar), `newPrivateChat(user)`, `newGroup(name?)`, `newSupergroup(name?)`, `newChannel(name?)`, plus iteration accessors over the participants and chats it has minted.
- `User<TContext>` actor with text-message verbs: `sendText(text, options?)`, `sendMessage(text, options?)` (alias), `sendCommand(command, args?)` (auto-emits `bot_command` entity). Each verb dispatches a synthetic update through the bot under test and resolves once `bot.handleUpdate` settles.
- `Membership` per-chat role model. `group.promote(user, perms?)` returns a `Membership` view; `group.restrict(user, perms?)`, `user.in(group)`, `chat.changeMemberStatus(user, transition)` cover the role transitions the audited anti-spam suite uses (~30 tests). **`Admin` is NOT an identity class**; `chats.newAdmin()` is sugar for `newUser` + `promote` in a default chat.
- `Reply<TContext>` normalized object, derived from each captured outgoing message-shaped API call. Properties: `text`, `parseMode`, `entities`, `buttons` (flat array of inline-keyboard buttons with `text`/`callbackData`/`url`), `replyMarkup`, `chat`, `replyingTo` (the message this is in reply to, if any), `raw` (escape hatch). Methods: `clickButton(textOrCallbackData)` synthesizes a `callback_query`; `replyTo(text, options?)` is a placeholder hook for follow-ups (full chain logic deferred — see Out of Scope below).
- `user.replies` filtered inbox: messages the bot directed at this user. Filtering rule: any captured `sendMessage`-shape outgoing where (a) `chat_id` matches a chat this user is a participant of AND (b) the message has no specific addressee OR addresses this user via `reply_to_message`, `@`-mention of their `username`, or `callback_data` whose preceding `clickButton` was issued by this user. `replies.last` accessor and `replies.byText(matcher)` finder.
- `chat.messages` canonical log: every message the bot posted into this chat, in capture order. `messages.last`, `messages.byText(matcher)`. Lives alongside `user.replies` as a coarser-grain view.
- **Three high-frequency Coverage-audit gaps addressed inline** (must-have v1, per `docs/project.md` §Coverage audit):
  - **Gap #3 — `sender_chat` / channel-as-author posts**: `chats.newChannel(name)` produces a `Channel` actor; `channel.postMessageTo(group, text, options?)` dispatches a message with `sender_chat = channel` and `from = Channel_Bot`. Used by ~20 anti-spam tests.
  - **Gap #4 — Media group with per-message metadata**: `user.sendMediaGroup([...])` accepts an array of media specs, each with optional `caption` etc., and dispatches N updates sharing a `media_group_id`.
  - **Gap #7 — `my_chat_member` status transitions**: `chat.changeMemberStatus(user, { from, to, permissions?, untilDate? })` dispatches a `my_chat_member` update with explicit old/new status, permission flags, and `until_date`. Used by ~30 anti-spam tests.

## Capabilities

### New Capabilities

- `chats-orchestrator`: the `Chats` class with `newUser` / `newAdmin` (sugar) / chat-creating methods and the `chats.outgoing` / `chats.idle()` re-exposure. Defines what `prepareBot` returns at v0.2.
- `user-actor`: the `User` class — text/command verbs that dispatch synthetic updates and settle on `bot.handleUpdate`.
- `membership-roles`: per-chat `Membership` model. `group.promote` / `group.restrict` / `user.in(group)` / `chat.changeMemberStatus` plus the `my_chat_member` dispatch semantics.
- `reply-objects`: the normalized `Reply` shape — `text`, `parseMode`, `entities`, `buttons`, `replyMarkup`, `chat`, `replyingTo`, `raw`, plus `clickButton` and `replies.last` / `replies.byText`.
- `chat-messages-log`: per-chat canonical message log (`chat.messages`, `messages.last`, `messages.byText`) and the channel-as-author posting verb (`channel.postMessageTo`).
- `media-group-dispatch`: `user.sendMediaGroup(items)` and the underlying N-updates-with-shared-`media_group_id` dispatch contract.

### Modified Capabilities

- `bot-test-harness`: the `Chats` returned from `prepareBot` / `prepareComposer` / `prepareMiddleware` is now `Chats<TContext>` with the v0.2 orchestrator surface, not just `{ outgoing, idle }`. Existing requirements (entry-point shape, async settle, canned responses) stay unchanged; we add requirements about what additional members `chats` exposes.

## Impact

- **Source layout**: new directory `src/high-level/` containing `chats.ts`, `user.ts`, `chat.ts`, `channel.ts`, `membership.ts`, `reply.ts`, plus a `messages-log.ts` per-chat collector. `src/index.ts` re-exports the new public surface; `src/low-level.ts` keeps the v0.1 escape hatch.
- **Tests**: new directory `tests/high-level/` for unit coverage. The smoke tests under `tests/smoke.spec.ts` get extended with one `Chats`-style scenario alongside the existing low-level ones. The `tests/reference/` directory promised by `update-project-vision` is **not** introduced here — that's a separate proposal so we keep this change focused on API delivery.
- **Public API**: the package's default entry now exports `Chats`, `User`, `Channel`, `Reply`, `Membership` types plus the verb-bearing classes. Update-builder primitives stay in `@grammyjs/testing/low-level`.
- **No new runtime dependencies.** No changes to `package.json` deps or peerDeps.
- **Out of scope (separate proposals or v0.2.x follow-ups)**:
  - Media verbs (`sendPhoto`, `sendDocument`, `sendVideo`, `sendVoice`, `sendVideoNote`, `sendAnimation`, `sendSticker`, `sendLocation`, `sendContact`, `sendVenue`, `sendPoll`, `sendDice`) — wire-through implementations land in v0.2.x once the core surface is proven.
  - `CapturedFile` with `readBytes` / `readText` — depends on media verbs landing first.
  - `replyTo(message)` chainable nested-reply support beyond a single-level placeholder — Coverage-audit gap #5, medium frequency, defers to v0.2.x.
  - Edited messages first-class dispatch (gap #1), custom entities helpers beyond passing `entities` through `options` (gap #2), `channel_post` field correctness on channel actor (gap #6) — low-frequency gaps that defer to v0.2.x once we have feedback from the reference suite.
  - `submitInlineQuery` / `chooseInlineResult` / `react` / `joinChat` / `leaveChat` / `forward` — full update-vocabulary verbs land in v0.2.x.
  - The anti-spam reference suite that exercises this API end-to-end — separate `add-anti-spam-reference-suite` proposal, planned to follow this one.
  - Plugin interop examples (conversations, menu, hydrate, …) — separate `add-grammy-plugin-interop` proposal in v0.3.
