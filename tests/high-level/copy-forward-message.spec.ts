import { Bot } from 'grammy';
import { describe, expect, it } from 'vitest';

import { prepareBot } from '../../src/index';

describe('copyMessage default response', () => {
  it('resolves with a MessageId containing the reply messageId — no date field', async () => {
    const bot = new Bot('test-token');
    let copiedMessageId: number | undefined;

    bot.on('message:text', async (ctx) => {
      const result = await ctx.api.copyMessage(ctx.chat.id, ctx.chat.id, 1);

      copiedMessageId = result.message_id;
    });

    const { chats } = await prepareBot(bot);
    const user = chats.newUser();
    const dm = chats.newPrivateChat(user);

    await user.sendText('trigger');

    expect(copiedMessageId).toBeDefined();
    expect(copiedMessageId).toBe(dm.messages.last?.messageId);

    const outgoing = chats.outgoing.requests.find((r) => r.method === 'copyMessage');

    expect(outgoing).toBeDefined();
  });

  it('result does not carry a date field', async () => {
    const bot = new Bot('test-token');
    let copyResult: { message_id: number; date?: number } | undefined;

    bot.on('message:text', async (ctx) => {
      copyResult = await ctx.api.copyMessage(ctx.chat.id, ctx.chat.id, 1);
    });

    const { chats } = await prepareBot(bot);
    const user = chats.newUser();

    await user.sendText('trigger');

    expect(copyResult).toBeDefined();
    expect((copyResult as Record<string, unknown>)['date']).toBeUndefined();
  });

  it('user-supplied responses.copyMessage overrides the synthetic default', async () => {
    const bot = new Bot('test-token');
    let copiedMessageId: number | undefined;

    bot.on('message:text', async (ctx) => {
      const result = await ctx.api.copyMessage(ctx.chat.id, ctx.chat.id, 1);

      copiedMessageId = result.message_id;
    });

    const { chats } = await prepareBot(bot, {
      responses: {
        copyMessage: { message_id: 1234 },
      },
    });

    const user = chats.newUser();

    await user.sendText('trigger');

    expect(copiedMessageId).toBe(1234);
  });

  it('bot can read copy.message_id to drive a follow-up editMessageText', async () => {
    const bot = new Bot('test-token');

    bot.on('message:text', async (ctx) => {
      const copy = await ctx.api.copyMessage(ctx.chat.id, ctx.chat.id, 1);

      await ctx.api.editMessageText(ctx.chat.id, copy.message_id, 'edited after copy');
    });

    const { chats } = await prepareBot(bot);
    const user = chats.newUser();

    await user.sendText('trigger');

    expect(chats.editsFor(user).lastOrThrow().text).toBe('edited after copy');
  });

  it('appears in chat.messages for the destination chat', async () => {
    const bot = new Bot('test-token');

    bot.on('message:text', async (ctx) => {
      await ctx.api.copyMessage(ctx.chat.id, ctx.chat.id, 1);
    });

    const { chats } = await prepareBot(bot);
    const user = chats.newUser();
    const dm = chats.newPrivateChat(user);

    await user.sendText('trigger');

    expect(dm.messages.length).toBeGreaterThanOrEqual(1);
  });
});

describe('forwardMessage default response', () => {
  it('resolves with a Message containing message_id and date', async () => {
    const bot = new Bot('test-token');
    let forwardedMessageId: number | undefined;
    let forwardedDate: number | undefined;

    bot.on('message:text', async (ctx) => {
      const result = await ctx.api.forwardMessage(ctx.chat.id, ctx.chat.id, 1);

      forwardedMessageId = result.message_id;
      forwardedDate = result.date;
    });

    const { chats } = await prepareBot(bot);
    const user = chats.newUser();
    const dm = chats.newPrivateChat(user);

    await user.sendText('trigger');

    expect(forwardedMessageId).toBeDefined();
    expect(forwardedMessageId).toBe(dm.messages.last?.messageId);
    expect(forwardedDate).toBeGreaterThan(0);
  });

  it('user-supplied responses.forwardMessage overrides the synthetic default', async () => {
    const bot = new Bot('test-token');
    let forwardedMessageId: number | undefined;

    bot.on('message:text', async (ctx) => {
      const result = await ctx.api.forwardMessage(ctx.chat.id, ctx.chat.id, 1);

      forwardedMessageId = result.message_id;
    });

    const { chats } = await prepareBot(bot, {
      responses: {
        forwardMessage: { message_id: 5678, date: 0 },
      },
    });

    const user = chats.newUser();

    await user.sendText('trigger');

    expect(forwardedMessageId).toBe(5678);
  });

  it('appears in chat.messages and user.replies when forwarded to a private chat', async () => {
    const bot = new Bot('test-token');

    bot.on('message:text', async (ctx) => {
      await ctx.api.forwardMessage(ctx.chat.id, ctx.chat.id, 1);
    });

    const { chats } = await prepareBot(bot);
    const user = chats.newUser();
    const dm = chats.newPrivateChat(user);

    const initialReplies = user.replies.length;

    await user.sendText('trigger');

    expect(dm.messages.length).toBeGreaterThanOrEqual(1);
    expect(user.replies.length).toBeGreaterThan(initialReplies);
  });

  it('captured Reply has text === undefined (hollow Reply)', async () => {
    const bot = new Bot('test-token');

    bot.on('message:text', async (ctx) => {
      await ctx.api.forwardMessage(ctx.chat.id, ctx.chat.id, 1);
    });

    const { chats } = await prepareBot(bot);
    const user = chats.newUser();
    const dm = chats.newPrivateChat(user);

    await user.sendText('trigger');

    const forwardReply = dm.messages.last;

    expect(forwardReply?.text).toBeUndefined();
  });
});
