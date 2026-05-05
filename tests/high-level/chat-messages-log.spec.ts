import { Bot } from 'grammy';
import { describe, expect, it } from 'vitest';

import { prepareBot } from '../../src/index';

describe('chat.messages log', () => {
  describe('group broadcasts', () => {
    it('lands in chat.messages', async () => {
      const bot = new Bot('test-token');
      const { chats } = await prepareBot(bot);
      const group = chats.newSupergroup();

      await bot.api.sendMessage(group.id, 'announcement');

      expect(group.messages.last?.text).toBe('announcement');
      expect(group.messages.length).toBe(1);
    });

    it('messages.last and byText work', async () => {
      const bot = new Bot('test-token');
      const { chats } = await prepareBot(bot);
      const group = chats.newSupergroup();

      await bot.api.sendMessage(group.id, 'first');
      await bot.api.sendMessage(group.id, 'second');

      expect(group.messages.last?.text).toBe('second');
      expect(group.messages.byText('first')?.text).toBe('first');
    });

    it('byText with regex', async () => {
      const bot = new Bot('test-token');
      const { chats } = await prepareBot(bot);
      const group = chats.newSupergroup();

      await bot.api.sendMessage(group.id, 'Hello, world!');

      expect(group.messages.byText(/hello/i)?.text).toBe('Hello, world!');
    });
  });

  describe('channel.postMessageTo', () => {
    it('dispatches a sender_chat-bearing message', async () => {
      const bot = new Bot('test-token');
      let captured: { senderChatId?: number; fromUsername?: string; text?: string } = {};

      bot.on('message:text', (ctx) => {
        captured = {
          senderChatId: ctx.message.sender_chat?.id,
          fromUsername: ctx.message.from.username,
          text: ctx.message.text,
        };
      });

      const { chats } = await prepareBot(bot);
      const channel = chats.newChannel('Main');
      const group = chats.newSupergroup('Discussion');

      await channel.postMessageTo(group, 'Channel announcement');

      expect(captured.senderChatId).toBe(channel.id);
      expect(captured.fromUsername).toBe('Channel_Bot');
      expect(captured.text).toBe('Channel announcement');
    });
  });
});
