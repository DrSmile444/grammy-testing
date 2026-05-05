## 1. Dispatch helper

- [x] 1.1 `dispatchServiceMessage` helper added in `src/high-level/dispatch.ts` with `kind: 'new_chat_members' | 'left_chat_member'` discriminator. Synthesizes the right `Message` shape (with `new_chat_members: [user]` or `left_chat_member: user`) and dispatches via `bot.handleUpdate`.
- [x] 1.2 Helper composes with the existing `dispatchTextMessage` / `dispatchMyChatMember` style — same `bot`/`ids`/`user`/`chat` parameter shape, single-await dispatch.

## 2. `user.joinChat`

- [x] 2.1 `user.joinChat(chat)` added on `User<TContext>` in `src/high-level/user.ts`. Validates chat type — throws if not `'group'` / `'supergroup'`.
- [x] 2.2 Implementation calls `dispatchServiceMessage({ kind: 'new_chat_members', ... })`, then `ctx.updateMembership(chat, this, 'join')`. The Chats-side handler preserves higher-privileged statuses (`creator`, `administrator`, `restricted`, `member`) and only sets `'member'` for fresh / `'left'` / `'kicked'` users.
- [x] 2.3 Wired through the User → Chats boundary via a new `updateMembership` closure on `UserContext`. Chats sets it to `(chat, who, mode) => this.applyMembershipTransition(...)`.

## 3. `user.leaveChat`

- [x] 3.1 `user.leaveChat(chat)` added on `User<TContext>`. Same chat-type validation.
- [x] 3.2 Implementation calls `dispatchServiceMessage({ kind: 'left_chat_member', ... })`, then `ctx.updateMembership(chat, this, 'leave')`. Always sets `status: 'left'` regardless of prior status; preserves the entry (does NOT delete) so `user.in(chat)?.status === 'left'` is queryable.

## 4. Filter-rule refinement

- [x] 4.1 `Chats.userReceivesReply` updated: participant check now reads `chat.members.get(user.id)?.status` and rejects `undefined`, `'left'`, and `'kicked'`. Active statuses (`'creator'`, `'administrator'`, `'member'`, `'restricted'`) pass.
- [x] 4.2 Existing 124 tests still pass — verified `npm run test:run` after filter change before adding new tests.

## 5. Public exports

- [x] 5.1 No new exports needed — `joinChat` / `leaveChat` are methods on the existing exported `User` class.
- [x] 5.2 Verified `src/index.ts` and `src/low-level.ts` unchanged from prior to this proposal.

## 6. High-level tests

- [x] 6.1 `tests/high-level/service-messages.spec.ts` created (10 tests).
- [x] 6.2 `joinChat` dispatches `new_chat_members` — bot's handler observes `new_chat_members[0].id`.
- [x] 6.3 `joinChat` updates fresh user to `'member'`.
- [x] 6.4 `joinChat` does NOT downgrade an `'administrator'`.
- [x] 6.5 `leaveChat` dispatches `left_chat_member` — bot's handler observes `left_chat_member.id`.
- [x] 6.6 `leaveChat` updates membership to `'left'`.
- [x] 6.7 Re-joining after leave: `'left'` → `'member'`.
- [x] 6.8 `joinChat` / `leaveChat` on private chat or channel throws.
- [x] 6.9 Filter-rule integration: after `leaveChat`, mention-bearing broadcast lands in `chat.messages` but NOT in `user.replies`.

## 7. Reference suite migration

- [x] 7.1 `tests/reference/service-messages.spec.ts` rewritten to use `user.joinChat(group)` / `user.leaveChat(group)`. `// v0.2.x gap` inline comments removed.
- [x] 7.2 File header updated: `v0.2 API expression: user.joinChat(group), user.leaveChat(group)`; `v0.2.x gaps: none`.
- [x] 7.3 `tests/reference/README.md` gap-catalog table: 2 service-message rows removed. Catalog now has 5 rows (was 7). Index entry for `service-messages.spec.ts` updated to reflect native v0.2.x support.
- [x] 7.4 Verified `grep -rn "v0.2.x gap" tests/reference/` no longer surfaces any service-message tags. Remaining tags map 1:1 to the 5 catalog rows.

## 8. Validation

- [x] 8.1 `npm run typecheck` clean.
- [x] 8.2 `npm run lint` clean — 0 errors, 4 informational warnings (carry-over from existing src files).
- [x] 8.3 `npm run test:run` green: **134/134 tests pass** (124 pre-existing + 10 new high-level service-message tests). Reference-suite count unchanged (still 2 tests in service-messages.spec.ts), expression updated.
- [x] 8.4 `openspec validate add-service-message-verbs --strict` reports valid.
- [x] 8.5 Cross-checked: `grep "v0.2.x gap" tests/reference/` output corresponds to README catalog rows — both list the same 5 remaining gaps (commands-in-supergroup, forwarded, edited, nested-replies, caption-in-non-media-group).
