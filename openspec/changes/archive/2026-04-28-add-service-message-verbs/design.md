## Context

The v0.2 high-level layer ships six update-vocabulary verbs on `User` (`sendText`, `sendMessage`, `sendCommand`, `sendMediaGroup`) plus chat-rooted verbs (`group.promote`, `group.restrict`, `chat.changeMemberStatus`, `channel.postMessageTo`). Service messages — the `new_chat_members` / `left_chat_member` events — are conspicuously absent from the user-side surface. The reference suite documents this in two of seven gap-catalog rows.

The v0.1 low-level builders (`NewMemberMockUpdate`, `LeftMemberMockUpdate`) work, and the high-level verbs in this proposal are thin shells over the same dispatch primitive. The interesting design choices are about **state semantics**, not dispatch mechanics:

1. Should `joinChat` / `leaveChat` update the membership map?
2. What status does `joinChat` write?
3. What does `leaveChat` write — delete the entry or set `status: 'left'`?
4. How does the `user.replies` filter rule interpret the resulting state?

## Goals / Non-Goals

**Goals:**

- Tests can write `await user.joinChat(group)` and have both the dispatched service message AND the membership state reflect what real Telegram does.
- Tests can write `await user.leaveChat(group)` and subsequent broadcasts in the group do NOT land in `user.replies`.
- The reference suite drops both service-message rows from the gap catalog.
- The change is small — one verb pair, deterministic side effects, no new capabilities.

**Non-Goals:**

- Bulk join (`chat.addMembers([users])`) — defer.
- Distinguishing `kicked` from `left` — defer; both currently flatten to "not an active member" for filter purposes.
- The arbitrary-user `chat_member` update — `my_chat_member` is for the bot itself; non-bot membership changes fire `chat_member` for admin observers. We don't ship a verb for that here. Tests that need it use the low-level escape hatch with explicit gap tags.
- Welcome-flow ergonomics (e.g. `chat.welcome(user)` shortcut) — out of scope; tests compose `joinChat` + assertions themselves.

## Decisions

### D1. Verbs on `User`, not `Chat`

**Decision:** `user.joinChat(chat)` and `user.leaveChat(chat)`. Not `chat.welcome(user)` or `chat.addMember(user)`.

**Rationale:** A test author models "this user joined the chat", not "this chat acquired this member". The user is the active actor; the chat is the destination. Mirrors `user.sendText(...)`, where the user is the subject of the verb. Tests read more like prose: `await alice.joinChat(group)` reads naturally; `group.welcome(alice)` reads like an admin operation.

**Alternatives considered:**

- `chat.addMember(user)` (silent — no service message). Rejected: that's a different verb (state-only mutation without dispatch), worth its own proposal if needed.
- Both `user.joinChat(chat)` AND a chat-side bulk verb. Rejected: out of scope; bulk joins defer.

### D2. `joinChat` writes `status: 'member'` unless already privileged

**Decision:** `user.joinChat(group)` sets `chat.members[user.id]` to:

```ts
if (existing && (existing.status === 'administrator' || existing.status === 'creator' || existing.status === 'restricted')) {
  // Don't downgrade. Pre-existing privileged status persists.
} else {
  // Set to plain member (or upgrade from 'left'/'kicked' to 'member').
  chat.members.set(user.id, { user, chat, status: 'member', permissions: {} });
}
```

**Rationale:** The realistic test sequence "promote user, then user joins" — e.g., to test a welcome flow on a pre-promoted admin — should not silently demote the user. The dispatch goes out (the bot sees the service message); the side effect respects existing role state.

**Alternatives considered:**

- Always overwrite with `status: 'member'`. Rejected: silently demoting promoted users is a footgun.
- Skip the side effect entirely (only dispatch). Rejected: tests would have to manually add the user via `promote` first to make `user.replies` work, which is exactly the friction the v0.2 layer should hide.

### D3. `leaveChat` sets `status: 'left'`, doesn't delete

**Decision:** `user.leaveChat(group)` sets `chat.members[user.id]` to `{ user, chat, status: 'left', permissions: {} }`. The entry stays in the map.

**Rationale:** Three benefits:

- `user.in(group)?.status === 'left'` works as a queryable fact after departure. Useful for tests asserting on bot reactions to leave events.
- Re-joining via `joinChat` is a clean transition (D2 explicitly upgrades 'left' to 'member').
- Matches Telegram's actual semantics — `left` is a known status, not "no longer in any state".

**Alternatives considered:**

- Delete the entry. Rejected: loses history; re-joining loses the prior membership context; `user.in(group)` returns `undefined` instead of telling the test "this user has left".
- Keep with `status: 'member'` and a separate `isMember: false` flag. Rejected: invents a duplicate state mechanism when Telegram already has a `'left'` status.

### D4. Filter rule: a "participant" is active membership only

**Decision:** Modify the `userReceivesReply` filter rule's participant clause: a user is a participant of a non-private chat iff `chat.members.get(user.id)?.status` is one of `'creator'`, `'administrator'`, `'member'`, `'restricted'`. Statuses `'left'` and `'kicked'` are NOT participants.

