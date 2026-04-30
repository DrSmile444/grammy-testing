import type { Api, Bot, Context } from 'grammy';

import { Chats } from '../high-level/chats';

import { genericBotInfo } from './bot-info';
import { IdleTracker } from './idle';
import { OutgoingRequests } from './outgoing-requests';
import type { Responses } from './responses';
import { createTransformer } from './transformer';

export interface PrepareOptions {
  /**
   * Map of grammY API method name → canned response (static value or
   * `(payload, method) => result` function). Methods without an entry
   * resolve to `{ ok: true, result: true }` by default.
   */
  responses?: Responses;
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
  const chats = new Chats<TContext>(outgoing, idle);

  bot.api.config.use(
    createTransformer({
      outgoing,
      idle,
      responses: options.responses,
      onCapture: (request) => {
        chats.deriveFromCapture(request);
      },
    }),
  );

  // eslint-disable-next-line no-param-reassign -- intentional: matches the inspiration's pattern of setting fixture botInfo before init
  bot.botInfo = { ...genericBotInfo };

  await bot.init();

  chats.attachBot(bot as unknown as Bot<TContext>);

  return { chats };
}
