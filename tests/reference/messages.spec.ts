/**
 * Pattern: Text messages — entities, parse_mode, replies, forwards, edits.
 *
 * Source: ua-anti-spam-bot/tests/bot/composers/hotline-security.composer.spec.ts,
 *         ua-anti-spam-bot/tests/bot/composers/messages/no-channel-messages.composer.spec.ts,
 *         ua-anti-spam-bot/tests/edit-message.spec.ts
 * Inspired-by tests: ~40
 *
 * What this exercises: text-message variations bot tests routinely deal with.
 * `parse_mode`, custom entities, `reply_parameters`, forwarded messages
 * (forward_origin), edited messages, and nested reply chains.
 *
 * v0.2 API expression: user.sendText(text, { entities, parse_mode, reply_parameters }).
 * For forwarded/edited/nested-reply patterns the v0.2 surface is incomplete —
 * see `v0.2.x gap` markers below.
 *
 * v0.2.x gaps: forwarded messages, edited messages, nested reply chains.
 */

import { Bot } from 'grammy';
import type { Update } from 'grammy/types';
import { describe, expect, it } from 'vitest';

import { prepareBot } from '../../src/index';
import { MessagePrivateMockUpdate } from '../../src/low-level';

describe('reference: messages', () => {
  describe('parse_mode and entities', () => {
    it('bot replying with parse_mode HTML is observable on Reply', async () => {
      const bot = new Bot('test-token');

      bot.on('message:text', async (context) => {
        await context.reply('<b>hi</b>', { parse_mode: 'HTML' });
      });

      const { chats } = await prepareBot(bot);
      const user = chats.newUser();

      await user.sendText('trigger');

      expect(chats.repliesFor(user).last?.parseMode).toBe('HTML');
      expect(chats.repliesFor(user).last?.text).toBe('<b>hi</b>');
    });

    it('user can send text with custom entities (mention + url)', async () => {
      const bot = new Bot('test-token');
      let entitiesObserved: unknown;

      bot.on('message:text', (context) => {
        entitiesObserved = context.message.entities;
      });

      const { chats } = await prepareBot(bot);
      const user = chats.newUser();

      await user.sendText('Hi @bob check https://example.com', {
        entities: [
          { type: 'mention', offset: 3, length: 4 },
          { type: 'url', offset: 14, length: 19 },
        ],
      });

      expect(entitiesObserved).toEqual([
        { type: 'mention', offset: 3, length: 4 },
        { type: 'url', offset: 14, length: 19 },
      ]);
    });
  });

  describe('reply_parameters (single-level)', () => {
    it('user can reply to a known message_id via reply_parameters', async () => {
      const bot = new Bot('test-token');
      let observedReplyTo: number | undefined;

      bot.on('message:text', (context) => {
        observedReplyTo = context.message.reply_to_message?.message_id;
      });

      const { chats } = await prepareBot(bot);
      const user = chats.newUser();

      await user.sendText('reply text', {
        reply_parameters: { message_id: 100 },
        reply_to_message: {
          message_id: 100,
          date: 1_000_000,
          chat: chats.newPrivateChat(user).toTelegramChat(),
          text: 'original',
        },
      });

      expect(observedReplyTo).toBe(100);
    });
  });

  describe('forwarded messages (v0.2.x gap)', () => {
    it('bot reacts to a forwarded message via low-level buildOverwrite', async () => {
      // v0.2.x gap: no high-level forward verb yet. We construct the
      // forward_origin payload via the v0.1 MessageMockUpdate escape
      // hatch. Suggested proposal: add-forwarded-message-dispatch.
      const bot = new Bot('test-token');

      bot.on('message', async (context) => {
        if (context.message.forward_origin) {
          await context.deleteMessage();
        }
      });

      const { chats } = await prepareBot(bot);

      const update = new MessagePrivateMockUpdate('forwarded text').buildOverwrite({
        message: {
          forward_origin: {
            type: 'user',
            sender_user: {
              id: 99,
              is_bot: false,
              first_name: 'OriginalSender',
            },
            date: 1_000_000,
          },
        },
      });

      await bot.handleUpdate(update);

      expect(chats.outgoing.getMethods()).toContain('deleteMessage');
    });
  });

  describe('edited messages (v0.2.x gap)', () => {
    it('bot reacts to an edited_message update via inline Update literal', async () => {
      // v0.2.x gap: no high-level edit verb yet. We construct an
      // `edited_message`-shaped update inline (the v0.1 MockUpdate
      // builders all populate the `message` field, not `edited_message`).
      // Suggested proposal: add-edited-message-dispatch.
      const bot = new Bot('test-token');
      let editedTextObserved: string | undefined;

      bot.on('edited_message', (context) => {
        editedTextObserved = context.editedMessage.text;
      });

      const { chats } = await prepareBot(bot);
      const user = chats.newUser();
      const dm = chats.newPrivateChat(user);

      const update: Update = {
        update_id: 999_001,
        edited_message: {
          message_id: 50,
          date: 1_000_000,
          edit_date: 1_000_500,
          from: {
            id: user.id,
            is_bot: false,
            first_name: user.first_name,
          },
          chat: dm.toTelegramChat(),
          text: 'edited content',
        },
      };

      await bot.handleUpdate(update);

      expect(editedTextObserved).toBe('edited content');
    });
  });

  describe('nested reply chains (v0.2.x gap beyond single-level)', () => {
    it('bot reacts to a reply-to-a-reply via inline Update construction', async () => {
      // v0.2.x gap: user.sendText with reply_to_message covers single-level
      // replies. Multi-level chains (reply-to-a-reply with overridden
      // metadata on the replied message) need inline Update assembly.
      // Suggested proposal: add-nested-reply-chains.
      const bot = new Bot('test-token');
      let chainDepth = 0;

      bot.on('message:text', (context) => {
        let cursor = context.message.reply_to_message;

        while (cursor) {
          chainDepth += 1;
          cursor = cursor.reply_to_message;
        }
      });

      const { chats } = await prepareBot(bot);
      const user = chats.newUser();
      const dm = chats.newPrivateChat(user);
      const chatPayload = dm.toTelegramChat();

      const grandReply = {
        update_id: 999_010,
        message: {
          message_id: 30,
          date: 1_000_000,
          from: { id: user.id, is_bot: false, first_name: user.first_name },
          chat: chatPayload,
          text: 'grand-reply',
          reply_to_message: {
            message_id: 20,
            date: 999_990,
            from: { id: user.id, is_bot: false, first_name: user.first_name },
            chat: chatPayload,
            text: 'middle reply',
            reply_to_message: {
              message_id: 10,
              date: 999_980,
              from: { id: user.id, is_bot: false, first_name: user.first_name },
              chat: chatPayload,
              text: 'original',
            },
          },
        },
      } as unknown as Update;

      await bot.handleUpdate(grandReply);

      expect(chainDepth).toBe(2);
    });
  });
});
