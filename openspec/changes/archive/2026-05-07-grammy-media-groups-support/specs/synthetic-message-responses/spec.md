## MODIFIED Requirements

### Requirement: `sendMediaGroup` returns a `Message[]` whose length matches the number of media items

When the bot calls `sendMediaGroup` and no user-supplied `responses.sendMediaGroup` entry is present, the transformer SHALL resolve with an array of `Message`-shaped objects whose length equals the number of items in the `media` array of the outgoing payload. Each element SHALL contain:

- `message_id`: a unique synthetic integer. The first element's `message_id` equals the `messageId` of the captured `Reply` object for that call; subsequent elements receive fresh IDs from `IdGenerator.nextMessageId()`.
- `date`: the Unix timestamp (seconds) at the moment the response resolver runs.
- `chat`: the Telegram `Chat` object for the destination chat (`reply.chat?.toTelegramChat() ?? { id: 0, type: 'private' }`), matching the shape produced by `syntheticMessage`. Required by response-hydrating transformers such as `grammy-media-groups`.
- `media_group_id`: a stable string shared by all messages returned in a single `sendMediaGroup` call. Each call to `syntheticMediaGroup` generates a fresh unique ID. Required for correct grouping by response-hydrating transformers.

The previous behaviour of always returning `{ message_id, date }[]` without `chat` or `media_group_id` SHALL no longer apply.

#### Scenario: sendMediaGroup with two items resolves with a two-element Message array

- **WHEN** the bot calls `sendMediaGroup(chatId, [{ type: "photo", media: "f1" }, { type: "photo", media: "f2" }])`
- **AND** no `responses.sendMediaGroup` entry is configured
- **THEN** the resolved result is an array with length `2`
- **AND** `result[0].message_id` equals `user.replies.last.messageId`
- **AND** `result[1].message_id` is a positive integer distinct from `result[0].message_id`

#### Scenario: sendMediaGroup result includes chat and media_group_id

- **WHEN** the bot calls `sendMediaGroup` with any number of items
- **AND** no custom `responses.sendMediaGroup` override is provided
- **THEN** each message in the result has a `chat` field with a numeric `id`
- **AND** each message in the result has the same `media_group_id` string
- **AND** `media_group_id` is non-empty and distinct from other `sendMediaGroup` calls

#### Scenario: sendMediaGroup with one item still resolves with a single-element array

- **WHEN** the bot calls `sendMediaGroup(chatId, [{ type: "photo", media: "f1" }])`
- **AND** no `responses.sendMediaGroup` entry is configured
- **THEN** the resolved result is an array with length `1`
- **AND** `result[0].message_id` equals `user.replies.last.messageId`

#### Scenario: User-supplied responses.sendMediaGroup overrides the default

- **WHEN** `prepareBot(bot, { responses: { sendMediaGroup: [{ message_id: 9999, date: 0 }] } })` is called
- **AND** the bot calls `sendMediaGroup` with any number of items
- **THEN** the resolved result is the manually supplied array
