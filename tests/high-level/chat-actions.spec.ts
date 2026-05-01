import { Bot } from 'grammy';
import { describe, expect, it } from 'vitest';

import { prepareBot } from '../../src/index';

describe('chats.actionsFor(user)', () => {
  it('captures typing indicator in a private chat', async () => {
    const bot = new Bot('test-token');

    bot.on('message:text', async (ctx) => {
      await ctx.replyWithChatAction('typing');
    });

    const { chats } = await prepareBot(bot);
    const user = chats.newUser();

    await user.sendText('hi');

    expect(chats.actionsFor(user).last).toBe('typing');
    expect(chats.actionsFor(user).length).toBe(1);
  });

  it('captures multiple actions in dispatch order', async () => {
    const bot = new Bot('test-token');

    bot.on('message:text', async (ctx) => {
      await ctx.replyWithChatAction('typing');
      await ctx.replyWithChatAction('upload_document');
    });

    const { chats } = await prepareBot(bot);
    const user = chats.newUser();

    await user.sendText('hi');

    expect(chats.actionsFor(user).all).toEqual(['typing', 'upload_document']);
  });

  it('captures action for an active group member', async () => {
    const bot = new Bot('test-token');
    const { chats } = await prepareBot(bot);
    const user = chats.newUser();
    const group = chats.newSupergroup();

    group.promote(user);

    await bot.api.sendChatAction(group.id, 'typing');

    expect(chats.actionsFor(user).last).toBe('typing');
  });

  it('does not capture action for a user who left the group', async () => {
    const bot = new Bot('test-token');

    bot.on('message:left_chat_member', () => {});

    const { chats } = await prepareBot(bot);
    const user = chats.newUser();
    const group = chats.newSupergroup();

    group.promote(user);
    await user.leaveChat(group);

    await bot.api.sendChatAction(group.id, 'typing');

    expect(chats.actionsFor(user).length).toBe(0);
  });

  it('throws for a user not minted by this Chats instance', async () => {
    const bot1 = new Bot('test-token');
    const bot2 = new Bot('test-token');
    const { chats: chats1 } = await prepareBot(bot1);
    const { chats: chats2 } = await prepareBot(bot2);
    const foreignUser = chats2.newUser();

    expect(() => chats1.actionsFor(foreignUser)).toThrow();
  });
});
