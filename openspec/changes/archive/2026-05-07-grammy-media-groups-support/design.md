## Context

`grammy-media-groups` v0.0.5 ships `mediaGroupTransformer(adapter)` — a bot-level API transformer that intercepts `sendMediaGroup` (and `forwardMessage`, `editMessageMedia`, etc.) responses and calls `storeMessages(adapter, messages)`. `storeMessages` reads `message.chat.id` for deduplication and groups messages by `media_group_id` before writing to the adapter. Messages without `media_group_id` are silently skipped.

The library's current `syntheticMediaGroup` returns `{ message_id, date }[]` — no `chat`, no `media_group_id`. This means the transformer sees messages, reads `message.chat.id` (throws or returns `undefined`), skips them due to missing `media_group_id`, and writes nothing. The adapter stays empty.

The v0.23.0 transformer chain fix already makes the transformer run. The remaining blocker is the response shape.

## Goals / Non-Goals

**Goals:**

- `syntheticMediaGroup` returns messages with `chat` and `media_group_id` so `grammy-media-groups` can store them correctly
- A passing test that asserts the adapter is populated after a bot calls `sendMediaGroup`
- A VitePress doc page explaining the install pattern and storage behaviour in tests
- Version bump to 0.24.0 (the response shape change is user-visible — bots reading `sendMediaGroup` return values in tests will now see `chat` and `media_group_id`)

**Non-Goals:**

- Supporting `mg.transformer` (shorthand via `mediaGroups()` instance) separately — it is the same `mediaGroupTransformer` under the hood
- Testing `editMessageMedia` / `editMessageCaption` transformer paths (low value in isolation)
- Supporting `ctx.mediaGroups` context methods (the middleware path; no transformer involved, already works)

## Decisions

### D1 — Add `chat` and `media_group_id` to `syntheticMediaGroup`

`syntheticMediaGroup` constructs an array of partial Message objects. Each message needs:

- `chat`: `reply.chat?.toTelegramChat() ?? { id: 0, type: 'private' }` — same pattern used in `syntheticMessage` after the hydrate fix
- `media_group_id`: a stable string shared across all messages in the same call — use the same ID generator (`this.ids.nextMediaGroupId()`) already used by `user.sendMediaGroup` on the incoming side, or simply generate a UUID-style string per call

The simplest approach: generate a single `media_group_id` per `syntheticMediaGroup` call using a counter already available in `this.ids`, and assign it to every message in the array.

**Alternative considered**: let users pass `media_group_id` via `responses` override. Rejected — the default should just work without overrides.

### D2 — Bump to 0.24.0, not a patch

The `syntheticMediaGroup` shape change is observable: bots that read `sendMediaGroup` return values in tests (which is unusual but valid) will now see additional fields. This is additive and non-breaking in practice, but our versioning convention bumps minor for any user-visible change to default responses (consistent with how 0.23.0 bumped for the `getFile` and synthetic `chat` additions).

### D3 — One test, minimal scope

Install `mediaGroupTransformer(adapter)` before `prepareBot`. Bot handler calls `ctx.api.sendMediaGroup(chatId, media)`. Assert `adapter.read(media_group_id)` returns a non-empty array. A second test asserts the `chat.id` on the stored message matches the chat the bot sent to.

No dependency on `mediaGroups()` middleware or `ctx.mediaGroups` — those are middleware-level, not transformer-level, and already work without library changes.

## Risks / Trade-offs

- **`this.ids` may not have a `nextMediaGroupId` method** → use `String(this.ids.nextMessageId())` as a proxy, or just a local counter in `buildDefaultResponses`. Since `syntheticMediaGroup` already uses `this.ids.nextMessageId()` for individual message IDs, extending the pattern is low-risk.
- **Adding `chat` to `syntheticMediaGroup` mirrors the `syntheticMessage` fix** — it's consistent but exposes the `lastCapturedReply` dependency. If `prepareBot` is called before any chat is registered, `reply.chat` may be undefined and fall back to `{ id: 0, type: 'private' }`. This is acceptable for the transformer use-case (the chat ID is synthetic anyway).
- **Version 0.24.0 increment** → the changelog and both version files (`package.json`, `jsr.json`) must be updated in sync.

## Open Questions

- Does `grammy-media-groups` read any other fields from the stored messages (beyond `message_id`, `chat.id`, `media_group_id`)? Looking at `storeMessages`, only those three are accessed during storage. Other fields (`photo`, `video`, etc.) are only read later by `toInputMedia` — a user-space call, not tested here. No additional fields needed in `syntheticMediaGroup` for the core test.
