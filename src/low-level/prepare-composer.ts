import { Bot, type Composer, type Context } from 'grammy';

import type { Chats } from '../high-level/chats';

import { mockState, type StateContext } from './mock-context-fields';
import { prepareBot, type PrepareOptions } from './prepare-bot';

export interface PrepareWithConstructorOptions<TContext extends Context = Context> extends PrepareOptions {
  contextConstructor?: new (...args: ConstructorParameters<typeof Context>) => TContext;
  /**
   * Pre-populate `ctx.state` for every update dispatched during the test.
   * Only available in `prepareComposer` / `prepareMiddleware` (not `prepareBot`, because the
   * caller's bot is already configured before `prepareBot` is called).
   * The type is inferred from `TContext` — only valid when `TContext` has a `state` field.
   */
  state?: TContext extends StateContext<infer TState> ? Partial<TState> : never;
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
 * @param options - Optional canned-response config, custom context constructor, and initial `ctx.state`.
 * @returns Same shape as {@link prepareBot}: `{ chats }`.
 */
export async function prepareComposer<TContext extends Context = Context>(
  composer: Composer<TContext>,
  options: PrepareWithConstructorOptions<TContext> = {},
): Promise<PrepareComposerReturn<TContext>> {
  const bot = new Bot<TContext>('test-token', {
    ContextConstructor: options.contextConstructor,
  });

  if (options.state !== undefined) {
    const { mockStateMiddleware } = mockState(options.state as never);

    bot.use(mockStateMiddleware as never);
  }

  bot.use(composer);

  return prepareBot<TContext>(bot, options);
}
