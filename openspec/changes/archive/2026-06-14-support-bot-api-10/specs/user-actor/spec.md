## MODIFIED Requirements

### Requirement: `user.requestJoin` is a verb on the User actor

`user.requestJoin(group)` SHALL be available on every `User` instance for `Group` and
`Supergroup` targets. It SHALL return the `query_id` (a non-empty string) of the dispatched
`chat_join_request`.

#### Scenario: requestJoin is callable on a User

- **WHEN** a `User` is minted via `chats.newUser()`
- **THEN** `user.requestJoin` is a callable async method

#### Scenario: requestJoin resolves to a query_id string

- **WHEN** a test awaits `user.requestJoin(group)`
- **THEN** the resolved value is a non-empty string

## ADDED Requirements

### Requirement: `user.sendGuestMessage` is a verb on the User actor

`user.sendGuestMessage(chat, text?, options?)` SHALL be available on every `User` instance. It
SHALL dispatch a `guest_message` update and SHALL resolve to the generated `guest_query_id`
string (see the `guest-mode` capability for dispatch and correlation behavior).

#### Scenario: sendGuestMessage is callable on a User

- **WHEN** a `User` is minted via `chats.newUser()`
- **THEN** `user.sendGuestMessage` is a callable async method that resolves to a string
