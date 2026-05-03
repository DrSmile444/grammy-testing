import { Bot } from 'grammy';

/**
 * Creates a bot that tracks message counts and posts a summary to a channel.
 * @param summaryChannelId - The channel to receive the summary message.
 * @returns A configured Bot instance.
 */
export function createMultiChatBot(summaryChannelId: number) {
  const messageCounts = new Map<number, number>();

  const bot = new Bot('token');

  bot.on('message:text', async (ctx, next) => {
    if (!ctx.message.text.startsWith('/')) {
      const userId = ctx.from.id;

      messageCounts.set(userId, (messageCounts.get(userId) ?? 0) + 1);
    }

    await next();
  });

  bot.command('summary', async (ctx) => {
    if (messageCounts.size === 0) {
      await ctx.reply('No messages tracked yet.');

      return;
    }

    const lines = [...messageCounts.entries()].map(([uid, count]) => `User ${String(uid)}: ${String(count)} message(s)`);
    const report = lines.join('\n');

    await ctx.api.sendMessage(summaryChannelId, `Summary:\n${report}`);
    await ctx.reply('Summary posted to channel.');
    messageCounts.clear();
  });

  return bot;
}
