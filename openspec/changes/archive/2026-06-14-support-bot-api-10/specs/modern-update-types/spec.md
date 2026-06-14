## MODIFIED Requirements

### Requirement: `user.requestJoin` dispatches a chat_join_request update

The system SHALL provide `user.requestJoin(group)` that synthesizes a `chat_join_request` update
and dispatches it. `group` SHALL be a `Group` or `Supergroup` minted by the orchestrator. The
`from` field SHALL reflect the calling user. The method SHALL throw if the chat type does not
support join requests (private chat or channel). The synthesized `chat_join_request` SHALL carry
a non-empty `query_id` string (Bot API 10.1), and `user.requestJoin` SHALL return that `query_id`
so callers can correlate the bot's `answerChatJoinRequestQuery` call.

#### Scenario: User requests to join a group

- **WHEN** the test calls `await user.requestJoin(group)`
- **THEN** the bot receives a `chat_join_request` update with `from.id === user.id`
- **AND** `update.chat_join_request.chat.id === group.id`

#### Scenario: requestJoin emits and returns a query_id

- **WHEN** the test calls `const queryId = await user.requestJoin(group)`
- **THEN** `update.chat_join_request.query_id` equals the returned `queryId`
- **AND** `queryId` is a non-empty string
