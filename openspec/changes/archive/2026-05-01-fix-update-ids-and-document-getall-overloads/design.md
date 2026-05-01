## Context

`IdGenerator.nextUpdateId()` was introduced to replace scattered module-level counters. The migration was applied to `dispatch.ts`, `group.ts`, `supergroup.ts`, `channel.ts`, and `business-account.ts`, but two patterns in `user.ts` were missed:

1. `joinChat` and `leaveChat` pass literal constants (`600_000`, `700_000`) as `updateId`. Since `dispatchServiceMessage` no longer adds a counter, every call to either method produces the same `update_id`.
2. `sendText`, `sendForwarded`, and `editMessage` derive `updateId` from `nextMessageId() + offset` — calling the message counter a second time and using the resulting value as an update ID. This conflates two independent sequences.

## Goals / Non-Goals

**Goals:**
- All dispatched updates in `user.ts` use `IdGenerator.nextUpdateId()` for `update_id`.
- `outgoing-requests-capture` spec documents the 10-overload cap on `getAll()`.
- `user-actor` spec requires update IDs to come from `IdGenerator`.

**Non-Goals:**
- Changing the `getAll()` implementation — the 10-overload design is correct as-is; this is documentation only.
- Fixing update IDs in any file other than `user.ts` (the rest were already migrated).
- Renumbering or reserving ID ranges — `nextUpdateId()` produces a monotonic sequence; callers do not choose the value.

## Decisions

**Remove offset-based `updateId` computation entirely**

Old pattern: `updateId: this.ctx.ids.nextMessageId() + 100_000`
New pattern: `updateId: this.ctx.ids.nextUpdateId()`

Alternatives considered:
- Keep offsets but use `nextUpdateId() + offset` — rejected; the whole point of `nextUpdateId()` is to produce unique IDs without manual range management.
- Introduce a separate counter per dispatch type — rejected; over-engineering, the shared counter is sufficient.

**Document the `getAll()` overload cap in the spec, not in code comments**

The 10-overload limit is a deliberate UX decision: tests needing more than 10 simultaneous typed assertions should decompose into multiple assertions. A spec note communicates this to contributors better than a code comment.

## Risks / Trade-offs

- [Behavior change] Tests that previously relied on `update_id: 600_000` or `700_000` being stable will now see incrementing IDs. → These tests were already unreliable (duplicate IDs on repeated calls); the new behavior is strictly more correct.
- [None] No public API surface changes — `user.ts` methods have identical signatures before and after.

## Migration Plan

Straightforward in-place fix. No data migration, no rollback concern — all changes are in test-support code with no persistence.
