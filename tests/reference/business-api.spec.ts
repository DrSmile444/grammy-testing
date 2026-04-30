/**
 * Reference suite: Business API update types.
 *
 * Covers the `BusinessAccount` actor and all five dispatch verbs:
 * `connect`, `disconnect`, `sendMessage`, `editMessage`, `deleteMessages`.
 */

import { Bot } from 'grammy';
import type { BusinessConnection, BusinessMessagesDeleted, Message } from 'grammy/types';
import { describe, expect, it } from 'vitest';

import { prepareBot } from '../../src/index';

describe('reference: business-api', () => {
  describe('chats.newBusinessAccount', () => {
    it('generates a connectionId matching biz-<n>', async () => {
      const bot = new Bot('test-token');
      const { chats } = await prepareBot(bot);
      const user = chats.newUser();

      const biz = chats.newBusinessAccount(user);

      expect(biz.connectionId).toMatch(/^biz-\d+$/);
    });

    it('exposes the owner user as biz.user', async () => {
      const bot = new Bot('test-token');
      const { chats } = await prepareBot(bot);
      const user = chats.newUser({ first_name: 'Alice' });

      const biz = chats.newBusinessAccount(user);

      expect(biz.user).toBe(user);
    });
  });

  describe('businessAccount.connect', () => {
    it('dispatches business_connection with is_enabled true', async () => {
      const bot = new Bot('test-token');
      let received: BusinessConnection | undefined;

      bot.on('business_connection', (ctx) => {
        received = ctx.businessConnection;
      });

      const { chats } = await prepareBot(bot);
      const user = chats.newUser();
      const biz = chats.newBusinessAccount(user);

      await biz.connect();

      expect(received).toBeDefined();
      expect(received?.is_enabled).toBe(true);
      expect(received?.id).toBe(biz.connectionId);
      expect(received?.user.id).toBe(user.id);
    });
  });

  describe('businessAccount.disconnect', () => {
    it('dispatches business_connection with is_enabled false', async () => {
      const bot = new Bot('test-token');
      let received: BusinessConnection | undefined;

      bot.on('business_connection', (ctx) => {
        received = ctx.businessConnection;
      });

      const { chats } = await prepareBot(bot);
      const user = chats.newUser();
      const biz = chats.newBusinessAccount(user);

      await biz.disconnect();

      expect(received?.is_enabled).toBe(false);
      expect(received?.id).toBe(biz.connectionId);
    });
  });

  describe('businessAccount.sendMessage', () => {
    it('dispatches business_message with the correct text and connection id', async () => {
      const bot = new Bot('test-token');
      let received: (Message & { business_connection_id?: string }) | undefined;

      bot.on('business_message', (ctx) => {
        received = ctx.businessMessage as Message & { business_connection_id?: string };
      });

      const { chats } = await prepareBot(bot);
      const user = chats.newUser();
      const biz = chats.newBusinessAccount(user);

      await biz.sendMessage('hello from business');

      expect(received?.text).toBe('hello from business');
      expect(received?.business_connection_id).toBe(biz.connectionId);
      expect(received?.from?.id).toBe(user.id);
      expect(received?.chat.id).toBe(user.id);
    });
  });

  describe('businessAccount.editMessage', () => {
    it('dispatches edited_business_message with the new text and correct message_id', async () => {
      const bot = new Bot('test-token');
      let received: (Message & { business_connection_id?: string }) | undefined;

      bot.on('edited_business_message', (ctx) => {
        received = ctx.editedBusinessMessage as Message & { business_connection_id?: string };
      });

      const { chats } = await prepareBot(bot);
      const user = chats.newUser();
      const biz = chats.newBusinessAccount(user);

      await biz.editMessage(42, 'updated text');

      expect(received?.text).toBe('updated text');
      expect(received?.message_id).toBe(42);
      expect(received?.business_connection_id).toBe(biz.connectionId);
    });
  });

  describe('businessAccount.deleteMessages', () => {
    it('dispatches deleted_business_messages with the supplied message ids', async () => {
      const bot = new Bot('test-token');
      let received: BusinessMessagesDeleted | undefined;

      bot.on('deleted_business_messages', (ctx) => {
        received = ctx.update.deleted_business_messages;
      });

      const { chats } = await prepareBot(bot);
      const user = chats.newUser();
      const biz = chats.newBusinessAccount(user);

      await biz.deleteMessages([10, 11, 12]);

      expect(received?.message_ids).toEqual([10, 11, 12]);
      expect(received?.business_connection_id).toBe(biz.connectionId);
    });
  });
});
