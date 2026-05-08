# Auto-Retry Plugin

Testing bots that use [@grammyjs/auto-retry](https://grammy.dev/plugins/auto-retry) works with
`@grammyjs/testing` v0.23.0 and later.

## How auto-retry works

`autoRetry()` is a transformer that wraps every API call. If the inner transformer returns a
not-ok response with a `parameters.retry_after` value, `autoRetry` waits that many seconds and
retries. It continues until the call succeeds, or until `maxRetryAttempts` is exceeded.

## Transformer ordering

Install `autoRetry()` before `prepareBot`:

```ts
import { autoRetry } from '@grammyjs/auto-retry';
import { Bot } from 'grammy';
import { prepareBot } from '@grammyjs/testing';

const bot = new Bot('token');
bot.api.config.use(autoRetry({ maxRetryAttempts: 3, maxDelaySeconds: 60 }));

const { chats } = await prepareBot(bot);
```

With the v0.23.0 chain fix, `autoRetry` genuinely participates in every API call. Before this
fix it was silently skipped.

## Behaviour in tests

For normal (successful) API calls, `autoRetry` is transparent — it passes the ok response
through immediately with no delay.

The library's `failNext` / `failAll` helpers throw a `GrammyError` directly. Since `autoRetry`
does not wrap `prev()` in a try-catch, thrown errors propagate immediately without retry. This
matches the intent of `failNext`: forcing an error in a test should produce that error, not
trigger retry logic.

```ts
// failNext throws — autoRetry does NOT retry this
chats.outgoing.failNext('sendMessage', { code: 403, description: 'Forbidden' });

bot.on('message:text', async (ctx) => {
  try {
    await ctx.reply('Hello'); // throws GrammyError 403
  } catch (err) {
    // handle the 403 in your test
  }
});
```

## Testing retry behaviour intentionally

If you want to exercise actual retry paths — for example, validating that your bot eventually
succeeds after multiple rate-limit responses — you need your bot to implement the retry logic
itself (e.g. a manual retry loop with `failNext` + a success after), rather than relying on
`autoRetry`'s timing-based retry. This keeps tests deterministic and avoids real `setTimeout`
delays in your test suite.

## Timing caveat

In production, `autoRetry` calls `setTimeout` to wait `retry_after` seconds before retrying.
If you install `autoRetry` with a short `maxDelaySeconds` (or `maxDelaySeconds: 0`), no delay
is inserted and your tests run at full speed.

See the full runnable example in [`examples/23-auto-retry-bot/`](https://github.com/DrSmile444/grammy-testing/tree/main/examples/23-auto-retry-bot).
