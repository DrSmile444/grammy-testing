## ADDED Requirements

### Requirement: `user.sendAudio` dispatches an audio update with a populated Audio stub

The system SHALL provide `user.sendAudio(file?, options?)` that constructs a synthetic `Update` with `message.audio` set to an `Audio` stub. If `file` is supplied it is used as the `file_id`; otherwise a stable `'stub-file-<n>'` ID is generated. `options.caption` MAY set the message caption. `options.chat` MAY override the destination (defaults to the user's private chat). The call SHALL resolve once the middleware chain settles.

#### Scenario: Bot reads audio file_id from sendAudio dispatch

- **WHEN** the test calls `await user.sendAudio('aud-001')`
- **AND** the bot has a `bot.on('message:audio', ctx => { ... })` handler
- **THEN** the handler observes `ctx.message.audio.file_id === 'aud-001'`

#### Scenario: Dispatches into a group via options.chat

- **WHEN** the test calls `await user.sendAudio('aud-001', { chat: group })`
- **THEN** the dispatched update's `message.chat.id` equals `group.id`

### Requirement: `user.sendVoice` dispatches a voice update with a populated Voice stub

The system SHALL provide `user.sendVoice(file?, options?)` that constructs a synthetic `Update` with `message.voice` set to a `Voice` stub (`file_id`, `file_unique_id`, `duration: 0`, `mime_type: 'audio/ogg'`). `options.caption` and `options.chat` follow the same rules as `sendAudio`.

#### Scenario: Bot reads voice file_id from sendVoice dispatch

- **WHEN** the test calls `await user.sendVoice('voi-001')`
- **AND** the bot has a `bot.on('message:voice', ctx => { ... })` handler
- **THEN** the handler observes `ctx.message.voice.file_id === 'voi-001'`

#### Scenario: Auto-generates stable file_id when none supplied

- **WHEN** the test calls `await user.sendVoice()` without a file argument
- **THEN** the dispatched `message.voice.file_id` matches the pattern `'stub-file-<n>'`

### Requirement: `user.sendVideoNote` dispatches a video note update with a populated VideoNote stub

The system SHALL provide `user.sendVideoNote(file?, options?)` that constructs a synthetic `Update` with `message.video_note` set to a `VideoNote` stub (`file_id`, `file_unique_id`, `length: 240`, `duration: 0`). `options.chat` MAY override the destination.

#### Scenario: Bot reads video_note file_id from sendVideoNote dispatch

- **WHEN** the test calls `await user.sendVideoNote('vn-001')`
- **AND** the bot has a `bot.on('message:video_note', ctx => { ... })` handler
- **THEN** the handler observes `ctx.message.video_note.file_id === 'vn-001'`

### Requirement: `user.sendAnimation` dispatches an animation update with a populated Animation stub

The system SHALL provide `user.sendAnimation(file?, options?)` that constructs a synthetic `Update` with `message.animation` set to an `Animation` stub (`file_id`, `file_unique_id`, `width: 320`, `height: 240`, `duration: 0`). `options.caption` and `options.chat` follow the same rules as `sendAudio`.

#### Scenario: Bot reads animation file_id from sendAnimation dispatch

- **WHEN** the test calls `await user.sendAnimation('anim-001')`
- **AND** the bot has a `bot.on('message:animation', ctx => { ... })` handler
- **THEN** the handler observes `ctx.message.animation.file_id === 'anim-001'`

### Requirement: `user.sendSticker` dispatches a sticker update with a populated Sticker stub

The system SHALL provide `user.sendSticker(file?, options?)` that constructs a synthetic `Update` with `message.sticker` set to a `Sticker` stub (`file_id`, `file_unique_id`, `width: 512`, `height: 512`, `is_animated: false`, `is_video: false`, `type: 'regular'`). `options.chat` MAY override the destination.

#### Scenario: Bot reads sticker file_id from sendSticker dispatch

- **WHEN** the test calls `await user.sendSticker('stk-001')`
- **AND** the bot has a `bot.on('message:sticker', ctx => { ... })` handler
- **THEN** the handler observes `ctx.message.sticker.file_id === 'stk-001'`

### Requirement: `user.sendLocation` dispatches a location update

The system SHALL provide `user.sendLocation(latitude, longitude, options?)` that constructs a synthetic `Update` with `message.location` set to `{ latitude, longitude }`. `options.chat` MAY override the destination (defaults to the user's private chat). The call SHALL resolve once the middleware chain settles.

#### Scenario: Bot reads location coordinates from sendLocation dispatch

- **WHEN** the test calls `await user.sendLocation(51.5074, -0.1278)`
- **AND** the bot has a `bot.on('message:location', ctx => { ... })` handler
- **THEN** the handler observes `ctx.message.location.latitude === 51.5074`
- **AND** the handler observes `ctx.message.location.longitude === -0.1278`

#### Scenario: Dispatches into a group via options.chat

- **WHEN** the test calls `await user.sendLocation(51.5074, -0.1278, { chat: group })`
- **THEN** the dispatched update's `message.chat.id` equals `group.id`

### Requirement: `user.sendContact` dispatches a contact update

The system SHALL provide `user.sendContact(phoneNumber, firstName, options?)` that constructs a synthetic `Update` with `message.contact` set to `{ phone_number: phoneNumber, first_name: firstName }`. `options.lastName` MAY add the `last_name` field. `options.chat` MAY override the destination.

#### Scenario: Bot reads contact phone from sendContact dispatch

- **WHEN** the test calls `await user.sendContact('+1234567890', 'Alice')`
- **AND** the bot has a `bot.on('message:contact', ctx => { ... })` handler
- **THEN** the handler observes `ctx.message.contact.phone_number === '+1234567890'`
- **AND** the handler observes `ctx.message.contact.first_name === 'Alice'`

### Requirement: `user.sendVenue` dispatches a venue update

The system SHALL provide `user.sendVenue(latitude, longitude, title, address, options?)` that constructs a synthetic `Update` with `message.venue` set to `{ location: { latitude, longitude }, title, address }`. `options.chat` MAY override the destination.

#### Scenario: Bot reads venue title from sendVenue dispatch

- **WHEN** the test calls `await user.sendVenue(51.5074, -0.1278, 'Big Ben', 'Westminster, London')`
- **AND** the bot has a `bot.on('message:venue', ctx => { ... })` handler
- **THEN** the handler observes `ctx.message.venue.title === 'Big Ben'`
- **AND** the handler observes `ctx.message.venue.address === 'Westminster, London'`

### Requirement: `user.sendPoll` dispatches a poll update with a populated Poll stub

The system SHALL provide `user.sendPoll(question, answerOptions, options?)` that constructs a synthetic `Update` with `message.poll` set to a `Poll` stub. The stub SHALL carry `question` as a plain string, `options` as an array of `{ text, voter_count: 0 }` entries derived from `answerOptions`, `total_voter_count: 0`, `is_closed: false`, `allows_revoting: false`, and `type: 'regular'`. A unique `id` SHALL be generated for the poll. `options.chat` MAY override the destination.

#### Scenario: Bot reads poll question from sendPoll dispatch

- **WHEN** the test calls `await user.sendPoll('Favorite color?', ['Red', 'Blue', 'Green'])`
- **AND** the bot has a `bot.on('message:poll', ctx => { ... })` handler
- **THEN** the handler observes `ctx.message.poll.question === 'Favorite color?'`
- **AND** `ctx.message.poll.options` has length `3`
- **AND** `ctx.message.poll.options[0].text === 'Red'`

### Requirement: `user.sendDice` dispatches a dice update with a populated Dice stub

The system SHALL provide `user.sendDice(emoji?, options?)` that constructs a synthetic `Update` with `message.dice` set to `{ emoji, value: 1 }`. The `emoji` parameter defaults to `'🎲'` when omitted. `options.chat` MAY override the destination.

#### Scenario: Bot reads dice emoji from sendDice dispatch

- **WHEN** the test calls `await user.sendDice()`
- **AND** the bot has a `bot.on('message:dice', ctx => { ... })` handler
- **THEN** the handler observes `ctx.message.dice.emoji === '🎲'`
- **AND** the handler observes `ctx.message.dice.value === 1`

#### Scenario: Custom emoji is passed through

- **WHEN** the test calls `await user.sendDice('🎯')`
- **THEN** the handler observes `ctx.message.dice.emoji === '🎯'`
