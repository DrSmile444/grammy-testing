import { Bot } from 'grammy';

/**
 * Creates a bot that streams a rich-message draft (Bot API 10.1) and then sends the final rich
 * message. Mirrors the "stream AI-generated reply" pattern: a draft preview followed by the
 * persisted message.
 * @returns A configured Bot instance.
 */
export function createRichMessageBot() {
  const bot = new Bot('token');

  bot.on('message:text', async (ctx) => {
    // Ephemeral 30-second preview while the answer is "generated".
    await ctx.api.sendRichMessageDraft(ctx.chat.id, 1, { html: '<b>Thinking…</b>' });

    // Persist the finished rich message.
    await ctx.api.sendRichMessage(ctx.chat.id, { html: `<b>You said:</b> ${ctx.message.text}` });
  });

  return bot;
}
