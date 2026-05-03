## Why

Actor verb sends (`user.sendText`, `user.sendPhoto`, etc.) return `void`, so there is no way to
access the auto-assigned `message_id` of the dispatched message without magic numbers or private
field access. This forces test authors to hard-code IDs or use `(chats as any).ids.messageCounter`
whenever they need to chain a send with a follow-up operation (e.g. `editMessage`,
`reply_to_message`, assertions on the dispatched shape).

## What Changes

- All message-producing send verbs on `User` change return type from `Promise<void>` to
  `Promise<Message>`, returning the full synthetic `Message` object that was dispatched.
- `user.sendMediaGroup(items)` changes return type from `Promise<void>` to `Promise<Message[]>`,
  returning one `Message` per dispatched item in order.
- `dispatchTextMessage` in `dispatch.ts` is updated to return the `Message` it constructs, so
  `sendText`, `sendCommand`, and `sendForwarded` can surface it.
- Non-message verbs (`sendInlineQuery`, `sendChosenInlineResult`, `reactTo`, `answerPoll`,
  `requestJoin`, `manageBot`, `purchasePaidMedia`, `removeBoost`, `joinChat`, `leaveChat`,
  `editMessage`) are unaffected — they dispatch non-message updates or already return a value.
- `boostChat` already returns `string` — no change.

## Capabilities

### New Capabilities

- `actor-send-return-message`: Actor verb sends on `User` return the dispatched `Message` object,
  giving tests direct access to `message_id`, `chat`, `from`, and content fields without magic
  numbers or private state access.

### Modified Capabilities

- `user-actor`: Existing send-verb requirements gain a new observable: the resolved value is
  a `Message` (or `Message[]` for `sendMediaGroup`) with `message_id` populated.

## Impact

- `src/high-level/user.ts` — return type updates on ~15 methods; `sendMediaGroup` collects and
  returns the array.
- `src/high-level/dispatch.ts` — `dispatchTextMessage` return type `void → Message`.
- All existing tests remain valid (discarding the return value is still fine).
- No breaking changes — the new return value is opt-in; callers that ignore it are unaffected.
