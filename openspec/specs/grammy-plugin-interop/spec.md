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

The system SHALL support testing bots that use `@grammyjs/parse-mode` v2. In v2, all formatting is entity-based: the `fmt` tagged template literal combined with entity tag helpers (`b`, `i`, `u`, etc.) produces a `FormattedString` object whose `.text` and `.entities` fields are passed to `ctx.reply`. There is no `parse_mode` string involved.

The testing framework is fully transparent to this pattern: every outgoing `sendMessage` call is captured normally. `Reply.text` and `Reply.entities` expose the values produced by the plugin. `Reply.parseMode` is `undefined` when using entity-based formatting.

Note: `ctx.replyWithHTML`, `ctx.replyFmt`, and `ParseModeFlavor` are v1 APIs not present in v2. Tests MUST use the v2 entity-based approach.

#### Scenario: fmt with bold marker is captured as text + bold entity

- **WHEN** a bot uses `fmt\`${b}Hello${b}, world!\``and passes`.text`/`.entities`to`ctx.reply`
- **THEN** `chats.repliesFor(user).last?.text` equals `'Hello, world!'`
- **AND** `chats.repliesFor(user).last?.entities` contains an entry with `type === 'bold'`
- **AND** `chats.repliesFor(user).last?.parseMode` is `undefined`

#### Scenario: fmt with multiple markers produces merged entities

- **WHEN** a bot uses `fmt\`${b}Important${b}: ${i}note${i}\``and replies with`.text`/`.entities`
- **THEN** `Reply.text` equals `'Important: note'`
- **AND** `Reply.entities` contains both a `'bold'` and an `'italic'` entry

### Requirement: @grammyjs/chat-members works with joinChat / leaveChat

The system SHALL support testing bots that use `@grammyjs/chat-members`. The `user.joinChat` and `user.leaveChat` verbs SHALL dispatch the correct service message updates that the plugin uses to track chat membership. The plugin's session state SHALL be inspectable via `mockChatSession`.

#### Scenario: chat-members plugin tracks a user join

- **WHEN** `user.joinChat(group)` is dispatched
- **AND** the bot has `@grammyjs/chat-members` installed
- **THEN** the plugin's session records the user as a current member

#### Scenario: chat-members plugin tracks a user leave

- **WHEN** `user.leaveChat(group)` is dispatched after a join
- **THEN** the plugin's session records the user as having left

### Requirement: @grammyjs/files transformer runs and hydrates responses

The system SHALL support testing bots that use `@grammyjs/files`. When `hydrateFiles(token)` is installed via `bot.api.config.use()` before `prepareBot`, the transformer SHALL run during tests and add `getUrl()` and `download()` methods to `File` response objects. The default `buildDefaultResponses` for `getFile` SHALL return a realistic `File` shape so that `hydrateFiles` has a valid object to hydrate without requiring users to provide a custom `responses` override.

#### Scenario: getFile response is hydrated by hydrateFiles

- **WHEN** a bot installs `bot.api.config.use(hydrateFiles(bot.token))` before `prepareBot`
- **AND** a handler calls `ctx.getFile()`
- **THEN** the returned object has a `getUrl()` method
- **AND** calling `file.getUrl()` returns a valid HTTPS URL string

#### Scenario: Default getFile response has realistic File shape

- **WHEN** no custom `responses` override is provided for `getFile`
- **AND** a bot calls `ctx.getFile()` or `bot.api.getFile(fileId)`
- **THEN** the response object has `file_id`, `file_unique_id`, `file_size`, and `file_path` fields

#### Scenario: files plugin test passes without custom responses override

- **WHEN** a bot uses `@grammyjs/files` with the default library setup
- **AND** no explicit `getFile` response override is provided to `prepareBot`
- **THEN** the test passes and `file.getUrl()` is callable

### Requirement: @grammyjs/hydrate transformer runs and augments context

