import { hydrate, hydrateApi, type HydrateFlavor } from '@grammyjs/hydrate';
import { Bot, type Context } from 'grammy';

type MyContext = HydrateFlavor<Context>;

/**
 * Creates a bot that echoes text messages and reports the sent message ID using `@grammyjs/hydrate`.
 * @returns A configured Bot instance.
 */
export function createHydrateBot() {
  const bot = new Bot<MyContext>('token');

  bot.api.config.use(hydrateApi());
  bot.use(hydrate<Context>());

  bot.on('message:text', async (ctx) => {
    const sent = await ctx.reply(`You said: ${ctx.message.text}`);
    const messageId = String(sent.message_id);

    await ctx.reply(`Message ID: ${messageId}`);
  });

  return bot;
}
