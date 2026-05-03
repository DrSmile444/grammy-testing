import { Bot } from 'grammy';

export const CORRECT_OPTION = 1;

/**
 * Creates a bot that sends a quiz poll and tracks answers.
 * @returns A configured Bot instance.
 */
export function createPollBot() {
  const bot = new Bot('token');

  bot.command('poll', async (ctx) => {
    await ctx.replyWithPoll('What is 2 + 2?', ['3', '4', '5'], {
      type: 'quiz',
      correct_option_ids: [CORRECT_OPTION],
      is_anonymous: false,
    });
  });

  bot.on('poll_answer', async (ctx) => {
    const userId = ctx.pollAnswer.user?.id;

    if (userId === undefined) {
      return;
    }

    const isCorrect = ctx.pollAnswer.option_ids.includes(CORRECT_OPTION);

    await ctx.api.sendMessage(userId, isCorrect ? 'Correct!' : 'Try again!');
  });

  return bot;
}
