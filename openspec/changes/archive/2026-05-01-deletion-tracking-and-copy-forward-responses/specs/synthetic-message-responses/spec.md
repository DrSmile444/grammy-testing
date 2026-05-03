## ADDED Requirements

### Requirement: `copyMessage` returns a synthetic `MessageId` by default

When the bot calls `copyMessage` and no user-supplied `responses.copyMessage` entry is present, the transformer SHALL resolve the call with a `MessageId`-shaped object (`{ message_id: number }`) where `message_id` equals the synthetic integer assigned to the captured `Reply` object for that call. No `date` field SHALL be included, matching the Telegram Bot API response shape for `copyMessage`.

#### Scenario: copyMessage resolves with a MessageId containing the reply's messageId

- **WHEN** the bot calls `ctx.api.copyMessage(destChatId, sourceChatId, sourceMsgId)`
- **AND** no `responses.copyMessage` entry is configured
- **THEN** the resolved result has `message_id` equal to the synthetic ID in `destChat.messages.last.messageId`
- **AND** the result does not have a `date` field

#### Scenario: Bot can read copyMessage result to drive a follow-up edit

- **WHEN** the bot calls `const copy = await ctx.api.copyMessage(chatId, fromChat, msgId)`
- **AND** then calls `await ctx.api.editMessageText(chatId, copy.message_id, "edited")`
- **AND** no custom responses are configured
- **THEN** `chats.editsFor(user).lastOrThrow().editedMessageId` equals `copy.message_id`

#### Scenario: User-supplied responses.copyMessage overrides the default

- **WHEN** `prepareBot(bot, { responses: { copyMessage: { message_id: 1234 } } })` is called
- **AND** the bot calls `copyMessage`
- **THEN** the resolved `message_id` equals `1234`

### Requirement: `forwardMessage` returns a synthetic `Message` by default

When the bot calls `forwardMessage` and no user-supplied `responses.forwardMessage` entry is present, the transformer SHALL resolve the call with a `Message`-shaped object that includes at minimum:

- `message_id`: the same synthetic integer assigned to the captured `Reply` object for that call.
- `date`: the Unix timestamp (seconds) at which the default response was generated.

The `Reply` object for a `forwardMessage` call SHALL have `text === undefined` because the forwarded content is not present in the outgoing payload; `raw` SHALL still contain the full outgoing payload for escape-hatch assertions.

#### Scenario: forwardMessage resolves with a Message containing the reply's messageId

- **WHEN** the bot calls `ctx.api.forwardMessage(destChatId, sourceChatId, sourceMsgId)`
- **AND** no `responses.forwardMessage` entry is configured
- **THEN** the resolved result has `message_id` equal to `destChat.messages.last.messageId`
- **AND** the result has a `date` field

#### Scenario: Bot can read forwardMessage result to drive a follow-up pin

- **WHEN** the bot forwards a message and reads the returned `message_id`
- **AND** uses it to call `pinChatMessage`
- **THEN** the `pinChatMessage` call in `outgoing` carries the correct `message_id`

#### Scenario: User-supplied responses.forwardMessage overrides the default

- **WHEN** `prepareBot(bot, { responses: { forwardMessage: { message_id: 5678, date: 0 } } })` is called
- **AND** the bot calls `forwardMessage`
- **THEN** the resolved `message_id` equals `5678`

### Requirement: `copyMessage` and `forwardMessage` populate `chat.messages` and `user.replies`

`copyMessage` and `forwardMessage` SHALL be treated as message-sending methods: captured `Reply` objects SHALL be pushed to `chat.messages` for the destination chat and to the `RepliesInbox` of every active member of that chat, following the same membership routing rules as `sendMessage`. The captured `Reply` objects SHALL also be registered in the `messageIdToReply` registry so that follow-up operations referencing their `message_id` are resolved correctly.

#### Scenario: copyMessage appears in destination chat messages log

- **WHEN** the bot calls `copyMessage` targeting a registered group
- **THEN** `group.messages.length` increases by `1`
- **AND** `group.messages.last.messageId` equals the `message_id` in the resolved response

#### Scenario: forwardMessage appears in active members' reply inboxes

- **WHEN** the bot calls `forwardMessage` targeting a group where `user` is an active member
- **THEN** `user.replies.length` increases by `1`
