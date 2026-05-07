import { autoRetry } from '@grammyjs/auto-retry';
import { Bot, GrammyError } from 'grammy';

/**
 * Creates a bot that broadcasts a message to a fixed set of chats using `@grammyjs/auto-retry`.
 * @returns A configured Bot instance.
 */
export function createAutoRetryBot() {
  const bot = new Bot('token');

  bot.api.config.use(autoRetry({ maxRetryAttempts: 3, maxDelaySeconds: 60 }));

  bot.command('broadcast', async (ctx) => {
    const targets = [1001, 1002, 1003];
    const failed: number[] = [];

    for (const chatId of targets) {
      try {
        // eslint-disable-next-line no-await-in-loop -- sequential broadcast
        await bot.api.sendMessage(chatId, 'Broadcast message!');
      } catch (error) {
        if (error instanceof GrammyError) {
          failed.push(chatId);
        }
      }
    }

    await (failed.length === 0
      ? ctx.reply('Broadcast sent successfully!')
      : ctx.reply(`Broadcast done. Failed for ${String(failed.length)} chat(s).`));
  });

  return bot;
}
