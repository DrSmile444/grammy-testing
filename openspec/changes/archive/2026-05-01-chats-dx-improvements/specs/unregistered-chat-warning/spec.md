## ADDED Requirements

### Requirement: Warn when a message method targets an unregistered chat

When the `Chats` orchestrator processes a captured API call whose `chat_id` does not correspond to any registered chat, it SHALL emit a `console.warn` message describing the situation. The warning SHALL be emitted for the following method families:
- Message-sending methods (`sendMessage`, `sendPhoto`, etc.)
- Chat action methods (`sendChatAction`)
- Delete methods (`deleteMessage`)

The warning message SHALL include the API method name and the unregistered chat ID. It SHALL reference the corrective action (registering the chat) and how to suppress the warning.

The warning SHALL NOT be emitted for `editMessage*` methods targeting unknown message IDs — that is intentional documented behavior (edits to pre-test messages are silently skipped).

#### Scenario: Warning fires when sendMessage targets unknown chat

- **WHEN** a bot calls `sendMessage` with a `chat_id` not registered with the `Chats` instance
- **THEN** a `console.warn` is emitted containing the method name and chat ID
- **AND** the call is still captured in `chats.outgoing`
- **AND** no error is thrown

#### Scenario: Warning fires for sendChatAction to unknown chat

- **WHEN** a bot calls `sendChatAction` with an unregistered `chat_id`
- **THEN** a `console.warn` is emitted

#### Scenario: Warning fires for deleteMessage to unknown chat

- **WHEN** a bot calls `deleteMessage` with an unregistered `chat_id`
- **THEN** a `console.warn` is emitted

#### Scenario: No warning for editMessage to unknown message ID

- **WHEN** a bot calls `editMessageText` with a `message_id` not captured during the test
- **THEN** no `console.warn` is emitted
- **AND** the edit is silently skipped

### Requirement: `warnOnUnregisteredChats` option suppresses the warning

Each entry point (`prepareBot`, `prepareComposer`, `prepareMiddleware`) SHALL accept a `warnOnUnregisteredChats: boolean` option (default `true`). When set to `false`, no `console.warn` is emitted for unregistered chat targets.

#### Scenario: Warning suppressed when option is false

- **WHEN** `prepareBot(bot, { warnOnUnregisteredChats: false })` is called
- **AND** the bot sends a message to an unregistered chat ID
- **THEN** no `console.warn` is emitted
- **AND** the call is still captured in `chats.outgoing`

#### Scenario: Default is warn-on

- **WHEN** `prepareBot(bot)` is called with no options
- **AND** the bot sends a message to an unregistered chat ID
- **THEN** a `console.warn` is emitted
