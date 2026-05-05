## 1. Fix `update_id` counter — `user.ts`

- [x] 1.1 Replace all `this.ctx.ids.nextMessageId() + N` expressions used as `update_id` in `User` send/dispatch methods with `this.ctx.ids.nextUpdateId()`
- [x] 1.2 Replace `400_000 + this.ctx.ids.nextMessageId()` in the `sendMediaGroup` item loop with `this.ctx.ids.nextUpdateId()`
- [x] 1.3 Replace `options.updateId ?? this.ctx.ids.nextMessageId() + N` in `manageBot` and `purchasePaidMedia` with `options.updateId ?? this.ctx.ids.nextUpdateId()`

## 2. Fix `update_id` counter — `reply.ts`

- [x] 2.1 Replace `500_000 + this.deps.ids.nextMessageId()` in `Reply.clickButton` with `this.deps.ids.nextUpdateId()`

## 3. Fix `syntheticMediaGroup` — `chats.ts`

- [x] 3.1 Change the `syntheticMediaGroup` resolver signature to `(payload: Record<string, unknown>): unknown[]`
- [x] 3.2 Read `payload.media` to determine item count `N`
- [x] 3.3 Return an array of `N` synthetic `{ message_id, date }` objects — first from `lastCapturedReply.messageId`, remaining from `this.ids.nextMessageId()`

## 4. Update test

- [x] 4.1 Update `tests/high-level/media-group.spec.ts` — change the `sendMediaGroup` response test to assert `length === 2` for a two-item call, and verify both elements have numeric `message_id` values

## 5. Document `GROUP_ANONYMOUS_BOT.is_bot`

- [x] 5.1 Add an inline comment on the `is_bot: false` line in `GROUP_ANONYMOUS_BOT` (user.ts) explaining it reflects real Telegram payloads, consistent with `Channel_Bot`

## 6. Quality gate

- [x] 6.1 Run `npm run lint:fix` and fix all errors
- [x] 6.2 Run `npm run format:md` and fix all errors
- [x] 6.3 Run `npm run typecheck` and fix all errors
- [x] 6.4 Run `npm run lint` and fix all errors
- [x] 6.5 Run `npm run test:run` and fix all failures
- [x] 6.6 Run `npm run test:coverage` and fix all failures

## 7. Changelog and version bump

- [x] 7.1 Add entry to `docs/CHANGELOG.md` under a new `## <version> — <date>` heading describing the three fixes
- [x] 7.2 Bump version in both `package.json` and `jsr.json` to the same new version string
