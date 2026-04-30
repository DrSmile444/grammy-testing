/**
 * Pattern: Special message verbs — Web App data, successful payment,
 * inline query, chosen inline result, pre-checkout query, shipping query.
 *
 * Covers all six new user.send* verbs introduced in v0.4.
 */

import { Bot } from 'grammy';
import type { ChosenInlineResult, InlineQuery, Message, PreCheckoutQuery, ShippingQuery } from 'grammy/types';
import { describe, expect, it } from 'vitest';

import { prepareBot } from '../../src/index';

describe('reference: special message verbs', () => {
  describe('sendWebAppData', () => {
    it('bot handler receives data and button_text', async () => {
      const bot = new Bot('test-token');
      let observed: Message['web_app_data'] | undefined;

      bot.on('message:web_app_data', (ctx) => {
        observed = ctx.message.web_app_data;
      });

      const { chats } = await prepareBot(bot);
      const user = chats.newUser();

      await user.sendWebAppData('{"action":"submit"}', 'Open App');

      expect(observed?.data).toBe('{"action":"submit"}');
      expect(observed?.button_text).toBe('Open App');
    });

    it('dispatches into a group via options.chat', async () => {
      const bot = new Bot('test-token');
      let observedChatId: number | undefined;

      bot.on('message:web_app_data', (ctx) => {
        observedChatId = ctx.message.chat.id;
      });

      const { chats } = await prepareBot(bot);
      const user = chats.newUser();
      const group = chats.newSupergroup();

      await user.sendWebAppData('data', 'btn', { chat: group });

      expect(observedChatId).toBe(group.id);
    });
  });

  describe('sendSuccessfulPayment', () => {
    it('bot handler receives invoice payload, currency, and total amount', async () => {
      const bot = new Bot('test-token');
      let observed: Message['successful_payment'] | undefined;

      bot.on('message:successful_payment', (ctx) => {
        observed = ctx.message.successful_payment;
      });

      const { chats } = await prepareBot(bot);
      const user = chats.newUser();

      await user.sendSuccessfulPayment('order-123', 'USD', 1000);

      expect(observed?.invoice_payload).toBe('order-123');
      expect(observed?.currency).toBe('USD');
      expect(observed?.total_amount).toBe(1000);
    });
  });

  describe('sendInlineQuery', () => {
    it('bot handler receives the query text and sender id', async () => {
      const bot = new Bot('test-token');
      let observed: InlineQuery | undefined;

      bot.on('inline_query', (ctx) => {
        observed = ctx.inlineQuery;
      });

      const { chats } = await prepareBot(bot);
      const user = chats.newUser();

      await user.sendInlineQuery('cats');

      expect(observed?.query).toBe('cats');
      expect(observed?.from.id).toBe(user.id);
      expect(observed?.chat_type).toBe('sender');
    });

    it('chatType option is reflected in the dispatched update', async () => {
      const bot = new Bot('test-token');
      let observedChatType: string | undefined;

      bot.on('inline_query', (ctx) => {
        observedChatType = ctx.inlineQuery.chat_type;
      });

      const { chats } = await prepareBot(bot);
      const user = chats.newUser();

      await user.sendInlineQuery('dogs', { chatType: 'group' });

      expect(observedChatType).toBe('group');
    });
  });

  describe('sendChosenInlineResult', () => {
    it('bot handler receives result_id and query', async () => {
      const bot = new Bot('test-token');
      let observed: ChosenInlineResult | undefined;

      bot.on('chosen_inline_result', (ctx) => {
        observed = ctx.chosenInlineResult;
      });

      const { chats } = await prepareBot(bot);
      const user = chats.newUser();

      await user.sendChosenInlineResult('result-1', 'cats');

      expect(observed?.result_id).toBe('result-1');
      expect(observed?.query).toBe('cats');
      expect(observed?.from.id).toBe(user.id);
    });
  });

  describe('sendPreCheckoutQuery', () => {
    it('bot handler receives invoice payload, currency, total amount, and from', async () => {
      const bot = new Bot('test-token');
      let observed: PreCheckoutQuery | undefined;

      bot.on('pre_checkout_query', (ctx) => {
        observed = ctx.preCheckoutQuery;
      });

      const { chats } = await prepareBot(bot);
      const user = chats.newUser();

      await user.sendPreCheckoutQuery('order-456', 'EUR', 2000);

      expect(observed?.invoice_payload).toBe('order-456');
      expect(observed?.currency).toBe('EUR');
      expect(observed?.total_amount).toBe(2000);
      expect(observed?.from.id).toBe(user.id);
    });
  });

  describe('sendShippingQuery', () => {
    it('bot handler receives invoice payload and shipping address', async () => {
      const bot = new Bot('test-token');
      let observed: ShippingQuery | undefined;

      bot.on('shipping_query', (ctx) => {
        observed = ctx.shippingQuery;
      });

      const { chats } = await prepareBot(bot);
      const user = chats.newUser();

      await user.sendShippingQuery('order-789', {
        country_code: 'US',
        city: 'New York',
        street_line1: '123 Main St',
        street_line2: '',
        post_code: '10001',
        state: 'NY',
      });

      expect(observed?.invoice_payload).toBe('order-789');
      expect(observed?.shipping_address.city).toBe('New York');
      expect(observed?.from.id).toBe(user.id);
    });
  });
});