The system SHALL support testing bots that use `@grammyjs/hydrate`. When `hydrateApi()` is installed as bot-level middleware AND `hydrate()` is used as context middleware, both paths SHALL run during tests. API method responses SHALL be augmented with convenience methods (`delete()`, `edit()`, etc.) that proxy back to `ctx.api`.

#### Scenario: Hydrated message has delete() method

- **WHEN** a bot installs `@grammyjs/hydrate` and calls `ctx.reply()`
- **THEN** the returned message object has a `delete()` method
- **AND** calling `message.delete()` dispatches `deleteMessage` to the test API

#### Scenario: Bot-level hydrateApi transformer runs before prepareBot

- **WHEN** `bot.api.config.use(hydrateApi())` is installed before `prepareBot`
- **AND** the bot calls `bot.api.sendMessage()`
- **THEN** the returned object is hydrated with `delete()` / `edit()` methods

### Requirement: @grammyjs/auto-retry transformer runs and retries on configured errors

The system SHALL support testing bots that use `@grammyjs/auto-retry`. When `autoRetry()` is installed via `bot.api.config.use()` before `prepareBot`, the transformer SHALL run during tests. If the library returns a simulated error response (e.g., a 429 Too Many Requests), `autoRetry` SHALL retry the call as it would in production.

#### Scenario: autoRetry retries on simulated 429 response

- **WHEN** a bot installs `bot.api.config.use(autoRetry({ maxRetryAttempts: 1 }))` before `prepareBot`
- **AND** the test uses `failNext('sendMessage', { error_code: 429, ... })`
- **AND** a second valid response is queued via `respondNext('sendMessage', ...)`
- **THEN** the bot's handler completes successfully after one retry

#### Scenario: autoRetry error is observable when maxRetryAttempts is exceeded

- **WHEN** `autoRetry({ maxRetryAttempts: 1 })` is installed
- **AND** two consecutive 429 responses are queued
- **THEN** the handler throws a GrammyError indicating retries were exhausted

### Requirement: @grammyjs/chat-members hydrateChatMember() transformer runs and augments API results

The system SHALL support the `hydrateChatMember()` API transformer from `@grammyjs/chat-members`. When `hydrateChatMember()` is installed via `bot.api.config.use()` before `prepareBot`, the transformer SHALL run during tests and add an `.is(query)` method to `getChatMember` and `getChatAdministrators` response objects. The existing realistic default responses for those methods are sufficient for hydration without a custom `responses` override.

#### Scenario: getChatMember result has .is() method

- **WHEN** a bot installs `bot.api.config.use(hydrateChatMember())` before `prepareBot`
- **AND** a handler calls `bot.api.getChatMember(chatId, userId)`
- **THEN** the returned object has an `.is(query)` method
- **AND** calling `.is('member')` on a member result returns `true`

#### Scenario: getChatAdministrators results each have .is() method

- **WHEN** `hydrateChatMember()` is installed before `prepareBot`
- **AND** a handler calls `bot.api.getChatAdministrators(chatId)`
- **THEN** each item in the returned array has an `.is(query)` method

### Requirement: Custom payload-modifying transformers run before the library mock

The system SHALL support custom transformers that mutate outgoing API request payloads. When a transformer is installed via `bot.api.config.use()` before `prepareBot`, it SHALL run and its payload modifications SHALL be visible in `chats.outgoing.requests`.

#### Scenario: Custom request mutator modifies payload captured by the library

- **WHEN** a transformer adds `disable_notification: true` to every `sendMessage` payload
- **AND** the bot calls `ctx.reply()`
- **THEN** `chats.outgoing.requests` includes a `sendMessage` call with `disable_notification: true`

#### Scenario: Custom response augmenter runs after the library mock

- **WHEN** a transformer wraps the result of `prev()` and adds a custom field
- **AND** the handler reads that field from the API response
- **THEN** the custom field is present on the response object
