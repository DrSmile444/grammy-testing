## Context

`Reply` is constructed inside `Chats.deriveFromCapture` for every captured outgoing message-shape API call. The constructor currently receives `rawPayload`, `chat`, and a `ReplyDeps` bag. Two accessors from the spec are missing: `replyMarkup` (trivial read of `rawPayload.reply_markup`) and `replyingTo` (requires a lookup of an earlier Reply by its synthetic `messageId`).

## Goals / Non-Goals

**Goals:**
- Expose `reply.replyMarkup` as `Record<string, unknown> | undefined` read directly from `rawPayload.reply_markup`
- Expose `reply.replyingTo` as `Reply<TContext> | undefined` by resolving `replyToMessageId` through a registry owned by `Chats`

**Non-Goals:**
- Strongly-typing `replyMarkup` as the full grammy union (`InlineKeyboardMarkup | ReplyKeyboardMarkup | ...`) — the escape-hatch semantics call for a plain object type; callers that need the specific type can cast from `raw`
- Resolving `replyingTo` when the referenced ID belongs to an incoming user message — those IDs are not registered, so `replyingTo` correctly returns `undefined`

## Decisions

### `replyMarkup` is a one-liner

`this.replyMarkup = rawPayload.reply_markup as Record<string, unknown> | undefined` in the constructor. No new deps needed.

### `replyingTo` uses a registry passed through `ReplyDeps`

`ReplyDeps` gains a new `resolveReply: (messageId: number) => Reply<TContext> | undefined` callback. The `Reply` constructor calls it immediately with `this.replyToMessageId` to set `this.replyingTo`.

`Chats` maintains a private `messageIdToReply = new Map<number, Reply<TContext>>()`. After `new Reply(...)` returns, `Chats.deriveFromCapture` registers it: `this.messageIdToReply.set(reply.messageId, reply)`. This means `replyingTo` can only resolve Replies that were created in *earlier* captured calls, which is the correct semantics — a bot message cannot reply to itself or a message that hasn't been captured yet.

### Registration happens after construction

The `Reply` constructor reads from the registry (via `resolveReply`) but does NOT write to it. Writing is done by the caller (`Chats.deriveFromCapture`) after the constructor returns. This avoids self-reference and keeps `Reply` side-effect-free.

## Risks / Trade-offs

- `replyingTo` returns `undefined` when a bot replies to an incoming user message (the user's synthetic message_id is not in the Reply registry). This is correct behavior but tests that set `reply_parameters` pointing to user messages will see `replyingTo === undefined`. The spec does not promise otherwise.
- The registry grows unbounded for the lifetime of a `Chats` instance. In tests this is fine — test suites are short-lived. If `Chats` instances are ever reused across many scenarios, callers can create a fresh `Chats`.
