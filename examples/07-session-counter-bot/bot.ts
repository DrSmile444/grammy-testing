import type { SessionContext } from '@grammyjs/testing';
import { Bot, session } from 'grammy';

export interface CounterSession {
  count: number;
}

export type CounterContext = SessionContext<CounterSession>;

/**
 * Creates a bot that counts user messages using session storage.
 * @returns A configured Bot instance with session middleware applied.
 */
export function createSessionCounterBot() {
  const bot = new Bot<CounterContext>('token');

  bot.use(
    session({
      initial: (): CounterSession => ({ count: 0 }),
    }),
  );

  bot.command('count', async (ctx) => {
    ctx.session.count += 1;
    await ctx.reply(`Count: ${String(ctx.session.count)}`);
  });

  bot.command('reset', async (ctx) => {
    ctx.session.count = 0;
    await ctx.reply('Counter reset.');
  });

  return bot;
}
