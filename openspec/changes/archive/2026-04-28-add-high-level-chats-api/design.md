## Context

v0.1 ships the low-level layer: every entry point returns `{ chats }` where `chats` exposes only `outgoing` (the `OutgoingRequests` capture) and `idle()` (the async settle helper). v0.2 builds the high-level API on top — the surface that `docs/project.md` quickstart and assertion-strategy sections describe. The implementation is layered: the high-level types call into the low-level transformer/idle/builder primitives without bypassing them.

Two architectural questions drive this design:

1. **What does `user.replies` actually filter on?** The doc commits to a three-layered model (`user.replies` filtered, `chat.messages` canonical, `chats.outgoing` raw), but the filtering rule for `user.replies` is non-trivial — Telegram's Bot API doesn't have an "addressee" field on a message; addressing is implicit via `reply_to_message`, `@`-mention entities, or button-callback target.
2. **How do we keep the participant/chat model honest under the role-not-identity decision?** A user can be admin in one chat and a regular member in another; promotion happens *to a chat*, not to a person. The internal data model has to reflect that.

The high-frequency Coverage-audit gaps (sender_chat / media groups / my_chat_member transitions) are explicitly v0.2 must-haves — punting them to v0.2.x would force users back to `buildOverwrite()` for ~70 of the audited anti-spam tests.

## Goals / Non-Goals

**Goals:**

- Tests can be written end-to-end against the `Chats`/`User`/`Reply` surface without ever touching `bot.handleUpdate` or `Update` builders directly.
- `user.replies.last.text` works correctly for the common DM case.
- `chat.messages` works correctly for group/supergroup broadcasts.
- The three high-frequency Coverage-audit gaps (sender_chat, media groups, my_chat_member transitions) are first-class verbs.
- `clickButton(textOrCallbackData)` synthesizes a real `callback_query` and dispatches it through the bot, settling the resulting middleware chain before the test's `await` returns.
- Custom `Context` flavors thread through unchanged (`Chats<TContext>`, `User<TContext>`, `Reply<TContext>`).

**Non-Goals:**

- **Media verbs** (`sendPhoto`, `sendDocument`, `sendVideo`, `sendVoice`, `sendVideoNote`, `sendAnimation`, `sendSticker`, `sendLocation`, `sendContact`, `sendVenue`, `sendPoll`, `sendDice`). These are wire-throughs once the core API ships; deferring keeps v0.2 reviewable.
- **`CapturedFile`** with `readBytes` / `readText`. Tied to media verbs.
- **Nested reply chains** beyond a single-level placeholder (`reply.replyTo(text)` records the chain but the dispatch logic for "user replies to a reply of a reply" defers to v0.2.x).
- **Edited messages**, **custom-entity helpers**, **`channel_post` field correctness** — Coverage-audit gaps #1, #2, #6 (low-frequency) defer to v0.2.x.
- **Update-vocabulary completion**: `submitInlineQuery`, `chooseInlineResult`, `react`, `joinChat`, `leaveChat`, `forward`. Defer to v0.2.x.
- **The anti-spam reference suite.** Separate proposal (`add-anti-spam-reference-suite`).
- **Plugin interop** (conversations, menu, hydrate). v0.3.

## Decisions

### D1. `Chats` extends what entry points return; v0.1 surface stays compatible

**Decision:** v0.1's entry points return `{ chats }` where `chats` was just `{ outgoing, idle }`. v0.2 widens `chats` to also expose `newUser`, `newAdmin`, `newPrivateChat`, `newGroup`, `newSupergroup`, `newChannel`, plus iteration accessors (`users`, `groups`, etc.). The v0.1 properties (`outgoing`, `idle`) stay exactly where they are — additive change, no breaking.

**Rationale:** The `bot-test-harness` capability spec already passes; we mark it as MODIFIED rather than REMOVED to add the new requirements. Existing v0.1 tests continue to pass without edit.

**Alternatives considered:**

- New return type. Rejected — would force a v0.2 breaking change to entry points for no benefit.
- Separate `chats(prep)` factory called after `prepareBot`. Rejected — extra ceremony, no upside.

### D2. `user.replies` filter rule

**Decision:** A message lands in `user.replies` if:

