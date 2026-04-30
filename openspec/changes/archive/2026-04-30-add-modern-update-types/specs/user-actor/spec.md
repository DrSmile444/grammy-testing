## ADDED Requirements

### Requirement: `user.reactTo` is a verb on the User actor

`user.reactTo(reply, reaction)` SHALL be available on every `User` instance. See the `modern-update-types` capability spec for the full behavioral requirement and scenarios.

#### Scenario: reactTo is callable on a User

- **WHEN** a `User` is minted via `chats.newUser()`
- **THEN** `user.reactTo` is a callable async method

### Requirement: `user.answerPoll` is a verb on the User actor

`user.answerPoll(reply, optionIndices)` SHALL be available on every `User` instance.

#### Scenario: answerPoll is callable on a User

- **WHEN** a `User` is minted via `chats.newUser()`
- **THEN** `user.answerPoll` is a callable async method

### Requirement: `user.requestJoin` is a verb on the User actor

`user.requestJoin(group)` SHALL be available on every `User` instance for `Group` and `Supergroup` targets.

#### Scenario: requestJoin is callable on a User

- **WHEN** a `User` is minted via `chats.newUser()`
- **THEN** `user.requestJoin` is a callable async method

### Requirement: `user.boostChat` and `user.removeBoost` are verbs on the User actor

`user.boostChat(chat)` SHALL return `Promise<string>` (the boost_id). `user.removeBoost(chat, boostId)` SHALL return `Promise<void>`.

#### Scenario: boostChat returns a string boost_id

- **WHEN** `await user.boostChat(group)` is called
- **THEN** the return value is a non-empty string
