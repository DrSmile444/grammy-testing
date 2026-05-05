## Why

`user.sendCommand(cmd, args?)` defaults to a private chat with no override. Sending a command into a group/supergroup currently requires falling back to `user.sendText(cmd, { chat: group, entities: [{ type: 'bot_command', offset: 0, length: <cmd.length> }] })` — a manual reconstruction of the `bot_command`-entity computation that `sendCommand` does for free. The reference suite documents this in one of five remaining gap-catalog rows. Closing it is a single-method extension and removes the most superficial of the v0.2.x gaps.

## What Changes

- **Add an optional third parameter to `user.sendCommand`:** `sendCommand(command, args?, options?)` where `options.chat` overrides the default destination. Backward compatible — existing call sites (1-arg and 2-arg forms) keep working unchanged.
- **Implementation threads through `sendText`:** the verb already builds the `bot_command` entity and delegates the rest to `sendText`; we add the `options.chat` value into the `sendText` call.
- **Reference suite cleanup:**
  - `tests/reference/commands.spec.ts` test "command in a supergroup" rewritten from `user.sendText('/start', { chat: group, entities: [...] })` to `user.sendCommand('/start', undefined, { chat: group })`. The `// v0.2.x gap` tag and the file-header gap note removed.
  - `tests/reference/README.md` gap-catalog: row `Command sent into a supergroup` removed. Catalog drops from 5 rows to 4.
- **No new low-level surface.** No new exports. No new files in `src/`.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `user-actor`: the `sendCommand` requirement gets a new optional `options` parameter and a scenario for non-private destinations. The existing four scenarios (private dispatch, args parsing, leading-slash auto-add, async settle) stay unchanged.

## Impact

- **Source layout**: one method's signature widens by an optional third argument in `src/high-level/user.ts`. ~5 lines changed.
- **Tests**: one new high-level test added (`tests/high-level/user-actor.spec.ts` gets a "sendCommand into a group" case); reference test rewritten in place.
- **Public API**: backward-compatible signature extension. Existing `sendCommand('/start')` and `sendCommand('/lang', 'en')` calls keep working.
- **Reference-suite gap catalog**: drops to **4 rows** (was 5; before that 7). Remaining gaps after this lands: forwarded messages, edited messages, nested reply chains, caption-bearing single message.
- **Out of scope**: command parsing inside the verb (e.g. splitting `'/lang en us'` into args array) — current single-string `args` keeps working unchanged. Multi-arg parsing is a separate concern if it ever comes up.