1. The message's `chat_id` matches a chat this user is a participant of (private chat with this user, or group/supergroup/channel where this user has joined or been minted as a member).
2. AND any of the following addressee conditions hold:
   - The chat is private with this user (DMs default to "this user is the addressee").
   - The message's `reply_to_message.from.id` equals this user's `id`.
   - The message's text contains a `mention` entity whose body is `@<this user's username>`.
   - The message is a response to a `callback_query` issued via `clickButton` by this user (we track this association internally).

If a chat-wide message has no specific addressee but the user is a participant, it lands in **`chat.messages`** but NOT in `user.replies`. This is the cleanest split — `user.replies` is "messages directed at me", not "every message I can see".

**Rationale:** Real DM tests are 90% of `user.replies` use; the DM rule (1+private) covers them trivially. Reply-to and mention rules are needed for the audited group tests. Button-callback association keeps menu-flow tests readable. Anything more elaborate (heuristic addressing, "first user mentioned in the chat") would be guesswork.

**Alternatives considered:**

- "Every chat message lands in every participant's `replies`" — rejected, makes group-broadcast tests noisy and `replies.last` ambiguous.
- "Only DMs; mentions and reply-to don't count" — rejected, would force group tests onto `chat.messages` even when the test logically asks "what reply did this user get?".
- Customizable filter callback. Rejected — premature flexibility; revisit if a real test demands it.

### D3. `Membership` model — admin is per-chat state, not identity

**Decision:** `User` has no permissions. `Group` (and `Supergroup`) has an internal map `Map<UserId, Membership>` that tracks each user's role in *that* chat. `group.promote(user, perms?)` updates the map and returns a `Membership` view scoped to (this user, this group). `user.in(group)` reads the same map.

`chats.newAdmin(profile?, perms?)` is sugar:

```ts
function newAdmin(profile, perms) {
  const user = chats.newUser(profile);
  const defaultGroup = chats.defaultGroup ??= chats.newSupergroup('default-group');
  defaultGroup.promote(user, perms);
  return user; // typed as User, with a Membership accessible via user.in(defaultGroup)
}
```

Tests that don't care about which chat the admin is in get the convenience. Tests that DO care (anti-spam role-transition tests) call `newUser` + `group.promote` explicitly.

**Rationale:** Role-as-state matches Telegram's actual semantics. `Admin` as identity-class would have made it impossible to test role transitions without retconning the user's class — a real anti-spam concern (~30 tests).

**Alternatives considered:**

- `User` carries `permissions` as an optional field. Rejected: same role-as-identity confusion, just looser.
- Two classes (`User`, `Admin`) with `Admin extends User`. Rejected: per-chat semantics are lost; transitions become impossible.

### D4. `clickButton(textOrCallbackData)` synthesizes a `callback_query` update

**Decision:** When a `Reply` has inline-keyboard buttons, `reply.clickButton('confirm')` (text match) or `reply.clickButton({ data: 'cb-confirm' })` (callback_data match) synthesizes an `Update` with a `callback_query` field whose `from` is the user this reply was directed at, `message` is the original message, and `data` is the matched button's `callback_data`. The synthesized update is dispatched via `bot.handleUpdate` and the call resolves once the resulting middleware chain settles.

If the button has a `url` instead of `callback_data`, `clickButton` throws — URL buttons don't generate callback_queries in real Telegram either. Tests assert on the URL via `reply.buttons.find(...)?.url`.

**Rationale:** Match Telegram's actual semantics. Tests for menu-driven bots become `await reply.clickButton('confirm')` instead of three lines of update construction.

**Alternatives considered:**

- `user.clickButton(reply, 'confirm')` — rejected, more verbose for the common case.
- Separate `submitCallbackQuery` low-level verb on User. Defer to v0.2.x; `clickButton` is the ergonomic surface for v0.2.

### D5. `channel.postMessageTo(group, text, options?)` for sender_chat scenarios

**Decision:** A `Channel` actor (returned by `chats.newChannel(name)`) has only one verb in v0.2: `postMessageTo(group, text, options?)`. It dispatches a message update to `group` where `from` is the synthetic `Channel_Bot` user (id 136817688, matches Telegram's anonymous channel forwarder) and `sender_chat` is the channel itself.

Channels do not have `sendText` (that would imply users in the channel can send messages there directly, which they can't outside of the channel-owner context). The narrow `postMessageTo` verb covers the audited use case (~20 tests) without inviting confusion.

**Rationale:** sender_chat is the high-frequency gap (#3) and the test pattern is uniform (channel posts a message into a group). One narrow verb covers it cleanly. A broader `Channel` API can come in v0.2.x if real tests demand it.

**Alternatives considered:**

- `channel.sendText(group, text)`. Rejected — naming is misleading.
- Channel as a flag on `User` (`user.asChannel(channel).sendText(group, ...)`). Rejected — the actor IS the channel, not a user pretending.

### D6. `user.sendMediaGroup(items)` dispatches N updates with shared `media_group_id`

**Decision:** `sendMediaGroup` accepts an array of media specs (`{ photo?, video?, document?, caption?, ... }` per item). The implementation generates a single `media_group_id` and dispatches N separate `bot.handleUpdate` calls in sequence, each with a message carrying that `media_group_id`. Caption typically goes on the first item only (matching Telegram's behavior); subsequent items get bare media.

The dispatch order is preserved. `await user.sendMediaGroup([...])` resolves once all N `handleUpdate` calls have settled.

**Rationale:** Real Telegram media groups arrive as N separate updates sharing a `media_group_id`. Bots that aggregate captions across group members need to see all N. One `await` resolving after all of them lands cleanly in test code.

In v0.2 we don't ship the underlying media verbs themselves (`sendPhoto`, etc.) — but `sendMediaGroup` works against the message *shape*. Items in v0.2 are limited to text-shaped fixtures (`{ caption?, media_group_id }` plus minimal `photo`/`video` placeholders); full media verbs land in v0.2.x.

**Alternatives considered:**

- One update with array payload. Rejected — doesn't match Telegram's actual delivery shape; bots that filter on per-update structure would behave differently in test vs prod.

### D7. `chat.changeMemberStatus(user, transition)` dispatches `my_chat_member`

**Decision:** Method on `Group`/`Supergroup`/`Channel`. Signature:

```ts
chat.changeMemberStatus(user, {
  from?: ChatMemberStatus,
  to: ChatMemberStatus,
  permissions?: ChatPermissions | ChatAdministratorRights,
  untilDate?: number,
})
```

Dispatches a `my_chat_member` update with `old_chat_member` reflecting `from` (or the current state from the membership map if `from` omitted) and `new_chat_member` reflecting `to`+permissions+untilDate. Updates the internal membership map after dispatch so subsequent `user.in(chat)` reads the new state.

**Rationale:** Coverage-audit gap #7. Tests need precise control over old→new transitions, which the simpler `joinChat` / `leaveChat` verbs (deferred to v0.2.x) cannot express.

### D8. Internal data flow: capture → derive → expose

**Decision:** The high-level layer doesn't replace the v0.1 capture pipeline — it derives from it. Wiring:

```
bot under test
  ↓ ctx.api.* (or ctx.reply, etc.)
