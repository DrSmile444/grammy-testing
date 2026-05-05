import { Bot } from 'grammy';
import { describe, expect, it } from 'vitest';

import { prepareBot } from '@grammyjs/testing';

import { createCallbackQueryBot } from './bot';

describe('callback-query-bot', () => {
  it('handles a callback query dispatched without a prior message', async () => {
    const { chats } = await prepareBot(createCallbackQueryBot());
    const user = chats.newUser();

    await user.sendCallbackQuery('ping');

    expect(user.replies.lastOrThrow().text).toBe('pong');
  });

  it('handles a pattern-matched callback query', async () => {
    const { chats } = await prepareBot(createCallbackQueryBot());
    const user = chats.newUser();

    await user.sendCallbackQuery('action:delete');

    expect(user.replies.lastOrThrow().text).toBe('You triggered: delete');
  });

  it('callback query carries the correct from.id', async () => {
    let capturedFromId: number | undefined;

    const testBot = new Bot('token');

    testBot.on('callback_query', (ctx) => {
      capturedFromId = ctx.callbackQuery.from.id;
    });

    const { chats } = await prepareBot(testBot);
    const user = chats.newUser({ id: 42 });

    await user.sendCallbackQuery('ping');

    expect(capturedFromId).toBe(42);
    expect(user.id).toBe(42);
  });

  it('can supply an explicit message in the callback query', async () => {
    const { chats } = await prepareBot(createCallbackQueryBot());
    const user = chats.newUser();

    await user.sendCallbackQuery('ping', {
      message: { text: 'original text', message_id: 99 },
    });

    expect(user.replies.lastOrThrow().text).toBe('pong');
  });
});
