import { Bot } from 'grammy';

/**
 * Creates a bot that handles /start and /help commands.
 * @returns A configured Bot instance.
 */
export function createCommandBot() {
  const bot = new Bot('token');

  bot.command('start', async (ctx) => {
    await ctx.reply('Welcome! Use /help to see available commands.');
  });

  bot.command('help', async (ctx) => {
    await ctx.reply('Commands:\n/start — welcome message\n/help — this list');
  });

  return bot;
}
