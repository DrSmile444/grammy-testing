# message-edits-capture Specification

## Purpose

Defines per-user capture of `editMessage*` API calls via `chats.editsFor(user)`.

## Requirements

### Requirement: `chats.editsFor(user)` returns a per-user edit log

The system SHALL provide `chats.editsFor(user)` returning an `EditsLog` that captures every `editMessageText`, `editMessageCaption`, and `editMessageMedia` API call routed to that user. Routing SHALL be resolved by looking up the `message_id` from the edit payload in the `messageIdToReply` registry to determine the target chat, then applying the same membership logic as `chats.repliesFor`. Edit calls whose `message_id` does not match any previously-captured reply SHALL be silently skipped. `EditsLog` SHALL expose `.all` (read-only array of `Edit` objects), `.length` (number), `.last` (`Edit | undefined`), and `.lastOrThrow()` (throws when empty). `Edit` SHALL expose `text` (`string | undefined`), `editedMessageId` (the `message_id` from the payload), and `raw` (the full captured payload as `Record<string, unknown>`). Calling `chats.editsFor(user)` for a user not minted by this `Chats` instance SHALL throw an `Error`.

#### Scenario: Captures editMessageText for a previously sent reply

- **WHEN** the bot sends a message and the test edits it via `bot.api.editMessageText` using the reply's synthetic `messageId`
- **AND** the test has awaited `chats.idle()` after both calls
- **THEN** `chats.editsFor(user).length` equals `1`
- **AND** `chats.editsFor(user).last?.text` equals the edited text

#### Scenario: Captures multiple edits in order

- **WHEN** the bot edits the same message twice with different text
- **THEN** `chats.editsFor(user).all` has length `2`
- **AND** `chats.editsFor(user).all[0].text` is the first edit text
- **AND** `chats.editsFor(user).all[1].text` is the second edit text

#### Scenario: Silently skips edits to unknown message IDs

- **WHEN** the bot calls `editMessageText` with a `message_id` that was not captured during the test
- **THEN** `chats.editsFor(user).length` equals `0`
- **AND** no error is thrown

#### Scenario: Edit captures editedMessageId linking back to original reply

- **WHEN** the bot sends a reply and the test edits it
- **THEN** `chats.editsFor(user).last?.editedMessageId` equals the `messageId` of the original `Reply` in `user.replies`

#### Scenario: EditsLog.lastOrThrow throws when log is empty

- **WHEN** no edits have been captured for the user
- **THEN** calling `chats.editsFor(user).lastOrThrow()` throws an `Error`

#### Scenario: Throws for unknown user

- **WHEN** the test calls `chats.editsFor(unknownUser)` where `unknownUser` was not minted by this `Chats` instance
- **THEN** an `Error` is thrown
