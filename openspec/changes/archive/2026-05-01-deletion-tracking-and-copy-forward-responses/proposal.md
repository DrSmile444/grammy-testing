## Why

Two gaps in the high-level capture surface leave bot authors resorting to raw payload inspection: `deleteMessage` calls have no semantic log (forcing `outgoing.getLast()` checks), and `copyMessage`/`forwardMessage` return `true` instead of a real `MessageId`/`Message`, breaking any bot code that reads `result.message_id` for follow-up operations.

## What Changes

- **New `DeletionsLog`** per-chat tracking of `deleteMessage` calls, exposed as `chats.deletionsFor(chat)`. Each entry carries the synthetic `message_id` and a back-reference to the original captured `Reply` (if the message was sent during the test).
- **`copyMessage` and `forwardMessage` receive full treatment** in the `Chats` pipeline: added to `MESSAGE_METHODS`, creating `Reply` objects and populating `chat.messages`/`user.replies`, with `buildDefaultResponses()` returning properly shaped responses (`MessageId` for `copyMessage`, `Message` for `forwardMessage`).

## Capabilities

### New Capabilities

- `delete-message-capture`: Per-chat `DeletionsLog` returned by `chats.deletionsFor(chat)`, tracking `deleteMessage` calls with `messageId`, resolved `reply`, and `raw` payload.

### Modified Capabilities

- `synthetic-message-responses`: Extend coverage to `copyMessage` (returns `{ message_id }`) and `forwardMessage` (returns `{ message_id, date }`), following the same `lastCapturedReply` pattern as existing `send*` methods.

## Impact

- `src/high-level/deletions-log.ts` — new file
- `src/high-level/chats.ts` — `chatDeletions` map, `deletionsFor()` accessor, `DELETE_METHODS_GUARD`, deletion routing in `deriveFromCapture`, initialization in `registerChat()` and `privateChatFor()`
- `src/high-level/chats.ts` — `copyMessage` and `forwardMessage` added to `MESSAGE_METHODS_GUARD` and `buildDefaultResponses()`
- Public API surface: new `chats.deletionsFor(chat)`, new `Deletion` type export
