/**
 * Pattern: privateChat.messages log.
 *
 * Private DMs land in both privateChat.messages AND user.replies.
 */

import { Bot } from 'grammy';
import { describe, expect, it } from 'vitest';

import { prepareBot } from '../../src/index';

describe('reference: privateChat.messages', () => {
  it('private DM lands in both privateChat.messages and user.replies', async () => {
    const bot = new Bot('test-token');

    bot.on('message:text', async (ctx) => {
      await ctx.reply('hello back');
    });

    const { chats } = await prepareBot(bot);
    const user = chats.newUser();
    const privateChat = chats.newPrivateChat(user);

    await user.sendText('hi');

    expect(chats.repliesFor(user).last?.text).toBe('hello back');
    expect(privateChat.messages.last?.text).toBe('hello back');
    expect(privateChat.messages.length).toBe(1);
  });

  it('privateChat.messages.last returns undefined when no messages sent', async () => {
    const bot = new Bot('test-token');

    const { chats } = await prepareBot(bot);
    const user = chats.newUser();
    const privateChat = chats.newPrivateChat(user);

    expect(privateChat.messages.last).toBeUndefined();
    expect(privateChat.messages.length).toBe(0);
  });

  it('privateChat.messages accumulates multiple replies in order', async () => {
    const bot = new Bot('test-token');

    bot.on('message:text', async (ctx) => {
      await ctx.reply('one');
      await ctx.reply('two');
    });

    const { chats } = await prepareBot(bot);
    const user = chats.newUser();
    const privateChat = chats.newPrivateChat(user);

    await user.sendText('go');

    expect(privateChat.messages.length).toBe(2);
    expect(privateChat.messages.last?.text).toBe('two');
  });

  it('privateChat.messages.byText finds by string', async () => {
    const bot = new Bot('test-token');

    bot.on('message:text', async (ctx) => {
      await ctx.reply('find me');
      await ctx.reply('not this one');
    });

    const { chats } = await prepareBot(bot);
    const user = chats.newUser();
    const privateChat = chats.newPrivateChat(user);

    await user.sendText('go');

    expect(privateChat.messages.byText('find me')?.text).toBe('find me');
  });
});
