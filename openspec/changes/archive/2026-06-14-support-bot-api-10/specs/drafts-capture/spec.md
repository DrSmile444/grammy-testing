## ADDED Requirements

### Requirement: Draft sends are captured into a drafts projection

When the bot calls `sendMessageDraft` or `sendRichMessageDraft`, the system SHALL record each
call into a drafts projection in dispatch order, keyed by target chat. The projection SHALL be
readable via `chats.draftsFor(chatOrUser)` (and the per-user view `user.drafts`). Each captured
draft entry SHALL expose at minimum the `method`, the target `chat_id`, and the outgoing
`payload`. Drafts SHALL NOT be pushed to `chat.messages` or `user.replies`, because draft sends
do not produce a `Message`.

#### Scenario: A draft send appears in the drafts projection

- **WHEN** the bot calls `ctx.api.sendMessageDraft({ chat_id, text: 'typing…' })`
- **THEN** `user.drafts.length` increases by `1`
- **AND** `user.drafts.last.payload.text` equals `'typing…'`

#### Scenario: A streaming sequence of drafts is captured in order

- **WHEN** the bot sends three `sendRichMessageDraft` calls in sequence
- **THEN** `chats.draftsFor(user).length` equals `3`
- **AND** the entries appear in dispatch order

#### Scenario: Drafts do not pollute the messages log

- **WHEN** the bot sends a draft targeting a registered private chat
- **THEN** `chat.messages.length` is unchanged

### Requirement: Draft methods resolve with `true` by default

The transformer SHALL resolve `sendMessageDraft` and `sendRichMessageDraft` with `true` by default
when no user-supplied `responses` entry is present, matching the Telegram Bot API return type. No
synthetic `Message` SHALL be generated for draft sends.

#### Scenario: sendRichMessageDraft resolves with true

- **WHEN** the bot calls `ctx.api.sendRichMessageDraft({ chat_id, ...{ html: '<b>x</b>' } })`
- **AND** no `responses.sendRichMessageDraft` entry is configured
- **THEN** the resolved result is `true`
