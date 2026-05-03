import { Bot } from 'grammy';

/**
 * Creates a bot that handles inline button callback queries.
 * @returns A configured Bot instance.
 */
export function createCallbackQueryBot() {
  const bot = new Bot('token');

  bot.callbackQuery(/^action:(.+)$/, async (ctx) => {
    const action = ctx.match[1];

    await ctx.answerCallbackQuery(`Action: ${action}`);
    await ctx.reply(`You triggered: ${action}`);
  });

  bot.callbackQuery('ping', async (ctx) => {
    await ctx.answerCallbackQuery('Pong!');
    await ctx.reply('pong');
  });

  return bot;
}
