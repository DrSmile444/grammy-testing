import { Bot } from 'grammy';

/**
 * Creates a bot that thanks users when they react to its messages.
 * @returns A configured Bot instance.
 */
export function createReactionsBot() {
  const bot = new Bot('token');

  bot.on('message:text', async (ctx) => {
    await ctx.reply('Message received! React to this with an emoji.');
  });

  bot.on('message_reaction', async (ctx) => {
    const reactions = ctx.messageReaction.new_reaction;
    const emojis = reactions.map((reaction) => (reaction.type === 'emoji' ? reaction.emoji : '?')).join(' ');

    await ctx.api.sendMessage(ctx.messageReaction.chat.id, `Thanks for reacting: ${emojis}`);
  });

  return bot;
}
