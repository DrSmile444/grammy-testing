## Why

The transformer's default `{ ok: true, result: true }` response for message-sending methods silently breaks any bot that reads `sent.message_id` to drive follow-up edits — a common pattern. Separately, bots that use per-update state middleware (`ctx.state`) must drop to the low-level API to wire state in tests, adding boilerplate that the high-level `chats` API should absorb.

## What Changes

- **Auto-synthetic Message responses**: all message-sending methods (`sendMessage`, `sendPhoto`, `sendDocument`, `sendVideo`, `sendAudio`, `sendVoice`, `sendVideoNote`, `sendAnimation`, `sendSticker`, `sendLocation`, `sendContact`, `sendVenue`, `sendPoll`, `sendDice`, `sendMediaGroup`) now return a real `Message` (or `Message[]` for `sendMediaGroup`) by default, using the synthetic `messageId` already assigned to the captured `Reply`. User-supplied `responses` entries override the defaults.
- **High-level state injection**: `PrepareOptions` gains an optional `state` field. When provided, a `mockState` middleware is inserted before the bot/composer under test so `ctx.state` is pre-populated for every update dispatched during the test. Compatible with `prepareBot`, `prepareComposer`, and `prepareMiddleware`.
- **TODO housekeeping**: items #7 (`sendCommand` shorthand) and #10 (`getMethods()` type safety) are moved to Resolved — both have already been implemented.

## Capabilities

### New Capabilities

- `synthetic-message-responses`: the `Chats` layer auto-generates a `Message`-shaped default response for each message-sending API call, keyed to the synthetic `messageId` of the captured `Reply`.
- `state-injection`: high-level `PrepareOptions.state` field wires a `mockState` middleware automatically, surfacing per-update state pre-population at the `prepareBot` / `prepareComposer` / `prepareMiddleware` call site.

### Modified Capabilities

- `outgoing-requests-capture`: default response for message-sending methods changes from `true` to a full `Message` object — downstream tests that assert `result === true` on `sendMessage` calls will need to update to a structure check.
- `chats-orchestrator`: `Chats.onCapture` gains responsibility for supplying synthetic `Message` defaults and for inserting the state-injection middleware when `PrepareOptions.state` is present.
- `bot-test-harness`: `PrepareOptions` type is extended with an optional `state` field; `prepareBot`, `prepareComposer`, and `prepareMiddleware` forward it to `Chats`.

## Impact

- `src/high-level/chats.ts` — `onCapture` logic, `MESSAGE_METHODS` guard reused for auto-response generation.
- `src/low-level/transformer.ts` — no changes; default-response logic lives in `Chats`, not the transformer.
- `src/low-level/prepare-bot.ts`, `prepare-composer.ts`, `prepare-middleware.ts` — `PrepareOptions` extended; state middleware wired when present.
- `src/low-level/mock-context-fields.ts` — `mockState` already exists; no changes needed.
- `TODO.md` — items #7 and #10 moved to Resolved section.
- Tests that assert `outgoing.getLast<'sendMessage'>().payload` and then check `result === true` must be updated to check the new `Message` shape.
