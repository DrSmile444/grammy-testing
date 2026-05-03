## Why

Five TODO items (19, 20, 21, 23, 25) were already implemented in prior changes but never marked resolved in `TODO.md`. Three sub-items remain genuinely open: anonymous admin message dispatch (#22a), senderless/system message dispatch (#22b), and chat creation with a caller-supplied ID (#24). Without these, bots that guard against anonymous admin posts, handle from-less service messages, or operate on configuration-driven chat IDs must fall back to raw `handleUpdate` with hand-crafted objects and `as any` casts — the exact boilerplate grammy-testing exists to eliminate.

## What Changes

- `chats.newGroup`, `chats.newSupergroup`, `chats.newChannel` accept an object profile `{ id?, title? }` in addition to the existing `string | undefined` — any integer ID accepted, no validation
- `SendTextOptions` gains `anonymous?: boolean`; when set, `message.from` is replaced with the GroupAnonymousBot identity and `message.sender_chat` is set to the target group
- `user.sendCommand` options gain the same `anonymous?` field (delegated to `sendText`)
- `Group`, `Supergroup`, and `Channel` each gain `sendSystemMessage(text, options?)` which dispatches a `message` update with `from` absent
- `TODO.md` items 19, 20, 21, 23, 25 marked resolved with implementation details
- `TODO.md` items 22a, 22b, 24 marked resolved after implementation
- Version bump to `0.14.0`

## Capabilities

### New Capabilities

- `chat-id-override`: Chat factory methods accept an explicit caller-supplied ID via an object profile, mirroring the existing `UserProfile` pattern on `newUser`
- `anonymous-admin-dispatch`: `sendText` / `sendCommand` with `anonymous: true` fabricates the GroupAnonymousBot wire format (from + sender_chat) that Telegram sends for anonymous group admin posts
- `system-message-dispatch`: `sendSystemMessage(text, options?)` on Group, Supergroup, and Channel dispatches a message update with no `from` field, simulating Telegram service/system messages

### Modified Capabilities

- `user-actor`: `SendTextOptions` gains `anonymous?`; `sendCommand` options gain `anonymous?`

## Impact

- `src/high-level/chats.ts` — `ChatProfile` interface; updated factory signatures
- `src/high-level/user.ts` — `SendTextOptions.anonymous`; `sendText` dispatch logic; `sendCommand` options
- `src/high-level/group.ts` — `sendSystemMessage`
- `src/high-level/supergroup.ts` — `sendSystemMessage`
- `src/high-level/channel.ts` — `sendSystemMessage`
- `src/index.ts` — exports for `ChatProfile`, `GROUP_ANONYMOUS_BOT`, `SendSystemMessageOptions`
- `TODO.md` — documentation-only update
- `package.json` / `CHANGELOG.md` — version and release notes
