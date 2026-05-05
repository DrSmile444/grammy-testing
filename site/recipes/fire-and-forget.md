# Fire & Forget

## The problem

grammY handlers sometimes start API calls without `await`:

```ts
bot.on('message:text', async (ctx) => {
  await ctx.reply('Got it!');

  // fire-and-forget — handler returns immediately
  void ctx.api.sendMessage(LOG_CHANNEL_ID, `log: ${ctx.message.text}`);
});
```

When `user.sendText('hello')` returns, `ctx.reply` has been captured. But the log call is still
in-flight as a floating promise. If you assert immediately, `chats.outgoing.length` will be 1,
not 2.

## The fix: await chats.idle()

`chats.idle()` returns a promise that resolves when all in-flight transformer promises have
settled, including chains triggered by those promises.

```ts
const LOG_CHANNEL_ID = -100_999;

bot.on('message:text', async (ctx) => {
  await ctx.reply('Got it!');
  void ctx.api.sendMessage(LOG_CHANNEL_ID, `log: ${ctx.message.text}`);
});

const { chats } = await prepareBot(bot);

// Register the channel actor so chats knows about it
chats.newChannel({ id: LOG_CHANNEL_ID });

const user = chats.newUser();

await user.sendText('hello');
await chats.idle(); // wait for the log call to settle

expect(chats.outgoing.getMethods()).toContain('sendMessage');
expect(chats.outgoing.length).toBe(2); // reply + log
```

## What idle() does NOT track

`idle()` tracks promises that flow through the transformer. Work deferred via `setTimeout` or
`setInterval` is **not** tracked:

```ts
bot.on('message:text', async (ctx) => {
  await ctx.reply('Processing...');

  setTimeout(async () => {
    // This runs after a delay — idle() cannot wait for it
    await ctx.api.sendMessage(LOG_CHANNEL_ID, 'done');
  }, 1000);
});
```

For this pattern, advance time manually:

```ts
// In Vitest with fake timers:
vi.useFakeTimers();

await user.sendText('trigger');
vi.runAllTimers();
await chats.idle(); // flush any promises triggered by the timer

expect(chats.outgoing.length).toBe(2);
```

## Logging channel pattern

A common use case: every user message is forwarded to a private log channel.

```ts
const LOG = -100_1234;

bot.on('message:text', async (ctx) => {
  await ctx.reply('Received!');
  void ctx.api.sendMessage(LOG, `[${ctx.from?.username}] ${ctx.message.text}`);
});

// Test:
const { chats } = await prepareBot(bot);
const logChannel = chats.newChannel({ id: LOG });
const user = chats.newUser({ username: 'alice' });

await user.sendText('hello world');
await chats.idle();

// The log message was captured
const logMsg = logChannel.messages.lastOrThrow();
expect(logMsg.text).toContain('[alice]');
expect(logMsg.text).toContain('hello world');
```

## Chaining fire-and-forget

idle() also waits for promises that are chained off the initial ones. If a fire-and-forget
call triggers another API call, idle() waits for that too.
