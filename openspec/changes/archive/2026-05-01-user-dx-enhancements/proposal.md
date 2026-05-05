## Why

The high-level testing API has four small but sharp ergonomic gaps: accessing replies requires going through `chats` rather than the `User` you already have in scope, the only way to get the last reply without TypeScript/ESLint friction is a non-null assertion, chat-action dispatches (`sendChatAction`) are invisible to the test surface, and message edits (`editMessageText` etc.) are not tracked per-user. Each gap individually is a minor annoyance; together they push tests toward workarounds or raw `outgoing.requests` inspection that bypasses the high-level API entirely.

## What Changes

- **`user.replies`** — new getter on `User<TContext>` returning the user's `RepliesInbox`, delegating to the inbox reference already stored inside `Chats`. Eliminates the `chats.repliesFor(user)` call at every assertion site.
- **`RepliesInbox.lastOrThrow()`** — new method returning `Reply<TContext>` (non-nullable). Throws with a descriptive error when the inbox is empty. Replaces the `reply!.text` / optional-chain / disable-comment pattern in single-reply tests.
- **`chats.actionsFor(user)`** — new method returning an `ActionsLog` that captures `sendChatAction` payloads routed to that user, using the same chat-membership routing logic as `repliesFor`.
- **`chats.editsFor(user)`** — new method returning an `EditsLog` that captures `editMessageText`, `editMessageCaption`, and `editMessageMedia` calls routed to that user, resolved via the existing `messageIdToReply` registry.

No breaking changes. All additions are purely additive to existing public APIs.

## Capabilities

### New Capabilities

- `chat-actions-capture`: per-user capture and inspection of `sendChatAction` dispatches via `chats.actionsFor(user)`
- `message-edits-capture`: per-user capture and inspection of `editMessage*` calls via `chats.editsFor(user)`

### Modified Capabilities

- `user-actor`: adds `user.replies` shorthand getter returning the user's `RepliesInbox`
- `chats-orchestrator`: adds `RepliesInbox.lastOrThrow()` non-nullable last-reply accessor; adds `actionsFor` and `editsFor` factory methods to `Chats`

## Impact

- `src/high-level/user.ts` — add `replies` getter; thread `RepliesInbox` reference through `UserDeps`
- `src/high-level/chats.ts` — add `actionsFor`, `editsFor` methods; create `ActionsLog` and `EditsLog` classes; extend `deriveFromCapture` to handle `sendChatAction` and edit methods; create inbox before user in `newUser()` to allow threading
- `src/high-level/reply.ts` — no changes
- `src/index.ts` — export new public types (`ActionsLog`, `EditsLog`, any new value types)
- Test suite — new test files for the four additions
