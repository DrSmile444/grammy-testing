## ADDED Requirements

### Requirement: `user.reactTo` dispatches a message_reaction update

The system SHALL provide `user.reactTo(reply, reaction)` that synthesizes an `Update` with a `message_reaction` field and dispatches it via `bot.handleUpdate`. `reply` SHALL be a `Reply` instance captured from a previous outgoing API call. `reaction` SHALL accept either a `ReactionType` object or a plain emoji string (auto-wrapped as `{ type: 'emoji', emoji }`). The `old_reaction` field SHALL be `[]` and `new_reaction` SHALL be `[reaction]`.

#### Scenario: User reacts with emoji string shorthand

- **WHEN** the bot has sent a reply and the test calls `await user.reactTo(reply, '👍')`
- **THEN** the bot receives a `message_reaction` update with `new_reaction[0].emoji === '👍'`
- **AND** `update.message_reaction.message_id === reply.messageId`
- **AND** `update.message_reaction.user.id === user.id`

#### Scenario: User reacts with a full ReactionType object

- **WHEN** the test calls `await user.reactTo(reply, { type: 'emoji', emoji: '🔥' })`
- **THEN** the bot receives a `message_reaction` update with `new_reaction[0].emoji === '🔥'`

### Requirement: `user.answerPoll` dispatches a poll_answer update

The system SHALL provide `user.answerPoll(reply, optionIndices)` that dispatches a `poll_answer` update. `reply` SHALL be a `Reply` whose `raw` payload contains a `poll` object with an `id` field. `optionIndices` SHALL be an array of zero-based option indices. The method SHALL throw a descriptive error if `reply` does not contain a poll.

#### Scenario: User votes in a poll

- **WHEN** the bot sends a poll and the test calls `await user.answerPoll(pollReply, [0])`
- **THEN** the bot receives a `poll_answer` update with `option_ids === [0]`
- **AND** `update.poll_answer.user.id === user.id`

#### Scenario: Voting on a non-poll reply throws

- **WHEN** `user.answerPoll` is called with a reply that has no poll in its raw payload
- **THEN** the call throws an error describing that the reply does not contain a poll

### Requirement: `user.requestJoin` dispatches a chat_join_request update

The system SHALL provide `user.requestJoin(group)` that synthesizes a `chat_join_request` update and dispatches it. `group` SHALL be a `Group` or `Supergroup` minted by the orchestrator. The `from` field SHALL reflect the calling user. The method SHALL throw if the chat type does not support join requests (private chat or channel).

#### Scenario: User requests to join a group

- **WHEN** the test calls `await user.requestJoin(group)`
- **THEN** the bot receives a `chat_join_request` update with `from.id === user.id`
- **AND** `update.chat_join_request.chat.id === group.id`

### Requirement: `group.dispatchMemberUpdate` dispatches a chat_member update

The system SHALL provide `group.dispatchMemberUpdate(fromAdmin, targetUser, newStatus, options?)` on `Group` and `Supergroup`. This dispatches a `chat_member` update representing an admin changing another user's membership status. `old_chat_member` SHALL default to `{ status: 'member' }` and MAY be overridden via `options.oldStatus`. This is distinct from `my_chat_member` (which tracks the bot's own status).

#### Scenario: Admin promotes a user — bot observes chat_member

- **WHEN** the test calls `group.dispatchMemberUpdate(adminUser, targetUser, 'administrator')`
- **THEN** the bot receives a `chat_member` update with `new_chat_member.status === 'administrator'`
- **AND** `update.chat_member.from.id === adminUser.id`
- **AND** `update.chat_member.chat.id === group.id`

### Requirement: `channel.editPost` dispatches an edited_channel_post update

The system SHALL provide `channel.editPost(messageId, newText, options?)` that synthesizes an `edited_channel_post` update for the channel. `messageId` SHALL be the `message_id` of the original channel post.

#### Scenario: Channel post is edited

- **WHEN** the test calls `await channel.editPost(originalMessageId, 'updated text')`
- **THEN** the bot receives an `edited_channel_post` update with `text === 'updated text'`
- **AND** `update.edited_channel_post.chat.id === channel.id`
- **AND** `update.edited_channel_post.message_id === originalMessageId`

### Requirement: `user.boostChat` dispatches a chat_boost update and returns the boost_id

The system SHALL provide `user.boostChat(chat)` that synthesizes a `chat_boost` update. The boost source SHALL be `{ source: 'premium', user }`. The method SHALL return the generated `boost_id` string so callers can pass it to `user.removeBoost`.

#### Scenario: User boosts a chat

- **WHEN** the test calls `const boostId = await user.boostChat(group)`
- **THEN** the bot receives a `chat_boost` update with `boost.source.user.id === user.id`
- **AND** `boostId` is a non-empty string

### Requirement: `user.removeBoost` dispatches a removed_chat_boost update

The system SHALL provide `user.removeBoost(chat, boostId)` that synthesizes a `removed_chat_boost` update using the supplied `boostId`.

#### Scenario: User removes a boost

- **WHEN** the test calls `await user.removeBoost(group, boostId)`
- **THEN** the bot receives a `removed_chat_boost` update with `boost_id === boostId`
- **AND** `update.removed_chat_boost.chat.id === group.id`

### Requirement: `chat.dispatchReactionCount` dispatches a message_reaction_count update

The system SHALL provide `chat.dispatchReactionCount(messageId, reactions, options?)` on `Group`, `Supergroup`, and `Channel`. `reactions` SHALL be an array of `{ type: ReactionType, total_count: number }` objects passed directly by the caller. The method SHALL construct a `message_reaction_count` update with `chat`, `message_id`, `date`, and the supplied `reactions` array, then dispatch via `bot.handleUpdate`.

#### Scenario: Bot receives message_reaction_count update on a group

- **WHEN** the test calls `await group.dispatchReactionCount(100, [{ type: { type: 'emoji', emoji: '👍' }, total_count: 5 }])`
- **THEN** the bot receives a `message_reaction_count` update with `message_reaction_count.message_id === 100`
- **AND** `message_reaction_count.chat.id === group.id`
- **AND** `message_reaction_count.reactions[0].total_count === 5`

#### Scenario: Bot receives message_reaction_count update on a channel

- **WHEN** the test calls `await channel.dispatchReactionCount(200, [{ type: { type: 'emoji', emoji: '🔥' }, total_count: 12 }])`
- **THEN** the bot receives a `message_reaction_count` update with `message_reaction_count.chat.id === channel.id`
- **AND** `message_reaction_count.reactions[0].total_count === 12`

### Requirement: `chats.dispatchPollState` dispatches a poll state update

The system SHALL provide `chats.dispatchPollState(poll, options?)` on the `Chats` orchestrator. `poll` SHALL be a full `Poll` object provided by the caller. The method SHALL construct a `poll` update with the supplied object and dispatch via `bot.handleUpdate`.

#### Scenario: Bot receives autonomous poll state update

- **WHEN** the test calls `await chats.dispatchPollState({ id: 'poll-1', question: 'Favorite color?', options: [], is_closed: true, is_anonymous: true, type: 'regular', allows_multiple_answers: false, total_voter_count: 10 })`
- **THEN** the bot receives a `poll` update with `poll.id === 'poll-1'`
- **AND** `poll.is_closed === true`
- **AND** `poll.total_voter_count === 10`
