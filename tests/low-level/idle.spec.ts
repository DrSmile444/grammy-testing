import { Bot } from 'grammy';
import { describe, expect, it } from 'vitest';

import { prepareBot } from '../../src/index';
import { MessagePrivateMockUpdate } from '../../src/low-level';

describe('chats.idle()', () => {
  it('is a no-op when every API call is awaited', async () => {
    const bot = new Bot('test-token');

    bot.on('message:text', async (context) => {
      await context.reply('awaited');
    });

    const { chats } = await prepareBot(bot);

    await bot.handleUpdate(new MessagePrivateMockUpdate('hi').build());

    // Already captured before idle runs:
    expect(chats.outgoing.getMethods()).toContain('sendMessage');

    await chats.idle();

    expect(chats.outgoing.getMethods()).toEqual(['sendMessage']);
  });

  it('drains unawaited (fire-and-forget) API calls', async () => {
    const bot = new Bot('test-token');

    bot.on('message:text', (context) => {
      // Intentionally fire-and-forget:
      void context.api.sendMessage(123, 'fire-and-forget');
    });

    const { chats } = await prepareBot(bot);

    await bot.handleUpdate(new MessagePrivateMockUpdate('hi').build());
    await chats.idle();

    expect(chats.outgoing.getMethods()).toContain('sendMessage');
  });

  it('resolves even when a tracked promise rejects', async () => {
    const bot = new Bot('test-token');

    bot.on('message:text', (context) => {
      // Will reject because of failNext below, but we don't await:
      context.api.sendMessage(123, 'will-fail').catch(() => {
        // swallow
      });
    });

    const { chats } = await prepareBot(bot);

    chats.outgoing.failNext('sendMessage', { code: 403, description: 'Forbidden' });

    await bot.handleUpdate(new MessagePrivateMockUpdate('hi').build());
    await chats.idle();

    expect(chats.outgoing.getMethods()).toContain('sendMessage');
  });

  it('does NOT wait for setTimeout-scheduled work (documented limitation)', async () => {
    const bot = new Bot('test-token');

    bot.on('message:text', (context) => {
      setTimeout(() => {
        void context.api.sendMessage(123, 'late');
      }, 100);
    });

    const { chats } = await prepareBot(bot);

    await bot.handleUpdate(new MessagePrivateMockUpdate('hi').build());
    await chats.idle();

    expect(chats.outgoing.requests).toEqual([]);
  });
});
