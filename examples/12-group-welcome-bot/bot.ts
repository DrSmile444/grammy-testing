import { Bot } from 'grammy';

/**
 * Creates a bot that welcomes new members when they join a group.
 * @returns A configured Bot instance.
 */
export function createGroupWelcomeBot() {
  const bot = new Bot('token');

  bot.on('message:new_chat_members', async (ctx) => {
    await Promise.all(ctx.message.new_chat_members.map(async (member) => ctx.reply(`Welcome, ${member.first_name}! 👋`)));
  });

  return bot;
}
