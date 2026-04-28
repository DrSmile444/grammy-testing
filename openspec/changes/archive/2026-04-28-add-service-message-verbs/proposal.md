## Why

Two of the seven rows in the reference suite's v0.2.x gap catalog are about the same thing: bot-side reactions to user-join and user-leave service messages currently require dropping into the v0.1 low-level `NewMemberMockUpdate` / `LeftMemberMockUpdate` builders. These are common enough patterns (welcome flows, anti-raid, deletion of join/leave noise) that forcing test authors through the escape hatch breaks the v0.2 ergonomic promise. Closing both rows in one proposal is the smallest unit of work that meaningfully shrinks the gap catalog and tightens the reference suite's "no escape hatch for normal patterns" claim.

## What Changes

- **New verbs on `User`:**
  - `user.joinChat(chat)` — synthesizes a `new_chat_members` service-message update where `from = user`, `chat = <target>`, `new_chat_members = [user]`. Dispatches via `bot.handleUpdate`. Settles when middleware is done.
  - `user.leaveChat(chat)` — synthesizes a `left_chat_member` service-message update where `from = user`, `chat = <target>`, `left_chat_member = user`. Dispatches via `bot.handleUpdate`.
- **Membership-state side effects:**
  - `user.joinChat(group)` adds the user to `chat.members` with `status: 'member'` (if not already present with a higher-privileged status — promote/restrict are NOT downgraded).
  - `user.leaveChat(group)` updates the user's entry in `chat.members` to `status: 'left'`. The entry is kept (not deleted) so re-joining the same user transitions cleanly and `user.in(chat)` still returns the membership view.
- **Filter-rule refinement on `user.replies`:** the participant check excludes users whose current `chat.members` status is `'left'` or `'kicked'`. A user who has left a group SHALL NOT receive subsequent broadcasts in their `user.replies` even if they're still in the chat's members map. (Today this is moot because no v0.2 verb sets status to `'left'`; with `leaveChat` shipping, the filter needs to be precise.)
- **Reference suite cleanup:**
  - `tests/reference/service-messages.spec.ts` rewritten to use `user.joinChat(group)` / `user.leaveChat(group)` instead of `NewMemberMockUpdate.build()` / `LeftMemberMockUpdate.build()`. The `// v0.2.x gap` tags removed.
  - `tests/reference/README.md` gap catalog: rows for `new_chat_members service message` and `left_chat_member service message` removed. Catalog drops from 7 rows to 5.
- **No new low-level surface.** The v0.1 `NewMemberMockUpdate` and `LeftMemberMockUpdate` builders stay available under `@grammyjs/testing/low-level` for advanced cases (custom service-message metadata, multiple new members at once, edge-case `from` overrides). Only the high-level user-facing verbs are new.

## Capabilities

### New Capabilities

None. This is a v0.2.x verb addition that extends existing capabilities — the verbs and their side effects sit on top of the v0.2 surface, not as a new conceptual area.

### Modified Capabilities

- `user-actor`: adds `joinChat` and `leaveChat` requirements alongside the existing text/command verbs.
- `membership-roles`: adds requirements for the membership-state side effects of `joinChat` (status becomes `'member'`) and `leaveChat` (status becomes `'left'`); clarifies that pre-existing higher-privileged statuses (`'administrator'`, `'creator'`, `'restricted'`) are NOT downgraded by `joinChat`.
- `reply-objects`: modifies the participant check in the `user.replies` filter rule to exclude `'left'` and `'kicked'` statuses. Existing four-clause addressee rule (DM / reply-to / mention / callback-association) stays unchanged.

## Impact

- **Source layout**: net additive in `src/high-level/`. Two new methods on `User`, one new dispatch helper for service-message-shape updates in `dispatch.ts`, a small refinement in `chats.ts` to the `userReceivesReply` filter and the membership-update closure handed to `User`. No new files.
- **Tests**: new `tests/high-level/service-messages.spec.ts` with ~6 tests covering the verbs and their side effects. `tests/reference/service-messages.spec.ts` rewritten to use the new verbs (~2 tests, same count, different expression). README catalog updated.
- **Public API**: two new methods exposed via the existing `User` re-export in `src/index.ts`. No breaking changes.
- **Backward compat**: `NewMemberMockUpdate` and `LeftMemberMockUpdate` low-level builders unchanged and still re-exported. Tests that already use them keep working.
- **Reference-suite gap catalog**: drops to 5 rows. The remaining gaps (forwarded messages, edited messages, nested reply chains, caption-only messages, supergroup-aware sendCommand) become the next v0.2.x candidates.
- **Out of scope**: bulk join/leave (`chat.addMembers([...])`), kick semantics (status `'kicked'` distinct from `'left'`), the `chat_member` update (admin-observable role changes for non-bot users; distinct from `my_chat_member` which fires for the bot itself). Each of these is a separate future proposal.
