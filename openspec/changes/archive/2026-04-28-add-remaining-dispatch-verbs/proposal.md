## Why

The `User` actor covers the most common message types (`sendText`, `sendPhoto`, `sendDocument`, `sendVideo`, `sendMediaGroup`) but leaves audio, voice, video notes, animations, stickers, location, contact, venue, polls, and dice without first-class dispatch verbs. Tests for bots that handle these types must fall back to raw `bot.handleUpdate` calls, losing the ergonomics and chat-routing logic that the high-level API provides.

## What Changes

- Add `user.sendAudio(file?, options?)` — dispatches an audio message with an `Audio` stub
- Add `user.sendVoice(file?, options?)` — dispatches a voice message with a `Voice` stub
- Add `user.sendVideoNote(file?, options?)` — dispatches a video note with a `VideoNote` stub
- Add `user.sendAnimation(file?, options?)` — dispatches an animation (GIF) with an `Animation` stub
- Add `user.sendSticker(file?, options?)` — dispatches a sticker with a `Sticker` stub
- Add `user.sendLocation(latitude, longitude, options?)` — dispatches a location message
- Add `user.sendContact(phoneNumber, firstName, options?)` — dispatches a contact message
- Add `user.sendVenue(latitude, longitude, title, address, options?)` — dispatches a venue message
- Add `user.sendPoll(question, answerOptions, options?)` — dispatches a poll message
- Add `user.sendDice(emoji?, options?)` — dispatches a dice roll message
- Extend `reply.media` to cover the new media types (audio, voice, video_note, animation, sticker are already in `MediaType` — no new types needed)
- Add corresponding stub helpers to `media-stubs.ts`

## Capabilities

### New Capabilities

- `remaining-dispatch-verbs`: All new `user.send*` verbs for the Telegram message types not yet covered by the high-level actor API

### Modified Capabilities

- `user-actor`: New `sendAudio`, `sendVoice`, `sendVideoNote`, `sendAnimation`, `sendSticker`, `sendLocation`, `sendContact`, `sendVenue`, `sendPoll`, `sendDice` verbs added to the existing user-actor spec

## Impact

- `src/high-level/user.ts` — ten new methods
- `src/high-level/media-stubs.ts` — five new stub helpers (`makeAudioStub`, `makeVoiceStub`, `makeVideoNoteStub`, `makeAnimationStub`, `makeStickerStub`)
- `src/index.ts` — new option types exported
- `tests/reference/remaining-dispatch-verbs.spec.ts` — new reference-suite spec file
- Minor version bump (`0.2.x → 0.3.0`)
