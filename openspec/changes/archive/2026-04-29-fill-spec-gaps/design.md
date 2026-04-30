## Context

Two spec requirements exist but are unimplemented:

1. `chat-messages-log` — `PrivateChat` has no `messages` field. `Chats.deriveFromCapture` explicitly skips private chats with a comment "PrivateChat doesn't have its own MessagesLog yet". All other chat types (`Group`, `Supergroup`, `Channel`) already have `messages: MessagesLog<TContext>` initialized in `Chats.registerChat`.

2. `grammy-plugin-interop` — `tests/plugins/parse-mode.spec.ts` only tests entities-based formatting (`fmt`/`b`/`i`). The `replyWithHTML` and `replyFmt` (HTML parse_mode path) scenarios are documented in the spec but not tested.

## Goals / Non-Goals

**Goals:**

- `PrivateChat` exposes `messages: MessagesLog<TContext>` as a public field
- Private chat replies land in both `chat.messages` and `user.replies`
- `tests/plugins/parse-mode.spec.ts` covers `ctx.replyWithHTML` producing `parseMode === 'HTML'` and `ctx.replyFmt` using the `ParseModeFlavor` middleware

**Non-Goals:**

- Changing the filtering logic for `user.replies` — private DMs already land there
- Supporting `fmt` template literal helpers producing a `parse_mode` string — they use entities, not parse_mode, by design

## Decisions

### Initialize `messages` in `privateChatFor`, not `registerChat`

Private chats are created via `Chats.privateChatFor` (a separate path from `registerChat` which handles groups/supergroups/channels). The `MessagesLog` must be initialized there. Since `PrivateChat` now owns a `messages` field, it should be set at construction time inside `privateChatFor`.

### `PrivateChat.messages` is typed `MessagesLog<TContext>` — initialized eagerly

Same pattern as `Group`/`Supergroup`/`Channel`. No lazy initialization needed — private chats are always fully set up before any dispatch can reach them.

### `Chats.deriveFromCapture` — remove the skip for private chats

The comment block that skips `chat.messages.push(reply)` for private chats is removed. Private chats now have a `messages` log, so the same branch that serves groups/channels applies.

### parse-mode test: install `ParseModeFlavor` middleware properly

`@grammyjs/parse-mode` v2's `replyWithHTML` is available on the flavored context after installing the `hydrateReply` middleware. Tests must use `Bot<ParseModeFlavor<Context>>` with `bot.use(hydrateReply)`.

## Risks / Trade-offs

- **`chat.messages.push` in private chats is a new behavior** — existing tests that relied on private chat messages NOT being in `chat.messages` would break. A quick grep of the test suite shows no test currently asserts on private `chat.messages` being empty, so the risk is low.
- **`PrivateChat` was previously not exported with a `messages` property** — adding it is a backward-compatible addition (no existing code checks for its absence).
