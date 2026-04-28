## Why

Bots that handle photos, documents, and videos need to read `message.photo[0].file_id`, `message.document.file_id`, etc. in their handlers, but the framework has no single-media dispatch verbs and `sendMediaGroup` currently produces empty `photo: []` arrays — bots that read `message.photo[0].file_id` get nothing. This rounds out the User actor API and closes the last v0.2.x reference-suite gap.

## What Changes

- Add `user.sendPhoto(file?, options?)` — dispatches a photo update; `message.photo` is populated with a `PhotoSize[]` stub carrying a stable `file_id`
- Add `user.sendDocument(file?, options?)` — dispatches a document update; `message.document` is a `Document` stub with a stable `file_id`
- Add `user.sendVideo(file?, options?)` — dispatches a video update; `message.video` is a `Video` stub with a stable `file_id`
- Fix `user.sendMediaGroup` — items with a `photo` string now produce a proper `PhotoSize[]` instead of `[]`
- Add `reply.media` accessor — exposes `{ type, fileId }` for any captured outgoing media call (`sendPhoto`, `sendDocument`, `sendVideo`, `sendAnimation`, `sendAudio`, `sendVoice`, `sendSticker`)

## Capabilities

### New Capabilities

_(none — all additions extend existing capabilities)_

### Modified Capabilities

- `user-actor`: add `sendPhoto`, `sendDocument`, `sendVideo` verbs; each accepts an optional `file` hint (string used as the `file_id` stub) and an `options` bag with `caption?` and `chat?`
- `media-group-dispatch`: `sendMediaGroup` items with a `photo` string SHALL populate `message.photo` as a `PhotoSize[]` with `file_id` equal to the supplied string; other media fields follow the same pattern
- `reply-objects`: add `reply.media` accessor exposing `{ type: MediaType, fileId: string }` for outgoing media-bearing captured calls; `undefined` for non-media calls

## Impact

- `src/high-level/user.ts` — new `sendPhoto`, `sendDocument`, `sendVideo` methods; fix to `sendMediaGroup` item construction
- `src/high-level/reply.ts` — new `media` accessor
- `src/index.ts` — export new option types (`SendPhotoOptions`, `SendDocumentOptions`, `SendVideoOptions`)
- `tests/reference/media-groups.spec.ts` — extend to assert `message.photo[0].file_id` is stable
- New `tests/reference/media-single.spec.ts` — reference tests for single-media dispatch verbs
- No new dependencies
