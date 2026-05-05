import { Bot } from 'grammy';

export const WINNING_VALUE = 6;

/**
 * Creates a bot that plays a dice game — evaluates dice messages sent by users.
 * @returns A configured Bot instance.
 */
export function createDiceGameBot() {
  const bot = new Bot('token');

  bot.on('message:dice', async (ctx) => {
    const { value } = ctx.message.dice;
    const isWin = value === WINNING_VALUE;

    await ctx.reply(isWin ? `🎉 You rolled ${String(value)} — you win!` : `You rolled ${String(value)} — try again!`);
  });

  return bot;
}
