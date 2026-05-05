## 1. IdGenerator extension

- [x] 1.1 Add `nextFileId(): string` method to `IdGenerator` that returns `'stub-file-<n>'` with an incrementing counter

## 2. Stub helpers

- [x] 2.1 Add `makePhotoSizeStub(fileId: string): PhotoSize` helper in `dispatch.ts` (or a new `media-stubs.ts`) returning `{ file_id, file_unique_id: fileId + '_unique', width: 800, height: 600 }`
- [x] 2.2 Add `makeDocumentStub(fileId: string): Document` helper returning `{ file_id, file_unique_id: fileId + '_unique', file_name: fileId }`
- [x] 2.3 Add `makeVideoStub(fileId: string): Video` helper returning `{ file_id, file_unique_id: fileId + '_unique', width: 1280, height: 720, duration: 0 }`

## 3. User actor — new dispatch verbs

- [x] 3.1 Add `SendPhotoOptions<TContext>` interface (`caption?: string; chat?: AnyChat<TContext>`) and export it from `src/index.ts`
- [x] 3.2 Add `SendDocumentOptions<TContext>` and `SendVideoOptions<TContext>` interfaces; export from `src/index.ts`
- [x] 3.3 Implement `user.sendPhoto(file?: string, options?: SendPhotoOptions)` on the `User` class — builds a `Message` with `photo: [makePhotoSizeStub(file ?? ids.nextFileId())]` and dispatches via `bot.handleUpdate`
- [x] 3.4 Implement `user.sendDocument(file?: string, options?: SendDocumentOptions)` — same pattern with `message.document`
- [x] 3.5 Implement `user.sendVideo(file?: string, options?: SendVideoOptions)` — same pattern with `message.video`

## 4. Fix sendMediaGroup stubs

- [x] 4.1 Update `user.sendMediaGroup` item construction: replace `photo: item.photo === undefined ? undefined : []` with `photo: item.photo ? [makePhotoSizeStub(item.photo)] : undefined`
- [x] 4.2 Apply same fix for `document` and `video` fields in `sendMediaGroup` items using the respective stubs

## 5. Reply.media accessor

- [x] 5.1 Define `MediaType = 'photo' | 'document' | 'video' | 'audio' | 'voice' | 'animation' | 'sticker' | 'video_note'` and `ReplyMedia = { type: MediaType; fileId: string }` in `reply.ts`; export both from `src/index.ts`
- [x] 5.2 Add `readonly media: ReplyMedia | undefined` field to `Reply` class — derived in constructor by checking `rawPayload` for each `MediaType` key in priority order

## 6. Tests

- [x] 6.1 Create `tests/reference/media-single.spec.ts` — reference tests for `sendPhoto`, `sendDocument`, `sendVideo` verbs; assert `message.photo[0].file_id`, `message.document.file_id`, `message.video.file_id` in bot handlers
- [x] 6.2 Extend `tests/reference/media-groups.spec.ts` with a test that asserts `message.photo[0].file_id` equals the string passed to `sendMediaGroup`
- [x] 6.3 Add a test for `reply.media` — bot echoes a photo back via `ctx.replyWithPhoto`, test asserts `reply.media?.type === 'photo'` and `reply.media?.fileId`
- [x] 6.4 Remove the `v0.2.x gaps` comment from `tests/reference/media-groups.spec.ts` header now that the gap is closed

## 7. Quality gate

- [x] 7.1 Run `npm run lint:fix && npm run typecheck && npm run lint && npm run test:run && npm run test:coverage` — all pass, coverage ≥ 80%
- [x] 7.2 Bump `package.json` version (minor — new public verbs)
