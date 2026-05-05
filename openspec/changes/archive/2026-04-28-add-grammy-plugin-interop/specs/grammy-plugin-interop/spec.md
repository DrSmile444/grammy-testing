## ADDED Requirements

### Requirement: @grammyjs/conversations works with MemorySessionStorage

The system SHALL support testing bots that use `@grammyjs/conversations`. A test SHALL be able to advance a conversation step-by-step by dispatching sequential updates and asserting on replies after each step. The recipe SHALL use `MemorySessionStorage` from grammy core (no external session store required).

#### Scenario: Multi-step conversation completes successfully

- **WHEN** a bot registers a conversation that asks for a name then echoes it
- **AND** the test dispatches `/start`, then a name text message
- **THEN** the bot's reply after step 1 asks for the name
- **AND** the bot's reply after step 2 echoes the name back

#### Scenario: Conversation state persists across dispatches

- **WHEN** the bot is mid-conversation after the first message
- **AND** a second message is dispatched in the same test
- **THEN** the conversation resumes from the correct waiting point

### Requirement: @grammyjs/menu works with reply.clickButton

The system SHALL support testing bots that use `@grammyjs/menu`. A test SHALL be able to interact with a menu by calling `reply.clickButton(matcher)` on a captured reply, which synthesizes the callback_query update that the menu plugin expects.

#### Scenario: Menu button click triggers the registered handler

- **WHEN** a bot sends a menu with an inline keyboard via `@grammyjs/menu`
- **AND** the test calls `reply.clickButton('Some Button')`
- **THEN** the menu's button handler runs
- **AND** the bot's response is observable in `chats.outgoing`

### Requirement: @grammyjs/parse-mode is transparent to the testing framework

The system SHALL support testing bots that use `@grammyjs/parse-mode`. Calling `ctx.replyWithHTML(...)` or `ctx.replyFmt(...)` SHALL produce a captured outgoing `sendMessage` call with the correct `parse_mode` and text, observable on `Reply.parseMode` and `Reply.text`.

#### Scenario: replyWithHTML is captured with correct parse_mode

- **WHEN** a bot uses `ctx.replyWithHTML('<b>hello</b>')`
- **THEN** `chats.repliesFor(user).last?.parseMode` equals `'HTML'`
- **AND** `chats.repliesFor(user).last?.text` equals `'<b>hello</b>'`

### Requirement: @grammyjs/chat-members works with joinChat / leaveChat

The system SHALL support testing bots that use `@grammyjs/chat-members`. The `user.joinChat` and `user.leaveChat` verbs SHALL dispatch the correct service message updates that the plugin uses to track chat membership. The plugin's session state SHALL be inspectable via `mockChatSession`.

#### Scenario: chat-members plugin tracks a user join

- **WHEN** `user.joinChat(group)` is dispatched
- **AND** the bot has `@grammyjs/chat-members` installed
- **THEN** the plugin's session records the user as a current member

#### Scenario: chat-members plugin tracks a user leave

- **WHEN** `user.leaveChat(group)` is dispatched after a join
- **THEN** the plugin's session records the user as having left
