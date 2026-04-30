/**
 * Pattern: reply.replyMarkup and reply.replyingTo accessors.
 *
 * Covers the two Reply accessors added in v0.4.1.
 */

import { Bot, InlineKeyboard } from 'grammy';
import { describe, expect, it } from 'vitest';

import { prepareBot } from '../../src/index';

describe('reference: reply accessors', () => {
  describe('reply.replyMarkup', () => {
    it('is non-null when bot sends a reply with an inline keyboard', async () => {
      const bot = new Bot('test-token');

      bot.on('message:text', async (ctx) => {
        await ctx.reply('pick one', {
          reply_markup: new InlineKeyboard().text('Yes', 'yes').text('No', 'no'),
        });
      });

      const { chats } = await prepareBot(bot);
      const user = chats.newUser();

      await user.sendText('trigger');

      const reply = chats.repliesFor(user).last;

      expect(reply?.replyMarkup).toBeDefined();
      expect(reply?.replyMarkup?.inline_keyboard).toBeDefined();
    });

    it('is undefined for a plain text reply', async () => {
      const bot = new Bot('test-token');

      bot.on('message:text', async (ctx) => {
        await ctx.reply('hello');
      });

      const { chats } = await prepareBot(bot);
      const user = chats.newUser();

      await user.sendText('trigger');

      expect(chats.repliesFor(user).last?.replyMarkup).toBeUndefined();
    });
  });

  describe('reply.replyingTo', () => {
    it('resolves to the earlier Reply when bot replies to one of its own captured messages', async () => {
      const bot = new Bot('test-token');
      let firstMessageId: number | undefined;

      bot.on('message:text', async (ctx) => {
        if (ctx.message.text === 'first') {
          await ctx.reply('reply A');
        } else if (firstMessageId !== undefined) {
          await ctx.reply('reply B', {
            reply_parameters: { message_id: firstMessageId },
          });
        }
      });

      const { chats } = await prepareBot(bot);
      const user = chats.newUser();

      await user.sendText('first');
      const replyA = chats.repliesFor(user).last;

      firstMessageId = replyA?.messageId;

      await user.sendText('second');
      const replyB = chats.repliesFor(user).last;

      expect(replyB?.replyingTo).toBeDefined();
      expect(replyB?.replyingTo?.messageId).toBe(replyA?.messageId);
      expect(replyB?.replyingTo?.text).toBe('reply A');
    });

    it('is undefined when the bot replies to an incoming user message', async () => {
      const bot = new Bot('test-token');

      bot.on('message:text', async (ctx) => {
        await ctx.reply('got it', {
          reply_parameters: { message_id: ctx.message.message_id },
        });
      });

      const { chats } = await prepareBot(bot);
      const user = chats.newUser();

      await user.sendText('hello');

      // The bot replied to the incoming user message — not a captured Reply
      expect(chats.repliesFor(user).last?.replyingTo).toBeUndefined();
    });
  });
});
