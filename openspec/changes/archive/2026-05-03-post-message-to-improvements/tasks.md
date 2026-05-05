## 1. Update `channel.postMessageTo`

- [x] 1.1 Change return type of `postMessageTo` in `src/high-level/channel.ts` from `Promise<void>` to `Promise<Message>` and add `return message`
- [x] 1.2 Add `reply_to_message?: Partial<Message> & { message_id: number }` to the `postMessageTo` options type
- [x] 1.3 Implement auto-fill of `date` and `chat` for `reply_to_message` inside `postMessageTo`, using `target.toTelegramChat()` as `chat`

## 2. Tests

- [x] 2.1 Add `tests/high-level/post-message-to-improvements.spec.ts` covering: return type has correct `message_id`, `messageId` option reflected, auto-fill of `date` and `chat`, caller fields preserved, full Message accepted, cross-actor reply chain (`postMessageTo` → `sendText` reply)

## 3. Quality gate and release

- [x] 3.1 Update `docs/CHANGELOG.md` with entry for v0.17.0 describing the changes
- [x] 3.2 Bump version to `0.17.0` in both `package.json` and `jsr.json`
- [x] 3.3 Run full quality gate in order: `npm run lint:fix` → `npm run format:md` → `npm run typecheck` → `npm run lint` → `npm run test:run` → `npm run test:coverage`; fix every error before proceeding to the next step
