import { Bot } from 'grammy';

/**
 * Creates a bot that replies differently based on chat type.
 * @returns A configured Bot instance.
 */
export function createChatTypeFilterBot() {
  const bot = new Bot('token');

  bot.chatType('private').command('info', async (ctx) => {
    await ctx.reply('You are in a private chat.');
  });

  bot.chatType(['group', 'supergroup']).command('info', async (ctx) => {
    await ctx.reply(`You are in a group: ${ctx.chat.title}`);
  });

  return bot;
}
