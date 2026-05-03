## Context

All `User` send verbs that produce a `message` update currently return `Promise<void>`. The
dispatched `Message` object is constructed inside each method (or inside `dispatchTextMessage`)
and then discarded after `bot.handleUpdate` resolves. The only route to the auto-assigned
`message_id` is through private state (`(chats as any).ids.messageCounter`) or a hard-coded
magic number.

`dispatchTextMessage` in `dispatch.ts` currently takes a payload, constructs the `Update`, and
calls `bot.handleUpdate` — returning nothing. All other media send methods inline their `Message`
construction and have the object locally but never return it.

## Goals / Non-Goals

**Goals:**

- All message-producing `User` send verbs return the `Message` they dispatched.
- `sendMediaGroup` returns `Message[]` (one per item, in dispatch order).
- `dispatchTextMessage` returns the `Message` it constructs.
- Zero impact on callers that ignore the return value.

**Non-Goals:**

- Returning anything from non-message verbs (`sendInlineQuery`, `reactTo`, etc.).
- Changing `editMessage` — it dispatches `edited_message`, not `message`.
- Adding new fields to the returned `Message` beyond what is already constructed.

## Decisions

### Return the dispatched `Message` directly, not a wrapper type

**Decision:** Return `Promise<Message>` (the grammy-types `Message`), not a custom
`{ messageId, message }` wrapper.

**Rationale:** The `Message` object is already fully constructed inside each send method. Tests
that only need `message_id` use `msg.message_id`; tests that need the full shape get it without
an unwrapping step. A wrapper type would add indirection with no benefit.

**Alternative considered:** `Promise<{ messageId: number }>` — rejected because it discards
the rest of the shape, which test authors may legitimately want (e.g. asserting `msg.chat.id`
or using `msg` as `reply_to_message` in a follow-up send).

### Update `dispatchTextMessage` return type to `Message`

**Decision:** `dispatchTextMessage` returns the `Message` it constructs instead of `void`.

**Rationale:** `sendText`, `sendCommand`, and `sendForwarded` all delegate to
`dispatchTextMessage`. Returning the `Message` from the dispatcher is the cleanest single-point
change that propagates to all three callers, avoids duplicating the object construction, and
keeps each caller's body a simple `return dispatchTextMessage(...)`.

**Alternative considered:** Having each caller reconstruct or re-read the message — rejected
as redundant duplication.

### `sendMediaGroup` returns `Message[]`

**Decision:** Collect the constructed `Message` per item into an array and return it.

**Rationale:** Each item in a media group becomes a separate `message` update with its own
`message_id`. Returning an array in dispatch order lets tests reference individual item IDs
for follow-up operations (e.g. pinning one item, deleting a specific photo).

## Risks / Trade-offs

- **Type change is observable at compile time** — any callers that already assigned the result
  to a typed variable would get a type error only if they typed it as `void`. In practice all
  existing callers use `await user.sendText(...)` with no assignment, so no existing code breaks.
- **`dispatchTextMessage` signature widens** — internal function; no external exposure risk.

## Migration Plan

No data migration needed. The change is purely additive (new return value). Existing tests
continue to compile and pass without modification. Update changelog and bump minor version.
