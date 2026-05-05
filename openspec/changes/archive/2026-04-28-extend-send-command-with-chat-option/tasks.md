## 1. Signature extension

- [x] 1.1 `User.sendCommand` signature widened to accept optional third argument `options: { chat?: AnyChat<TContext> } = {}`. Existing 1-arg / 2-arg call sites unchanged.
- [x] 1.2 Implementation threads `options.chat` through to the existing `sendText(text, { entities, chat })` call. No new dispatch code; `sendText` already handles chat resolution.

## 2. High-level test

- [x] 2.1 Added test "dispatches into a supergroup via options.chat" in `tests/high-level/user-actor.spec.ts`. Asserts `chat.id`, `chat.type`, and `bot_command` entity all correct.
- [x] 2.2 Added test "honors args + options.chat together". Asserts text is `'/lang en'`, chat id matches, entity length is 5 (the `/lang` portion).

## 3. Reference suite migration

- [x] 3.1 Rewrote `tests/reference/commands.spec.ts` "command in a supergroup" test from `user.sendText('/start', { chat: group, entities: [...] })` to `user.sendCommand('/start', undefined, { chat: group })`. Inline `// v0.2.x gap` comment removed.
- [x] 3.2 Updated file header: replaced `(v0.2.x gap — sendCommand should accept options.chat)` with the new verb shape `user.sendCommand(cmd, args?, options?)`; cleared the gaps line.
- [x] 3.3 Removed `Command sent into a supergroup` row from `tests/reference/README.md` gap-catalog. Catalog now has 4 rows.
- [x] 3.4 Verified `grep "v0.2.x gap" tests/reference/commands.spec.ts` returns only the header note ("none for this pattern category at v0.2.x") — no inline tags remain.

## 4. Validation

- [x] 4.1 `npm run typecheck` clean.
- [x] 4.2 `npm run lint` clean — 0 errors, 4 informational warnings (pre-existing).
- [x] 4.3 `npm run test:run` green: **136/136 tests pass** (134 pre-existing + 2 new high-level tests). Reference suite still 34 tests, supergroup-command test now uses `sendCommand` directly.
- [x] 4.4 `openspec validate extend-send-command-with-chat-option --strict` reports valid.
- [x] 4.5 Cross-checked: `grep "v0.2.x gap" tests/reference/` corresponds to the 4 remaining README catalog rows (forwarded, edited, nested-replies, caption-in-non-media-group).
