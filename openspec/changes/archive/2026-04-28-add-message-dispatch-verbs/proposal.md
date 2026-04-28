## Why

Two common Telegram update types — forwarded messages and edited messages — had no high-level verb in v0.2, forcing reference tests to use `buildOverwrite()` and inline `Update` literals. These escape hatches are verbose and expose low-level plumbing for patterns that appear in virtually every real bot's test suite.

## What Changes

- Add `user.sendForwarded(text, { forwardOrigin, chat? })` — dispatches a text message with `forward_origin` populated, removing the `buildOverwrite` escape hatch for the forwarded-message pattern.
- Add `user.editMessage(messageId, text, { chat? })` — dispatches an `edited_message` update, removing the inline `Update` literal escape hatch for the edited-message pattern.
- Add `SendForwardedOptions<TContext>` interface to the public export surface.
- Update `tests/reference/messages.spec.ts` to use the new verbs; remove the two `// v0.2.x gap` describe blocks.
- Remove two rows from the `tests/reference/README.md` gap catalog.

## Capabilities

### New Capabilities

None — these verbs extend the existing `user-actor` capability rather than introducing a new domain.

### Modified Capabilities

- `user-actor`: Two new dispatch verbs (`sendForwarded`, `editMessage`) added to the `User` class public surface.

## Impact

- `src/high-level/user.ts` — two new methods, one new exported interface
- `src/high-level/dispatch.ts` — `dispatchEditedMessage` function added; `PrivateMessageDispatch` gains optional `forwardOrigin` field
- `src/index.ts` — exports `SendForwardedOptions`
- `tests/reference/messages.spec.ts` — two test blocks migrated from escape hatches to high-level verbs
- `tests/reference/README.md` — gap catalog reduced from 4 to 2 rows
- No new dependencies; no breaking changes
