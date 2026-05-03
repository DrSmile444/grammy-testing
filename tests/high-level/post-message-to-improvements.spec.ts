import { Bot } from 'grammy';
import { describe, expect, it } from 'vitest';

import { prepareBot } from '../../src/index';

describe('postMessageTo return value', () => {
  it('returns a Message with correct message_id and text', async () => {
    const bot = new Bot('test-token');
    const { chats } = await prepareBot(bot);
    const channel = chats.newChannel('News');
    const group = chats.newGroup();

    const message = await channel.postMessageTo(group, 'hello');

    expect(message.message_id).toBeGreaterThan(0);
    expect(message.text).toBe('hello');
    expect(message.chat.id).toBe(group.id);
  });

  it('options.messageId is reflected in the returned Message', async () => {
    const bot = new Bot('test-token');
    const { chats } = await prepareBot(bot);
    const channel = chats.newChannel('News');
    const group = chats.newGroup();

    const message = await channel.postMessageTo(group, 'hello', { messageId: 55 });

    expect(message.message_id).toBe(55);
  });

  it('bot handler receives the dispatched message', async () => {
    const bot = new Bot('test-token');
    let receivedText: string | undefined;
    let receivedChatId: number | undefined;

    bot.on('message:text', (ctx) => {
      receivedText = ctx.message.text;
      receivedChatId = ctx.message.chat.id;
    });

    const { chats } = await prepareBot(bot);
    const channel = chats.newChannel('News');
    const group = chats.newGroup();

    await channel.postMessageTo(group, 'announcement');

    expect(receivedText).toBe('announcement');
    expect(receivedChatId).toBe(group.id);
  });
});

describe('postMessageTo reply_to_message option', () => {
  it('auto-fills date and chat when only message_id is provided', async () => {
    const bot = new Bot('test-token');
    let replyToMessageId: number | undefined;
    let replyToChatId: number | undefined;
    let replyDate: number | undefined;
    const before = Math.floor(Date.now() / 1000);

    bot.on('message:text', (ctx) => {
      replyToMessageId = ctx.message.reply_to_message?.message_id;
      replyToChatId = ctx.message.reply_to_message?.chat.id;
      replyDate = ctx.message.reply_to_message?.date;
    });

    const { chats } = await prepareBot(bot);
    const channel = chats.newChannel('News');
    const group = chats.newGroup();

    await channel.postMessageTo(group, 'reply', { reply_to_message: { message_id: 10 } });

    expect(replyToMessageId).toBe(10);
    expect(replyToChatId).toBe(group.id);
    expect(replyDate).toBeGreaterThanOrEqual(before);
  });

  it('caller-supplied fields are preserved', async () => {
    const bot = new Bot('test-token');
    let replyText: string | undefined;
    let replyFromId: number | undefined;

    bot.on('message:text', (ctx) => {
      replyText = ctx.message.reply_to_message?.text;
      replyFromId = ctx.message.reply_to_message?.from?.id;
    });

    const { chats } = await prepareBot(bot);
    const channel = chats.newChannel('News');
    const group = chats.newGroup();

    await channel.postMessageTo(group, 'reply', {
      reply_to_message: { message_id: 7, text: 'original', from: { id: 777_000, is_bot: true, first_name: 'Telegram' } },
    });

    expect(replyText).toBe('original');
    expect(replyFromId).toBe(777_000);
  });

  it('full Message object is accepted and message_id is preserved', async () => {
    const bot = new Bot('test-token');
    let replyToId: number | undefined;

    bot.on('message:text', (ctx) => {
      replyToId = ctx.message.reply_to_message?.message_id;
    });

    const { chats } = await prepareBot(bot);
    const channel = chats.newChannel('News');
    const group = chats.newGroup();

    const relay = await group.postRelayMessage('original post');

    await channel.postMessageTo(group, 'channel reply', { reply_to_message: relay });

    expect(replyToId).toBe(relay.message_id);
  });
});

describe('postMessageTo → sendText reply chain', () => {
  it('returned Message is usable as reply_to_message in a subsequent sendText', async () => {
    const bot = new Bot('test-token');
    let replyToId: number | undefined;

    bot.on('message:text', (ctx) => {
      if (ctx.message.reply_to_message) {
        replyToId = ctx.message.reply_to_message.message_id;
      }
    });

    const { chats } = await prepareBot(bot);
    const channel = chats.newChannel('News');
    const user = chats.newUser();
    const group = chats.newGroup();

    const post = await channel.postMessageTo(group, 'announcement');

    await user.sendText('nice post', { chat: group, reply_to_message: post });

    expect(replyToId).toBe(post.message_id);
  });
});
