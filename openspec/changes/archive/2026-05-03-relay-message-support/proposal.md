## Why

Telegram's channel relay mechanism delivers channel posts into linked groups as messages from
the reserved identity `from.id === 777_000` (the Telegram service account). Bots commonly
react to this pattern — detecting relayed posts, auto-deleting them, or tracking which user
replied to one. Testing this logic currently requires constructing the full `Message` shape
inline with `as any` cast, exposing the magic ID to test authors and making the relay message
itself invisible to the bot (it's never dispatched as an update, only embedded as
`reply_to_message`). The `777_000` identity is a reserved Telegram constant like `Channel_Bot`
(`136_817_688`) and `GroupAnonymousBot` (`1_087_968_824`), both of which already have dedicated
library APIs.

## What Changes

- `group.postRelayMessage(text, options?)` and `supergroup.postRelayMessage(text, options?)` are
  added, dispatching a `message` update with `from.id === 777_000` (Telegram relay identity).
  The method returns `Promise<Message>` (consistent with `actor-sends-return-message`).
  Optional `options.messageId` overrides the auto-generated ID.
  Optional `options.channel` populates `forward_origin` with the channel's chat data.
- `SendTextOptions.reply_to_message` type is loosened from `Message` to
  `Partial<Message> & { message_id: number }`. When `date` or `chat` are absent, the library
  auto-fills them (`date` = current Unix timestamp, `chat` = the resolved target chat). This
  eliminates `as any` for all `reply_to_message` scenarios, not just relay.
- A `TELEGRAM_RELAY` constant (the `from` user shape for `id: 777_000`) is exported for use in
  assertions.

## Capabilities

### New Capabilities

- `relay-message-dispatch`: Groups and supergroups can dispatch relay messages from the Telegram
  service identity (`777_000`), optionally linked to a source channel via `forward_origin`.

### Modified Capabilities

- `user-actor`: `SendTextOptions.reply_to_message` accepts a partial `Message` shape with only
  `message_id` required; `date` and `chat` are auto-filled when absent.

## Impact

- `src/high-level/group.ts` — add `postRelayMessage` method.
- `src/high-level/supergroup.ts` — add `postRelayMessage` method.
- `src/high-level/dispatch.ts` — add `makeRelayUser()` helper (mirrors `makeChannelBotUser`).
- `src/high-level/user.ts` — loosen `reply_to_message` type in `SendTextOptions`; update
  `sendText` to auto-fill `date` and `chat` when absent from the partial.
- `src/index.ts` — export `TELEGRAM_RELAY` constant.
- No breaking changes — the looser type is backward-compatible; existing `reply_to_message: fullMessage` usage continues to work.
