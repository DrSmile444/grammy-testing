import { Bot, type Context, type Middleware } from 'grammy';

import type { Chats } from '../high-level/chats';

import { mockState } from './mock-context-fields';
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
 * @param options - Optional canned-response config, custom context constructor, and initial `ctx.state`.
 * @returns Same shape as {@link prepareBot}: `{ chats }`.
 */
export async function prepareMiddleware<TContext extends Context = Context>(
  middleware: Middleware<TContext>,
  options: PrepareWithConstructorOptions<TContext> = {},
): Promise<PrepareMiddlewareReturn<TContext>> {
  const bot = new Bot<TContext>('test-token', {
    ContextConstructor: options.contextConstructor,
  });

  if (options.state !== undefined) {
    const { mockStateMiddleware } = mockState(options.state as never);

    bot.use(mockStateMiddleware as never);
  }

  bot.use(middleware);

  return prepareBot<TContext>(bot, options);
}
