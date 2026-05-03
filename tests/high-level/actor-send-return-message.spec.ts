import { Bot } from 'grammy';
import { describe, expect, it } from 'vitest';

import { prepareBot } from '../../src/index';

describe('Actor send return message', () => {
  describe('sendText', () => {
    it('returns the dispatched Message with message_id and text', async () => {
      const bot = new Bot('test-token');
      const { chats } = await prepareBot(bot);
      const user = chats.newUser();

      const message = await user.sendText('hello');

      expect(message.message_id).toBeGreaterThan(0);
      expect(message.text).toBe('hello');
      expect(message.from?.id).toBe(user.id);
    });

    it('returned message_id matches what the bot receives', async () => {
      const bot = new Bot('test-token');
      let botSeen: number | undefined;

      bot.on('message:text', (ctx) => {
        botSeen = ctx.message.message_id;
      });

      const { chats } = await prepareBot(bot);
      const user = chats.newUser();

      const message = await user.sendText('trigger');

      expect(message.message_id).toBe(botSeen);
    });

    it('return value can be passed directly to editMessage', async () => {
      const bot = new Bot('test-token');
      let editedId: number | undefined;

      bot.on('edited_message', (ctx) => {
        editedId = ctx.editedMessage.message_id;
      });

      const { chats } = await prepareBot(bot);
      const user = chats.newUser();

      const message = await user.sendText('original');

      await user.editMessage(message.message_id, 'updated');

      expect(editedId).toBe(message.message_id);
    });

    it('callers that ignore the return value are unaffected', async () => {
      const bot = new Bot('test-token');

      bot.on('message:text', async (ctx) => ctx.reply('ok'));

      const { chats } = await prepareBot(bot);
      const user = chats.newUser();

      await user.sendText('hello');

      expect(user.replies.lastOrThrow().text).toBe('ok');
    });
  });

  describe('sendCommand', () => {
    it('returns the dispatched Message with correct text and message_id', async () => {
      const bot = new Bot('test-token');
      const { chats } = await prepareBot(bot);
      const user = chats.newUser();

      const message = await user.sendCommand('/start');

      expect(message.message_id).toBeGreaterThan(0);
      expect(message.text).toBe('/start');
    });
  });

  describe('sendPhoto', () => {
    it('returns the dispatched Message with photo field', async () => {
      const bot = new Bot('test-token');
      const { chats } = await prepareBot(bot);
      const user = chats.newUser();

      const message = await user.sendPhoto('img-001');

      expect(message.message_id).toBeGreaterThan(0);
      expect(message.photo).toBeDefined();
      expect(message.photo).toHaveLength(1);
    });
  });

  describe('sendMediaGroup', () => {
    it('returns one Message per item', async () => {
      const bot = new Bot('test-token');
      const { chats } = await prepareBot(bot);
      const user = chats.newUser();

      const msgs = await user.sendMediaGroup([{ photo: 'a' }, { photo: 'b' }]);

      expect(msgs).toHaveLength(2);
      expect(msgs[0].message_id).toBeGreaterThan(0);
      expect(msgs[1].message_id).toBeGreaterThan(0);
      expect(msgs[0].message_id).not.toBe(msgs[1].message_id);
    });

    it('all returned messages share the same media_group_id', async () => {
      const bot = new Bot('test-token');
      const { chats } = await prepareBot(bot);
      const user = chats.newUser();

      const msgs = await user.sendMediaGroup([{ photo: 'a' }, { photo: 'b' }]);

      expect(msgs[0].media_group_id).toBeDefined();
      expect(msgs[0].media_group_id).toBe(msgs[1].media_group_id);
    });
  });
});
