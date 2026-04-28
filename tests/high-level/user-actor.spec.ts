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

      expect(chats.outgoing.getMethods().filter((m) => m === 'sendMessage')).toHaveLength(2);
    });
  });
});
