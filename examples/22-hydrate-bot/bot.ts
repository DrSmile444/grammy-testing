import { hydrate, hydrateApi, type HydrateFlavor } from '@grammyjs/hydrate';
import { Bot, type Context } from 'grammy';

type MyContext = HydrateFlavor<Context>;

export function createHydrateBot() {
  const bot = new Bot<MyContext>('token');

  bot.api.config.use(hydrateApi());
  bot.use(hydrate<Context>());

  bot.on('message:text', async (ctx) => {
    const sent = await ctx.reply(`You said: ${ctx.message.text}`);
    const messageId = String((sent as unknown as { message_id?: number }).message_id ?? 0);

    await ctx.reply(`Message ID: ${messageId}`);
  });

  return bot;
}
