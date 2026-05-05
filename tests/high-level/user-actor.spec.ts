import { Bot } from 'grammy';
import { describe, expect, it } from 'vitest';

import { prepareBot } from '../../src/index';

describe('User actor', () => {
  describe('sendText', () => {
    it('dispatches to a private chat by default and triggers handlers', async () => {
      const bot = new Bot('test-token');
      let observed: string | undefined;

      bot.on('message:text', async (ctx) => {
        observed = ctx.message.text;
        await ctx.reply(`echo: ${ctx.message.text}`);
      });

      const { chats } = await prepareBot(bot);
      const user = chats.newUser();

      await user.sendText('hello');

      expect(observed).toBe('hello');
      expect(chats.outgoing.getLast()?.method).toBe('sendMessage');
    });

    it('honors entity overrides', async () => {
      const bot = new Bot('test-token');
      let entities: unknown;

      bot.on('message:text', (ctx) => {
        entities = ctx.message.entities;
      });

      const { chats } = await prepareBot(bot);
      const user = chats.newUser({ username: 'bob' });

      await user.sendText('Hi @bob', {
        entities: [{ type: 'mention', offset: 3, length: 4 }],
      });

      expect(entities).toEqual([{ type: 'mention', offset: 3, length: 4 }]);
    });
  });

  describe('sendMessage', () => {
    it('aliases sendText', async () => {
      const bot = new Bot('test-token');
      let observed: string | undefined;

      bot.on('message:text', (ctx) => {
        observed = ctx.message.text;
      });

      const { chats } = await prepareBot(bot);
      const user = chats.newUser();

      await user.sendMessage('hi via alias');

      expect(observed).toBe('hi via alias');
    });
  });

  describe('sendCommand', () => {
    it('builds /start with bot_command entity', async () => {
      const bot = new Bot('test-token');
      let entities: unknown;
      let text: string | undefined;

      bot.on('message:text', (ctx) => {
        text = ctx.message.text;
        entities = ctx.message.entities;
      });

      const { chats } = await prepareBot(bot);
      const user = chats.newUser();

      await user.sendCommand('/start');

      expect(text).toBe('/start');
      expect(entities).toEqual([{ type: 'bot_command', offset: 0, length: 6 }]);
    });

    it('appends args after a space', async () => {
      const bot = new Bot('test-token');
      let text: string | undefined;
      let entities: unknown;

      bot.on('message:text', (ctx) => {
        text = ctx.message.text;
        entities = ctx.message.entities;
      });

      const { chats } = await prepareBot(bot);
      const user = chats.newUser();

      await user.sendCommand('/lang', 'en');

      expect(text).toBe('/lang en');
      expect(entities).toEqual([{ type: 'bot_command', offset: 0, length: 5 }]);
    });

    it('dispatches into a supergroup via options.chat', async () => {
      const bot = new Bot('test-token');
      let observedChatId: number | undefined;
      let observedChatType: string | undefined;
      let observedEntities: unknown;

      bot.on('message:text', (ctx) => {
        observedChatId = ctx.chat.id;
        observedChatType = ctx.chat.type;
        observedEntities = ctx.message.entities;
      });

      const { chats } = await prepareBot(bot);
      const user = chats.newUser();
      const group = chats.newSupergroup();

      await user.sendCommand('/start', undefined, { chat: group });

      expect(observedChatId).toBe(group.id);
      expect(observedChatType).toBe('supergroup');
      expect(observedEntities).toEqual([{ type: 'bot_command', offset: 0, length: 6 }]);
    });

    it('honors args + options.chat together', async () => {
      const bot = new Bot('test-token');
      let observedText: string | undefined;
      let observedChatId: number | undefined;
      let observedEntities: unknown;

      bot.on('message:text', (ctx) => {
        observedText = ctx.message.text;
        observedChatId = ctx.chat.id;
        observedEntities = ctx.message.entities;
      });

      const { chats } = await prepareBot(bot);
      const user = chats.newUser();
      const group = chats.newSupergroup();

      await user.sendCommand('/lang', 'en', { chat: group });

      expect(observedText).toBe('/lang en');
      expect(observedChatId).toBe(group.id);
      expect(observedEntities).toEqual([{ type: 'bot_command', offset: 0, length: 5 }]);
    });

    it('adds leading slash when missing', async () => {
      const bot = new Bot('test-token');
      let text: string | undefined;

      bot.on('message:text', (ctx) => {
        text = ctx.message.text;
      });

      const { chats } = await prepareBot(bot);
      const user = chats.newUser();

      await user.sendCommand('start');

      expect(text).toBe('/start');
    });
  });

  describe('async settle', () => {
    it('awaiting send waits for handler to finish', async () => {
      const bot = new Bot('test-token');

      bot.on('message:text', async (ctx) => {
        await ctx.reply('hi');
        await ctx.reply('twice');
      });

      const { chats } = await prepareBot(bot);
      const user = chats.newUser();

      await user.sendText('trigger');

      expect(chats.outgoing.getMethods().filter((method) => method === 'sendMessage')).toHaveLength(2);
    });
  });

  describe('sendCallbackQuery', () => {
    it('bare dispatch fires handler with correct data and from', async () => {
      const bot = new Bot('test-token');
      let cbData: string | undefined;
      let fromId: number | undefined;

      bot.on('callback_query:data', (ctx) => {
        cbData = ctx.callbackQuery.data;
        fromId = ctx.callbackQuery.from.id;
      });

      const { chats } = await prepareBot(bot);
      const user = chats.newUser();

      await user.sendCallbackQuery('some-data');

      expect(cbData).toBe('some-data');
      expect(fromId).toBe(user.id);
    });

    it('auto-synthesized message passes chatType private filter', async () => {
      const bot = new Bot('test-token');
      let isReached = false;

      bot.chatType('private').on('callback_query', () => {
        isReached = true;
      });

      const { chats } = await prepareBot(bot);
      const user = chats.newUser();

      await user.sendCallbackQuery('data');

      expect(isReached).toBe(true);
    });

    it('explicit message option shapes callback_query.message', async () => {
      const bot = new Bot('test-token');
      let messageText: string | undefined;
      let messageMarkup: unknown;

      bot.on('callback_query', (ctx) => {
        messageText = ctx.callbackQuery.message?.text;
        messageMarkup = ctx.callbackQuery.message?.reply_markup;
      });

      const { chats } = await prepareBot(bot);
      const user = chats.newUser();
      const keyboard = { inline_keyboard: [[{ text: 'OK', callback_data: 'ok' }]] };

      await user.sendCallbackQuery('data', {
        message: { text: 'prior text', reply_markup: keyboard },
      });

      expect(messageText).toBe('prior text');
      expect(messageMarkup).toEqual(keyboard);
    });

    it('auto-fills message_id when partial message has none', async () => {
      const bot = new Bot('test-token');
      let messageId: number | undefined;

      bot.on('callback_query', (ctx) => {
        messageId = ctx.callbackQuery.message?.message_id;
      });

      const { chats } = await prepareBot(bot);
      const user = chats.newUser();

      await user.sendCallbackQuery('data', { message: { text: 'hi' } });

      expect(messageId).toBeGreaterThan(0);
    });

    it('returns void', async () => {
      const bot = new Bot('test-token');

      bot.on('callback_query', () => {});

      const { chats } = await prepareBot(bot);
      const user = chats.newUser();

      // eslint-disable-next-line @typescript-eslint/no-confusing-void-expression
      const result = await user.sendCallbackQuery('data');

      expect(result).toBeUndefined();
    });
  });
});
