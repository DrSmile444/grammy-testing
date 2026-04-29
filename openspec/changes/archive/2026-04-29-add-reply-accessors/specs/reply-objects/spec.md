## MODIFIED Requirements

### Requirement: `Reply` is a normalized object derived from each message-shape outgoing call

For every captured outgoing API call whose method produces a message in a chat (`sendMessage`, `sendPhoto`, `sendDocument`, etc., or any call that produces a `Message` shape), the system SHALL derive a `Reply<TContext>` object exposing normalized accessors:

- `reply.text`: message text or caption, whichever is present.
- `reply.parseMode`: `'HTML' | 'Markdown' | 'MarkdownV2' | undefined`.
- `reply.entities`: normalized entity array.
- `reply.buttons`: flat array of inline-keyboard buttons; each entry has `text` and either `callbackData` or `url` (other button types as appropriate).
- `reply.replyMarkup`: the raw `reply_markup` object from the captured payload (`Record<string, unknown> | undefined`); escape hatch for markup types not covered by `reply.buttons`.
- `reply.chat`: the destination chat (the `Chat` object from the `chats` orchestrator if known, else the captured payload's chat).
- `reply.replyingTo`: the `Reply` object this is in reply to, if the captured payload had `reply_to_message_id`/`reply_parameters` pointing to a previously-captured outgoing reply; `undefined` when no matching Reply is found (including when replying to an incoming user message).
- `reply.raw`: the original captured outgoing payload (escape hatch for anything not normalized).

`Reply` instances SHALL be plain values (not proxies), safe to snapshot, log, and pass around.

#### Scenario: text accessor for sendMessage

- **WHEN** the bot calls `ctx.reply('welcome')`
- **THEN** the corresponding `Reply` has `reply.text === 'welcome'`

#### Scenario: parseMode accessor

- **WHEN** the bot calls `ctx.reply('<b>bold</b>', { parse_mode: 'HTML' })`
- **THEN** the corresponding `Reply.parseMode === 'HTML'`

#### Scenario: replyMarkup accessor exposes raw markup

- **WHEN** the bot sends a message with an inline keyboard via `ctx.reply('pick', { reply_markup: keyboard })`
- **THEN** `reply.replyMarkup` is a non-null object
- **AND** `reply.replyMarkup` equals the raw `reply_markup` value from the captured payload

#### Scenario: replyMarkup is undefined for plain text replies

- **WHEN** the bot calls `ctx.reply('hello')` with no reply_markup
- **THEN** `reply.replyMarkup` is `undefined`

#### Scenario: replyingTo resolves to the referenced Reply

- **WHEN** the bot sends reply A (e.g. a message with `message_id` X)
- **AND** the bot sends reply B with `reply_parameters: { message_id: X }`
- **THEN** `replyB.replyingTo` is the same object as reply A
- **AND** `replyB.replyingTo?.messageId` equals `replyA.messageId`

#### Scenario: replyingTo is undefined when replying to an incoming user message

- **WHEN** the bot calls `ctx.reply('hi')` in response to a user's incoming message
- **THEN** `reply.replyingTo` is `undefined` (the user's incoming message is not a captured Reply)
