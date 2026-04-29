import { Bot, type Context, type Middleware } from 'grammy';

import type { Chats } from './chats';
import { prepareBot } from './prepare-bot';
import type { PrepareWithConstructorOptions } from './prepare-composer';

export interface PrepareMiddlewareReturn<TContext extends Context = Context> {
  chats: Chats<TContext>;
}

/**
 * Initialize a single grammY middleware function for in-process
 * testing. Wraps the middleware in an internal {@link Bot} and
 * delegates to {@link prepareBot}.
 *
 * Use when the unit under test is a single middleware function
 * (`(ctx, next) => ...`) rather than a composer or assembled bot.
 * @param middleware - The middleware under test.
 * @param options - Optional canned-response config and custom context constructor.
 * @returns Same shape as {@link prepareBot}: `{ chats }`.
 */
export async function prepareMiddleware<TContext extends Context = Context>(
  middleware: Middleware<TContext>,
  options: PrepareWithConstructorOptions<TContext> = {},
): Promise<PrepareMiddlewareReturn<TContext>> {
  const bot = new Bot<TContext>('test-token', {
    ContextConstructor: options.ContextConstructor,
  });

  bot.use(middleware);

  return prepareBot<TContext>(bot, options);
}
