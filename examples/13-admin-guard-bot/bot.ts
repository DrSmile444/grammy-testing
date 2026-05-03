import { Bot } from 'grammy';

/**
 * Creates a bot that restricts /admin_only commands to chat administrators.
 * @returns A configured Bot instance.
 */
export function createAdminGuardBot() {
  const bot = new Bot('token');

  bot.command('admin_only', async (ctx) => {
    const fromId = ctx.from?.id;

    if (fromId === undefined) {
      return;
    }

    const member = await ctx.getChatMember(fromId);
    const isAdmin = member.status === 'administrator' || member.status === 'creator';

    if (!isAdmin) {
      await ctx.reply('This command is for admins only.');

      return;
    }

    await ctx.reply('Admin command executed!');
  });

  return bot;
}
