/**
 * Plugin interop: `@grammyjs/hydrate`
 *
 * Setup notes:
 * - `hydrateApi()` is a bot-level transformer installed via `bot.api.config.use()`.
 *   Install it BEFORE `prepareBot` so the chain-ordering fix places it outside
 *   the library transformer. API call results (sendMessage, etc.) are hydrated
 *   and gain convenience methods (delete, edit, pin, etc.).
 * - `hydrate()` is a context middleware installed via `bot.use()`. It augments
 *   the context object so `ctx.message.delete()` and similar shortcuts work.
 *   This runs per-request and is unaffected by the transformer chain order.
 * - A synthetic message response must have a message_id for hydration to attach
 *   message-aware methods. The library's `syntheticMessage` resolver returns
 *   a real message_id once a chat is registered with `chats.newUser()` or
 *   similar — so standard test setups work without custom `responses`.
 */

import { hydrate, hydrateApi, type HydrateFlavor } from '@grammyjs/hydrate';
import { Bot, type Context } from 'grammy';
import { describe, expect, it } from 'vitest';

import { prepareBot } from '../../src/index';

describe('plugin: @grammyjs/hydrate', () => {
  it('bot.api.sendMessage result is hydrated with delete() via hydrateApi()', async () => {
    const bot = new Bot<Context>('test-token');

    bot.api.config.use(hydrateApi());

    let sentMessage: { delete?: unknown } | undefined;

    bot.on('message:text', async (ctx) => {
      sentMessage = (await ctx.reply('Hello!')) as unknown as { delete?: unknown };
    });

    const { chats } = await prepareBot(bot);
    const user = chats.newUser();

    await user.sendText('trigger');

    expect(typeof sentMessage?.delete).toBe('function');
  });

  it('ctx.message.delete() is available when hydrate() middleware is installed', async () => {
    const bot = new Bot<HydrateFlavor<Context>>('test-token');

    bot.use(hydrate<Context>());

    let hasDeleteMethod = false;

    bot.on('message:text', (ctx) => {
      hasDeleteMethod = typeof ctx.message.delete === 'function';
    });

    const { chats } = await prepareBot(bot);
    const user = chats.newUser();

    await user.sendText('trigger');

    expect(hasDeleteMethod).toBe(true);
  });

  it('hydrateApi() and hydrate() work together', async () => {
    const bot = new Bot<HydrateFlavor<Context>>('test-token');

    bot.api.config.use(hydrateApi());
    bot.use(hydrate<Context>());

    let hasDeleteOnReply = false;
    let hasDeleteOnCtxMessage = false;

    bot.on('message:text', async (ctx) => {
      const reply = (await ctx.reply('Hello!')) as unknown as { delete?: unknown };

      hasDeleteOnReply = typeof reply.delete === 'function';
      hasDeleteOnCtxMessage = typeof ctx.message.delete === 'function';
    });

    const { chats } = await prepareBot(bot);
    const user = chats.newUser();

    await user.sendText('trigger');

    expect(hasDeleteOnReply).toBe(true);
    expect(hasDeleteOnCtxMessage).toBe(true);
  });
});
