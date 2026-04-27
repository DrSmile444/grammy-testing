import type { Api, Bot, Context } from 'grammy';

import { genericBotInfo } from './bot-info';
import { type Chats, createChats } from './chats';
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

export interface PrepareBotReturn {
  chats: Chats;
}

/**
 * Initialize a {@link Bot} for in-process testing. Installs an outgoing
 * API transformer that captures every call, pre-populates `bot.botInfo`
 * with a generic fixture (so `bot.init()` skips its own `getMe` call),
 * awaits `bot.init()`, and returns a `chats` handle that exposes the
 * captured requests and an async settle helper.
 * @param bot - The {@link Bot} instance under test.
 * @param options - Optional {@link Responses} map for canned replies.
 * @returns `{ chats }` — `chats.outgoing` for capture inspection,
 *   `chats.idle()` to await fire-and-forget API calls.
 */
export async function prepareBot<
  TContext extends Context = Context,
  TApi extends Api = Api,
  TBot extends Bot<TContext, TApi> = Bot<TContext, TApi>,
>(bot: TBot, options: PrepareOptions = {}): Promise<PrepareBotReturn> {
  const outgoing = new OutgoingRequests();
  const idle = new IdleTracker();

  bot.api.config.use(createTransformer({ outgoing, idle, responses: options.responses }));

  // eslint-disable-next-line no-param-reassign -- intentional: matches the inspiration's pattern of setting fixture botInfo before init
  bot.botInfo = { ...genericBotInfo };

  await bot.init();

  return { chats: createChats(outgoing, idle) };
}
