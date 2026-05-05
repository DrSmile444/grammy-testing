## ADDED Requirements

### Requirement: `user.replies` shorthand delegates to the user's inbox

The system SHALL expose a `replies` getter on `User<TContext>` that returns the `RepliesInbox<TContext>` associated with this user. The inbox SHALL be the same live object that `chats.repliesFor(user)` returns; accessing `user.replies` multiple times SHALL return the same reference. The getter SHALL be available immediately after the user is minted via `chats.newUser()`.

#### Scenario: user.replies returns the same inbox as chats.repliesFor

- **WHEN** the test mints `const user = chats.newUser()`
- **THEN** `user.replies` is strictly equal to `chats.repliesFor(user)`

#### Scenario: user.replies reflects replies captured after minting

- **WHEN** the test sends a message that causes the bot to reply
- **AND** the test has awaited `chats.idle()`
- **THEN** `user.replies.length` equals the number of replies the bot sent to that user
- **AND** `user.replies.last` is the most recently captured reply

#### Scenario: user.replies.all returns all replies in dispatch order

- **WHEN** the bot sends two replies to the same user
- **THEN** `user.replies.all` has length 2
- **AND** `user.replies.all[0]` is the first reply sent
- **AND** `user.replies.all[1]` is the second reply sent
