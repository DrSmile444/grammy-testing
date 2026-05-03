## Context

`channel.postMessageTo(target, text, options)` is the only send verb in the library that returns
`void`. Since v0.15.0 all `User` send verbs return `Promise<Message>`, and `postRelayMessage`
(v0.16.0) also returns `Promise<Message>`. The `postMessageTo` method predates both changes and was
not updated alongside them. Users writing "post then reply" test sequences have no way to chain off
the returned message without capturing it separately.

`src/high-level/channel.ts` already constructs a local `message` constant before calling
`bot.handleUpdate`; returning it is a one-line change.

## Goals / Non-Goals

**Goals:**

- Return `Promise<Message>` from `postMessageTo` (consistency + usability)
- Accept `reply_to_message?: Partial<Message> & { message_id: number }` in options, with auto-fill
  of `date` and `chat` when absent (mirrors `sendText` and `postRelayMessage` behaviour)

**Non-Goals:**

- No other options fields are added or changed
- No changes to other `Channel` methods (`changeMemberStatus`, etc.)
- No changes to `User` or `Group`/`Supergroup` actors

## Decisions

**Return the already-constructed `message` constant.**
The `message` object is built synchronously before `bot.handleUpdate`. Returning it requires
changing the signature and adding `return message` — zero re-architecture needed.

**Reuse the same partial-shape auto-fill pattern from `sendText`.**
`sendText` does:

```ts
const filled = {
  date: Math.floor(Date.now() / 1000),
  chat: targetChat,
  ...options.reply_to_message,
} as Message;
```

`postMessageTo` uses `target.toTelegramChat()` as `chat`, so the fill is:

```ts
reply_to_message: options.reply_to_message
  ? ({ date: Math.floor(Date.now() / 1000), chat: target.toTelegramChat(), ...options.reply_to_message } as Message)
  : undefined,
```

This avoids a new helper function and is self-contained in the method.

**Keep the options type inline (no named export for now).**
The options object is simple (`messageId?`, `reply_to_message?`). Exporting a named type can wait
until a caller needs to reference it externally.

## Risks / Trade-offs

[Callers that typed the return as `void`] → Returning `Message` is backwards-compatible; ignoring
a return value is always valid in TypeScript and JavaScript.

[Partial `reply_to_message` in `postMessageTo` mirrors `sendText`] → If the auto-fill semantics
ever change, both methods must be updated consistently. Acceptable — there is no abstraction yet
to share between them.
