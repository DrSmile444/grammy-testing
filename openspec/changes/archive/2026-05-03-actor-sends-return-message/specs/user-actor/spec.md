## ADDED Requirements

### Requirement: `user.sendText` resolves with the dispatched `Message`

The return value of `user.sendText(text, options?)` SHALL be the full synthetic `Message` object
that was dispatched. `message.message_id` SHALL equal the ID that the bot receives in
`ctx.message.message_id`. All other fields on the returned `Message` SHALL match what was
constructed and dispatched.

#### Scenario: sendText resolves with message_id equal to what the bot sees

- **WHEN** the test calls `const msg = await user.sendText('hello')`
- **AND** the bot handler captures `ctx.message.message_id`
- **THEN** `msg.message_id` equals the captured value

### Requirement: `user.sendCommand` resolves with the dispatched `Message`

`user.sendCommand` delegates to `sendText` and SHALL return the same `Message` that `sendText`
returns, with `message.text` equal to the full command string and `message.entities` containing
the `bot_command` entity.

#### Scenario: sendCommand resolves with correct text and message_id

- **WHEN** the test calls `const msg = await user.sendCommand('/start')`
- **THEN** `msg.message_id` is a positive integer
- **AND** `msg.text` equals `'/start'`

### Requirement: `user.sendMediaGroup` resolves with `Message[]`

`user.sendMediaGroup(items, options?)` SHALL resolve with an array of `Message` objects, one per
item, in dispatch order. See `actor-send-return-message` spec for full requirements.

#### Scenario: sendMediaGroup resolves with a Message per item

- **WHEN** the test calls `const msgs = await user.sendMediaGroup([{ photo: 'a' }, { photo: 'b' }])`
- **THEN** `msgs` is an array of length `2`
- **AND** each element has a distinct `message_id`
