## 1. Stub helpers in media-stubs.ts

- [x] 1.1 Add `makeAudioStub(fileId)` returning `Audio` stub (`file_id`, `file_unique_id`, `duration: 0`, `mime_type: 'audio/mpeg'`)
- [x] 1.2 Add `makeVoiceStub(fileId)` returning `Voice` stub (`file_id`, `file_unique_id`, `duration: 0`, `mime_type: 'audio/ogg'`)
- [x] 1.3 Add `makeVideoNoteStub(fileId)` returning `VideoNote` stub (`file_id`, `file_unique_id`, `length: 240`, `duration: 0`)
- [x] 1.4 Add `makeAnimationStub(fileId)` returning `Animation` stub (`file_id`, `file_unique_id`, `width: 320`, `height: 240`, `duration: 0`)
- [x] 1.5 Add `makeStickerStub(fileId)` returning `Sticker` stub (`file_id`, `file_unique_id`, `width: 512`, `height: 512`, `is_animated: false`, `is_video: false`, `type: 'regular'`)

## 2. Option interfaces in user.ts

- [x] 2.1 Add `SendAudioOptions<TContext>` interface (`caption?`, `chat?`)
- [x] 2.2 Add `SendVoiceOptions<TContext>` interface (`caption?`, `chat?`)
- [x] 2.3 Add `SendVideoNoteOptions<TContext>` interface (`chat?`)
- [x] 2.4 Add `SendAnimationOptions<TContext>` interface (`caption?`, `chat?`)
- [x] 2.5 Add `SendStickerOptions<TContext>` interface (`chat?`)
- [x] 2.6 Add `SendLocationOptions<TContext>` interface (`chat?`)
- [x] 2.7 Add `SendContactOptions<TContext>` interface (`lastName?`, `chat?`)
- [x] 2.8 Add `SendVenueOptions<TContext>` interface (`chat?`)
- [x] 2.9 Add `SendPollOptions<TContext>` interface (`chat?`)
- [x] 2.10 Add `SendDiceOptions<TContext>` interface (`chat?`)

## 3. Dispatch verbs in user.ts

- [x] 3.1 Add `user.sendAudio(file?, options?)` using `makeAudioStub`
- [x] 3.2 Add `user.sendVoice(file?, options?)` using `makeVoiceStub`
- [x] 3.3 Add `user.sendVideoNote(file?, options?)` using `makeVideoNoteStub`
- [x] 3.4 Add `user.sendAnimation(file?, options?)` using `makeAnimationStub`
- [x] 3.5 Add `user.sendSticker(file?, options?)` using `makeStickerStub`
- [x] 3.6 Add `user.sendLocation(latitude, longitude, options?)` building `message.location` inline
- [x] 3.7 Add `user.sendContact(phoneNumber, firstName, options?)` building `message.contact` inline
- [x] 3.8 Add `user.sendVenue(latitude, longitude, title, address, options?)` building `message.venue` inline
- [x] 3.9 Add `user.sendPoll(question, answerOptions, options?)` building a `Poll` stub inline
- [x] 3.10 Add `user.sendDice(emoji?, options?)` building `message.dice` inline with default emoji `'🎲'`

## 4. Exports in src/index.ts

- [x] 4.1 Export all ten new option interfaces from `src/index.ts`

## 5. Tests

- [x] 5.1 Create `tests/reference/remaining-dispatch-verbs.spec.ts` covering all ten new verbs: happy path per verb (bot receives the update, key fields observable), auto-generated file_id for file-based verbs, and a `chat` override test for at least one verb

## 6. Quality gate

- [x] 6.1 Run `npm run typecheck` — passes
- [x] 6.2 Run `npm run lint` — passes
- [x] 6.3 Run `npm run test:run` — passes
- [x] 6.4 Run `npm run test:coverage` — passes at 80%+

## 7. Versioning

- [x] 7.1 Bump `version` in `package.json` from `0.2.0` to `0.3.0` (minor — new public API)
