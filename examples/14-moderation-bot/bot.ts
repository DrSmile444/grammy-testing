import { Bot } from 'grammy';

/**
 * Creates a bot with /ban and /restrict moderation commands.
 * @returns A configured Bot instance.
 */
export function createModerationBot() {
  const bot = new Bot('token');

  bot.command('ban', async (ctx) => {
    const args = ctx.match;

    if (!args) {
      await ctx.reply('Usage: /ban <user_id>');

      return;
    }

    const targetId = Number(args);

    if (!Number.isFinite(targetId)) {
      await ctx.reply('Invalid user ID.');

      return;
    }

    await ctx.banChatMember(targetId);
    await ctx.reply(`User ${String(targetId)} has been banned.`);
  });

  bot.command('restrict', async (ctx) => {
    const args = ctx.match;

    if (!args) {
      await ctx.reply('Usage: /restrict <user_id>');

      return;
    }

    const targetId = Number(args);

    await ctx.restrictChatMember(targetId, { can_send_messages: false });
    await ctx.reply(`User ${String(targetId)} has been restricted.`);
  });

  return bot;
}
