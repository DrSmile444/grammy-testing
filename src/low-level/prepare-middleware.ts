import { Bot, type Context, type Middleware } from 'grammy';

import type { Chats } from './chats';
import { prepareBot, type PrepareOptions } from './prepare-bot';

export interface PrepareMiddlewareReturn {
  chats: Chats;
}

/**
 * Initialize a single grammY middleware function for in-process
 * testing. Wraps the middleware in an internal {@link Bot} and
 * delegates to {@link prepareBot}.
 *
 * Use when the unit under test is a single middleware function
 * (`(ctx, next) => ...`) rather than a composer or assembled bot.
 * @param middleware - The middleware under test.
 * @param options - Optional canned-response config.
 * @returns Same shape as {@link prepareBot}: `{ chats }`.
 */
export async function prepareMiddleware<TContext extends Context = Context>(
  middleware: Middleware<TContext>,
  options: PrepareOptions = {},
): Promise<PrepareMiddlewareReturn> {
  const bot = new Bot<TContext>('test-token');

  bot.use(middleware);

  return prepareBot<TContext>(bot, options);
}
