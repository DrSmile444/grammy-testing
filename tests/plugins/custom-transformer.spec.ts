/**
 * Custom transformer support
 *
 * With the transformer chain fix (v0.23.0), transformers installed via
 * bot.api.config.use() before prepareBot run normally — including transformers
 * that mutate outgoing request payloads. This test validates both request
 * mutation and response augmentation patterns.
 *
 * Setup notes:
 * - Install custom transformers before prepareBot.
 * - The library transformer is positioned innermost (index 0); user-installed
 *   transformers wrap it at higher indices and run first.
 * - Request mutators modify the payload object passed to previous(). The library
 *   captures whatever payload arrives — mutations made by outer transformers
 *   are visible in chats.outgoing.requests.
 * - Response augmenters call previous() and then modify the result. The library
 *   returns synthetic objects; augmenters can add arbitrary fields.
 */

import type { Transformer } from 'grammy';
import { Bot } from 'grammy';
import { describe, expect, it } from 'vitest';

import { prepareBot } from '../../src/index';

const silentTransformer: Transformer = async (previous, method, payload, signal) => {
  if (method === 'sendMessage') {
    return previous(method, { ...payload, disable_notification: true }, signal);
  }

  return previous(method, payload, signal);
};

const tagTransformer: Transformer = async (previous, method, payload, signal) => {
  if (method === 'sendMessage') {
    return previous(method, { ...payload, protect_content: true }, signal);
  }

  return previous(method, payload, signal);
};

const annotateTransformer: Transformer = async (previous, method, payload, signal) => {
  const apiResult = await previous(method, payload, signal);

  if (apiResult.ok && method === 'sendMessage') {
    (apiResult.result as unknown as Record<string, unknown>).__annotated = true;
  }

  return apiResult;
};

describe('custom transformer: request mutation', () => {
  it('payload modified by transformer is captured in outgoing.requests', async () => {
    const bot = new Bot('test-token');

    bot.api.config.use(silentTransformer);

    bot.on('message:text', async (ctx) => {
      await ctx.reply('hello');
    });

    const { chats } = await prepareBot(bot);
    const user = chats.newUser();

    await user.sendText('ping');

    const sendCall = chats.outgoing.requests.find((entry) => entry.method === 'sendMessage');

    expect(sendCall).toBeDefined();
    expect((sendCall?.payload as Record<string, unknown>).disable_notification).toBe(true);
  });

  it('multiple payload fields can be injected by a transformer', async () => {
    const bot = new Bot('test-token');

    bot.api.config.use(tagTransformer);

    bot.on('message:text', async (ctx) => {
      await ctx.reply('protected');
    });

    const { chats } = await prepareBot(bot);
    const user = chats.newUser();

    await user.sendText('hi');

    const sendCall = chats.outgoing.requests.find((entry) => entry.method === 'sendMessage');

    expect((sendCall?.payload as Record<string, unknown>).protect_content).toBe(true);
  });
});

describe('custom transformer: response augmentation', () => {
  it('transformer can read and annotate the synthetic response', async () => {
    const bot = new Bot('test-token');

    bot.api.config.use(annotateTransformer);

    let isAnnotated = false;

    bot.on('message:text', async (ctx) => {
      const reply = await ctx.reply('hi');

      isAnnotated = (reply as unknown as Record<string, unknown>).__annotated === true;
    });

    const { chats } = await prepareBot(bot);
    const user = chats.newUser();

    await user.sendText('ping');

    expect(isAnnotated).toBe(true);
  });
});
