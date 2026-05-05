import { Bot } from 'grammy';

/**
 * Creates a bot that forwards /post commands to a target channel.
 * @param channelId - The Telegram channel ID to post messages to.
 * @returns A configured Bot instance.
 */
export function createChannelPostBot(channelId: number) {
  const bot = new Bot('token');

  bot.command('post', async (ctx) => {
    const text = ctx.match;

    if (!text) {
      await ctx.reply('Usage: /post <text>');

      return;
    }

    await ctx.api.sendMessage(channelId, text);
    await ctx.reply('Posted to channel!');
  });

  return bot;
}
