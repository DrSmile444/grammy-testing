## ADDED Requirements

### Requirement: `RepliesInbox.lastOrThrow()` returns the last reply or throws

The system SHALL provide a `lastOrThrow()` method on `RepliesInbox<TContext>` that returns the last captured reply as `Reply<TContext>` (non-nullable). If the inbox is empty, the method SHALL throw an `Error` with the message `"Expected a reply but the reply collection is empty"`. The method SHALL never return `undefined`.

#### Scenario: lastOrThrow returns last reply when inbox is non-empty

- **WHEN** the bot has sent at least one reply to the user
- **THEN** `user.replies.lastOrThrow()` returns the last `Reply<TContext>` instance
- **AND** the return type is `Reply<TContext>` (not `Reply<TContext> | undefined`)

#### Scenario: lastOrThrow throws when inbox is empty

- **WHEN** no replies have been sent to the user
- **THEN** calling `user.replies.lastOrThrow()` throws an `Error`
- **AND** the error message is `"Expected a reply but the reply collection is empty"`

#### Scenario: lastOrThrow is equivalent to last when inbox is non-empty

- **WHEN** the inbox contains at least one reply
- **THEN** `user.replies.lastOrThrow()` returns the same object as `user.replies.last`
