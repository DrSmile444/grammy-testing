## Why

Two requirements that are explicitly specified in existing specs are not yet implemented: `PrivateChat` lacks a `messages` log (the `chat-messages-log` spec requires private DMs to land in `privateChat.messages`), and the `grammy-plugin-interop` spec requires a scenario for `ctx.replyWithHTML(...)` / `ctx.replyFmt(...)` producing the correct `parseMode` — but no such test exists.

## What Changes

- Add `messages: MessagesLog<TContext>` to `PrivateChat` and populate it in `Chats.deriveFromCapture` for private chats
- Add two test cases to `tests/plugins/parse-mode.spec.ts` covering `replyWithHTML` and `replyFmt` (HTML parse_mode path)

## Capabilities

### New Capabilities

<!-- None — both gaps live inside existing capabilities -->

### Modified Capabilities

- `chat-messages-log`: add the missing `privateChat.messages` field to `PrivateChat` so private DMs land in both `privateChat.messages` and `user.replies` as the spec requires
- `grammy-plugin-interop`: add test coverage for the `replyWithHTML` / `replyFmt` scenario already present in the spec

## Impact

- `src/high-level/private-chat.ts` — add `messages` field
- `src/high-level/chats.ts` — initialize `MessagesLog` for new private chats; push to `chat.messages` in `deriveFromCapture`
- `tests/plugins/parse-mode.spec.ts` — add two test cases
- Patch version bump: `0.5.0 → 0.5.1` (bug fix / spec compliance, no API changes)
