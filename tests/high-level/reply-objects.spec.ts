import assert from 'node:assert';

import { Bot, InlineKeyboard } from 'grammy';
import { describe, expect, it } from 'vitest';

import { prepareBot } from '../../src/index';

describe('Reply objects', () => {
  describe('normalized accessors', () => {
    it('text accessor', async () => {
      const bot = new Bot('test-token');

      bot.on('message:text', async (ctx) => {
        await ctx.reply('welcome');
      });

      const { chats } = await prepareBot(bot);
      const user = chats.newUser();

      await user.sendText('hi');

      expect(chats.repliesFor(user).last?.text).toBe('welcome');
    });

    it('parseMode accessor', async () => {
      const bot = new Bot('test-token');

      bot.on('message:text', async (ctx) => {
        await ctx.reply('<b>bold</b>', { parse_mode: 'HTML' });
      });

      const { chats } = await prepareBot(bot);
      const user = chats.newUser();

      await user.sendText('hi');

      expect(chats.repliesFor(user).last?.parseMode).toBe('HTML');
    });

    it('buttons accessor flattens inline keyboard', async () => {
      const bot = new Bot('test-token');

      bot.on('message:text', async (ctx) => {
        const kb = new InlineKeyboard().text('OK', 'cb-ok').url('Open', 'https://example.com');

        await ctx.reply('pick', { reply_markup: kb });
      });

      const { chats } = await prepareBot(bot);
      const user = chats.newUser();

      await user.sendText('hi');

      const reply = chats.repliesFor(user).last;

      expect(reply?.buttons).toHaveLength(2);
      expect(reply?.buttons[0]?.text).toBe('OK');
      expect(reply?.buttons[0]?.callbackData).toBe('cb-ok');
      expect(reply?.buttons[1]?.text).toBe('Open');
      expect(reply?.buttons[1]?.url).toBe('https://example.com');
    });
  });

  describe('clickButton', () => {
    it('match by text dispatches callback_query', async () => {
      const bot = new Bot('test-token');
      let cbData: string | undefined;

      bot.on('message:text', async (ctx) => {
        const kb = new InlineKeyboard().text('Confirm', 'cb-confirm');

        await ctx.reply('proceed?', { reply_markup: kb });
      });

      bot.on('callback_query:data', (ctx) => {
        cbData = ctx.callbackQuery.data;
      });

      const { chats } = await prepareBot(bot);
      const user = chats.newUser();

      await user.sendText('hi');

      const reply = chats.repliesFor(user).last;

      assert.ok(reply);

      await reply.clickButton('Confirm');

      expect(cbData).toBe('cb-confirm');
    });

    it('match by callback_data spec', async () => {
      const bot = new Bot('test-token');
      let cbData: string | undefined;

      bot.on('message:text', async (ctx) => {
        const kb = new InlineKeyboard().text('Confirm', 'cb-confirm');

        await ctx.reply('proceed?', { reply_markup: kb });
      });

      bot.on('callback_query:data', (ctx) => {
        cbData = ctx.callbackQuery.data;
      });

      const { chats } = await prepareBot(bot);
      const user = chats.newUser();

      await user.sendText('hi');

      const reply = chats.repliesFor(user).last;

      assert.ok(reply);

      await reply.clickButton({ callbackData: 'cb-confirm' });

      expect(cbData).toBe('cb-confirm');
    });

    it('throws on URL-only button', async () => {
      const bot = new Bot('test-token');

      bot.on('message:text', async (ctx) => {
        const kb = new InlineKeyboard().url('Open', 'https://example.com');

        await ctx.reply('go', { reply_markup: kb });
      });

      const { chats } = await prepareBot(bot);
      const user = chats.newUser();

      await user.sendText('hi');

      const reply = chats.repliesFor(user).last;

      assert.ok(reply);

      await expect(reply.clickButton('Open')).rejects.toThrow(/URL buttons/);
    });
  });

  describe('replies.last and replies.byText', () => {
    it('replies.last returns latest', async () => {
      const bot = new Bot('test-token');

      bot.on('message:text', async (ctx) => {
        await ctx.reply('first');
        await ctx.reply('second');
      });

      const { chats } = await prepareBot(bot);
      const user = chats.newUser();

      await user.sendText('hi');

      expect(chats.repliesFor(user).last?.text).toBe('second');
    });

    it('byText finds by string', async () => {
      const bot = new Bot('test-token');

      bot.on('message:text', async (ctx) => {
        await ctx.reply('hello world');
        await ctx.reply('goodbye');
      });

      const { chats } = await prepareBot(bot);
      const user = chats.newUser();

      await user.sendText('hi');

      expect(chats.repliesFor(user).byText('goodbye')?.text).toBe('goodbye');
    });

    it('byText finds by regex', async () => {
      const bot = new Bot('test-token');

      bot.on('message:text', async (ctx) => {
        await ctx.reply('Welcome, alice!');
      });

      const { chats } = await prepareBot(bot);
      const user = chats.newUser();

      await user.sendText('hi');

      expect(chats.repliesFor(user).byText(/welcome/i)?.text).toBe('Welcome, alice!');
    });
  });
});
