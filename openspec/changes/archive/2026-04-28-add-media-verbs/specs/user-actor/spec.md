## ADDED Requirements

### Requirement: `user.sendPhoto` dispatches a photo update with a populated PhotoSize stub

The system SHALL provide `user.sendPhoto(file?, options?)` that constructs a synthetic `Update` with `message.photo` set to a one-element `PhotoSize[]` stub. If `file` is supplied, it is used as the `file_id`; otherwise a stable `'stub-file-<n>'` ID is generated. `options.caption` MAY set the message caption. `options.chat` MAY override the destination (defaults to the user's private chat). The call SHALL resolve once the middleware chain settles.

#### Scenario: Bot reads photo file_id from sendPhoto dispatch

- **WHEN** the test calls `await user.sendPhoto('img-001')`
- **AND** the bot has a `bot.on('message:photo', ctx => { ... })` handler
- **THEN** the handler observes `ctx.message.photo[0].file_id === 'img-001'`

#### Scenario: Auto-generates stable file_id when none supplied

- **WHEN** the test calls `await user.sendPhoto()` without a file argument
- **THEN** the dispatched `message.photo[0].file_id` matches the pattern `'stub-file-<n>'`

#### Scenario: Caption is carried on the message

- **WHEN** the test calls `await user.sendPhoto('img-001', { caption: 'my photo' })`
- **THEN** the dispatched `message.caption` equals `'my photo'`

#### Scenario: Dispatches into a non-private chat via options.chat

- **WHEN** the test creates `const group = chats.newSupergroup()` and calls `await user.sendPhoto('img-001', { chat: group })`
- **THEN** the dispatched update's `message.chat.id` equals `group.id`

### Requirement: `user.sendDocument` dispatches a document update with a populated Document stub

The system SHALL provide `user.sendDocument(file?, options?)` that constructs a synthetic `Update` with `message.document` set to a `Document` stub. If `file` is supplied, it is used as the `file_id` and `file_name`; otherwise a stable `'stub-file-<n>'` ID is generated. `options.caption` and `options.chat` follow the same rules as `sendPhoto`.

#### Scenario: Bot reads document file_id from sendDocument dispatch

- **WHEN** the test calls `await user.sendDocument('doc-001')`
- **AND** the bot has a `bot.on('message:document', ctx => { ... })` handler
- **THEN** the handler observes `ctx.message.document.file_id === 'doc-001'`

#### Scenario: Dispatches into a group via options.chat

- **WHEN** the test calls `await user.sendDocument('doc-001', { chat: group })`
- **THEN** the dispatched update's `message.chat.id` equals `group.id`

### Requirement: `user.sendVideo` dispatches a video update with a populated Video stub

The system SHALL provide `user.sendVideo(file?, options?)` that constructs a synthetic `Update` with `message.video` set to a `Video` stub (`file_id`, `file_unique_id`, `width: 1280`, `height: 720`, `duration: 0`). The `file` and `options` follow the same rules as `sendPhoto`.

#### Scenario: Bot reads video file_id from sendVideo dispatch

- **WHEN** the test calls `await user.sendVideo('vid-001')`
- **AND** the bot has a `bot.on('message:video', ctx => { ... })` handler
- **THEN** the handler observes `ctx.message.video.file_id === 'vid-001'`