**Rationale:** Real semantics. A user who has left a group does not see new messages there. A bot broadcast in the group should not land in their `user.replies`.

**Implementation impact:** small change in `Chats.userReceivesReply` — replace `chat.members.has(entry.user.id)` with a status check that excludes `'left'` and `'kicked'`.

**Alternatives considered:**

- Treat any membership map entry as "participant" (current behavior). Rejected: would mean a user who left still receives broadcasts in their inbox — wrong.
- Make the filter configurable per-test. Rejected: premature flexibility; a sensible default suffices.

### D5. Spec deltas in three capabilities

**Decision:** Modify `user-actor` (ADD verbs), `membership-roles` (ADD side-effect requirements), `reply-objects` (MODIFY participant clause).

**Rationale:** The verb is in `user-actor`; the state semantics are in `membership-roles`; the filter-rule refinement is in `reply-objects`. Each delta is small and lives where the requirement naturally belongs.

**Alternatives considered:**

- Stuff everything into `user-actor`. Rejected: state semantics belong with `membership-roles`; cross-spec semantics would drift.
- Create a new `service-messages` capability. Rejected: the verbs are part of the user actor surface, not a distinct conceptual area.

### D6. Re-use `dispatchTextMessage`-style helper, not a new module

**Decision:** Add a single `dispatchServiceMessage` helper in `src/high-level/dispatch.ts` (the file that already houses `dispatchMyChatMember` and `dispatchTextMessage`). The helper takes `{ kind: 'new_chat_members' | 'left_chat_member', user, chat, ids, bot }` and synthesizes the right `Update` shape.

**Rationale:** Consistency with the other dispatchers in that file. The two verb implementations on `User` become trivial — they call `dispatchServiceMessage` and update the membership map.

**Alternatives considered:**

- Two separate helpers (`dispatchNewMember`, `dispatchLeftMember`). Rejected: 90% shared shape; one helper with a discriminator is cleaner.

## Risks / Trade-offs

- **D2's "don't downgrade" rule introduces conditional logic** → Mitigation: documented explicitly in spec; tested with both "user is fresh" and "user is already admin" join scenarios.
- **D4 changes the filter rule's effective behavior** → Today no v0.2 path sets status to `'left'`/`'kicked'`, so this is a no-op for existing tests. After this change lands, leaveChat-then-broadcast tests will get the new (correct) behavior. Mitigation: existing reference-suite and high-level tests don't exercise this corner; new tests in this proposal explicitly verify it.
- **`chat.members.get(...).status` chains are now load-bearing in the filter** → Mitigation: keep the helper local to `Chats.userReceivesReply`; don't expose the participant check as a public method.
- **The README gap-catalog drops 2 rows but adds none** → That's the desired outcome. If implementation surfaces new gaps (e.g., bulk join from real-bot patterns we hadn't audited), we tag them in this same proposal's tasks.
- **Modifying `reply-objects` is a real spec change** → Mitigation: the modification is a clarification (defining "participant" precisely), not a behavior reversal. Document via the `MODIFIED Requirements` delta with the full requirement re-pasted per OpenSpec convention.

## Migration Plan

Additive in source code; refining in spec. No breaking changes.

1. Implement `dispatchServiceMessage` helper.
2. Add `joinChat` / `leaveChat` to `User`.
3. Refine `Chats.userReceivesReply` to exclude `'left'`/`'kicked'`.
4. Wire membership map updates from the verbs.
5. Add high-level tests (`tests/high-level/service-messages.spec.ts`).
6. Rewrite `tests/reference/service-messages.spec.ts` to use the new verbs; remove gap tags.
7. Update `tests/reference/README.md` gap catalog (drop 2 rows).
8. Lint, typecheck, full suite green.
9. `openspec validate --strict` clean.

Rollback: revert the high-level changes; reference suite goes back to the low-level escape hatch.

## Open Questions

- **Should the reference suite's `tests/reference/service-messages.spec.ts` keep one low-level escape-hatch test as a documented "for advanced cases" example?** That would be useful documentation but reintroduces a `v0.2.x gap` tag for a non-gap. **Default for now: no — fully migrate to high-level. The low-level builders stay available via `@grammyjs/testing/low-level`; advanced patterns can document themselves separately if needed.**
- **Should `joinChat` accept an optional `from` override (admin-adds-user vs self-join)?** Real Telegram differentiates: an admin adding a user has `from = admin`, `new_chat_members = [user]`. Self-joins have `from = user`, `new_chat_members = [user]`. **Default for now: only self-join (`from = user`). The admin-adds-user case can be a v0.2.x follow-up if reference patterns demand it.**
- **What about `chat.members` for the bot itself?** Bot's own membership transitions are dispatched via `chat.changeMemberStatus(bot, transition)` — but we don't have `bot` as a `User<TContext>` instance in the orchestrator. **Default for now: this proposal doesn't touch bot self-membership; that's separate. The existing `chat.changeMemberStatus(user, ...)` covers user transitions when needed.**
