import { prepareBot, prepareMiddleware } from '@grammyjs/testing';
import { Bot } from 'grammy';
import { describe, expect, it } from 'vitest';

import { createRateLimitMiddleware } from './bot';

describe('middleware-test (rate limiter)', () => {
  it('passes the first message through', async () => {
    const { chats } = await prepareMiddleware(createRateLimitMiddleware(1000));
    const user = chats.newUser();

    let isReached = false;

    const bot = new Bot('token');

    bot.use(createRateLimitMiddleware(1000));

    bot.on('message:text', () => {
      isReached = true;
    });

    const { chats: testChats } = await prepareBot(bot);
    const testUser = testChats.newUser();

    await testUser.sendText('hello');

    expect(isReached).toBe(true);
    expect(user.id).toBeGreaterThan(0);
  });

  it('blocks a rapid second message and replies with slow-down text', async () => {
    const bot = new Bot('token');

    bot.use(createRateLimitMiddleware(60_000));

    bot.on('message:text', async (ctx) => {
      await ctx.reply('OK');
    });

    const { chats } = await prepareBot(bot);
    const user = chats.newUser();

    await user.sendText('first');
    await user.sendText('second');

    const replyTexts = chats.outgoing.requests
      .filter((request) => request.method === 'sendMessage')
      .map((request) => (request.payload as { text: string }).text);

    expect(replyTexts).toContain('Slow down! Please wait before sending another message.');
  });

  it('prepareMiddleware isolates the middleware for unit testing', async () => {
    const { chats } = await prepareMiddleware(createRateLimitMiddleware(0));
    const user = chats.newUser();

    expect(user.id).toBeGreaterThan(0);
    expect(chats.outgoing).toBeDefined();
  });

  it('allows a second message after the cooldown has passed', async () => {
    const bot = new Bot('token');

    bot.use(createRateLimitMiddleware(0));

    bot.on('message:text', async (ctx) => {
      await ctx.reply('OK');
    });

    const { chats } = await prepareBot(bot);
    const user = chats.newUser();

    await user.sendText('first');
    await user.sendText('second');

    const okReplies = chats.outgoing.requests.filter(
      (request) => request.method === 'sendMessage' && (request.payload as { text: string }).text === 'OK',
    );

    expect(okReplies).toHaveLength(2);
  });
});
