import { Bot } from 'grammy';

/**
 * Creates a bot that echoes back every text message it receives.
 * @returns A configured Bot instance.
 */
export function createEchoBot() {
  const bot = new Bot('token');

  bot.on('message:text', async (ctx) => {
    await ctx.reply(ctx.message.text);
  });

  return bot;
}
