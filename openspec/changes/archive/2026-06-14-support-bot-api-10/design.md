## Context

The library mirrors the Telegram Bot API surface in three tiers:

1. **Tier 0 — generic capture**: every outgoing API call is recorded in `chats.outgoing`
   automatically by the testing transformer. New methods work here with zero code.
2. **Tier 1 — synthetic responses + derived projections**: message-sending methods get a
   synthetic `Message` and are routed into `chat.messages` / `user.replies`. Driven by
   `MESSAGE_METHODS_GUARD` and the response map in `src/high-level/chats.ts`.
3. **Tier 2 — dispatch verbs**: incoming updates are synthesized by verbs on `User` / chat
   classes (e.g. `user.reactTo`, `user.requestJoin`) and fed to `bot.handleUpdate`.

Bot API 10.0/10.1 add surfaces across all three tiers. All shapes here were verified against
`@grammyjs/types@3.28.0` (grammy@1.44.0's dependency), not web changelogs — three early
assumptions were wrong and are corrected below.

## Goals / Non-Goals

**Goals:**

- First-class, best-UX support for every new Bot API 10.0/10.1 surface, generic for all users.
- Stay faithful to the _real_ type shapes (return types, payload shapes) verified from
  `@grammyjs/types@3.28.0`.
- Zero breaking changes; existing tests pass unchanged.

**Non-Goals:**

- Modeling server-side rich-text parsing (html/markdown → `RichBlock[]`). The library has no
  Telegram server; it captures what the bot sent, not what Telegram would render.
- Per-`RichText*`/`RichBlock*` builder helpers or inline-span matchers (~50 types). Out of scope.
- Premium-gating / bot-to-bot delivery semantics (Telegram-side behavior, not testable here).

## Decisions

### D1: `answerGuestQuery` is inline-style, not a chat message — corrected

Verified signature: `answerGuestQuery({ guest_query_id, result: InlineQueryResult }):
SentGuestMessage` where `SentGuestMessage = { inline_message_id: string }`. It behaves like
`answerInlineQuery`, **not** `sendMessage`.

- Synthetic default returns `{ inline_message_id: <synthetic string> }`.
- It is **not** routed into `chat.messages` (an earlier exploration assumption, invalidated by
  the real type).
- The orchestrator tracks `guest_query_id → user` (minted when `sendGuestMessage` dispatches
  the `guest_message`). This lets tests assert the bot answered the _right_ guest via
  `chats.outgoing` plus correlation, without a chat-message projection.

Alternative considered: force it into `chat.messages` for symmetry — rejected, it would
fabricate a message shape Telegram never returns.

### D2: Drafts return `true` — capture, don't synthesize a Message

`sendMessageDraft` and `sendRichMessageDraft` both return `true` (verified). They are the
"streaming/composing" primitive, not message sends.

- No synthetic `Message`; the existing `{ ok: true, result: true }` default already fits.
- Add a **drafts projection** (`user.drafts` / `chats.draftsFor(user)`) capturing each draft
  payload in order, so a streaming sequence is assertable.
- The earlier `reply.isDraft` accessor idea is dropped — drafts produce no `Reply` (no
  message_id), so they are not in the replies inbox.

Alternative considered: a bespoke draft→final lifecycle aggregate — rejected as speculative
against a new, evolving API. Primitives (drafts log + the final `sendRichMessage`) reconstruct
the sequence.

### D3: Rich message read ergonomics follow the input shape

The bot sends `InputRichMessage = { html?, markdown?, is_rtl?, skip_entity_detection? }` — a
string-based input, not parsed blocks. `RichMessage = { blocks: RichBlock[], is_rtl? }` only
exists on a _received_ `Message.rich_message`.

- `reply.richMessage` exposes the sent `InputRichMessage` plus `.plainText` (the `html ??
markdown` text with tags/markup stripped for simple assertions).
- No `blocks` / `blocksOfType` matchers on the send side (input has no blocks). This corrects
  the matcher set sketched during exploration.

### D4: New message sends — `sendRichMessage`, `sendLivePhoto`

Both return `Message` subtypes (`RichMessageMessage`, `LivePhotoMessage`). They join
`MESSAGE_METHODS_GUARD` and the synthetic response map, getting full Tier-1 treatment
(synthetic `Message`, routing into `chat.messages` and active members' `user.replies`),
identical to `sendPhoto` etc.

### D5: Query/answer correlation convention

Both guest queries and join-request queries follow one convention: the dispatch verb mints and
**returns** the query id (string), matching `user.boostChat` returning `boost_id`.

- `user.sendGuestMessage(chat, text?)` → returns `guest_query_id`.
- `user.requestJoin(group)` → now emits `chat_join_request.query_id` and returns it.
- `answerChatJoinRequestQuery({ chat_join_request_query_id, result })` → returns `true`,
  generic capture + synthetic `true` default. `sendChatJoinRequestWebApp` → generic capture.

### D6: Reaction removal projection

`deleteMessageReaction` / `deleteAllMessageReactions` are captured into a reactions-removed
projection modeled on the existing `delete-message-capture` (e.g. `chats.reactionRemovals`),
keyed by chat + message id.

### D7: Other new methods get static synthetic defaults

`getManagedBotAccessSettings → BotAccessSettings`, `setManagedBotAccessSettings → true`,
`getManagedBotToken` / `replaceManagedBotToken → ` a token `string` (their real return type),
`getUserPersonalChatMessages → []`. State-derivation is speculative; static defaults plus
generic capture are enough until a concrete need appears.

## Risks / Trade-offs

- **Web-changelog drift** → Mitigated: every shape verified against `@grammyjs/types@3.28.0`;
  three assumptions were caught and corrected (D1, D2, D3). Implementation re-checks names
  against the installed types after the bump.
- **`managed_bot` / `ctx.from` fix** → The grammy 1.43 fix may read a field our synthetic
  `manageBot` update does not emit. Mitigation: add a test asserting `ctx.from` resolves; adjust
  the synthetic shape only if the test fails.
- **Type churn from `@grammyjs/types` widening** → Expected additive; the `satisfies
Partial<Record<keyof RawApi, true>>` guards and synthetic resolvers compile against the new
  types, so any signature drift surfaces at typecheck and is fixed inline.
- **Poll min-options 2→1** → If any validation rejects single-option polls, relax it; likely
  none exists.

## Migration Plan

Additive only. Bump `grammy` peer + dev dep → `^1.44.0` (the public API now references Bot API
10.x types), version → `0.26.0`, run the full quality gate. Consumers must be on grammy `^1.44.0`.
Rollback = revert the version bump and feature commits.

## Open Questions

None blocking. Exact field names of `BotAccessSettings` and the managed-bot token methods are
locked against `@grammyjs/types@3.28.0` during implementation.
