import { Bot } from 'grammy';

/**
 * Creates a bot that replies with file details when a document is received.
 * @returns A configured Bot instance.
 */
export function createDocumentBot() {
  const bot = new Bot('token');

  bot.on('message:document', async (ctx) => {
    const { file_id: fileId, mime_type: mimeType } = ctx.message.document;

    await ctx.reply(`File ID: ${fileId}\nMIME type: ${mimeType ?? 'unknown'}`);
  });

  return bot;
}
