## ADDED Requirements

### Requirement: `BusinessAccount` actor encapsulates Business API updates

The system SHALL provide a `BusinessAccount` class accessible via `chats.newBusinessAccount(user)`. The constructor SHALL auto-generate a unique `connectionId` string of the form `biz-<n>`. The `user` property SHALL reference the `User` actor representing the business account owner.

#### Scenario: Factory mints a BusinessAccount with a generated connectionId

- **WHEN** the test calls `const biz = chats.newBusinessAccount(user)`
- **THEN** `biz.connectionId` is a non-empty string matching `/^biz-\d+$/`
- **AND** `biz.user` is the same `User` instance

### Requirement: `businessAccount.connect` dispatches a business_connection update (enabled)

The system SHALL provide `businessAccount.connect(options?)` that constructs a `business_connection` update with `is_enabled: true` and dispatches it via `bot.handleUpdate`. The update SHALL reference `businessAccount.connectionId` and the account owner's user profile.

#### Scenario: Bot receives business_connection with is_enabled true

- **WHEN** the test calls `await biz.connect()`
- **THEN** the bot receives a `business_connection` update with `business_connection.is_enabled === true`
- **AND** `business_connection.id === biz.connectionId`
- **AND** `business_connection.user.id === biz.user.id`

### Requirement: `businessAccount.disconnect` dispatches a business_connection update (disabled)

The system SHALL provide `businessAccount.disconnect(options?)` that constructs a `business_connection` update with `is_enabled: false` and dispatches it via `bot.handleUpdate`. All other fields SHALL mirror `connect`.

#### Scenario: Bot receives business_connection with is_enabled false

- **WHEN** the test calls `await biz.disconnect()`
- **THEN** the bot receives a `business_connection` update with `business_connection.is_enabled === false`
- **AND** `business_connection.id === biz.connectionId`

### Requirement: `businessAccount.sendMessage` dispatches a business_message update

The system SHALL provide `businessAccount.sendMessage(text, options?)` that constructs a `business_message` update. The `business_message` field SHALL be a `Message` with `business_connection_id` set to `businessAccount.connectionId`. The `from` field SHALL reflect the account owner. The `chat` SHALL be a private chat whose `id` equals the account owner's `user.id`.

#### Scenario: Bot receives business_message update

- **WHEN** the test calls `await biz.sendMessage('hello from business')`
- **THEN** the bot receives a `business_message` update with `business_message.text === 'hello from business'`
- **AND** `business_message.business_connection_id === biz.connectionId`
- **AND** `business_message.from.id === biz.user.id`
- **AND** `business_message.chat.id === biz.user.id`

### Requirement: `businessAccount.editMessage` dispatches an edited_business_message update

The system SHALL provide `businessAccount.editMessage(messageId, newText, options?)` that constructs an `edited_business_message` update. The `edited_business_message` field SHALL carry the supplied `messageId`, the new `newText`, `business_connection_id`, and `from` reflecting the account owner.

#### Scenario: Bot receives edited_business_message update

- **WHEN** the test calls `await biz.editMessage(42, 'updated text')`
- **THEN** the bot receives an `edited_business_message` update with `edited_business_message.text === 'updated text'`
- **AND** `edited_business_message.message_id === 42`
- **AND** `edited_business_message.business_connection_id === biz.connectionId`

### Requirement: `businessAccount.deleteMessages` dispatches a deleted_business_messages update

The system SHALL provide `businessAccount.deleteMessages(messageIds, options?)` that constructs a `deleted_business_messages` update. `messageIds` SHALL be an array of message IDs. The `deleted_business_messages.message_ids` SHALL equal the supplied array. `business_connection_id` and `chat` SHALL be set from the account context.

#### Scenario: Bot receives deleted_business_messages update

- **WHEN** the test calls `await biz.deleteMessages([10, 11, 12])`
- **THEN** the bot receives a `deleted_business_messages` update with `deleted_business_messages.message_ids` equal to `[10, 11, 12]`
- **AND** `deleted_business_messages.business_connection_id === biz.connectionId`
