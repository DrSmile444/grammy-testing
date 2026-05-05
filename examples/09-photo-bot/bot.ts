import { Bot } from 'grammy';

/**
 * Creates a bot that acknowledges photo messages with a caption echo.
 * @returns A configured Bot instance.
 */
export function createPhotoBot() {
  const bot = new Bot('token');

  bot.on('message:photo', async (ctx) => {
    const caption = ctx.message.caption ?? 'no caption';

    await ctx.reply(`Got your photo! Caption: ${caption}`);
  });

  return bot;
}
