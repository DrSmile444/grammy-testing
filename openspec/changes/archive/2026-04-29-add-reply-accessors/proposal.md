## Why

The `reply-objects` spec documents two `Reply` accessors that are not yet implemented: `reply.replyMarkup` (the raw `reply_markup` escape hatch) and `reply.replyingTo` (the earlier `Reply` object that this message is replying to). Both are already in the canonical spec — this change closes the gap between spec and implementation.

## What Changes

- Add `reply.replyMarkup` — exposes `rawPayload.reply_markup` as a typed accessor (`Record<string, unknown> | undefined`). Useful when callers need to inspect the full markup object beyond what `reply.buttons` provides (e.g. `ReplyKeyboardMarkup`, `ForceReply`, custom button types).
- Add `reply.replyingTo` — resolves the `Reply` object that this outgoing message is replying to, when the captured payload contained `reply_to_message_id` or `reply_parameters.message_id`. Returns `undefined` when the referenced message is not a known captured reply (e.g. when replying to an incoming user message rather than an earlier bot reply).
- Wire `Chats` to maintain a `messageId → Reply` registry so `replyingTo` can resolve at construction time.

## Capabilities

### New Capabilities

*(none)*

### Modified Capabilities

- `reply-objects`: Adds `replyMarkup` and `replyingTo` accessors to the `Reply` requirement (both are already listed in the spec requirement text; this change adds the missing scenarios and closes the implementation gap)

## Impact

- `src/high-level/reply.ts` — two new fields, updated `ReplyDeps` interface, updated constructor
- `src/high-level/chats.ts` — new `messageIdToReply: Map<number, Reply>` registry; `deriveFromCapture` registers each Reply after construction and passes `resolveReply` into `ReplyDeps`
- `tests/reference/reply-accessors.spec.ts` — new reference suite spec covering both accessors
- Patch version bump (`0.4.0 → 0.4.1`)
