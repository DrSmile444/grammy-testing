import { Bot } from 'grammy';

/**
 * Creates a moderation bot that strips reactions from a message (Bot API 10.0) when an admin
 * replies to it with `/clearreactions`.
 * @returns A configured Bot instance.
 */
export function createReactionRemovalBot() {
  const bot = new Bot('token');

  bot.command('clearreactions', async (ctx) => {
    const target = ctx.message?.reply_to_message;

    if (target === undefined) {
      await ctx.reply('Reply to a message to clear its reactions.');

      return;
    }

    await ctx.api.raw.deleteMessageReaction({ chat_id: ctx.chat.id, message_id: target.message_id });
    await ctx.reply('Reactions cleared.');
  });

  return bot;
}
