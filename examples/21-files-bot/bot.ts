import { type FileFlavor, hydrateFiles } from '@grammyjs/files';
import { Bot, type Context } from 'grammy';

/**
 * Creates a bot that retrieves a download URL for any document sent to it using `@grammyjs/files`.
 * @returns A configured Bot instance.
 */
export function createFilesBot() {
  const bot = new Bot<FileFlavor<Context>>('token');

  bot.api.config.use(hydrateFiles(bot.token));

  bot.on('message:document', async (ctx) => {
    const file = await ctx.getFile();
    const url = file.getUrl();

    await ctx.reply(`Download your file: ${url}`);
  });

  return bot;
}
