## Why

Module-level counters were removed and `IdGenerator.nextUpdateId()` was introduced, but two call sites in `user.ts` were not updated: `joinChat`/`leaveChat` still pass hardcoded constants (`600_000`, `700_000`) producing duplicate `update_id` values on repeated calls, and `sendText`/`sendForwarded`/`editMessage` derive `updateId` from `nextMessageId()` rather than `nextUpdateId()`, calling the wrong counter. Additionally, `OutgoingRequests.getAll()` now supports up to 10 typed overloads — this cap is intentional and should be documented in the relevant spec.

## What Changes

- Fix `user.ts` `joinChat` and `leaveChat` to pass `this.ctx.ids.nextUpdateId()` instead of `600_000` / `700_000`.
- Fix `user.ts` `sendText`, `sendForwarded`, and `editMessage` to derive `updateId` from `this.ctx.ids.nextUpdateId()` instead of `nextMessageId() + offset`.
- Document in the `outgoing-requests-capture` spec that `getAll()` supports up to 10 positional type parameters and that this limit is intentional.

## Capabilities

### New Capabilities

<!-- none -->

### Modified Capabilities

- `outgoing-requests-capture`: Document the 10-overload cap on `getAll()` as an explicit, intentional constraint.
- `user-actor`: Update requirements to reflect that all dispatched updates must use `IdGenerator.nextUpdateId()` for their `update_id`.

## Impact

- `src/high-level/user.ts` — 5 call sites updated
- `openspec/specs/outgoing-requests-capture/spec.md` — adds `getAll()` overload cap note
- `openspec/specs/user-actor/spec.md` — adds update ID sourcing requirement
