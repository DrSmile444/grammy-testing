## ADDED Requirements

### Requirement: grammy-media-groups mediaGroupTransformer runs and stores sent messages

The system SHALL support testing bots that use `grammy-media-groups`. When `mediaGroupTransformer(adapter)` is installed via `bot.api.config.use()` before `prepareBot`, the transformer SHALL run during tests and store messages returned by `sendMediaGroup` in the provided adapter, keyed by `media_group_id`. The library's default `sendMediaGroup` response SHALL include `chat` and `media_group_id` fields so the transformer can group and store messages without requiring a custom `responses` override.

#### Scenario: sendMediaGroup response is stored by mediaGroupTransformer

- **WHEN** a bot installs `bot.api.config.use(mediaGroupTransformer(adapter))` before `prepareBot`
- **AND** a handler calls `ctx.api.sendMediaGroup(chatId, media)`
- **THEN** the adapter contains an entry keyed by the response messages' `media_group_id`
- **AND** the stored array is non-empty

#### Scenario: Stored messages have chat.id accessible

- **WHEN** `mediaGroupTransformer(adapter)` is installed and `sendMediaGroup` is called
- **THEN** each stored message has a `chat.id` field
- **AND** the stored messages are deduplication-safe (no duplicate `message_id` per `chat.id`)

#### Scenario: Test passes without a custom responses override

- **WHEN** `grammy-media-groups` is installed with the default library setup
- **AND** no explicit `sendMediaGroup` response override is provided to `prepareBot`
- **THEN** the transformer stores messages correctly and the test passes
