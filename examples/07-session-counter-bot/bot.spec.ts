import { Bot, session } from 'grammy';
import { describe, expect, it } from 'vitest';

import { mockSession, prepareBot } from 'grammy-testing';

import type { CounterContext, CounterSession } from './bot';

describe('session-counter-bot', () => {
  it('increments the counter on each /count command', async () => {
    const { session: counterSession, mockSessionMiddleware } = mockSession<CounterSession, CounterContext>({ count: 0 });

    const bot = new Bot<CounterContext>('token');

    bot.use(mockSessionMiddleware);

    bot.command('count', async (ctx) => {
      ctx.session.count += 1;
      await ctx.reply(`Count: ${String(ctx.session.count)}`);
    });

    const { chats } = await prepareBot(bot);
    const user = chats.newUser();

    await user.sendCommand('/count');

    expect(user.replies.lastOrThrow().text).toBe('Count: 1');
    expect(counterSession.count).toBe(1);
  });

  it('session mutation persists between dispatches', async () => {
    const { session: counterSession, mockSessionMiddleware } = mockSession<CounterSession, CounterContext>({ count: 0 });

    const bot = new Bot<CounterContext>('token');

    bot.use(mockSessionMiddleware);

    bot.command('count', async (ctx) => {
      ctx.session.count += 1;
      await ctx.reply(`Count: ${String(ctx.session.count)}`);
    });

    const { chats } = await prepareBot(bot);
    const user = chats.newUser();

    await user.sendCommand('/count');
    await user.sendCommand('/count');
    await user.sendCommand('/count');

    expect(user.replies.lastOrThrow().text).toBe('Count: 3');
    expect(counterSession.count).toBe(3);
  });

  it('injecting a pre-set count starts from that value', async () => {
    const { mockSessionMiddleware } = mockSession<CounterSession, CounterContext>({ count: 9 });

    const bot = new Bot<CounterContext>('token');

    bot.use(mockSessionMiddleware);

    bot.command('count', async (ctx) => {
      ctx.session.count += 1;
      await ctx.reply(`Count: ${String(ctx.session.count)}`);
    });

    const { chats } = await prepareBot(bot);
    const user = chats.newUser();

    await user.sendCommand('/count');

    expect(user.replies.lastOrThrow().text).toBe('Count: 10');
  });

  it('uses real session storage when the full bot factory is used', async () => {
    const { chats } = await prepareBot(
      (() => {
        const bot = new Bot<CounterContext>('token');

        bot.use(session({ initial: (): CounterSession => ({ count: 0 }) }));

        bot.command('count', async (ctx) => {
          ctx.session.count += 1;
          await ctx.reply(`Count: ${String(ctx.session.count)}`);
        });

        return bot;
      })(),
    );

    const user = chats.newUser();

    await user.sendCommand('/count');
    await user.sendCommand('/count');

    expect(user.replies.lastOrThrow().text).toBe('Count: 2');
  });
});
