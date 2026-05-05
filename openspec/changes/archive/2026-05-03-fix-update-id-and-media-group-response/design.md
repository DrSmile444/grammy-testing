## Context

The `IdGenerator` class manages separate counters for users, groups, supergroups, channels, messages, media groups, files, and — as of this change — updates. Before this fix, every `User` dispatch method and `Reply.clickButton` derived its `update_id` by adding a large fixed offset to a call to `nextMessageId()`. This meant (a) each dispatch consumed a message ID slot it never used for a message, and (b) the two sequences were coupled — high-volume tests could exhaust offsets or produce collisions if counters converged.

The `syntheticMediaGroup` resolver in `Chats.buildDefaultResponses()` previously captured the single `Reply` object created by `onCapture` and returned a one-element `Message[]`. Because the Telegram Bot API's `sendMediaGroup` returns `Message[]` with one entry per media item, bots that iterated the returned array or checked its length received incorrect data.

## Goals / Non-Goals

**Goals:**

- Make `update_id` generation fully independent from message ID generation across all `User` methods and `Reply.clickButton`.
- Make `syntheticMediaGroup` return `N` synthetic messages when the bot sends `N` media items.
- Document `GROUP_ANONYMOUS_BOT.is_bot: false` inline to prevent future misidentification as a bug.

**Non-Goals:**

- Changing the public API surface of `User`, `Chats`, or `Reply`.
- Making `update_id` values user-observable (no tests assert specific `update_id` values).
- Fixing other hardcoded counters outside `user.ts` and `reply.ts` (all other callers already use `nextUpdateId()`).

## Decisions

### Decision: Dedicated `nextUpdateId()` counter starting at 1 000 000

`IdGenerator` already had `nextUpdateId()` added in the same PR. The counter starts at 1 000 000, well above the message counter (which starts at 1), so any snapshot of both counters is unambiguous during debugging.

_Alternative considered_: Reuse `nextMessageId()` with a large enough offset permanently. Rejected — the offset approach is fragile and couples the two sequences.

### Decision: `syntheticMediaGroup` reads `payload.media.length`

The outgoing `sendMediaGroup` payload always contains a `media` field (the `InputMedia[]` array). Reading its length gives the exact count needed without introducing new state or a second `onCapture` path.

The first message ID comes from `lastCapturedReply.messageId` (already allocated when `onCapture` fired). Each additional message ID calls `this.ids.nextMessageId()` directly — `buildDefaultResponses` is a method on `Chats`, so `this.ids` is accessible.

_Alternative considered_: Accumulate all `onCapture` calls for the same media group ID and aggregate them. Rejected — `sendMediaGroup` is one bot API call so `onCapture` fires exactly once; the item count is cleanly derivable from the payload.

### Decision: Comment rather than spec change for `GROUP_ANONYMOUS_BOT.is_bot`

The `is_bot: false` value is a Telegram protocol detail, not a testable requirement. A two-line inline comment (referencing `Channel_Bot` as a parallel) is sufficient; adding a spec requirement would over-specify Telegram internals that can change without notice.

## Risks / Trade-offs

- **Tests that snapshot `update_id`**: No existing test asserts on specific `update_id` values, so the counter change is non-breaking. Future tests should avoid asserting on `update_id` as it remains an internal implementation detail.
- **`syntheticMediaGroup` IDs are not correlated with captured Replies**: The additional `N-1` message IDs returned by the resolver are allocated at response time, after `onCapture`. These IDs do not appear in `chat.messages` or `user.replies`. This is acceptable — the existing `Reply` for a `sendMediaGroup` call represents the whole group, and bots rarely inspect individual returned message IDs from a group send.
