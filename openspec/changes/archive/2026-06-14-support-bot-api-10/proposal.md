## Why

grammY shipped 1.43.0 (Bot API 10.0) and 1.44.0 (Bot API 10.1), adding guest mode,
rich messages, message drafts, live photos, reaction removal, join-request queries, and
new managed-bot methods. The testing library currently peers/targets grammy 1.42 (Bot API
9.6). Because the library mirrors the Bot API surface, bots that exercise the new features
get only generic outgoing capture today — no synthetic responses, no dispatch verbs, no
read ergonomics. This change brings the library up to Bot API 10.1 with first-class,
best-practice support for every new surface. All shapes below were verified against
`@grammyjs/types@3.28.0` (the version grammy@1.44.0 depends on).

## What Changes

- **Bump** the `grammy` dev dependency to `^1.44.0` and the package version `0.25.0 → 0.26.0`
  (`package.json` + `jsr.json`).
- **New message-sending methods** (Tier-1 synthetic `Message` + routing): `sendRichMessage`
  (→ `Message.RichMessageMessage`) and `sendLivePhoto` (→ `Message.LivePhotoMessage`).
- **Message drafts**: `sendMessageDraft` and `sendRichMessageDraft` both return `true` (they
  are not message sends). Add a drafts capture projection so a streaming/draft sequence can be
  asserted (`user.drafts` / `chats.draftsFor(user)`).
- **Rich message read ergonomics**: `reply.richMessage` exposes the sent `InputRichMessage`
  (`{ html?, markdown?, is_rtl?, skip_entity_detection? }`) with a `.plainText` convenience.
- **Guest mode**: `user.sendGuestMessage(chat, text?)` dispatches a `guest_message` update
  (a `Message` carrying `guest_query_id`) and returns the generated `guest_query_id`.
  `answerGuestQuery` is an inline-style answer returning `SentGuestMessage`
  (`{ inline_message_id }`) — captured with `query_id → user` correlation, **not** routed to
  `chat.messages`.
- **Join-request queries**: `user.requestJoin(group)` now emits and returns
  `chat_join_request.query_id`; `answerChatJoinRequestQuery` / `sendChatJoinRequestWebApp` are
  captured generically with synthetic defaults.
- **Reaction removal**: `deleteMessageReaction` / `deleteAllMessageReactions` captured into a
  reactions-removed projection (modeled on `delete-message-capture`).
- **Other new methods** (static synthetic defaults): `getManagedBotAccessSettings` →
  `BotAccessSettings`, `setManagedBotAccessSettings` → `true`, `getManagedBotToken` /
  `replaceManagedBotToken`, `getUserPersonalChatMessages` → `Message[]`.
- **Additive, generic capture only** (no first-class work): poll `members_only` /
  `country_codes` / media fields, min poll options 2→1, `can_react_to_messages` permission
  flag, `return_bots` on `getChatAdministrators`, `live_photo` in `sendMediaGroup` /
  `editMessageMedia`.
- **Examples + docs**: new example bots and doc pages for guest mode, rich messages,
  drafts/streaming, poll-with-media, and reaction removal.
- **`managed_bot` / `ctx.from`**: grammy 1.43 now resolves `ctx.from` for `managed_bot`
  updates; verify the existing `user.manageBot` synthetic shape works and adjust only if needed.

No breaking changes — every addition is additive. Existing tests and APIs are unaffected.

## Capabilities

### New Capabilities

- `guest-mode`: dispatching `guest_message` updates via `user.sendGuestMessage`, returning the
  `guest_query_id`, and the inline-style `answerGuestQuery` round-trip with `query_id → user`
  correlation.
- `rich-messages`: `sendRichMessage` / `sendRichMessageDraft` handling and `reply.richMessage`
  (`html` / `markdown` / `is_rtl` / `skip_entity_detection` / `plainText`) read ergonomics.
- `drafts-capture`: capturing `sendMessageDraft` / `sendRichMessageDraft` calls into a drafts
  projection for streaming-sequence assertions.
- `reaction-removal-capture`: capturing `deleteMessageReaction` / `deleteAllMessageReactions`
  into a reactions-removed projection.

### Modified Capabilities

- `synthetic-message-responses`: add `sendRichMessage` and `sendLivePhoto` to the synthetic
  `Message` methods.
- `modern-update-types`: `user.requestJoin` now emits `chat_join_request.query_id` and returns it.
- `user-actor`: `user.requestJoin` returns the `query_id`; `user.sendGuestMessage` is a new
  verb on the User actor.
- `auto-derived-api-responses`: managed-bot access settings/token defaults,
  `getUserPersonalChatMessages` default, `return_bots` on `getChatAdministrators`.

The version bump (`0.26.0`), `docs/CHANGELOG.md` entry, new examples, and new doc pages are
housekeeping/content handled in tasks — they satisfy existing `build-and-publish`, `changelog`,
`examples-catalog`, and `documentation-content` requirements rather than changing them.

## Impact

- **Dependencies**: `grammy` dev dependency `^1.42.0 → ^1.44.0` (pulls `@grammyjs/types@3.28.0`).
  Peer range `^1.42.0` already admits 1.44, so consumers are unaffected.
- **Source**: `src/high-level/chats.ts` (method guards, synthetic responses, drafts/reaction
  projections, `query_id → user` correlation), `src/high-level/user.ts` (`sendGuestMessage`,
  `requestJoin` query_id), `src/high-level/reply.ts` (rich message accessors),
  `src/low-level/responses.ts` / synthetic defaults.
- **Versioning**: `package.json` + `jsr.json` → `0.26.0`; `docs/CHANGELOG.md` entry.
- **Docs/examples**: `examples/`, `site/`.
- **Tests**: new spec coverage per capability; full quality gate must pass.
