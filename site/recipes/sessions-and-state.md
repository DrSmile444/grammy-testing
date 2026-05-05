# Sessions & State

## Session counter with mockSession

`mockSession` injects a mutable session object into `ctx.session`. You can pre-seed it and
read/write it directly in your tests.

**Bot:**

```ts
// bot.ts
import { Bot, session } from 'grammy';
import type { SessionContext } from '@grammyjs/testing';

export interface CounterSession {
  count: number;
}
export type CounterContext = SessionContext<CounterSession>;

export function createBot() {
  const bot = new Bot<CounterContext>('token');

  bot.use(session({ initial: (): CounterSession => ({ count: 0 }) }));

  bot.command('count', async (ctx) => {
    ctx.session.count += 1;
    await ctx.reply(`Count: ${ctx.session.count}`);
  });

  bot.command('reset', async (ctx) => {
    ctx.session.count = 0;
    await ctx.reply('Counter reset.');
  });

  return bot;
}
```

**Test with mockSession:**

```ts
import { mockSession, prepareBot } from '@grammyjs/testing';
import { Bot } from 'grammy';
import { describe, expect, it } from 'vitest';
import type { CounterContext, CounterSession } from './bot';

describe('session counter', () => {
  it('increments on each /count', async () => {
    const { session, mockSessionMiddleware } = mockSession<CounterSession, CounterContext>({ count: 0 });

    const bot = new Bot<CounterContext>('token');
    bot.use(mockSessionMiddleware); // inject before handlers

    bot.command('count', async (ctx) => {
      ctx.session.count += 1;
      await ctx.reply(`Count: ${ctx.session.count}`);
    });

    const { chats } = await prepareBot(bot);
    const user = chats.newUser();

    await user.sendCommand('/count');
    await user.sendCommand('/count');
    await user.sendCommand('/count');

    expect(user.replies.lastOrThrow().text).toBe('Count: 3');
    expect(session.count).toBe(3); // direct read
  });

  it('starts from a pre-set value', async () => {
    const { mockSessionMiddleware } = mockSession<CounterSession, CounterContext>({ count: 9 });
    const bot = new Bot<CounterContext>('token');
    bot.use(mockSessionMiddleware);
    bot.command('count', async (ctx) => {
      ctx.session.count += 1;
      await ctx.reply(`Count: ${ctx.session.count}`);
    });

    const { chats } = await prepareBot(bot);
    const user = chats.newUser();

    await user.sendCommand('/count');

    expect(user.replies.lastOrThrow().text).toBe('Count: 10');
  });
});
```

## Per-chat session with mockChatSession

```ts
import { mockChatSession } from '@grammyjs/testing';

interface ChatSettings {
  language: string;
}

const { chatSession, mockChatSessionMiddleware } = mockChatSession<ChatSettings, MyContext>({ language: 'uk' });

bot.use(mockChatSessionMiddleware);
```

## ctx.state via prepareComposer

Use `state` in `prepareComposer` options to pre-populate `ctx.state` for every update:

```ts
import { prepareComposer } from '@grammyjs/testing';
import { Composer } from 'grammy';

interface MyState {
  isAdmin: boolean;
}

const composer = new Composer<MyContext>();

composer.command('admin-action', async (ctx) => {
  if (!ctx.state.isAdmin) {
    await ctx.reply('Forbidden.');
    return;
  }
  await ctx.reply('Done!');
});

const { chats } = await prepareComposer(composer, {
  state: { isAdmin: true },
});

const user = chats.newUser();
await user.sendCommand('/admin-action');
expect(user.replies.lastOrThrow().text).toBe('Done!');
```
