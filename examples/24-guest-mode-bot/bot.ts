import { Bot } from 'grammy';

/**
 * Creates a bot that replies to guest messages (Bot API 10.0 guest mode) using
 * `answerGuestQuery`. A guest is a user who messages the bot in a chat the bot is not a member of.
 * @returns A configured Bot instance.
 */
export function createGuestModeBot() {
  const bot = new Bot('token');

  bot.use(async (ctx, next) => {
    const guestMessage = ctx.update.guest_message;

    if (guestMessage?.guest_query_id !== undefined) {
      await ctx.api.answerGuestQuery(guestMessage.guest_query_id, {
        type: 'article',
        id: '1',
        title: 'Guest reply',
        input_message_content: { message_text: `Hello, ${guestMessage.from.first_name}!` },
      });

      return;
    }

    await next();
  });

  return bot;
}
