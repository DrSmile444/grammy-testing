## ADDED Requirements

### Requirement: grammy-media-groups mediaGroupTransformer is a supported plugin

The system SHALL support `grammy-media-groups` as a tested and documented plugin. `mediaGroupTransformer(adapter)` installed via `bot.api.config.use()` before `prepareBot` SHALL run during tests and receive synthetic `sendMediaGroup` responses with sufficient shape for the transformer to store messages correctly.

#### Scenario: grammy-media-groups appears in the plugin interop table

- **WHEN** the README plugin interop table is viewed
- **THEN** `grammy-media-groups` is listed with install pattern `bot.api.config.use(mediaGroupTransformer(...))` and supported since v0.24.0
