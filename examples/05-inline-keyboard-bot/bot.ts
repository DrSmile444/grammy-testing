import { Bot, InlineKeyboard } from 'grammy';

/**
 * Creates a bot that presents an inline keyboard menu on /menu.
 * @returns A configured Bot instance.
 */
export function createInlineKeyboardBot() {
  const bot = new Bot('token');

  bot.command('menu', async (ctx) => {
    const keyboard = new InlineKeyboard().text('Yes', 'answer:yes').text('No', 'answer:no');

    await ctx.reply('Do you like grammY?', { reply_markup: keyboard });
  });

  bot.callbackQuery('answer:yes', async (ctx) => {
    await ctx.editMessageText('Great choice!');
    await ctx.answerCallbackQuery();
  });

  bot.callbackQuery('answer:no', async (ctx) => {
    await ctx.editMessageText('Give it a try!');
    await ctx.answerCallbackQuery();
  });

  return bot;
}
