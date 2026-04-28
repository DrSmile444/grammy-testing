## 1. Scaffolding

- [x] 1.1 Created `tests/reference/` directory.
- [x] 1.2 `tests/reference/README.md` with intro, link to `docs/project.md`, file index, and v0.2.x gap catalog table covering all currently-tagged escape-hatch usages.
- [x] 1.3 Vitest already picks up `tests/reference/**/*.spec.ts` via the existing `**/*.spec.ts` include glob — no `vitest.config.ts` change needed; documented in the README.

## 2. Commands pattern

- [x] 2.1 `tests/reference/commands.spec.ts` with header block (source, inspired-by tests, v0.2 API, gaps).
- [x] 2.2 `/start` in private chat triggers handler — uses `user.sendCommand('/start')` + `chats.repliesFor(user).last`.
- [x] 2.3 `/lang en` arg parsing — uses `user.sendCommand('/lang', 'en')`; bot reads `context.match`.
- [x] 2.4 Command in supergroup via `user.sendText('/start', { chat: group, entities: [...] })`. Tagged `v0.2.x gap: user.sendCommand should accept options.chat`.
- [x] 2.5 Admin-only command — promoted user, plus a non-admin variant (test 5) confirming the framework dispatches to the handler regardless of role; gating is the bot's responsibility.

## 3. Messages pattern

- [x] 3.1 `tests/reference/messages.spec.ts` with header.
- [x] 3.2 `parse_mode: 'HTML'` — bot replies, observed via `reply.parseMode`.
- [x] 3.3 Custom entities (`mention` + `url`) — passes through `user.sendText(..., { entities })`; bot observes them.
- [x] 3.4 `reply_parameters.message_id` — single-level reply chain via `user.sendText(..., { reply_parameters, reply_to_message })`.
- [x] 3.5 Forwarded message (`forward_origin`) via `MessagePrivateMockUpdate.buildOverwrite()` — tagged `v0.2.x gap: add-forwarded-message-dispatch`. Edited message via inline `Update` literal — tagged `v0.2.x gap: add-edited-message-dispatch`. Nested reply chain (reply-to-a-reply-to-a-reply) via inline assembly — tagged `v0.2.x gap: add-nested-reply-chains`.

## 4. Channel posts pattern (Coverage-audit gap #3)

- [x] 4.1 `tests/reference/channel-posts.spec.ts` with header.
- [x] 4.2 `channel.postMessageTo(group, text)` — bot detects `sender_chat.type === 'channel'` and deletes.
- [x] 4.3 Discrimination: user message vs channel-posted message in same chat — bot treats them differently. Demonstrates v0.2 sender_chat handling.

## 5. Media groups pattern (Coverage-audit gap #4)

- [x] 5.1 `tests/reference/media-groups.spec.ts` with header.
- [x] 5.2 3-item dispatch with shared `media_group_id`; bot's `bot.on('message', ...)` runs 3 times.
- [x] 5.3 Bot aggregates by `media_group_id` and counts items.
- [x] 5.4 Two distinct calls produce two distinct media_group_ids.
- [x] 5.5 Header notes the limitation: media verbs (`sendPhoto`, etc.) are placeholder-only — `add-media-verbs` proposal will close.

## 6. Membership pattern (Coverage-audit gap #7)

- [x] 6.1 `tests/reference/membership.spec.ts` with header.
- [x] 6.2 `group.promote(user, { can_delete_messages: true })` granted-then-asserted.
- [x] 6.3 `group.restrict(user, { can_send_messages: false, can_send_photos: false }, untilDate)` — multiple permission flags + `untilDate` observed.
- [x] 6.4 `chat.changeMemberStatus(user, { from: 'member', to: 'restricted', permissions, untilDate })` — bot's `my_chat_member` handler observes both old and new.
- [x] 6.5 Membership map updates after `changeMemberStatus` — `user.in(group)?.status` reflects the latest transition.

## 7. Service messages pattern (low-level escape hatch)

- [x] 7.1 `tests/reference/service-messages.spec.ts` with header noting the entire category is a v0.2.x gap (suggested proposal: `add-service-message-verbs`).
- [x] 7.2 New-member service message via `NewMemberMockUpdate().build()` — bot reacts.
- [x] 7.3 Left-member service message via `LeftMemberMockUpdate().build()` — bot reacts.
- [x] 7.4 Both tests carry inline `// v0.2.x gap` comments.

## 8. Sessions pattern

- [x] 8.1 `tests/reference/sessions.spec.ts` with header.
- [x] 8.2 `mockSession({ language: 'en' })` — bot reads `ctx.session.language` and replies localized.
- [x] 8.3 Cross-call mutation — first dispatch with `language === 'en'`, mutate to `'uk'`, second dispatch sees the new value.
- [x] 8.4 `mockChatSession({ isBotAdmin: true })` — bot reads `ctx.chatSession.isBotAdmin`.
- [x] 8.5 Combined `mockSession + mockChatSession` — both visible in one handler.

## 9. Error simulation pattern

- [x] 9.1 `tests/reference/error-simulation.spec.ts` with header.
- [x] 9.2 `failNext('sendMessage', { code: 403, ... })` — bot's try/catch observes the rejection.
- [x] 9.3 `failAll('sendMessage', { code: 429, ... })` — bot retries 3x then rethrows; `attempts === 3`.
- [x] 9.4 `respondNext('getChat', customPayload)` — bot reads back the override on the next call.
- [x] 9.5 Combination: `failNext` for `sendMessage` while `respondNext` for `getChat` in the same dispatch — both compose cleanly.

## 10. Menu flows pattern

- [x] 10.1 `tests/reference/menu-flows.spec.ts` with header.
- [x] 10.2 Basic flow: bot replies with keyboard, user `clickButton('Yes')`, callback handler runs and replies.
- [x] 10.3 Chained keyboards: 3-step menu (start → option-pick → terminal); each click reveals the next keyboard.
- [x] 10.4 `clickButton({ data: 'cb-greet' })` matches when the button text is dynamic (e.g. localized greeting).
- [x] 10.5 URL-only button rejects `clickButton` with a `/URL buttons/` error.

## 11. README gap catalog

- [x] 11.1 Ran `grep -rn "v0.2.x gap" tests/reference/` — every escape-hatch usage is tagged at the file (header) and line (inline) level.
- [x] 11.2 `tests/reference/README.md` gap table has 7 rows: command-in-supergroup, forwarded messages, edited messages, nested replies, caption-only-message (no media verbs), `new_chat_members`, `left_chat_member`.
- [x] 11.3 Cross-checked: every tagged code-level gap is in the README; every README row corresponds to a real tag (or a documented limitation in a header `gaps:` line).

## 12. Validation

- [x] 12.1 `npm run test:run` green — **124/124 tests pass** (90 v0.1+v0.2 + 34 new reference suite tests) in ~1s.
- [x] 12.2 `npm run typecheck` clean.
- [x] 12.3 `npm run lint` clean — 0 errors, 4 informational warnings (unused-disable directives + a security-rule false positive).
- [x] 12.4 `openspec validate add-anti-spam-reference-suite --strict` reports valid.
- [x] 12.5 Manual cross-check: every audited pattern bullet in `docs/project.md` §"Reference test suite" maps to passing tests in `tests/reference/`. The README index documents the mapping.
