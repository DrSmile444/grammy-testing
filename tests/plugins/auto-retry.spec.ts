/**
 * Plugin interop: `@grammyjs/auto-retry`
 *
 * Setup notes:
 * - Install `autoRetry(options)` via `bot.api.config.use()` BEFORE calling
 *   `prepareBot`. With the chain-ordering fix, autoRetry runs as an outer
 *   transformer and can intercept API calls before they reach the library.
 * - `autoRetry` retries when the inner transformer returns a not-ok response
 *   with a `parameters.retry_after` value (raw API response, not a thrown
 *   GrammyError). The library's `failNext` throws a GrammyError which autoRetry
 *   does not retry — it propagates the throw as-is. This is consistent with
 *   production behaviour where non-retryable errors are not caught by autoRetry.
 * - For most bot tests, autoRetry is a transparent pass-through: the library
 *   returns ok responses and autoRetry passes them along without delay.
 * - After the chain fix, installing autoRetry no longer silently skips it —
 *   it genuinely participates in every API call made during tests.
 */

import { autoRetry } from '@grammyjs/auto-retry';
import { Bot, GrammyError } from 'grammy';
import { describe, expect, it } from 'vitest';

import { prepareBot } from '../../src/index';

describe('plugin: @grammyjs/auto-retry', () => {
  it('normal bot operation works with autoRetry installed', async () => {
    const bot = new Bot('test-token');

    bot.api.config.use(autoRetry({ maxRetryAttempts: 3, maxDelaySeconds: 1 }));

    let hasReplied = false;

    bot.on('message:text', async (ctx) => {
      await ctx.reply('Hello!');
      hasReplied = true;
    });

    const { chats } = await prepareBot(bot);
    const user = chats.newUser();

    await user.sendText('trigger');

    expect(hasReplied).toBe(true);
    expect(user.replies.last?.text).toBe('Hello!');
  });

  it('failNext errors propagate through autoRetry to the handler catch block', async () => {
    const bot = new Bot('test-token');

    bot.api.config.use(autoRetry({ maxRetryAttempts: 1, maxDelaySeconds: 0 }));

    let observedError: GrammyError | undefined;

    bot.on('message:text', async (ctx) => {
      try {
        await ctx.reply('This will fail');
      } catch (error) {
        if (error instanceof GrammyError) {
          observedError = error;
        }
      }
    });

    const { chats } = await prepareBot(bot);
    const user = chats.newUser();

    chats.outgoing.failNext('sendMessage', { code: 403, description: 'Forbidden: bot was blocked by the user' });

    await user.sendText('trigger');

    expect(observedError).toBeInstanceOf(GrammyError);
    expect(observedError?.error_code).toBe(403);
  });

  it('multiple API calls all pass through autoRetry correctly', async () => {
    const bot = new Bot('test-token');

    bot.api.config.use(autoRetry({ maxRetryAttempts: 1, maxDelaySeconds: 0 }));

    bot.on('message:text', async (ctx) => {
      await ctx.reply('First');
      await ctx.reply('Second');
      await ctx.reply('Third');
    });

    const { chats } = await prepareBot(bot);
    const user = chats.newUser();

    await user.sendText('trigger');

    const sendMessageRequests = chats.outgoing.requests.filter((request) => request.method === 'sendMessage');

    expect(sendMessageRequests).toHaveLength(3);
    expect(user.replies).toHaveLength(3);
  });
});
