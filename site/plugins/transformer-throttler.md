# Transformer Throttler

[@grammyjs/transformer-throttler](https://grammy.dev/plugins/transformer-throttler) queues and
delays outgoing API calls to stay within Telegram's rate limits. It is a bot-level transformer
installed via `bot.api.config.use(throttler())`.

## Compatibility with the testing framework

`@grammyjs/transformer-throttler` is compatible with `@grammyjs/testing` v0.23.0 and later.
With the chain-ordering fix in v0.23.0, the throttler transformer is correctly positioned as an
outer transformer and participates in every API call.

## Timing caveat

In production, the throttler introduces real delays between API calls. In tests, those delays
still apply — `chats.idle()` (and any `await user.sendX(...)` call) will take longer than usual
because the throttler is waiting before forwarding calls to the library's mock transformer.

To keep tests fast, configure the throttler with permissive limits when testing:

```ts
import { throttler } from '@grammyjs/transformer-throttler';
import { Bot } from 'grammy';
import { prepareBot } from '@grammyjs/testing';

const bot = new Bot('token');

// Use very high limits in tests so the throttler never delays
bot.api.config.use(
  throttler({
    global: { maxConcurrent: Infinity, minTime: 0 },
    group: { maxConcurrent: Infinity, minTime: 0 },
    out: { maxConcurrent: Infinity, minTime: 0 },
  }),
);

const { chats } = await prepareBot(bot);
```

Alternatively, only install the throttler in non-test environments:

```ts
if (process.env.NODE_ENV !== 'test') {
  bot.api.config.use(throttler());
}
```

## No example provided

A meaningful throttler example would require asserting on timing behaviour, which is inherently
flaky in test suites. The documentation above covers the key caveat. For correct throttler
usage, refer to the [official plugin documentation](https://grammy.dev/plugins/transformer-throttler).
