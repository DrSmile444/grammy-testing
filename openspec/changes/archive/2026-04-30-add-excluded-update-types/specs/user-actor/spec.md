## ADDED Requirements

### Requirement: `user.purchasePaidMedia` dispatches a purchased_paid_media update

The system SHALL provide `user.purchasePaidMedia(payload, options?)` that constructs a `purchased_paid_media` update with `from` set to the calling user and `paid_media_payload` set to the supplied `payload` string. The method SHALL dispatch via `bot.handleUpdate` and resolve once the middleware chain settles.

#### Scenario: Bot receives purchased_paid_media update

- **WHEN** the test calls `await user.purchasePaidMedia('payload-token-abc')`
- **THEN** the bot receives a `purchased_paid_media` update with `purchased_paid_media.paid_media_payload === 'payload-token-abc'`
- **AND** `purchased_paid_media.from.id === user.id`

### Requirement: `user.manageBot` dispatches a managed_bot update

The system SHALL provide `user.manageBot(botUser, options?)` that constructs a `managed_bot` update. `botUser` SHALL be a plain object with at minimum `id` and `first_name` fields. The synthesized update SHALL set `managed_bot.user` to the calling user's profile and `managed_bot.bot` to a bot user derived from `botUser` (with `is_bot: true`).

#### Scenario: Bot receives managed_bot update

- **WHEN** the test calls `await user.manageBot({ id: 99999, first_name: 'MyBot' })`
- **THEN** the bot receives a `managed_bot` update with `managed_bot.user.id === user.id`
- **AND** `managed_bot.bot.id === 99999`
- **AND** `managed_bot.bot.is_bot === true`
