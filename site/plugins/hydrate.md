# Hydrate Plugin

Testing bots that use [@grammyjs/hydrate](https://grammy.dev/plugins/hydrate) works out of the
box with `@grammyjs/testing` v0.23.0 and later.

## Two installation paths

`@grammyjs/hydrate` offers two distinct installation mechanisms:

| Path                      | API                                | Effect                                                                                                |
| ------------------------- | ---------------------------------- | ----------------------------------------------------------------------------------------------------- |
| **Bot-level transformer** | `bot.api.config.use(hydrateApi())` | Hydrates return values of `bot.api.*` calls (e.g., `sendMessage` returns a `Message` with `delete()`) |
| **Context middleware**    | `bot.use(hydrate())`               | Hydrates the context object (e.g., `ctx.message.delete()`, `ctx.message.forward()`)                   |

Most bots use both. Install both before calling `prepareBot`.

## Transformer ordering

`hydrateApi()` is a bot-level transformer. Before v0.23.0, the library's mock transformer was
outermost and `hydrateApi()` was silently skipped. The fix in v0.23.0 positions the library
transformer innermost so `hydrateApi()` runs and can hydrate synthetic responses.

`hydrate()` is a context-level middleware that runs per-request. It was never affected by the
ordering issue.

## Setup

```ts
import { hydrate, hydrateApi } from '@grammyjs/hydrate';
import { Bot } from 'grammy';
import { prepareBot } from '@grammyjs/testing';

const bot = new Bot('token');

bot.api.config.use(hydrateApi()); // before prepareBot ✓
bot.use(hydrate()); // context middleware ✓

const { chats } = await prepareBot(bot);
```

## Synthetic message shape

`hydrateApi()` checks that the response has both `message_id` and `chat` before adding methods.
The library's default `sendMessage` response includes both fields when the message is sent to a
registered chat (created via `chats.newUser()`, `chats.newGroup()`, etc.):

```ts
{ message_id: <auto-incremented>, date: <unix>, chat: { id: ..., type: 'private' } }
```

If a chat is not registered, the response falls back to `true` (no hydration). Always register
chats with `chats.newUser()` or similar before dispatching updates.

## Example

```ts
import { hydrate, hydrateApi, type HydrateFlavor } from '@grammyjs/hydrate';
import { Bot, type Context } from 'grammy';
import { describe, expect, it } from 'vitest';
import { prepareBot } from '@grammyjs/testing';

type MyContext = HydrateFlavor<Context>;

describe('hydrate-bot', () => {
  it('ctx.reply() returns a hydrated message with delete()', async () => {
    const bot = new Bot<MyContext>('test-token');
    bot.api.config.use(hydrateApi());
    bot.use(hydrate<Context>());

    let sentMessage: any;

    bot.on('message:text', async (ctx) => {
      sentMessage = await ctx.reply('Hello!');
    });

    const { chats } = await prepareBot(bot);
    const user = chats.newUser();

    await user.sendText('trigger');

    expect(typeof sentMessage?.delete).toBe('function');
  });

  it('ctx.message.delete() is a function', async () => {
    const bot = new Bot<MyContext>('test-token');
    bot.use(hydrate<Context>());

    let deletePresent = false;

    bot.on('message:text', async (ctx) => {
      deletePresent = typeof ctx.message?.delete === 'function';
    });

    const { chats } = await prepareBot(bot);
    await chats.newUser().sendText('ping');

    expect(deletePresent).toBe(true);
  });
});
```

See the full runnable example in [`examples/22-hydrate-bot/`](https://github.com/DrSmile444/grammy-testing/tree/main/examples/22-hydrate-bot).
