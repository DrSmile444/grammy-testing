## Context

Two entangled gaps were confirmed across the real-world integration run:

1. **#32** — `user.sendCallbackQuery()` is absent. The only current `callback_query` dispatch path is
   `reply.clickButton()`, which requires a prior captured `Reply`. Cross-feature tests and tests where
   the keyboard lives in a different composer have no high-level path.
2. **#35** — `Reply.toCapturedMessage()` silently drops `reply_markup`. When `reply.clickButton()`
   constructs `callback_query.message`, the handler sees `ctx.callbackQuery.message.reply_markup === undefined`
   even though the Reply instance already stores the keyboard in `this.replyMarkup`.

The two gaps share the same `callback_query.message` construction path — fixing one opens the other.

## Goals / Non-Goals

**Goals:**

- Add `user.sendCallbackQuery(data, options?)` as a first-class dispatch verb on `User`
- Fix `Reply.toCapturedMessage()` to include `reply_markup` when the Reply stores a keyboard
- Both paths produce a well-formed `callback_query` update that passes `chatType('private')` and
  other grammY filters

**Non-Goals:**

- High-level log for `answerCallbackQuery` responses (gap #42 — separate change)
- Callback queries in group chats via `sendCallbackQuery` (not a confirmed use case; add via `options.chat` if needed)

## Decisions

### D1 — `sendCallbackQuery` signature

```ts
user.sendCallbackQuery(data: string, options?: SendCallbackQueryOptions): Promise<void>

interface SendCallbackQueryOptions {
  message?: Partial<Message> & { message_id?: number };
  chat?: PrivateChat | Group | Supergroup;
}
```

**Rationale:** `data` is required (the only mandatory field in a callback_query). `options.message`
is optional because the majority of tests just need to fire the callback — they don't need the
message context. When omitted, the library synthesizes a minimal message stub with
`chat: user's private chat` and a stable `message_id`. This ensures `chatType('private')` and
similar grammY filters work without any test boilerplate.

`options.chat` is a convenience shortcut that sets `message.chat` without requiring a full message
object — useful for tests that fire a group keyboard callback.

**Alternative considered:** Always require `message` — rejected because 80% of test callsites just
want to dispatch the data; forcing a message object is boilerplate with no safety payoff.

### D2 — `toCapturedMessage()` fix

Add `reply_markup: this.replyMarkup` to the object returned by `toCapturedMessage()`. The field is
already stored on every `Reply` instance via `this.replyMarkup`. No schema change needed — just
include it in the returned shape.

**Rationale:** `clickButton()` always calls `toCapturedMessage()` to build `callback_query.message`.
Including `reply_markup` there means `clickButton()` is fixed automatically with a one-line change
and no API surface change.

**Alternative considered:** Fix only in `clickButton()` — rejected because `toCapturedMessage()` is
a documented escape hatch and should always return the full captured state.

### D3 — Return type of `sendCallbackQuery`

Returns `Promise<void>`. Unlike `sendText`, a `callback_query` dispatch does not produce a user
message in the chat — it is a pure event. There is no `Message` to return.

### D4 — Auto-synthesized message_id

When `options.message` is absent or has no `message_id`, use `this.ctx.ids.nextMessageId()` to
generate a stable ID. This prevents `message_id: 0` or `message_id: undefined` reaching grammY
code that may read it.

## Risks / Trade-offs

- **chatType filter gotcha** — grammY's `chatType('private')` reads `ctx.update.callback_query.message.chat.type`.
  The auto-synthesized stub defaults to `type: 'private'`, which is correct for the common case but
  wrong for group keyboard callbacks. Document that `options.chat` (or `options.message.chat`) must
  be set explicitly for group callbacks.
- **Handlers reading `message.text`** — the auto-synthesized message has no `text`. Tests for
  handlers that inspect `ctx.callbackQuery.message.text` must pass an explicit `message`. This is
  intentional — there is no text to infer.
- **`toCapturedMessage()` shape change** — `reply_markup` was previously absent; handlers that
  assumed `undefined` will now see the keyboard. This is a bugfix not a behavior change, but worth
  noting.
