## MODIFIED Requirements

### Requirement: `sendMediaGroup` returns a `Message[]` whose length matches the number of media items

When the bot calls `sendMediaGroup` and no user-supplied `responses.sendMediaGroup` entry is present, the transformer SHALL resolve with an array of `Message`-shaped objects whose length equals the number of items in the `media` array of the outgoing payload. Each element SHALL contain:

- `message_id`: a unique synthetic integer. The first element's `message_id` equals the `messageId` of the captured `Reply` object for that call; subsequent elements receive fresh IDs from `IdGenerator.nextMessageId()`.
- `date`: the Unix timestamp (seconds) at the moment the response resolver runs.

The previous behaviour of always returning a single-element array regardless of item count SHALL no longer apply.

#### Scenario: sendMediaGroup with two items resolves with a two-element Message array

- **WHEN** the bot calls `sendMediaGroup(chatId, [{ type: "photo", media: "f1" }, { type: "photo", media: "f2" }])`
- **AND** no `responses.sendMediaGroup` entry is configured
- **THEN** the resolved result is an array with length `2`
- **AND** `result[0].message_id` equals `user.replies.last.messageId`
- **AND** `result[1].message_id` is a positive integer distinct from `result[0].message_id`

#### Scenario: sendMediaGroup with one item still resolves with a single-element array

- **WHEN** the bot calls `sendMediaGroup(chatId, [{ type: "photo", media: "f1" }])`
- **AND** no `responses.sendMediaGroup` entry is configured
- **THEN** the resolved result is an array with length `1`
- **AND** `result[0].message_id` equals `user.replies.last.messageId`

#### Scenario: User-supplied responses.sendMediaGroup overrides the default

- **WHEN** `prepareBot(bot, { responses: { sendMediaGroup: [{ message_id: 9999, date: 0 }] } })` is called
- **AND** the bot calls `sendMediaGroup` with any number of items
- **THEN** the resolved result is the manually supplied array
