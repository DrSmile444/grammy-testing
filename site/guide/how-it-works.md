# How It Works

## The transformer

grammY has a middleware-like system for the **outgoing** API client called
[transformers](https://grammy.dev/advanced/transformers). `prepareBot` installs one that:

1. **Captures** every outgoing call into the `OutgoingRequests` store.
2. **Checks overrides** — if `failNext` or `respondNext` were called, applies them for this call.
3. **Returns a canned response** — either from your `responses` map or the default `{ ok: true, result: true }`.
4. **Tracks the promise** via `IdleTracker` so `chats.idle()` can wait for fire-and-forget calls.
5. **Calls `onCapture`** which drives the high-level `Chats` orchestrator: routes the captured
   call to per-user `replies`/`edits`/`actions` and per-chat `messages`/`deletions` logs.

```
Your handler code
  │  ctx.reply('Hi!')
  ▼
grammY API client
  │  sendMessage({ chat_id, text })
  ▼
Transformer (installed by prepareBot)
  ├─ capture → OutgoingRequests store
  ├─ override check (failNext / respondNext)
  ├─ track promise → IdleTracker
  ├─ onCapture → Chats.deriveFromCapture()
  │    ├─ → user.replies log
  │    ├─ → chat.messages log
  │    └─ → user.edits / user.actions / chat.deletions
  └─ return canned response → { ok: true, result: { message_id, ... } }
```

No real network call is made. grammY's internal `sendMessage` resolves with the canned value.

## Two-layer design

The library exposes two layers:

| Layer          | Import path                | When to use                      |
| -------------- | -------------------------- | -------------------------------- |
| **High-level** | `grammy-testing`           | Most tests — readable actor API  |
| **Low-level**  | `grammy-testing/low-level` | Edge cases, custom update shapes |

High-level: you work with `User`, `Group`, `Channel` actors. You call `user.sendText('hi')` and
assert on `user.replies.lastOrThrow().text`. Everything is named after Telegram domain concepts.

Low-level: you build raw `Update` objects manually using `GenericMockUpdate` subclasses, inspect
`chats.outgoing.requests` directly, or simulate API errors with `failNext`.

## idle() — waiting for fire-and-forget calls

grammY handlers sometimes do fire-and-forget work:

```ts
bot.on('message:text', async (ctx) => {
  await ctx.reply('Got it!');

  // fire-and-forget: no await
  void ctx.api.sendMessage(LOG_CHANNEL_ID, `log: ${ctx.message.text}`);
});
```

The handler returns after `ctx.reply`, but the log call is still in-flight. If you assert
immediately, the log call hasn't been captured yet.

`chats.idle()` returns a promise that resolves when all in-flight transformer promises have
settled, including chains triggered by those promises:

```ts
await user.sendText('hello');
await chats.idle(); // wait for the fire-and-forget log call

expect(chats.outgoing.getMethods()).toContain('sendMessage');
```

::: warning setTimeout is not tracked
`idle()` only tracks promises that flow through the transformer. Work deferred via `setTimeout`
or `setInterval` is **not** tracked. If your handler delays work with `setTimeout`, you need
to advance time manually (e.g. `vi.runAllTimers()` in Vitest) before asserting.
:::

## Bot info fixture

`prepareBot` pre-populates `bot.botInfo` with a generic fixture so `bot.init()` skips its
`getMe` network call. The fixture looks like:

```ts
{
  id: 12345,
  is_bot: true,
  first_name: 'Test Bot',
  username: 'test_bot',
  can_join_groups: true,
  can_read_all_group_messages: false,
  supports_inline_queries: false,
}
```

Your handlers can access `ctx.me` and get this value consistently.

## Canned responses

By default, every API call resolves to `{ ok: true, result: true }` (or a sensible shape for
methods that return rich objects). You can override any method:

```ts
const { chats } = await prepareBot(bot, {
  responses: {
    getChat: { id: -100123, type: 'supergroup', title: 'My Group' },
    getChatMember: (payload) => ({
      status: payload.user_id === 42 ? 'administrator' : 'member',
    }),
  },
});
```

See [Response Mocking](/low-level/response-mocking) for details.
