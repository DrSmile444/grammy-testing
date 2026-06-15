## ADDED Requirements

### Requirement: `sendRichMessage` and `sendLivePhoto` return a synthetic `Message` by default

The transformer SHALL resolve `sendRichMessage` and `sendLivePhoto` with a `Message`-shaped
object by default when no user-supplied `responses` entry is present for that method. The resolved
object includes at minimum:

- `message_id`: the same synthetic integer assigned to the captured `Reply` object for that call.
- `date`: the Unix timestamp (seconds) at which the default response was generated.

Both methods SHALL be treated as message-sending methods (added to `MESSAGE_METHODS_GUARD`):
captured `Reply` objects SHALL be pushed to `chat.messages` for the target chat and to the
`RepliesInbox` of every active member of that chat, following the same membership routing rules as
`sendMessage`, and SHALL be registered in the `messageIdToReply` registry.

#### Scenario: sendRichMessage resolves with a Message containing the reply's messageId

- **WHEN** the bot calls `ctx.api.sendRichMessage({ chat_id, ...{ html: '<b>hi</b>' } })`
- **AND** no `responses.sendRichMessage` entry is configured
- **THEN** the resolved result has `message_id` equal to `user.replies.last.messageId`
- **AND** `message_id` is a positive integer

#### Scenario: sendLivePhoto resolves with a Message and is logged

- **WHEN** the bot calls `ctx.api.sendLivePhoto({ chat_id, ... })` targeting a registered group
- **AND** no `responses.sendLivePhoto` entry is configured
- **THEN** the resolved result has a `message_id` and a `date` field
- **AND** `group.messages.last.messageId` equals the resolved `message_id`

#### Scenario: User-supplied responses entry overrides the default

- **WHEN** `prepareBot(bot, { responses: { sendRichMessage: { message_id: 9999, date: 0 } } })`
- **AND** the bot calls `sendRichMessage`
- **THEN** the resolved `message_id` equals `9999`
