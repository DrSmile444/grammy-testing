# rich-messages Specification

## Purpose

TBD - created by archiving change support-bot-api-10. Update Purpose after archive.

## Requirements

### Requirement: `reply.richMessage` exposes the sent input rich message

For a captured `Reply` produced by `sendRichMessage` or `sendRichMessageDraft`, the system SHALL
provide a `reply.richMessage` accessor that returns the `InputRichMessage` the bot sent —
`{ html?, markdown?, is_rtl?, skip_entity_detection? }` — read from the outgoing payload. For any
other reply, `reply.richMessage` SHALL be `undefined`, consistent with the existing
optional-accessor pattern (e.g. `reply.text` is `undefined` for a forward).

#### Scenario: richMessage returns the sent html content

- **WHEN** the bot calls `ctx.api.sendRichMessage({ chat_id, ...{ html: '<b>hi</b>' } })`
- **THEN** `reply.richMessage.html` equals `'<b>hi</b>'`

#### Scenario: richMessage is undefined for a plain text reply

- **WHEN** the bot calls `ctx.reply('hi')`
- **THEN** `reply.richMessage` is `undefined`

### Requirement: `reply.richMessage.plainText` flattens the rich content

The `reply.richMessage` value SHALL provide a `plainText` convenience that returns the sent
`html ?? markdown` text with its formatting markup stripped, for simple text assertions. When
neither `html` nor `markdown` is present, `plainText` SHALL be the empty string.

#### Scenario: plainText strips html tags

- **WHEN** the bot sends a rich message with `html: '<b>hello</b> <i>world</i>'`
- **THEN** `reply.richMessage.plainText` equals `'hello world'`

#### Scenario: plainText strips markdown markup

- **WHEN** the bot sends a rich message with `markdown: '**hello** _world_'`
- **THEN** `reply.richMessage.plainText` equals `'hello world'`
