import { Bot } from 'grammy';

/**
 * Creates a bot that greets users by name on /greet.
 * @returns A configured Bot instance.
 */
export function createGreetingBot() {
  const bot = new Bot('token');

  bot.command('greet', async (ctx) => {
    const name = ctx.from?.first_name ?? 'stranger';

    await ctx.reply(`Hello, ${name}!`);
  });

  return bot;
}
