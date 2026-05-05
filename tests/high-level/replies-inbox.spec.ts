import { Bot } from 'grammy';
import { describe, expect, it } from 'vitest';

import { prepareBot } from '../../src/index';

describe('RepliesInbox', () => {
  describe('lastOrThrow()', () => {
    it('returns the last reply when inbox is non-empty', async () => {
      const bot = new Bot('test-token');

      bot.on('message:text', async (ctx) => {
        await ctx.reply('hello');
      });

      const { chats } = await prepareBot(bot);
      const user = chats.newUser();

      await user.sendText('trigger');

      const reply = chats.repliesFor(user).lastOrThrow();

      expect(reply.text).toBe('hello');
    });

    it('returns the same object as .last when non-empty', async () => {
      const bot = new Bot('test-token');

      bot.on('message:text', async (ctx) => {
        await ctx.reply('hello');
      });

      const { chats } = await prepareBot(bot);
      const user = chats.newUser();

      await user.sendText('trigger');

      const inbox = chats.repliesFor(user);

      expect(inbox.lastOrThrow()).toBe(inbox.last);
    });

    it('throws with a descriptive message when inbox is empty', async () => {
      const bot = new Bot('test-token');
      const { chats } = await prepareBot(bot);
      const user = chats.newUser();

      expect(() => chats.repliesFor(user).lastOrThrow()).toThrow('Expected a reply but the reply collection is empty');
    });
  });
});

describe('user.replies shorthand', () => {
  it('user.replies is the same reference as chats.repliesFor(user)', async () => {
    const bot = new Bot('test-token');
    const { chats } = await prepareBot(bot);
    const user = chats.newUser();

    expect(user.replies).toBe(chats.repliesFor(user));
  });

  it('user.replies reflects captures after minting', async () => {
    const bot = new Bot('test-token');

    bot.on('message:text', async (ctx) => {
      await ctx.reply('pong');
    });

    const { chats } = await prepareBot(bot);
    const user = chats.newUser();

    await user.sendText('ping');

    expect(user.replies.length).toBe(1);
    expect(user.replies.last?.text).toBe('pong');
  });

  it('user.replies.all returns all replies in dispatch order', async () => {
    const bot = new Bot('test-token');

    bot.on('message:text', async (ctx) => {
      await ctx.reply('first');
      await ctx.reply('second');
    });

    const { chats } = await prepareBot(bot);
    const user = chats.newUser();

    await user.sendText('trigger');

    expect(user.replies.all).toHaveLength(2);
    expect(user.replies.all[0]?.text).toBe('first');
    expect(user.replies.all[1]?.text).toBe('second');
  });

  it('user.replies.lastOrThrow() works via the shorthand', async () => {
    const bot = new Bot('test-token');

    bot.on('message:text', async (ctx) => {
      await ctx.reply('answer');
    });

    const { chats } = await prepareBot(bot);
    const user = chats.newUser();

    await user.sendText('question');

    expect(user.replies.lastOrThrow().text).toBe('answer');
  });
});
