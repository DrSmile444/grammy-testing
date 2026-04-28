## Context

`user.sendMediaGroup` exists but produces `photo: []` (empty array) for every item — bots that read `message.photo[0].file_id` receive nothing. There are no single-media dispatch verbs. `Reply` exposes `text`, `entities`, and `buttons` but nothing for media captures.

The `IdGenerator` already sequences message and media-group IDs. `Reply` infers its properties from `rawPayload` (the captured outgoing payload dict). `chats.ts` passes `payload` (not the API method name) to the `Reply` constructor.

## Goals / Non-Goals

**Goals:**
- Add `user.sendPhoto(file?, options?)`, `user.sendDocument(file?, options?)`, `user.sendVideo(file?, options?)` dispatch verbs
- Fix `user.sendMediaGroup` to populate proper `PhotoSize[]` / `Document` / `Video` stubs
- Add `reply.media` accessor (`{ type, fileId }`) derived from outgoing captured payload
- Add `ids.nextFileId()` to generate stable `'stub-file-<n>'` IDs

**Non-Goals:**
- `Buffer` / `Uint8Array` / `ReadableStream` file inputs (deferred — `InputFile` complexity not needed for current test patterns)
- `user.sendAudio`, `user.sendVoice`, `user.sendAnimation`, `user.sendSticker` (can follow the same pattern in a future change)
- Outgoing `CapturedFile` with eager buffer drain (explore-doc mention — deferred)

## Decisions

### 1 — `file` parameter is an optional string (used as `file_id`)

When provided, the string becomes the `file_id` of the generated stub (`PhotoSize`, `Document`, or `Video`). When omitted, `ids.nextFileId()` yields `'stub-file-<n>'`.

**Alternative considered:** Accept a full grammY `InputFile`. Rejected — `InputFile` is a complex union covering URLs, buffers, and streams. Most test handlers just need a stable string to echo back; this complexity belongs in a later `CapturedFile` change.

### 2 — Stub shapes use fixed but plausible dimensions

`PhotoSize` stub: `{ file_id, file_unique_id: file_id + '_unique', width: 800, height: 600 }`.  
`Document` stub: `{ file_id, file_unique_id: file_id + '_unique', file_name: file_id }`.  
`Video` stub: `{ file_id, file_unique_id: file_id + '_unique', width: 1280, height: 720, duration: 0 }`.

Bots almost never gate logic on width/height/duration in unit tests. Fixed values remove any need for the caller to specify them.

### 3 — `reply.media` inferred from payload fields, not method name

`Reply` receives `rawPayload` (not the method name) from `chats.ts`. Rather than threading the method name through the constructor, `reply.media` inspects `rawPayload` for known media keys (`photo`, `document`, `video`, `audio`, `voice`, `animation`, `sticker`, `video_note`) in priority order. The first match determines `type` and `fileId = String(payloadValue)`.

**Alternative considered:** Pass `method` to `Reply` constructor. Rejected — adds coupling for marginal benefit; payload inspection already works because grammY uses consistent field names matching the method suffix.

### 4 — `sendMediaGroup` fix is additive: keep existing `photo: string | null | undefined` type

The `UserSendMediaGroupItem.photo` field already accepts a string. The fix changes the message construction from `photo: item.photo === undefined ? undefined : []` to `photo: item.photo ? [makePhotoSizeStub(item.photo, ids)] : undefined`. Same change for `document` and `video` fields.

## Risks / Trade-offs

- [Risk] Bot reads `message.photo[1]` (second resolution) → Mitigation: stub provides a single `PhotoSize` entry; bots that need multiple resolutions are rare in unit tests; they can pass multiple sizes via `options.sizes?` in a future iteration.
- [Risk] `String(payload.photo)` in `reply.media` produces `'[object Object]'` when the bot passes an `InputFile` object → Mitigation: acceptable for now since `InputFile` objects are edge-case in test bots; documented in JSDoc.
