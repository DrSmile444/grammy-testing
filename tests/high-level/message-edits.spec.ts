import { Bot } from 'grammy';
import { describe, expect, it } from 'vitest';

import { prepareBot } from '../../src/index';

describe('chats.editsFor(user)', () => {
  it('captures editMessageText for a previously sent reply', async () => {
    const bot = new Bot('test-token');

    bot.on('message:text', async (ctx) => {
      await ctx.reply('original');
    });

    const { chats } = await prepareBot(bot);
    const user = chats.newUser();
    const dm = chats.newPrivateChat(user);

    await user.sendText('trigger');

    const originalMessageId = user.replies.lastOrThrow().messageId;

    await bot.api.editMessageText(dm.id, originalMessageId, 'updated');

    expect(chats.editsFor(user).length).toBe(1);
    expect(chats.editsFor(user).last?.text).toBe('updated');
  });

  it('captures editedMessageId linking back to the original reply', async () => {
    const bot = new Bot('test-token');

    bot.on('message:text', async (ctx) => {
      await ctx.reply('original');
    });

    const { chats } = await prepareBot(bot);
    const user = chats.newUser();
    const dm = chats.newPrivateChat(user);

    await user.sendText('trigger');

    const originalMessageId = user.replies.lastOrThrow().messageId;

    await bot.api.editMessageText(dm.id, originalMessageId, 'updated');

    expect(chats.editsFor(user).last?.editedMessageId).toBe(originalMessageId);
  });

  it('captures multiple edits in dispatch order', async () => {
    const bot = new Bot('test-token');

    bot.on('message:text', async (ctx) => {
      await ctx.reply('v1');
    });

    const { chats } = await prepareBot(bot);
    const user = chats.newUser();
    const dm = chats.newPrivateChat(user);

    await user.sendText('trigger');

    const originalMessageId = user.replies.lastOrThrow().messageId;

    await bot.api.editMessageText(dm.id, originalMessageId, 'v2');
    await bot.api.editMessageText(dm.id, originalMessageId, 'v3');

    expect(chats.editsFor(user).all).toHaveLength(2);
    expect(chats.editsFor(user).all[0]?.text).toBe('v2');
    expect(chats.editsFor(user).all[1]?.text).toBe('v3');
  });

  it('silently skips edits to unknown message IDs', async () => {
    const bot = new Bot('test-token');

    const { chats } = await prepareBot(bot);
    const user = chats.newUser();
    const dm = chats.newPrivateChat(user);

    await bot.api.editMessageText(dm.id, 99_999, 'edit of unknown message');

    expect(chats.editsFor(user).length).toBe(0);
  });

  it('EditsLog.lastOrThrow() returns the last edit when log is non-empty', async () => {
    const bot = new Bot('test-token');

    bot.on('message:text', async (ctx) => {
      await ctx.reply('original');
    });

    const { chats } = await prepareBot(bot);
    const user = chats.newUser();
    const dm = chats.newPrivateChat(user);

    await user.sendText('trigger');

    const { messageId } = user.replies.lastOrThrow();

    await bot.api.editMessageText(dm.id, messageId, 'updated');

    const edit = chats.editsFor(user).lastOrThrow();

    expect(edit.text).toBe('updated');
    expect(edit).toBe(chats.editsFor(user).last);
  });

  it('EditsLog.lastOrThrow() throws when log is empty', async () => {
    const bot = new Bot('test-token');
    const { chats } = await prepareBot(bot);
    const user = chats.newUser();

    expect(() => chats.editsFor(user).lastOrThrow()).toThrow('Expected an edit but the edit log is empty');
  });

  it('throws for a user not minted by this Chats instance', async () => {
    const bot1 = new Bot('test-token');
    const bot2 = new Bot('test-token');
    const { chats: chats1 } = await prepareBot(bot1);
    const { chats: chats2 } = await prepareBot(bot2);
    const foreignUser = chats2.newUser();

    expect(() => chats1.editsFor(foreignUser)).toThrow();
  });
});
