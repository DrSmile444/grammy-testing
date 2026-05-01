## ADDED Requirements

### Requirement: `chats.clear()` atomically resets all captured state

The `Chats` class SHALL expose a `clear()` method that atomically resets all captured log state in a single call. The reset SHALL include:
- `chats.outgoing` — all raw captured API call records
- Every registered user's `replies` inbox, `actions` log, and `edits` log
- Every registered chat's `messages` log
- Every registered chat's `DeletionsLog`
- The `messageIdToReply` routing registry
- The `clickers` routing registry
- The `lastCapturedReply` transient field

The reset SHALL NOT clear:
- The `users` map (user references stay valid)
- The `chats` map (chat references stay valid)
- Membership records on any chat
- The `IdGenerator` state (IDs continue incrementing across tests)

#### Scenario: Single call resets all logs

- **WHEN** a test sends a message, triggers an edit, a deletion, and a chat action, then calls `chats.clear()`
- **THEN** `chats.outgoing.all` is empty
- **AND** `user.replies.length` is `0`
- **AND** `chats.actionsFor(user).all` is empty
- **AND** `chats.editsFor(user).all` is empty
- **AND** `chats.deletionsFor(chat).all` is empty
- **AND** `chat.messages.all` is empty

#### Scenario: User and chat references remain valid after clear

- **WHEN** a test calls `chats.clear()`
- **THEN** the existing `user` variable still works as a sender in subsequent `sendText` calls
- **AND** the existing `group` variable still works as a target chat
- **AND** membership records (e.g., `user.in(group).status`) are unchanged

#### Scenario: Individual log clears still work alongside `chats.clear()`

- **WHEN** a test calls `user.replies.clear()` directly
- **THEN** only `user.replies` is emptied
- **AND** `chats.outgoing` and other logs are unaffected
- **AND** calling `chats.clear()` afterwards still resets everything else
