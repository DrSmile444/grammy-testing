import { Bot } from 'grammy';
import { describe, expect, it } from 'vitest';

import { prepareBot } from '../../src/index';

describe('chats.clear()', () => {
  it('resets outgoing, replies, actions, edits, deletions, and messages in one call', async () => {
    const bot = new Bot('test-token');

    bot.on('message:text', async (ctx) => {
      const reply = await ctx.reply('hello');
      const messageId = reply.message_id;

      await ctx.api.sendChatAction(ctx.chat.id, 'typing');
      await ctx.api.editMessageText(ctx.chat.id, messageId, 'edited');
      await ctx.api.deleteMessage(ctx.chat.id, messageId);
    });

    const { chats } = await prepareBot(bot);
    const user = chats.newUser();
    const dm = chats.newPrivateChat(user);

    await user.sendText('trigger');

    expect(chats.outgoing.length).toBeGreaterThan(0);
    expect(user.replies.length).toBeGreaterThan(0);
    expect(chats.actionsFor(user).length).toBeGreaterThan(0);
    expect(chats.editsFor(user).length).toBeGreaterThan(0);
    expect(chats.deletionsFor(dm).length).toBeGreaterThan(0);
    expect(dm.messages.length).toBeGreaterThan(0);

    chats.clear();

    expect(chats.outgoing.length).toBe(0);
    expect(user.replies.length).toBe(0);
    expect(chats.actionsFor(user).length).toBe(0);
    expect(chats.editsFor(user).length).toBe(0);
    expect(chats.deletionsFor(dm).length).toBe(0);
    expect(dm.messages.length).toBe(0);
  });

  it('preserves user and chat references after clear', async () => {
    const bot = new Bot('test-token');

    bot.on('message:text', async (ctx) => {
      await ctx.reply('hello');
    });

    const { chats } = await prepareBot(bot);
    const user = chats.newUser();

    await user.sendText('first');

    chats.clear();

    await user.sendText('second');

    expect(user.replies.length).toBe(1);
    expect(user.replies.lastOrThrow().text).toBe('hello');
  });

  it('preserves membership state after clear', async () => {
    const bot = new Bot('test-token');
    const { chats } = await prepareBot(bot);
    const user = chats.newUser();
    const group = chats.newSupergroup();

    group.promote(user);
    chats.clear();

    expect(user.in(group)?.status).toBe('administrator');
  });

  it('individual log clears still work alongside chats.clear()', async () => {
    const bot = new Bot('test-token');

    bot.on('message:text', async (ctx) => {
      await ctx.reply('hello');
    });

    const { chats } = await prepareBot(bot);
    const user = chats.newUser();

    await user.sendText('trigger');

    expect(user.replies.length).toBe(1);
    expect(chats.outgoing.length).toBeGreaterThan(0);

    user.replies.clear();

    expect(user.replies.length).toBe(0);
    expect(chats.outgoing.length).toBeGreaterThan(0);

    chats.clear();

    expect(chats.outgoing.length).toBe(0);
  });
});
