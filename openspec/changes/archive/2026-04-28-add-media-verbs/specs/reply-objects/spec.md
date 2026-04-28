## ADDED Requirements

### Requirement: `reply.media` exposes the file reference for outgoing media calls

For captured outgoing calls whose payload contains a media field (`photo`, `document`, `video`, `audio`, `voice`, `animation`, `sticker`, or `video_note`), the system SHALL expose a `reply.media` accessor returning `{ type: MediaType, fileId: string }`. For calls with no media field (e.g. `sendMessage`), `reply.media` SHALL return `undefined`.

`fileId` is derived by converting the payload's media field value to a string. When the bot passed a string `file_id` directly (the common test case), this returns the original string. When the bot passed an `InputFile` object, the result is implementation-defined and may not be useful — callers should pass string file IDs in tests to get reliable results.

`MediaType` is a string union of the supported media field names: `'photo' | 'document' | 'video' | 'audio' | 'voice' | 'animation' | 'sticker' | 'video_note'`.

#### Scenario: reply.media reflects the file_id used by the bot

- **WHEN** the bot handles an incoming photo and replies with `ctx.replyWithPhoto(ctx.message.photo[0].file_id)`
- **AND** `ctx.message.photo[0].file_id` was `'img-001'` (produced by `user.sendPhoto('img-001')`)
- **THEN** `chats.repliesFor(user).last?.media?.type` equals `'photo'`
- **AND** `chats.repliesFor(user).last?.media?.fileId` equals `'img-001'`

#### Scenario: reply.media is undefined for text-only replies

- **WHEN** the bot replies with `ctx.reply('hello')`
- **THEN** the corresponding `Reply.media` is `undefined`
