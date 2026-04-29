## MODIFIED Requirements

### Requirement: @grammyjs/parse-mode is transparent to the testing framework

The system SHALL support testing bots that use `@grammyjs/parse-mode` v2. In v2, all formatting is entity-based: the `fmt` tagged template literal combined with entity tag helpers (`b`, `i`, `u`, etc.) produces a `FormattedString` object whose `.text` and `.entities` fields are passed to `ctx.reply`. There is no `parse_mode` string involved.

The testing framework is fully transparent to this pattern: every outgoing `sendMessage` call is captured normally. `Reply.text` and `Reply.entities` expose the values produced by the plugin. `Reply.parseMode` is `undefined` when using entity-based formatting.

Note: `ctx.replyWithHTML`, `ctx.replyFmt`, and `ParseModeFlavor` are v1 APIs not present in v2. Tests MUST use the v2 entity-based approach.

#### Scenario: fmt with bold marker is captured as text + bold entity

- **WHEN** a bot uses `fmt\`${b}Hello${b}, world!\`` and passes `.text` / `.entities` to `ctx.reply`
- **THEN** `chats.repliesFor(user).last?.text` equals `'Hello, world!'`
- **AND** `chats.repliesFor(user).last?.entities` contains an entry with `type === 'bold'`
- **AND** `chats.repliesFor(user).last?.parseMode` is `undefined`

#### Scenario: fmt with multiple markers produces merged entities

- **WHEN** a bot uses `fmt\`${b}Important${b}: ${i}note${i}\`` and replies with `.text` / `.entities`
- **THEN** `Reply.text` equals `'Important: note'`
- **AND** `Reply.entities` contains both a `'bold'` and an `'italic'` entry
