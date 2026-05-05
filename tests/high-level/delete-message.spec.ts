import { Bot } from 'grammy';
import { describe, expect, it } from 'vitest';

import { prepareBot } from '../../src/index';

describe('chats.deletionsFor(chat)', () => {
  it('captures a deleteMessage call in a group chat', async () => {
    const bot = new Bot('test-token');

    bot.on('message:text', async (ctx) => {
      await ctx.reply('hello');
      const sent = await ctx.api.sendMessage(ctx.chat.id, 'to delete');
      const messageId = sent.message_id;

      await ctx.api.deleteMessage(ctx.chat.id, messageId);
    });

    const { chats } = await prepareBot(bot);
    const user = chats.newUser();
    const group = chats.newSupergroup();

    group.promote(user);

    await user.sendText('trigger', { chat: group });

    expect(chats.deletionsFor(group).length).toBe(1);
    expect(typeof chats.deletionsFor(group).last?.messageId).toBe('number');
  });

  it('captures multiple deletions in dispatch order', async () => {
    const bot = new Bot('test-token');

    bot.on('message:text', async (ctx) => {
      const first = await ctx.api.sendMessage(ctx.chat.id, 'first');
      const second = await ctx.api.sendMessage(ctx.chat.id, 'second');
      const id1 = first.message_id;
      const id2 = second.message_id;

      await ctx.api.deleteMessage(ctx.chat.id, id1);
      await ctx.api.deleteMessage(ctx.chat.id, id2);
    });

    const { chats } = await prepareBot(bot);
    const user = chats.newUser();
    const group = chats.newSupergroup();

    group.promote(user);

    await user.sendText('trigger', { chat: group });

    expect(chats.deletionsFor(group).all).toHaveLength(2);
    const [first, second] = chats.deletionsFor(group).all;

    expect(first.messageId).not.toBe(second.messageId);
  });

  it('reply is populated when the deleted message was captured during the test', async () => {
    const bot = new Bot('test-token');

    bot.on('message:text', async (ctx) => {
      const sent = await ctx.reply('to be deleted');

      await ctx.api.deleteMessage(ctx.chat.id, sent.message_id);
    });

    const { chats } = await prepareBot(bot);
    const user = chats.newUser();

    await user.sendText('trigger');

    const deletion = chats.deletionsFor(chats.newPrivateChat(user)).last;

    expect(deletion?.reply).toBeDefined();
    expect(deletion?.reply?.text).toBe('to be deleted');
    expect(deletion?.reply?.messageId).toBe(deletion?.messageId);
  });

  it('reply is undefined for pre-test message IDs', async () => {
    const bot = new Bot('test-token');

    bot.on('message:text', async (ctx) => {
      await ctx.api.deleteMessage(ctx.chat.id, 99_999);
    });

    const { chats } = await prepareBot(bot);
    const user = chats.newUser();

    await user.sendText('trigger');

    const deletion = chats.deletionsFor(chats.newPrivateChat(user)).last;

    expect(deletion?.messageId).toBe(99_999);
    expect(deletion?.reply).toBeUndefined();
  });

  it('captures deleteMessage in a private chat (DM)', async () => {
    const bot = new Bot('test-token');

    bot.on('message:text', async (ctx) => {
      const sent = await ctx.reply('dm reply');

      await ctx.api.deleteMessage(ctx.chat.id, sent.message_id);
    });

    const { chats } = await prepareBot(bot);
    const user = chats.newUser();
    const dm = chats.newPrivateChat(user);

    await user.sendText('trigger');

    expect(chats.deletionsFor(dm).length).toBe(1);
  });

  it('lastOrThrow throws when the deletion log is empty', async () => {
    const bot = new Bot('test-token');
    const { chats } = await prepareBot(bot);
    const group = chats.newSupergroup();

    expect(() => chats.deletionsFor(group).lastOrThrow()).toThrow('Expected a deletion but the deletion log is empty');
  });

  it('throws for an unregistered chat', async () => {
    const bot1 = new Bot('test-token');
    const bot2 = new Bot('test-token');
    const { chats: chats1 } = await prepareBot(bot1);
    const { chats: chats2 } = await prepareBot(bot2);
    const foreignGroup = chats2.newSupergroup();

    expect(() => chats1.deletionsFor(foreignGroup)).toThrow();
  });

  it('deletions in different chats are tracked independently', async () => {
    const bot = new Bot('test-token');

    bot.on('message:text', async (ctx) => {
      const sent = await ctx.reply('to delete');

      await ctx.api.deleteMessage(ctx.chat.id, sent.message_id);
    });

    const { chats } = await prepareBot(bot);
    const user = chats.newUser();
    const groupA = chats.newSupergroup('A');
    const groupB = chats.newSupergroup('B');

    groupA.promote(user);
    groupB.promote(user);

    await user.sendText('trigger', { chat: groupA });
    await user.sendText('trigger', { chat: groupB });

    expect(chats.deletionsFor(groupA).length).toBe(1);
    expect(chats.deletionsFor(groupB).length).toBe(1);
    expect(chats.deletionsFor(groupA).last?.messageId).not.toBe(chats.deletionsFor(groupB).last?.messageId);
  });
});
