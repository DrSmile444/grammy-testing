# guest-mode Specification

## Purpose

TBD - created by archiving change support-bot-api-10. Update Purpose after archive.

## Requirements

### Requirement: `user.sendGuestMessage` dispatches a guest_message update and returns the query id

The system SHALL provide `user.sendGuestMessage(chat, text?, options?)` that synthesizes an
`Update` with a `guest_message` field and dispatches it via `bot.handleUpdate`. The
`guest_message` SHALL be a `Message`-shaped object whose `from` reflects the calling user, whose
`chat` reflects the supplied `chat`, and which carries a non-empty `guest_query_id` string. The
method SHALL generate the `guest_query_id` and SHALL return it so callers can correlate the
bot's `answerGuestQuery` call, matching the convention of `user.boostChat` returning its
`boost_id`.

#### Scenario: Guest message dispatch returns the query id

- **WHEN** the test calls `const queryId = await user.sendGuestMessage(group, 'hi')`
- **THEN** the bot receives a `guest_message` update with `from.id === user.id`
- **AND** `update.guest_message.chat.id === group.id`
- **AND** `update.guest_message.guest_query_id` equals the returned `queryId`
- **AND** `queryId` is a non-empty string

#### Scenario: Guest message carries the supplied text

- **WHEN** the test calls `await user.sendGuestMessage(group, 'need help')`
- **THEN** the bot receives a `guest_message` update with `text === 'need help'`

### Requirement: `answerGuestQuery` resolves with a synthetic `SentGuestMessage`

The transformer SHALL resolve `answerGuestQuery` with a `SentGuestMessage`-shaped object
(`{ inline_message_id: string }`) by default when no user-supplied `responses.answerGuestQuery`
entry is present, where `inline_message_id` is a synthetic non-empty string. `answerGuestQuery`
SHALL NOT be treated as a chat message-sending method: it SHALL NOT push a `Reply` to
`chat.messages` or any `user.replies` inbox.

#### Scenario: answerGuestQuery returns a synthetic inline_message_id

- **WHEN** the bot calls `ctx.api.answerGuestQuery({ guest_query_id, result })`
- **AND** no `responses.answerGuestQuery` entry is configured
- **THEN** the resolved result has a non-empty string `inline_message_id`

#### Scenario: answerGuestQuery does not appear in chat.messages

- **WHEN** the bot answers a guest query targeting a registered group
- **THEN** `group.messages.length` is unchanged by the `answerGuestQuery` call

### Requirement: Guest queries are correlated to the originating user

The orchestrator SHALL track the mapping from each generated `guest_query_id` to the `User` that
dispatched it (via `user.sendGuestMessage`), analogous to the existing `messageIdToReply`
registry. The system SHALL expose this correlation so a test can assert that the bot's captured
`answerGuestQuery` call carries the `guest_query_id` belonging to a specific user.

#### Scenario: Bot answers the correct guest's query

- **WHEN** `userA` and `userB` each call `sendGuestMessage`, yielding `queryIdA` and `queryIdB`
- **AND** the bot calls `answerGuestQuery({ guest_query_id: queryIdA, result })`
- **THEN** the captured `answerGuestQuery` request in `chats.outgoing` carries `queryIdA`
- **AND** the correlation resolves `queryIdA` to `userA`
