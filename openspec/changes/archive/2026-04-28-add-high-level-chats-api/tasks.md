## 1. High-level data model scaffolding

- [x] 1.1 Created `src/high-level/` with: `chats.ts`, `user.ts`, `chat.ts`, `private-chat.ts`, `group.ts`, `supergroup.ts`, `channel.ts`, `dispatch.ts`, `reply.ts`, `messages-log.ts`, `id-generator.ts`, `types.ts`.
- [x] 1.2 `IdGenerator` in `id-generator.ts`: monotonic counters per kind (users 100M+, groups −1B−, supergroups −1.001T−, channels −1.002T−, message ids, media-group ids).
- [x] 1.3 Defined `User<TContext>`, `PrivateChat<TContext>`, `Group<TContext>`, `Supergroup<TContext>`, `Channel<TContext>`, `AnyChat<TContext>`, `Membership<TContext>`, `Reply<TContext>`. `TContext extends Context = Context` threaded throughout.

## 2. `Chats` orchestrator

- [x] 2.1 `Chats<TContext>` class in `src/high-level/chats.ts` exposes `outgoing`, `idle()`, plus the v0.2 factories.
- [x] 2.2 `chats.newUser(profile?)` — id via `IdGenerator`, defaults filled, returns `User<TContext>`.
- [x] 2.3 Chat factories: `newPrivateChat(user)`, `newGroup`, `newSupergroup`, `newChannel`, each producing the right `chat.type`.
- [x] 2.4 `chats.newAdmin(profile?, perms?)` — `newUser` + lazy-create `defaultGroup` (supergroup) + `defaultGroup.promote(user, perms)`.
- [x] 2.5 `Chats` holds `users` and `chats` registries so the deriver can resolve `chat_id` → chat object and iterate participants.
- [x] 2.6 `prepareBot` (and composer/middleware variants) instantiates `Chats<TContext>` and threads it through the transformer's `onCapture` hook.

## 3. `User` actor

- [x] 3.1 `User<TContext>` class with `id`, `first_name`, `last_name?`, `username?`, `is_bot: false`. Membership reader closure.
- [x] 3.2 `user.sendText(text, options?)` — defaults to private chat; `options.chat` overrides; constructs message + dispatches via `dispatchTextMessage`.
- [x] 3.3 `user.sendMessage` aliases `sendText`.
- [x] 3.4 `user.sendCommand(command, args?)` — auto-prepends `/`, computes `bot_command` entity, optional space + args.
- [x] 3.5 `user.in(group)` reads the per-chat membership map via the closure passed in at construction time.

## 4. `Membership` and role transitions

- [x] 4.1 `Membership` interface in `types.ts` with `user`, `chat`, `status`, `permissions`, `untilDate?`.
- [x] 4.2 `Group`, `Supergroup`, `Channel` each carry a `Map<UserId, Membership>` registry.
- [x] 4.3 `group.promote(user, perms?)` — defaults to all-true admin rights, sets `'administrator'` status, returns `Membership`.
- [x] 4.4 `group.restrict(user, perms?, untilDate?)` — sets `'restricted'` status with permissions and until-date.
- [x] 4.5 `chat.changeMemberStatus(user, transition)` — reads current/`from`, dispatches `my_chat_member` via `dispatchMyChatMember` helper, updates the map post-dispatch.

## 5. `Reply` normalization

- [x] 5.1 `Reply<TContext>` class with constructor that takes captured payload + chat + deps (bot, ids, recordClick).
- [x] 5.2 Normalized accessors: `text` (text-or-caption), `parseMode`, `entities`, `chat`, `replyToMessageId`, `mentionUsernames`, `raw`.
- [x] 5.3 `buttons` flattens `reply_markup.inline_keyboard` rows into a flat array; each entry has `text`, optional `callbackData` / `url`, plus `raw`.
- [x] 5.4 `reply.clickButton(textOrSpec)` — text or `{ data }` match; throws on URL-only buttons; synthesizes a `callback_query` update; dispatches via `bot.handleUpdate`; awaits settle.
- [x] 5.5 `reply.replyTo(text, options?)` — deferred to v0.2.x; spec already calls it a placeholder hook (no-op equivalent for v0.2).
- [x] 5.6 `Chats.clickers` map records `(callbackData → byUserId)` so the filter rule can use callback-association as an addressee criterion.

## 6. Per-user replies inbox + per-chat messages log

