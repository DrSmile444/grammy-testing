## Context

`user.sendCommand` is the highest-level verb for dispatching a command-bearing message: it auto-prepends `/` if missing, computes the correct `bot_command` entity offset/length, optionally appends args after a space, and dispatches via `sendText`. The one thing it doesn't do is let the caller pick the destination — it always defaults to the user's private chat.

Real-bot tests routinely test commands in groups and supergroups. Today those tests fall back to `user.sendText(cmd, { chat: group, entities: [{ type: 'bot_command', offset: 0, length: cmd.length }] })`, manually reconstructing the entity that `sendCommand` already builds. This is documented in the reference suite as a v0.2.x gap. Closing it is a one-line implementation change.

## Goals / Non-Goals

**Goals:**

- `await user.sendCommand('/start', undefined, { chat: group })` works and dispatches the command-shape message into the group.
- Existing call sites (1-arg, 2-arg) keep compiling and behave identically.
- The reference suite's "command in a supergroup" test uses `sendCommand` directly. Catalog row drops.

**Non-Goals:**

- Refactoring `sendCommand`'s signature into options-only form. That would be a breaking change for existing 2-arg callers and is not justified by the small ergonomic win.
- Adding multi-arg parsing (splitting `args` into an array). Single-string `args` covers every audited pattern.
- Extending `sendText` further. Already supports `options.chat`; we just pass it through.
- Implicit membership setup. If the test wants the bot's reaction in `user.replies`, the user still needs to be promoted/joined in the target chat. Same pattern as `user.sendText(text, { chat: group })`.

## Decisions

### D1. Third positional argument, not options-bag refactor

**Decision:** New signature: `sendCommand(command: string, args?: string, options?: { chat?: AnyChat })`. The third arg is optional; the second arg's type and meaning don't change.

**Rationale:** Backward compatible — every existing caller works unchanged. Migration cost is zero. The shape `('/start', undefined, { chat: group })` is mildly awkward when `args` is `undefined`, but acceptable for the small minority of group-command tests.

**Alternatives considered:**

- **Switch to options-only:** `sendCommand(command, options?: { args?: string; chat?: AnyChat })`. Rejected — breaks the existing 2-arg form (`sendCommand('/lang', 'en')`), would require migrating the v0.2 test suite, the user-actor spec, and the reference suite all in one shot. Net negative for a small ergonomic gain.
- **Overload both shapes:** keep `(command, args?)` AND add `(command, options?)` with runtime detection of string-vs-object. Rejected — runtime overload introduces type-narrowing complexity for an edge case that's used in maybe 5–10 test sites total. Cost > benefit.

### D2. Pass `options.chat` through to `sendText`; don't duplicate dispatch logic

**Decision:** `sendCommand`'s implementation already calls `sendText(text, { entities: [...] })`. We add `chat: options?.chat` to the sendText options object — that's the entire change.

**Rationale:** `sendText` already handles `options.chat`. No new dispatch code. The `bot_command`-entity computation stays in `sendCommand`; chat resolution stays in `sendText`'s existing path.

### D3. Spec delta is a MODIFIED requirement, not ADDED

**Decision:** The `user-actor` spec's existing "sendCommand auto-emits the bot_command entity" requirement gets the full text re-pasted under `## MODIFIED Requirements` with the signature widened and a new scenario added for the chat override.

**Rationale:** Per OpenSpec convention, modifying a requirement re-pastes the full content (header through scenarios) so the archive merge captures the complete final state. The four existing scenarios stay; one new scenario is added.

## Risks / Trade-offs

- **`sendCommand('/start', undefined, { chat: group })` reads awkwardly** → Mitigation: documented in spec scenario; the alternative (options-only refactor) is worse for 90% of tests that don't need the chat override.
- **TypeScript users may pass `null` instead of `undefined` for the args slot** → JavaScript/TS treats both as falsy in our use; the implementation falls through to "no args" cleanly. Tests cover the `undefined` case.
- **Future v0.2.x verbs may want a similar (chat?) option** → That's fine; each verb adds it as needed. We're not creating a precedent that fights anything.

## Migration Plan

Additive, backward compatible. No code migration outside the verb itself and the one reference test.

1. Update `sendCommand` signature + implementation in `src/high-level/user.ts`.
2. Update reference test `tests/reference/commands.spec.ts` to use the new option.
3. Drop the gap-catalog row from `tests/reference/README.md`.
4. Add a high-level test for the new path in `tests/high-level/user-actor.spec.ts`.
5. Lint, typecheck, full suite.

Rollback: revert the signature change. Reference test goes back to `sendText` workaround.

## Open Questions

- **Should we deprecate the `args?: string` form in favor of an options-only future?** Not in this proposal. If/when the API gets more options on commands (e.g. `args` as array, `parse_mode` for HTML-styled commands, custom `entities`), we can revisit. **Default for now: keep the current shape stable.**
