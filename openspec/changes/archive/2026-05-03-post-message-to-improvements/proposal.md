## Why

`channel.postMessageTo()` returns `void` and does not accept a `reply_to_message` option, making
it inconsistent with every other send verb in the library (which return `Promise<Message>` since
v0.15.0) and preventing the "post then reply" test pattern that works naturally with `sendText` and
`postRelayMessage`.

## What Changes

- `channel.postMessageTo()` return type changes from `Promise<void>` to `Promise<Message>`.
- A new `reply_to_message?: Partial<Message> & { message_id: number }` option is added to
  `postMessageTo`, following the same auto-fill pattern established by `sendText`: `date` and
  `chat` are populated from context when absent, and all caller-supplied fields are preserved.

## Capabilities

### New Capabilities

- `post-message-to-reply-support`: Adds `reply_to_message` option to `postMessageTo` with the
  same partial-shape + auto-fill semantics as `SendTextOptions.reply_to_message`.

### Modified Capabilities

- `relay-message-dispatch`: `postMessageTo` is the channel-side counterpart to `postRelayMessage`
  — the return-message behaviour is analogous, so the spec needs a delta clarifying that
  `channel.postMessageTo` also returns `Promise<Message>`.

## Impact

- `src/high-level/channel.ts` — `postMessageTo` return type and implementation
- `src/index.ts` — no public type changes needed (options type stays inline or can be exported)
- `tests/high-level/post-message-to-improvements.spec.ts` — new spec file
- `docs/CHANGELOG.md` + `package.json` / `jsr.json` — version bump to 0.17.0
