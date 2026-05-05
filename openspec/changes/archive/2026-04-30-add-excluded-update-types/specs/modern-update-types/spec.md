## ADDED Requirements

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

## REMOVED Requirements

### Requirement: Business API update types are intentionally out of scope

**Reason**: Business API dispatch verbs are now provided via the `BusinessAccount` actor. The exclusion no longer applies.
**Migration**: Use `chats.newBusinessAccount(user)` to obtain a `BusinessAccount` instance and call `connect`, `sendMessage`, `editMessage`, `deleteMessages`, or `disconnect` as needed.
