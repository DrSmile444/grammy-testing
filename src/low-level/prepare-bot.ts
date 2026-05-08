import type { Api, Bot, Context } from 'grammy';

import { Chats } from '../high-level/chats';

import { genericBotInfo } from './bot-info';
import { IdleTracker } from './idle';
import { OutgoingRequests } from './outgoing-requests';
import type { Responses } from './responses';
import { asTransformer, createTransformer } from './transformer';

export interface PrepareOptions {
  /**
   * Map of grammY API method name → canned response (static value or
   * `(payload, method) => result` function). Methods without an entry
   * resolve to `{ ok: true, result: true }` by default.
   */
  responses?: Responses;
  /**
   * Emit a `console.warn` when the bot calls an API method targeting a chat
   * not registered with the `Chats` orchestrator. Useful for diagnosing empty
   * `user.replies` when the bot fans out to external chats (log channels, etc.).
   * Defaults to `true`. Pass `false` to suppress.
   */
  warnOnUnregisteredChats?: boolean;
}

export interface PrepareBotReturn<TContext extends Context = Context> {
  chats: Chats<TContext>;
}

/**
 * Initialize a {@link Bot} for in-process testing. Installs an outgoing
 * API transformer that captures every call, pre-populates `bot.botInfo`
 * with a generic fixture (so `bot.init()` skips its own `getMe` call),
 * awaits `bot.init()`, and returns a `chats` handle that exposes the
 * captured requests, an async settle helper, plus the v0.2 orchestrator
 * surface (`newUser`, `newAdmin`, chat factories, per-user replies inbox).
 * @param bot - The {@link Bot} instance under test.
 * @param options - Optional {@link Responses} map for canned replies.
 * @returns `{ chats }` — `chats.outgoing` for capture inspection,
 *   `chats.idle()` to await fire-and-forget API calls,
 *   `chats.newUser()` / `chats.newAdmin()` etc. for the v0.2 orchestrator.
 */
export async function prepareBot<TContext extends Context = Context, TApi extends Api = Api>(
  bot: Bot<TContext, TApi>,
  options: PrepareOptions = {},
): Promise<PrepareBotReturn<TContext>> {
  const outgoing = new OutgoingRequests();
  const idle = new IdleTracker();
  const chats = new Chats<TContext>(outgoing, idle, options.warnOnUnregisteredChats ?? true);

  const responses = { ...chats.buildDefaultResponses(), ...options.responses };

  // Snapshot user-installed transformers before adding the library's so we can
  // reinstall them on top — making the library transformer innermost (index 0).
  const existingTransformers = bot.api.config.installedTransformers();

  bot.api.config.use(
    asTransformer(
      createTransformer({
        outgoing,
        idle,
        responses,
        onCapture: (request) => {
          chats.deriveFromCapture(request);
        },
      }),
    ),
  );

  if (existingTransformers.length > 0) {
    bot.api.config.use(...existingTransformers);
  }

  // eslint-disable-next-line no-param-reassign -- intentional: matches the inspiration's pattern of setting fixture botInfo before init
  bot.botInfo = { ...genericBotInfo };

  await bot.init();

  chats.attachBot(bot as unknown as Bot<TContext>);

  return { chats };
}