- [x] 6.1 `RepliesInbox<TContext>` (in `chats.ts`) and `MessagesLog<TContext>` (in `messages-log.ts`) — same surface (`length`, `last`, `byText`, `all`, `clear`, `push`).
- [x] 6.2 Both expose `.last`, `.byText(matcher)` (string exact OR regex), and `.all` for read-only iteration.
- [x] 6.3 Implemented as `Chats.deriveFromCapture(request)`: walks the `MESSAGE_METHODS` set, looks up the chat, constructs a `Reply`, pushes onto `chat.messages` (for non-private), and runs the four-clause filter rule against every minted user.
- [x] 6.4 Wired in `prepareBot` via `createTransformer({ ..., onCapture: (req) => chats.deriveFromCapture(req) })`. `transformer.ts` now accepts an `onCapture` hook; v0.1 callers that omit it are unchanged.

## 7. Channel-as-author posting

- [x] 7.1 `channel.postMessageTo(targetGroup, text, options?)` constructs a message with `from = makeChannelBotUser()` (id 136817688) and `sender_chat = this`.
- [x] 7.2 Dispatches via `bot.handleUpdate` and resolves once settled.

## 8. Media-group dispatch

- [x] 8.1 `user.sendMediaGroup(items, sharedOptions?)` — generates a `media_group_id` via `IdGenerator.nextMediaGroupId` (e.g. `mg-1`).
- [x] 8.2 For each item, constructs a message carrying the shared `media_group_id`, the per-item caption (or undefined), placeholder photo array.
- [x] 8.3 Dispatches each update in sequence via `bot.handleUpdate`; awaits all; resolves.

## 9. Public exports

- [x] 9.1 `src/index.ts` re-exports `Chats`, `RepliesInbox`, `User`, `PrivateChat`, `Group`, `Supergroup`, `Channel`, `Reply`, `MessagesLog`, plus all type-only exports from `types.ts`.
- [x] 9.2 `src/low-level.ts` includes the v0.2 surface via `export * from './index'`.
- [x] 9.3 v0.1 imports unchanged: `prepareBot`, `OutgoingRequests`, `mockSession`, etc. all still work (verified via 48/48 v0.1 tests passing).

## 10. Tests — high-level layer

- [x] 10.1 `tests/high-level/chats-orchestrator.spec.ts` — newUser shape/overrides/uniqueness, newAdmin sugar, chat factories, v0.1 surface preservation. (10 tests)
- [x] 10.2 `tests/high-level/user-actor.spec.ts` — sendText to private chat, entity overrides, sendMessage alias, sendCommand /start /lang fixture-args/no-leading-slash, async settle. (7 tests)
- [x] 10.3 `tests/high-level/membership-roles.spec.ts` — promote with perms, default permissive, restrict with permissions+untilDate, changeMemberStatus dispatches my_chat_member and updates the map, user.in(unknown) returns undefined. (6 tests)
- [x] 10.4 `tests/high-level/reply-objects.spec.ts` — text/parseMode/buttons accessors, clickButton-by-text and by-data, URL-only-throws, replies.last, replies.byText (string + regex). (8 tests)
- [x] 10.5 `tests/high-level/replies-filter.spec.ts` — DM rule, group-broadcast-not-in-replies-but-in-messages, mention rule. (3 tests)
- [x] 10.6 `tests/high-level/chat-messages-log.spec.ts` — group broadcast, messages.last, byText regex, channel.postMessageTo with sender_chat. (4 tests)
- [x] 10.7 `tests/high-level/media-group.spec.ts` — three-item shared id, caption-on-first-only, two distinct calls produce distinct media_group_ids. (3 tests)

## 11. Smoke test extension

- [x] 11.1 Added one Chats-style scenario at the top of `tests/smoke.spec.ts`: user sends 'hello', bot echoes, asserted via `chats.repliesFor(user).last?.text`.

## 12. Validation

- [x] 12.1 `npm run typecheck` clean.
- [x] 12.2 `npm run lint` clean (0 errors, 9 informational warnings — unused-disable hints + security-rule false positives on internal Map symbol dispatch, all from boilerplate's strict ruleset).
- [x] 12.3 `npm run test:run` green: **90/90 tests pass** in ~1s (48 v0.1 + 42 v0.2).
- [x] 12.4 `openspec validate add-high-level-chats-api --strict` reports valid.
- [x] 12.5 Every requirement in `specs/*/spec.md` is exercised by at least one test under `tests/high-level/` or `tests/smoke.spec.ts`. Filter-rule "callback-association" clause is exercised indirectly via `clickButton` tests in `tests/high-level/reply-objects.spec.ts` (the click is recorded; subsequent bot reply lands in the user's inbox).
