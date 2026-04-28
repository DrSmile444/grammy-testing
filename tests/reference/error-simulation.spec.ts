/**
 * Pattern: API failure simulation.
 *
 * Source: ua-anti-spam-bot/tests/bot.spec.ts (no direct equivalent —
 *         the inspiration handles errors via real-world try/catch on api
 *         calls; the testing framework needs to simulate these explicitly)
 * Inspired-by tests: ~5–10 across the audit
 *
 * What this exercises: forced rejections from grammY API methods so the
 * bot's error-handling code is exercised. Rate limits (429), blocked
 * users (403), chat-not-found (400), one-shot custom payloads.
 *
 * v0.2 API expression: chats.outgoing.failNext(method, errorOrSpec) /
 * failAll / respondNext / clearOverrides. Sugar form `{ code, description }`
 * supported.
 *
 * v0.2.x gaps: none for this pattern category at v0.2.
 */

import { Bot, GrammyError } from 'grammy';
import { describe, expect, it } from 'vitest';

import { prepareBot } from '../../src/index';

describe('reference: error simulation', () => {
  it('failNext: bot error handler observes a 403 on next sendMessage', async () => {
    const bot = new Bot('test-token');
    let observedError: GrammyError | undefined;

    bot.on('message:text', async (context) => {
      try {
        await context.reply('reply that will fail');
      } catch (error) {
        if (error instanceof GrammyError) {
          observedError = error;
        }
      }
    });

    const { chats } = await prepareBot(bot);
    const user = chats.newUser();

    chats.outgoing.failNext('sendMessage', {
      code: 403,
      description: 'Forbidden: bot was blocked by the user',
    });

    await user.sendText('trigger');

    expect(observedError).toBeInstanceOf(GrammyError);
    expect(observedError?.error_code).toBe(403);
  });

  it('failAll: bot retry logic engaged until clearOverrides', async () => {
    const bot = new Bot('test-token');
    let attempts = 0;

    bot.on('message:text', async (context) => {
      // Bot tries up to 3 times to send.
      for (let i = 0; i < 3; i += 1) {
        try {
          attempts += 1;
          // eslint-disable-next-line no-await-in-loop -- retry pattern is intentionally serial
          await context.api.sendMessage(context.chat.id, 'attempt');

          return;
        } catch (error) {
          if (i === 2) {
            throw error;
          }
        }
      }
    });

    const { chats } = await prepareBot(bot);
    const user = chats.newUser();

    chats.outgoing.failAll('sendMessage', {
      code: 429,
      description: 'Too Many Requests',
    });

    try {
      await user.sendText('trigger');
    } catch {
      // expected — bot rethrows after retries exhausted
    }

    expect(attempts).toBe(3);
  });

  it('respondNext: one-off custom payload returned to the bot', async () => {
    const bot = new Bot('test-token');
    let observedTitle: string | undefined;

    bot.on('message:text', async (context) => {
      const chat = await context.api.getChat(context.chat.id);

      if ('title' in chat) {
        observedTitle = chat.title;
      }
    });

    const { chats } = await prepareBot(bot);
    const user = chats.newUser();

    chats.outgoing.respondNext('getChat', {
      id: 99,
      type: 'supergroup',
      title: 'OverrideTitle',
    });

    await user.sendText('trigger');

    expect(observedTitle).toBe('OverrideTitle');
  });

  it('combination: failNext on one method while respondNext on another', async () => {
    const bot = new Bot('test-token');
    const events: string[] = [];

    bot.on('message:text', async (context) => {
      try {
        await context.reply('first');
      } catch {
        events.push('reply-failed');
      }
      try {
        const chat = await context.api.getChat(context.chat.id);

        if ('title' in chat && typeof chat.title === 'string') {
          events.push(`got-title:${chat.title}`);
        } else {
          events.push('no-title');
        }
      } catch {
        events.push('getChat-failed');
      }
    });

    const { chats } = await prepareBot(bot);
    const user = chats.newUser();

    chats.outgoing.failNext('sendMessage', { code: 403, description: 'x' });
    chats.outgoing.respondNext('getChat', {
      id: 1,
      type: 'supergroup',
      title: 'OK',
    });

    await user.sendText('trigger');

    expect(events).toEqual(['reply-failed', 'got-title:OK']);
  });
});
