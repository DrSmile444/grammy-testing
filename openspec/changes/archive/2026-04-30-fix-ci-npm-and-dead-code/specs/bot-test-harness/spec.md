## ADDED Requirements

### Requirement: `IdGenerator` provides instance-scoped message IDs

`IdGenerator` SHALL expose a `nextMessageId(): number` method that returns monotonically increasing integers starting at `1`. This counter SHALL be separate from the update-ID counter (`nextUpdateId()`, which starts at `1_000_000`) so that message IDs and update IDs occupy distinct numeric ranges and cannot collide in test assertions.

`Channel.postMessageTo` SHALL use `ids.nextMessageId()` as the default `message_id` when no explicit `messageId` override is provided in options. It SHALL NOT reuse `nextUpdateId()` for this purpose.

#### Scenario: nextMessageId returns values starting at 1

- **WHEN** a test calls `ids.nextMessageId()` on a fresh `IdGenerator` instance
- **THEN** the first call returns `1`
- **AND** each subsequent call returns a value incremented by 1

#### Scenario: message ID and update ID counters are independent

- **WHEN** a test calls `ids.nextUpdateId()` multiple times then calls `ids.nextMessageId()`
- **THEN** the message ID returned is not influenced by how many update IDs were previously generated
- **AND** both counters continue to increment independently

#### Scenario: Channel.postMessageTo default message ID uses nextMessageId

- **WHEN** the test calls `channel.postMessageTo(group, 'hello')` without a `messageId` option
- **THEN** the dispatched update's `message.message_id` is a small integer (in the 1-based range, not the 1,000,000+ update-ID range)

### Requirement: `Chats.dispatchPollState` has no module-level or unused instance counter

`Chats` SHALL NOT declare a `pollStateCounter` field. The update ID for `dispatchPollState` SHALL be generated exclusively via `this.ids.nextUpdateId()` (or an explicit `options.updateId` override). No intermediate counter SHALL be incremented as a side effect of the call.

#### Scenario: pollStateCounter does not exist on Chats instances

- **WHEN** TypeScript compiles the `Chats` class
- **THEN** there is no `pollStateCounter` property declared on the class
- **AND** `dispatchPollState` still dispatches a unique update ID on every call
