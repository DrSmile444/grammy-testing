## ADDED Requirements

### Requirement: Message-sending methods return a synthetic `Message` by default

When the bot calls a Telegram message-sending method (`sendMessage`, `sendPhoto`, `sendDocument`, `sendVideo`, `sendAudio`, `sendVoice`, `sendVideoNote`, `sendAnimation`, `sendSticker`, `sendLocation`, `sendContact`, `sendVenue`, `sendPoll`, `sendDice`) and no user-supplied `responses` entry is present for that method, the transformer SHALL resolve the call with a `Message`-shaped object that includes at minimum:
- `message_id`: the same synthetic integer assigned to the captured `Reply` object for that call.
- `date`: the Unix timestamp (seconds) at which the default response was generated.

The previous default (`{ ok: true, result: true }`) SHALL no longer apply to these methods.

#### Scenario: sendMessage resolves with a Message containing the reply's messageId

- **WHEN** the bot calls `ctx.reply("hello")`
- **AND** no `responses.sendMessage` entry is configured
- **THEN** the resolved result has `message_id` equal to `user.replies.last.messageId`
- **AND** `message_id` is a positive integer

#### Scenario: Bot can read sent.message_id to drive a follow-up edit

- **WHEN** the bot calls `const sent = await ctx.reply("loading…")`
- **AND** then calls `await ctx.api.editMessageText(chatId, sent.message_id, "done")`
- **AND** no custom responses are configured
- **THEN** `chats.editsFor(user).lastOrThrow().text` equals `"done"`
- **AND** `chats.editsFor(user).lastOrThrow().editedMessageId` equals `sent.message_id`

#### Scenario: sendPhoto resolves with a Message containing the reply's messageId

- **WHEN** the bot calls `ctx.replyWithPhoto("file-id")`
- **AND** no `responses.sendPhoto` entry is configured
- **THEN** the resolved result has `message_id` equal to `user.replies.last.messageId`

#### Scenario: User-supplied responses entry overrides the default

- **WHEN** `prepareBot(bot, { responses: { sendMessage: { message_id: 9999, date: 0 } } })` is called
- **AND** the bot calls `ctx.reply("hello")`
- **THEN** the resolved `message_id` equals `9999`
- **AND** `user.replies.last.messageId` is the grammy-testing synthetic ID (not 9999)

### Requirement: `sendMediaGroup` returns a `Message[]` with the captured Reply's `messageId`

When the bot calls `sendMediaGroup` and no user-supplied `responses.sendMediaGroup` entry is present, the transformer SHALL resolve with an array containing a single `Message`-shaped object with `message_id` equal to the captured Reply's `messageId` and `date` set to the current Unix timestamp.

#### Scenario: sendMediaGroup resolves with a single-element Message array

- **WHEN** the bot calls `ctx.replyWithMediaGroup([{ type: "photo", media: "f1" }])`
- **AND** no `responses.sendMediaGroup` entry is configured
- **THEN** the resolved result is an array with length `1`
- **AND** `result[0].message_id` equals `user.replies.last.messageId`
