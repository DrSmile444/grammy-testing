import { Bot } from 'grammy';
import type { Message } from 'grammy/types';
import { describe, expect, it } from 'vitest';

import { prepareBot, TELEGRAM_RELAY } from '../../src/index';

describe('postRelayMessage', () => {
  it('bot receives relay message with from.id === 777_000', async () => {
    const bot = new Bot('test-token');
    let fromId: number | undefined;
    let text: string | undefined;
    let chatId: number | undefined;

    bot.on('message:text', (ctx) => {
      fromId = ctx.message.from.id;
      text = ctx.message.text;
      chatId = ctx.message.chat.id;
    });

    const { chats } = await prepareBot(bot);
    const group = chats.newGroup();

    await group.postRelayMessage('channel post');

    expect(fromId).toBe(777_000);
    expect(text).toBe('channel post');
    expect(chatId).toBe(group.id);
  });

  it('returns the dispatched Message with correct message_id and from.id', async () => {
    const bot = new Bot('test-token');
    const { chats } = await prepareBot(bot);
    const group = chats.newGroup();

    const relay = await group.postRelayMessage('channel post');

    expect(relay.message_id).toBeGreaterThan(0);
    expect(relay.from?.id).toBe(777_000);
  });

  it('options.messageId overrides the auto-generated ID', async () => {
    const bot = new Bot('test-token');
    const { chats } = await prepareBot(bot);
    const group = chats.newGroup();

    const relay = await group.postRelayMessage('channel post', { messageId: 100 });

    expect(relay.message_id).toBe(100);
  });

  it('options.channel sets forward_origin', async () => {
    const bot = new Bot('test-token');
    let forwardOrigin: Message['forward_origin'] | undefined;

    bot.on('message:text', (ctx) => {
      forwardOrigin = ctx.message.forward_origin;
    });

    const { chats } = await prepareBot(bot);
    const group = chats.newGroup();
    const channel = chats.newChannel('My Channel');

    await group.postRelayMessage('post text', { channel });

    expect(forwardOrigin?.type).toBe('channel');
    expect((forwardOrigin as Extract<typeof forwardOrigin, { type: 'channel' }>).chat.id).toBe(channel.id);
  });

  it('TELEGRAM_RELAY matches the from field of a relay message', async () => {
    const bot = new Bot('test-token');
    const { chats } = await prepareBot(bot);
    const group = chats.newGroup();

    const relay = await group.postRelayMessage('post');

    expect(relay.from).toMatchObject(TELEGRAM_RELAY);
  });

  it('works on Supergroup', async () => {
    const bot = new Bot('test-token');
    let fromId: number | undefined;

    bot.on('message:text', (ctx) => {
      fromId = ctx.message.from.id;
    });

    const { chats } = await prepareBot(bot);
    const supergroup = chats.newSupergroup();

    const relay = await supergroup.postRelayMessage('channel post');

    expect(fromId).toBe(777_000);
    expect(relay.message_id).toBeGreaterThan(0);
  });
});

describe('postRelayMessage → sendText reply flow', () => {
  it('returned Message is directly usable as reply_to_message', async () => {
    const bot = new Bot('test-token');
    let replyToId: number | undefined;
    let replyFromId: number | undefined;

    bot.on('message:text', (ctx) => {
      if (ctx.message.reply_to_message) {
        replyToId = ctx.message.reply_to_message.message_id;
        replyFromId = ctx.message.reply_to_message.from?.id;
      }
    });

    const { chats } = await prepareBot(bot);
    const user = chats.newUser();
    const group = chats.newGroup();

    const relay = await group.postRelayMessage('channel post');

    await user.sendText('my comment', { chat: group, reply_to_message: relay });

    expect(replyToId).toBe(relay.message_id);
    expect(replyFromId).toBe(777_000);
  });
});

describe('SendTextOptions.reply_to_message partial shape', () => {
  it('partial shape with only message_id is accepted and auto-fills chat', async () => {
    const bot = new Bot('test-token');
    let replyToMessageId: number | undefined;
    let replyToChatId: number | undefined;

    bot.on('message:text', (ctx) => {
      replyToMessageId = ctx.message.reply_to_message?.message_id;
      replyToChatId = ctx.message.reply_to_message?.chat.id;
    });

    const { chats } = await prepareBot(bot);
    const user = chats.newUser();
    const group = chats.newGroup();

    await user.sendText('reply', { chat: group, reply_to_message: { message_id: 42 } });

    expect(replyToMessageId).toBe(42);
    expect(replyToChatId).toBe(group.id);
  });

  it('date is auto-filled when absent', async () => {
    const bot = new Bot('test-token');
    let replyDate: number | undefined;
    const before = Math.floor(Date.now() / 1000);

    bot.on('message:text', (ctx) => {
      replyDate = ctx.message.reply_to_message?.date;
    });

    const { chats } = await prepareBot(bot);
    const user = chats.newUser();

    await user.sendText('reply', { reply_to_message: { message_id: 5 } });

    expect(replyDate).toBeGreaterThanOrEqual(before);
  });

  it('explicit fields in the partial are preserved', async () => {
    const bot = new Bot('test-token');
    let replyFromId: number | undefined;
    let replyText: string | undefined;

    bot.on('message:text', (ctx) => {
      replyFromId = ctx.message.reply_to_message?.from?.id;
      replyText = ctx.message.reply_to_message?.text;
    });

    const { chats } = await prepareBot(bot);
    const user = chats.newUser();
    const group = chats.newGroup();

    await user.sendText('comment', {
      chat: group,
      reply_to_message: { message_id: 100, from: { ...TELEGRAM_RELAY }, text: 'original post' },
    });

    expect(replyFromId).toBe(777_000);
    expect(replyText).toBe('original post');
  });

  it('full Message object is still accepted unchanged', async () => {
    const bot = new Bot('test-token');
    let replyToId: number | undefined;

    bot.on('message:text', (ctx) => {
      replyToId = ctx.message.reply_to_message?.message_id;
    });

    const { chats } = await prepareBot(bot);
    const user = chats.newUser();
    const group = chats.newGroup();

    const relay = await group.postRelayMessage('original');

    await user.sendText('reply', { chat: group, reply_to_message: relay });

    expect(replyToId).toBe(relay.message_id);
  });
});
