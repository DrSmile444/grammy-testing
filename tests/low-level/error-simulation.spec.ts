import { Bot, GrammyError } from 'grammy';
import { describe, expect, it } from 'vitest';

import { prepareBot } from '../../src/index';

describe('error simulation', () => {
  it('failNext rejects only the next call', async () => {
    const bot = new Bot('test-token');
    const { chats } = await prepareBot(bot);

    chats.outgoing.failNext('sendMessage', {
      code: 403,
      description: 'Forbidden',
    });

    await expect(bot.api.sendMessage(1, 'first')).rejects.toBeInstanceOf(GrammyError);

    await expect(bot.api.sendMessage(1, 'second')).resolves.toBeDefined();
  });

  it('failNext sugar spec upgrades to a real GrammyError', async () => {
    const bot = new Bot('test-token');
    const { chats } = await prepareBot(bot);

    chats.outgoing.failNext('sendMessage', {
      code: 403,
      description: 'Forbidden: bot was blocked by the user',
    });

    try {
      await bot.api.sendMessage(1, 'hi');
      throw new Error('expected to reject');
    } catch (error) {
      expect(error).toBeInstanceOf(GrammyError);
      const grammyError = error as GrammyError;

      expect(grammyError.error_code).toBe(403);

      expect(grammyError.description).toBe('Forbidden: bot was blocked by the user');
    }
  });

  it('failNext accepts a real GrammyError', async () => {
    const bot = new Bot('test-token');
    const { chats } = await prepareBot(bot);

    const explicitError = new GrammyError('Forbidden', { ok: false, error_code: 403, description: 'Forbidden' }, 'sendMessage', {});

    chats.outgoing.failNext('sendMessage', explicitError);

    try {
      await bot.api.sendMessage(1, 'hi');
      throw new Error('expected to reject');
    } catch (error) {
      expect(error).toBe(explicitError);
    }
  });

  it('failAll rejects every matching call until clearOverrides', async () => {
    const bot = new Bot('test-token');
    const { chats } = await prepareBot(bot);

    chats.outgoing.failAll('sendMessage', {
      code: 429,
      description: 'Too Many Requests',
    });

    await expect(bot.api.sendMessage(1, 'a')).rejects.toBeInstanceOf(GrammyError);
    await expect(bot.api.sendMessage(1, 'b')).rejects.toBeInstanceOf(GrammyError);
    await expect(bot.api.sendMessage(1, 'c')).rejects.toBeInstanceOf(GrammyError);

    chats.outgoing.clearOverrides();

    await expect(bot.api.sendMessage(1, 'd')).resolves.toBeDefined();
  });

  it('respondNext returns a custom payload once', async () => {
    const bot = new Bot('test-token');
    const { chats } = await prepareBot(bot);

    chats.outgoing.respondNext('getChat', {
      id: 99,
      type: 'channel',
      title: 'Override',
    });

    const first = await bot.api.getChat(99);

    expect(first.id).toBe(99);
    expect(first.title).toBe('Override');

    // Second call falls back to the default success shape.
    const second = await bot.api.getChat(99);

    expect((second as unknown as { title?: string }).title).toBeUndefined();
  });

  it('clearOverrides drops both one-shot and sticky overrides', async () => {
    const bot = new Bot('test-token');
    const { chats } = await prepareBot(bot);

    chats.outgoing.failNext('sendMessage', { code: 1, description: 'one' });
    chats.outgoing.failAll('getChat', { code: 2, description: 'two' });

    chats.outgoing.clearOverrides();

    await expect(bot.api.sendMessage(1, 'hi')).resolves.toBeDefined();
    await expect(bot.api.getChat(1)).resolves.toBeDefined();
  });
});
