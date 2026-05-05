## ADDED Requirements

### Requirement: Message-producing send verbs return the dispatched `Message`

All `User` send verbs that produce a `message` update SHALL return `Promise<Message>` instead of
`Promise<void>`. The returned object SHALL be the exact synthetic `Message` that was passed to
`bot.handleUpdate` — including the auto-assigned `message_id`, `chat`, `from`, `date`, and any
content fields constructed by the verb. Callers that ignore the return value SHALL NOT be affected.

The following verbs are in scope: `sendText`, `sendMessage`, `sendCommand`, `sendForwarded`,
`sendPhoto`, `sendDocument`, `sendVideo`, `sendAudio`, `sendVoice`, `sendVideoNote`,
`sendAnimation`, `sendSticker`, `sendLocation`, `sendContact`, `sendVenue`, `sendPoll`,
`sendDice`, `sendWebAppData`, `sendSuccessfulPayment`.

The following verbs are out of scope (they dispatch non-message updates or already return a
meaningful value): `sendInlineQuery`, `sendChosenInlineResult`, `sendPreCheckoutQuery`,
`sendShippingQuery`, `reactTo`, `answerPoll`, `requestJoin`, `joinChat`, `leaveChat`,
`editMessage`, `manageBot`, `purchasePaidMedia`, `boostChat`, `removeBoost`.

#### Scenario: `sendText` returns the dispatched Message with message_id

- **WHEN** the test calls `const msg = await user.sendText('hello')`
- **THEN** `msg.message_id` is a positive integer
- **AND** `msg.text` equals `'hello'`
- **AND** `msg.from.id` equals `user.id`

#### Scenario: Returned message_id matches what the bot receives

- **WHEN** the test calls `const msg = await user.sendText('trigger')`
- **AND** the bot handler reads `ctx.message.message_id`
- **THEN** the value seen by the bot equals `msg.message_id`

#### Scenario: `sendText` return value can be passed directly to `editMessage`

- **WHEN** the test calls `const msg = await user.sendText('original')`
- **AND** then calls `await user.editMessage(msg.message_id, 'updated')`
- **THEN** the dispatched `edited_message` update has `message_id` equal to `msg.message_id`

#### Scenario: `sendPhoto` returns the dispatched Message with photo field

- **WHEN** the test calls `const msg = await user.sendPhoto('img-001')`
- **THEN** `msg.message_id` is a positive integer
- **AND** `msg.photo` is a non-empty array

#### Scenario: Callers that ignore the return value are unaffected

- **WHEN** an existing test calls `await user.sendText('hello')` without assigning the result
- **THEN** the test compiles and passes without modification

### Requirement: `sendMediaGroup` returns `Message[]`

`user.sendMediaGroup(items, options?)` SHALL return `Promise<Message[]>` containing one `Message`
per dispatched item, in the same order as the input array. Each `Message` SHALL carry the same
`media_group_id`, its own unique `message_id`, and the content fields populated for that item.

#### Scenario: Returns one Message per item

- **WHEN** the test calls `const msgs = await user.sendMediaGroup([{ photo: 'a' }, { photo: 'b' }])`
- **THEN** `msgs.length` equals `2`
- **AND** `msgs[0].message_id` is a positive integer
- **AND** `msgs[1].message_id` is a positive integer
- **AND** `msgs[0].message_id` does not equal `msgs[1].message_id`

#### Scenario: All returned messages share the same media_group_id

- **WHEN** the test calls `const msgs = await user.sendMediaGroup([{ photo: 'a' }, { photo: 'b' }])`
- **THEN** `msgs[0].media_group_id` equals `msgs[1].media_group_id`
- **AND** both values are non-empty strings
