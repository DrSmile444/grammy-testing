import { Bot, type Composer, type Context } from 'grammy';

import type { Chats } from './chats';
import { prepareBot, type PrepareOptions } from './prepare-bot';

export interface PrepareComposerReturn<TContext extends Context = Context> {
  chats: Chats<TContext>;
}

/**
 * Initialize a single {@link Composer} for in-process testing. Wraps
 * the composer in an internal {@link Bot} and delegates to
 * {@link prepareBot}.
 *
 * Use when the unit under test is a self-contained composer rather
 * than a fully assembled bot.
 * @param composer - The {@link Composer} instance under test.
 * @param options - Optional canned-response config.
 * @returns Same shape as {@link prepareBot}: `{ chats }`.
 */
export async function prepareComposer<TContext extends Context = Context>(
  composer: Composer<TContext>,
  options: PrepareOptions = {},
): Promise<PrepareComposerReturn<TContext>> {
  const bot = new Bot<TContext>('test-token');

  bot.use(composer);

  return prepareBot<TContext>(bot, options);
}
