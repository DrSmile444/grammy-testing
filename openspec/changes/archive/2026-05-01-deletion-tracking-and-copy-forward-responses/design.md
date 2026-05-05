## Context

`grammy-testing` exposes high-level capture surfaces for replies (`repliesFor`), chat actions (`actionsFor`), and message edits (`editsFor`). Two operations remain outside this surface:

- `deleteMessage` — bot authors testing spam filters or content-moderation flows are forced to inspect the raw `outgoing.getLast()` payload even when the rest of the test uses the semantic API.
- `copyMessage` / `forwardMessage` — both return `true` in tests today, breaking any bot code that reads `result.message_id` to drive a follow-up `editMessageText`, `pinChatMessage`, etc.

The `EditsLog` pattern (`Map<userId, log>` in `Chats`, resolved via `messageIdToReply`) and the `buildDefaultResponses` / `lastCapturedReply` pattern (already used by all `send*` methods) are the two structural building blocks for both fixes.

## Goals / Non-Goals

**Goals:**

- Expose `chats.deletionsFor(chat)` returning a `DeletionsLog` with `messageId`, resolved `reply`, and `raw` for every `deleteMessage` call routed to that chat.
- Extend `buildDefaultResponses()` so `copyMessage` returns a real `MessageId`-shaped object and `forwardMessage` returns a `Message`-shaped object.
- Cover private-chat `deleteMessage` calls in `deletionsFor`.

**Non-Goals:**

- Tracking `pinChatMessage`, `banChatMember`, or other moderation methods — out of scope for this change.
- Populating `reply.text` for `forwardMessage` with the original message's content — grammy-testing does not have access to source-chat message bodies.
- Providing a `chat.deletions` shorthand property directly on chat objects.

## Decisions

### 1. DeletionsLog is routed by chat, not by user

`deleteMessage` carries `chat_id` and `message_id` but no sender identity. There is no way to attribute a deletion to a specific user without tracking who sent each message (not a current feature). Routing by chat is the only correct choice and is consistent with how the Telegram API models the operation.

_Alternative considered_: Route to all users who are members of the chat, mirroring `actionsFor`. Rejected because deletion is not a per-user event — a spam filter deletes a message regardless of which member authored it, and fanning out would inflate assertion counts unexpectedly.

### 2. DeletionsLog stored in a `chatDeletions` Map on `Chats`

Storage follows the `users` Map pattern (`Map<number, UserEntry>` holding `EditsLog`, `ActionsLog`, etc.) rather than placing `deletions` as a property directly on chat objects (the pattern used by `chat.messages`).

Rationale:

- `chat.messages` is a `MessagesLog` set by `registerChat()` as a mutable property on the chat class. Adding `deletions` there would require modifying all chat class interfaces and the `AnyChat` union.
- The `Map`-in-`Chats` approach requires no changes to chat class hierarchies.
- `chats.deletionsFor(chat)` is parallel to `chats.editsFor(user)` — consistent verb, consistent failure mode (throws for unregistered chats).

### 3. `Deletion` record includes a resolved `Reply` reference

```ts
interface Deletion {
  messageId: number;
  reply: Reply<TContext> | undefined;
  raw: Record<string, unknown>;
}
```

`reply` is resolved via the existing `messageIdToReply` registry (same map used by `deriveEdit`). If the deleted message was captured during the current test, `reply` gives direct access to its text, buttons, and other metadata. If the message predates the test (e.g., a pre-seeded chat history message), `reply` is `undefined` and the test falls back to `raw`.

_Alternative considered_: Only expose `messageId` (no `reply` back-reference). Rejected because it forces test authors to cross-reference `user.replies` manually, defeating the purpose of the semantic API.

### 4. `copyMessage` and `forwardMessage` receive full treatment in the `MESSAGE_METHODS` pipeline

Both methods are added to `MESSAGE_METHODS_GUARD` so they pass through `deriveFromCapture`, creating `Reply` objects, populating `chat.messages`, `user.replies` (for active chat members), and the `messageIdToReply` registry.

Rationale: `buildDefaultResponses()` resolvers read `this.lastCapturedReply?.messageId` to return a real `message_id`. `lastCapturedReply` is only set by `deriveFromCapture`. A synthetic-only approach (adding to `buildDefaultResponses` without `MESSAGE_METHODS`) would require a separate ID-generation path and would leave the synthesised ID unregistered in `messageIdToReply`, silently breaking any follow-up `editMessageText` or `pinChatMessage` that references it.

_Alternative considered_: Synthetic-only (skip `deriveFromCapture`, generate ID directly in the resolver). Rejected because the unregistered ID causes silent failures in follow-up operations.

### 5. `copyMessage` and `forwardMessage` use separate response resolvers

- `copyMessage` → `MessageId`: `{ message_id }` (no `date` field — matches Telegram API spec).
- `forwardMessage` → `Message`: reuses the existing `syntheticMessage` resolver `{ message_id, date }`.

The `Reply` objects for both methods will be "hollow" — `reply.text` will be `undefined` for `forwardMessage` (no content in the outgoing payload), and equal to `caption` only if a caption override was provided for `copyMessage`. This is the honest representation of what grammy-testing captured: the outgoing API call, not the resulting Telegram message. The `raw` field is the escape hatch for assertions that need source metadata.

## Risks / Trade-offs

- **Hollow Reply for `forwardMessage`**: `reply.text === undefined` even though the forwarded message has text in reality. → Mitigated by documentation and `raw` escape hatch. Test authors asserting on forwarded content should inspect the source message before the forward.
- **Private-chat deletions require `privateChatFor()` to also register in `chatDeletions`**: The two chat-creation paths (`registerChat` for groups/channels and `privateChatFor` for DMs) must both initialize a `DeletionsLog`. → Addressed explicitly in tasks.
- **`copyMessage`/`forwardMessage` in `user.replies`**: Active chat members receive hollow Reply objects in their inbox. → Acceptable; consistent with how media-only `sendPhoto` replies have `text === undefined`.