v0.1 transformer
  ├→ chats.outgoing.requests (raw)
  ├→ chats.idle tracking
  └→ HighLevelDeriver (new in v0.2)
       ├→ chat.messages (per chat) — every sendMessage-shape call
       └→ user.replies (per user)  — filtered subset
```

The deriver runs synchronously inside the transformer's push hook. It looks at the captured payload, decides which chat(s) and user(s) it lands in, and updates the per-chat / per-user collections. No double-bookkeeping — the raw `chats.outgoing.requests` is still the source of truth; `chat.messages` and `user.replies` are projections.

**Rationale:** Single source of truth, derivations are testable independently, and we don't risk drift between layers.

**Alternatives considered:**

- High-level layer wraps the transformer, capturing first and only forwarding to the low-level capture if needed. Rejected — duplicates state and breaks the v0.1 assertion surface.

## Risks / Trade-offs

- **`user.replies` filter rule has corner cases** → Mitigation: document the rule explicitly in the spec; lean on `chat.messages` for "I'm not sure" tests; iterate the rule in v0.2.x if real tests find a clean miss.
- **`clickButton` callback-association tracking is in-memory state** → Mitigation: scoped to a single `prepareBot` invocation, cleared on `outgoing.clear()`. No persistence across tests.
- **Media-group dispatch without media-verb implementations means `sendMediaGroup` items in v0.2 carry minimal payload** → Mitigation: documented as a v0.2 limitation; full media verbs land in v0.2.x and the API extends compatibly.
- **`channel.postMessageTo` doesn't model `channel_post` field correctness (gap #6)** → Mitigation: gap #6 is low-frequency and defers cleanly; v0.2 ships sender_chat-via-group correctly which is the high-frequency case.
- **High-level layer adds API surface that's harder to break-fix than low-level** → Mitigation: build it on top of the v0.1 transformer (single source of truth); every high-level requirement has a scenario in the spec; reference suite (separate proposal) will exercise the API against real-bot patterns before 1.0.
- **Generic-first typing across many classes (`Chats<TContext>`, `User<TContext>`, `Reply<TContext>`, etc.) risks inference fights** → Mitigation: thread `TContext` through with explicit generic params on entry points (already proven in v0.1); type-test in CI with `tsd` or `expect-type`.

## Migration Plan

This is additive. v0.1 tests continue to work — every existing test that uses `chats.outgoing.requests` or `chats.idle()` reads the same data through the same access paths. v0.2 just adds new capabilities to the same `chats` object.

No code migration. No deprecations.

Rollback: revert the high-level files; the low-level layer keeps working.

## Open Questions

- Should `Reply` carry a typed `update.kind` field (`'message' | 'edited_message' | 'channel_post' | ...`)? Useful for filter-driven assertions but adds surface area. **Default for now: no — `Reply` is the *output* shape, the input update kind is internal. If a real test demands it, add later.**
- Should `chats.newGroup()` and `chats.newSupergroup()` differ in capabilities, or is `Group` a single class with a `type` discriminant? **Default for now: separate types so TypeScript catches "you can't restrict members in a regular group" at compile time. Revisit if the type tax outweighs the safety benefit.**
- Does `Channel.postMessageTo(group, text)` need an `into-its-own-channel` variant? In Telegram, channels post to themselves; we model the "channel posts into group" case here because that's gap #3. **Default for now: no — channel-self-posting is gap #6 (low frequency) and defers to v0.2.x.**
