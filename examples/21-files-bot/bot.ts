import { hydrateFiles } from '@grammyjs/files';
import { Bot, type Context } from 'grammy';

/**
 *
 */
export function createFilesBot() {
  const bot = new Bot<Context>('token');

  bot.api.config.use(hydrateFiles(bot.token));

  bot.on('message:document', async (ctx) => {
    const file = await ctx.getFile();
    const url = (file as unknown as { getUrl: () => string }).getUrl();

    await ctx.reply(`Download your file: ${url}`);
  });

  return bot;
}
