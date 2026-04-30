import { Bot, type Composer, type Context } from 'grammy';

import type { Chats } from './chats';
import { prepareBot, type PrepareOptions } from './prepare-bot';

export interface PrepareWithConstructorOptions<TContext extends Context = Context> extends PrepareOptions {
  ContextConstructor?: new (...args: ConstructorParameters<typeof Context>) => TContext;
}

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
 * @param options - Optional canned-response config and custom context constructor.
 * @returns Same shape as {@link prepareBot}: `{ chats }`.
 */
export async function prepareComposer<TContext extends Context = Context>(
  composer: Composer<TContext>,
  options: PrepareWithConstructorOptions<TContext> = {},
): Promise<PrepareComposerReturn<TContext>> {
  const bot = new Bot<TContext>('test-token', {
    ContextConstructor: options.ContextConstructor,
  });

  bot.use(composer);

  return prepareBot<TContext>(bot, options);
}
