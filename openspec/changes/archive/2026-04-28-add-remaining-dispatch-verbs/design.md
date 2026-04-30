## Context

The `User` actor already has dispatch verbs for text, photo, document, video, and media groups. Ten Telegram message types recognized by `MESSAGE_METHODS` in `chats.ts` have no corresponding incoming dispatch verb: audio, voice, video note, animation, sticker, location, contact, venue, poll, and dice. These are all legitimate Telegram message types that real bots react to.

## Goals / Non-Goals

**Goals:**

- Add `user.sendAudio`, `user.sendVoice`, `user.sendVideoNote`, `user.sendAnimation`, `user.sendSticker` — file-based media verbs following the same stub pattern as `sendPhoto`/`sendDocument`/`sendVideo`
- Add `user.sendLocation(latitude, longitude, options?)` — structured verb with required coordinate args
- Add `user.sendContact(phoneNumber, firstName, options?)` — structured verb with required contact args
- Add `user.sendVenue(latitude, longitude, title, address, options?)` — structured verb with required venue args
- Add `user.sendPoll(question, answerOptions, options?)` — structured verb with required poll args; stubs a `Poll` shape
- Add `user.sendDice(emoji?, options?)` — structured verb with optional emoji (defaults to `'🎲'`); stubs a `Dice` shape with value `1`
- Add stub helpers for the five new file-based types in `media-stubs.ts`

**Non-Goals:**

- Configuring dice value or poll state — tests observe these as sent but don't manipulate their state
- Forwarding or editing verbs for the new types — covered by `sendForwarded` + `editMessage` already
- Venue/location live update simulation

## Decisions

### File-based verbs follow the existing pattern

`sendAudio`, `sendVoice`, `sendVideoNote`, `sendAnimation`, `sendSticker` each accept `(file?: string, options?: { caption?, chat? })`. Like `sendPhoto`, if `file` is omitted, `ids.nextFileId()` generates a stable `'stub-file-<n>'` ID. A corresponding stub helper (`makeAudioStub`, etc.) in `media-stubs.ts` fills the required fields for each grammy type.

Alternatives considered: a generic `sendMedia(type, file?)` dispatcher. Rejected — it forces callers to know internal field names and loses type-narrowing on the resulting update.

### Structured verbs take typed positional args

`sendLocation`, `sendContact`, `sendVenue`, and `sendPoll` carry required semantic args as positional parameters (not folded into an options bag). This matches how developers think ("send a location at these coordinates") and keeps the required/optional split explicit at the call site.

`sendPoll` takes `answerOptions: string[]` as the second positional arg (the array of answer texts), mirroring the Telegram API shape. An `InputPollOption[]` stub is built inline; the `Poll` shape carries `type: 'regular'` and `is_closed: false` defaults.

### Dice defaults to '🎲', value always 1

`sendDice(emoji?, options?)` defaults to `'🎲'`. The stub dice value is always `1` — tests that care about dice value should handle any value (dice results in prod are random). Keeping it at `1` is simpler than making it configurable or random.

### No new dispatch infrastructure

All ten verbs build a `Message` inline and call `bot.handleUpdate` directly, identical to `sendPhoto`. No changes to `dispatch.ts` are needed.

### Options types exported from `src/index.ts`

New option interface types (`SendAudioOptions`, `SendVoiceOptions`, etc.) follow the existing export pattern established by `SendPhotoOptions`, `SendDocumentOptions`, `SendVideoOptions`.

## Risks / Trade-offs

- `VideoNote` requires `length` (diameter in pixels) and `duration` — stub uses `length: 240, duration: 0`. Tests that assert exact dimensions will need to be aware of these defaults.
- `Animation` (GIF) has `width`, `height`, `duration` — stub uses `320 × 240, duration: 0`.
- `Sticker` requires `type` field (`'regular' | 'mask' | 'custom_emoji'`) — stub uses `type: 'regular'`.
- `Poll` requires a minimum of two answer options in the real API, but the stub does not enforce this to keep tests simple.
