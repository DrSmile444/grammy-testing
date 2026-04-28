## Context

`dispatchTextMessage` and `dispatchServiceMessage` in `dispatch.ts` are the two existing dispatch primitives. Both construct a typed `Update`, populate it from a spec interface, and call `bot.handleUpdate`. The `User` class delegates to these from its verbs.

Forwarded messages are structurally a text message with an extra `forward_origin` field on the `Message` object — the rest of the shape is identical. Edited messages are a different Update field (`edited_message` instead of `message`) but contain the same inner `Message` structure.

## Goals / Non-Goals

**Goals:**
- Extend `dispatchTextMessage` minimally to support `forward_origin` (one optional field).
- Add a new `dispatchEditedMessage` dispatch function for the `edited_message` update shape.
- Keep both verbs consistent with existing ones: same `{ chat?, ... }` options pattern, same ID generation strategy.

**Non-Goals:**
- Full edit history tracking (mapping original send time to `date`).
- `edited_message` for media or other non-text message types.
- Forwarded messages with `forward_origin.type` other than what `MessageOrigin` already provides via grammy types — no custom validation.

## Decisions

**Decision 1: Extend `dispatchTextMessage` for forwarding rather than a new function.**

`sendForwarded` dispatches a text update that happens to carry `forward_origin`. Adding an optional `forwardOrigin?: MessageOrigin` to `PrivateMessageDispatch` and forwarding it onto the `Message` object is one line. A separate `dispatchForwardedMessage` function would duplicate the entire function for no benefit. The naming of `PrivateMessageDispatch` is a pre-existing misnomer (it already handles group chats) — not fixed here.

**Decision 2: `dispatchEditedMessage` as its own function (not a flag on `dispatchTextMessage`).**

The `edited_message` update field is structurally different from `message` — it cannot be handled by the same Update assembly without a conditional branch that complicates the existing function. A second function keeps both paths clean and independently testable.

**Decision 3: `date: now` and `edit_date: now` set from the same timestamp.**

In real Telegram, `date` is the original send time and `edit_date` is the edit time. For tests, the distinction rarely matters — bots react to `edit_date` being present, not to the delta. Using `Date.now()` for both keeps the implementation simple. A future enhancement could accept an explicit `originalDate` option if a test needs to assert the original send time.

**Decision 4: `updateId` offset of `+500_000` for edited messages.**

Existing offsets: `+100_000` for text messages, `600_000` for joinChat, `700_000` for leaveChat. `+500_000` is a clear slot in that range. The exact value doesn't matter — it only needs to be distinct from concurrent dispatches, which are sequential in tests.

## Risks / Trade-offs

- `PrivateMessageDispatch` interface name is misleading (handles any chat type). Accepted as pre-existing; rename is out of scope.
- `date === edit_date` in all synthesized edits. Acceptable for the test patterns this targets; noted in the `date` field JSDoc.
