## ADDED Requirements

### Requirement: `Chats` tracks the last captured Reply for use in synthetic responses

`Chats` SHALL maintain an internal `lastCapturedReply` reference (initially `undefined`) that is updated to the most recently created `Reply` each time `deriveFromCapture` processes a message-method API call. This reference SHALL be readable by the default-response builder at call time (after `onCapture` has fired but before `resolveCall` completes).

#### Scenario: lastCapturedReply is set after the first message-method capture

- **WHEN** the bot calls `ctx.reply("hello")`
- **AND** `deriveFromCapture` processes the `sendMessage` request
- **THEN** the internal `lastCapturedReply` reference equals the Reply that was just pushed into the user's inbox

#### Scenario: lastCapturedReply is updated on each subsequent capture

- **WHEN** the bot calls `ctx.reply("first")` then `ctx.reply("second")`
- **THEN** after both calls, `lastCapturedReply.messageId` equals the `messageId` of the second Reply

### Requirement: `Chats` provides a `buildDefaultResponses()` method for synthetic Message defaults

`Chats` SHALL expose an internal `buildDefaultResponses()` method that returns a `Responses` map covering every method in `MESSAGE_METHODS`. Each entry SHALL be a dynamic resolver function that, when called, reads `lastCapturedReply?.messageId` and returns `{ message_id, date }`. For `sendMediaGroup`, the resolver SHALL return an array `[{ message_id, date }]`. If `lastCapturedReply` is `undefined` at call time, the resolver SHALL fall back to `{ ok: true, result: true }` behavior (return `true` or a minimal stub).

The `buildDefaultResponses()` output SHALL be merged with user-supplied responses in prepare functions, with user entries taking precedence.

#### Scenario: buildDefaultResponses covers all MESSAGE_METHODS

- **WHEN** `chats.buildDefaultResponses()` is called
- **THEN** the returned object has an entry for each of: `sendMessage`, `sendPhoto`, `sendDocument`, `sendVideo`, `sendAudio`, `sendVoice`, `sendVideoNote`, `sendAnimation`, `sendSticker`, `sendLocation`, `sendContact`, `sendVenue`, `sendPoll`, `sendDice`, `sendMediaGroup`

#### Scenario: Default response for sendMessage uses the last captured Reply's messageId

- **WHEN** the bot calls `ctx.reply("hello")`
- **AND** no user-supplied `responses.sendMessage` is configured
- **THEN** calling the `sendMessage` resolver from `buildDefaultResponses()` returns an object with `message_id` equal to the last captured Reply's `messageId`
