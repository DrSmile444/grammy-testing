## Context

Three self-contained issues from TODO.md (#13, #14, #15) are being resolved together:

- **#15**: `package.json` has a `postinstall` hook pointing to `./scripts/link-codex-skills.sh` — a local dev convenience that isn't published. Consumers get a hard npm install failure.
- **#13**: No single-call way to reset captured state between tests. A typical `beforeEach` requires 4–5 individual `clear()` calls across different logs.
- **#14**: When a bot calls `sendMessage` (or similar) to a chat ID not registered with the `Chats` orchestrator, the call silently drops. Tests see the correct `outgoing.getMethods()` output but empty `user.replies`, with no hint as to why.

All three fixes touch `Chats` (the orchestrator) and the entry-point options types. None remove existing API surface.

## Goals / Non-Goals

**Goals:**
- Remove `postinstall` from `package.json` so consumer `npm install` works.
- Add `chats.clear()` that resets all captured logs and routing state atomically.
- Emit a `console.warn` (suppressible) when API calls target unregistered chat IDs.

**Non-Goals:**
- Clearing user/chat registries or membership state in `chats.clear()` — references must stay valid.
- Resetting the ID generator in `chats.clear()` — incrementing IDs across tests is fine.
- A structured `chats.unregistered` log — the warning covers the DX need without new API surface.
- Changing `deriveEdit` silent-skip behavior — edits to pre-test messages are intentionally quiet.

## Decisions

### D1: `chats.clear()` resets logs and routing state, not registries

**Decision:** `clear()` zeroes `outgoing`, all per-user `replies`/`actions`/`edits`, all per-chat `messages` and `DeletionsLog` entries, plus `messageIdToReply`, `clickers`, and `lastCapturedReply`. The `users` map, `chats` map, and membership records are untouched.

**Rationale:** Test authors hold references to `user` and `group` variables across the `beforeEach` boundary. Clearing the registry would invalidate those references and break tests. Routing state (`messageIdToReply`, `clickers`) must reset for test isolation — a click captured in test 1 would otherwise pollute routing in test 2.

**Alternative considered:** Reset only the log arrays, leave routing state. Rejected because stale click associations silently corrupt reply routing in subsequent tests.

### D2: `console.warn` on unregistered chat, on by default, suppressible per entry point

**Decision:** Add a `warnOnUnregisteredChats: boolean` field to `PrepareOptions` (default `true`). The `Chats` instance stores the flag. Each `deriveFromCapture`, `deriveChatAction`, and `deriveDelete` emits a `console.warn` when `findChatByTelegramId` returns `undefined`.

Warning message format:
```
[grammy-testing] Bot called <method> to unregistered chat <chatId>.
Register it with chats.newChannel() / newSupergroup() / newGroup(), or pass
{ warnOnUnregisteredChats: false } to suppress.
```

**Rationale:** Opt-out (on by default) surfaces the issue immediately without test authors needing to know the option exists. The `console.warn` is suppressible for bots that intentionally fan out to external channels.

**Alternative considered:** `onUnregisteredChat` hook in `PrepareOptions`. More flexible but requires opt-in — misses the "confused first-time user" case entirely.

**Alternative considered:** `chats.unregistered` log (observable sink). Cleaner API, but test authors still have to know to check it. Doesn't help with the "why is user.replies empty" confusion.

**Why not `deriveEdit`:** Edits to pre-test messages are documented intentional behavior (TODO resolved #6). Emitting a warning there would be noisy and incorrect.

### D3: `warnOnUnregisteredChats` is threaded through `Chats` constructor or setter

**Decision:** Add `warnOnUnregisteredChats: boolean` as a constructor parameter or a post-construction setter on `Chats`. Entry points (`prepareBot`, `prepareComposer`, `prepareMiddleware`) read it from their options and pass it through.

**Rationale:** `Chats` is instantiated inside each entry point. The flag must reach `Chats` without exposing internal factory details. A constructor parameter is the cleanest path.

## Risks / Trade-offs

- [Warn noise] Bots that send to external chats (log channels, creator notifications) will get console output in their test runs by default → Suppressed via `{ warnOnUnregisteredChats: false }` in `prepareBot`. Document in README.
- [Clear over-breadth] `chats.clear()` resets `messageIdToReply`, so any `reply` references held across a `clear()` become stale in edit/deletion lookups → Acceptable — references held across `clear()` imply test design that reaches across test boundaries, which is an anti-pattern regardless.

## Migration Plan

No migration needed. All changes are additive or removals of internal behavior.

1. Remove `postinstall` from `package.json` — ship as patch.
2. Add `chats.clear()` — additive, no consumer code changes required.
3. Add warn behavior — on by default; bots that fan out to external chats will want to add `{ warnOnUnregisteredChats: false }` to their `prepareBot` call.

## Open Questions

None — all three design decisions are settled from the explore session.
