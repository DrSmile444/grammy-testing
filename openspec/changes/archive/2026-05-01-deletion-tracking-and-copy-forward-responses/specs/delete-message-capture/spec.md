## ADDED Requirements

### Requirement: `chats.deletionsFor(chat)` returns a per-chat deletion log

The system SHALL provide `chats.deletionsFor(chat)` returning a `DeletionsLog` that captures every `deleteMessage` API call routed to that chat. Routing SHALL be resolved by reading the `chat_id` from the outgoing `deleteMessage` payload and looking up the registered chat. `DeletionsLog` SHALL expose `.all` (read-only array of `Deletion` objects), `.length` (number), `.last` (`Deletion | undefined`), and `.lastOrThrow()` (throws when empty). `Deletion` SHALL expose `messageId` (the `message_id` from the payload as `number`), `reply` (`Reply<TContext> | undefined` — resolved from the `messageIdToReply` registry, `undefined` if the message was not captured during this test), and `raw` (the full captured payload as `Record<string, unknown>`). Calling `chats.deletionsFor(chat)` for a chat not registered with this `Chats` instance SHALL throw an `Error`. `DeletionsLog` SHALL also expose `.clear()` to reset the log.

#### Scenario: Captures a deleteMessage call in a group chat

- **WHEN** the bot calls `ctx.api.deleteMessage(group.id, messageId)` inside a handler
- **AND** the test awaits idle
- **THEN** `chats.deletionsFor(group).length` equals `1`
- **AND** `chats.deletionsFor(group).last?.messageId` equals the deleted `messageId`

#### Scenario: Captures multiple deletions in order

- **WHEN** the bot deletes two messages in the same chat
- **THEN** `chats.deletionsFor(chat).all` has length `2`
- **AND** the entries appear in dispatch order

#### Scenario: `reply` is populated when the deleted message was captured during the test

- **WHEN** the bot sends a message (captured as a `Reply`) and then deletes it using `reply.messageId`
- **THEN** `chats.deletionsFor(chat).last?.reply` equals the original `Reply` object
- **AND** `chats.deletionsFor(chat).last?.reply?.text` equals the sent text

#### Scenario: `reply` is undefined for pre-test message IDs

- **WHEN** the bot deletes a message whose ID was not captured during the current test
- **THEN** `chats.deletionsFor(chat).last?.reply` is `undefined`
- **AND** `chats.deletionsFor(chat).last?.messageId` equals the deleted ID

#### Scenario: Captures deleteMessage in a private chat (DM)

- **WHEN** the bot deletes one of its own messages in a private chat with a user
- **THEN** `chats.deletionsFor(privateChat).length` equals `1`

#### Scenario: `lastOrThrow` throws when the deletion log is empty

- **WHEN** no `deleteMessage` calls have been made for the chat
- **THEN** `chats.deletionsFor(chat).lastOrThrow()` throws an `Error`

#### Scenario: Throws for an unregistered chat

- **WHEN** the test calls `chats.deletionsFor(unknownChat)` where `unknownChat` was not minted by this `Chats` instance
- **THEN** an `Error` is thrown

#### Scenario: Deletions in different chats are tracked independently

- **WHEN** the bot deletes a message in `groupA` and a different message in `groupB`
- **THEN** `chats.deletionsFor(groupA).length` equals `1`
- **AND** `chats.deletionsFor(groupB).length` equals `1`
- **AND** `chats.deletionsFor(groupA).last?.messageId` does not equal `chats.deletionsFor(groupB).last?.messageId`
