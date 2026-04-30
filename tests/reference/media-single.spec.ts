/**
 * Pattern: Single-media dispatch — photo, document, video.
 *
 * What this exercises: bots that gate logic on incoming media type,
 * read `message.photo[0].file_id`, `message.document.file_id`, or
 * `message.video.file_id`, or echo media back to the sender.
 *
 * v0.2 API expression:
 *   user.sendPhoto(file?, { caption?, chat? })
 *   user.sendDocument(file?, { caption?, chat? })
 *   user.sendVideo(file?, { caption?, chat? })
 *
 * v0.2.x gaps: none for this pattern category.
 */

import { Bot } from 'grammy';
import { describe, expect, it } from 'vitest';

import { prepareBot } from '../../src/index';

describe('reference: single-media dispatch', () => {
  describe('sendPhoto', () => {
    it('bot handler receives correct file_id from sendPhoto', async () => {
      const bot = new Bot('test-token');
      let observedFileId: string | undefined;

      bot.on('message:photo', (ctx) => {
        observedFileId = ctx.message.photo[0]?.file_id;
      });

      const { chats } = await prepareBot(bot);
      const user = chats.newUser();

      await user.sendPhoto('img-001');

      expect(observedFileId).toBe('img-001');
    });

    it('auto-generates a stable file_id when none supplied', async () => {
      const bot = new Bot('test-token');
      let observedFileId: string | undefined;

      bot.on('message:photo', (ctx) => {
        observedFileId = ctx.message.photo[0]?.file_id;
      });

      const { chats } = await prepareBot(bot);
      const user = chats.newUser();

      await user.sendPhoto();

      expect(observedFileId).toMatch(/^stub-file-\d+$/u);
    });

    it('caption is carried on the photo message', async () => {
      const bot = new Bot('test-token');
      let observedCaption: string | undefined;

      bot.on('message:photo', (ctx) => {
        observedCaption = ctx.message.caption;
      });

      const { chats } = await prepareBot(bot);
      const user = chats.newUser();

      await user.sendPhoto('img-001', { caption: 'my photo' });

      expect(observedCaption).toBe('my photo');
    });

    it('dispatches into a group via options.chat', async () => {
      const bot = new Bot('test-token');
      let observedChatId: number | undefined;

      bot.on('message:photo', (ctx) => {
        observedChatId = ctx.message.chat.id;
      });

      const { chats } = await prepareBot(bot);
      const user = chats.newUser();
      const group = chats.newSupergroup();

      await user.sendPhoto('img-001', { chat: group });

      expect(observedChatId).toBe(group.id);
    });
  });

  describe('sendDocument', () => {
    it('bot handler receives correct file_id from sendDocument', async () => {
      const bot = new Bot('test-token');
      let observedFileId: string | undefined;

      bot.on('message:document', (ctx) => {
        observedFileId = ctx.message.document.file_id;
      });

      const { chats } = await prepareBot(bot);
      const user = chats.newUser();

      await user.sendDocument('doc-001');

      expect(observedFileId).toBe('doc-001');
    });

    it('caption is carried on the document message', async () => {
      const bot = new Bot('test-token');
      let observedCaption: string | undefined;

      bot.on('message:document', (ctx) => {
        observedCaption = ctx.message.caption;
      });

      const { chats } = await prepareBot(bot);
      const user = chats.newUser();

      await user.sendDocument('doc-001', { caption: 'attached file' });

      expect(observedCaption).toBe('attached file');
    });

    it('dispatches into a group via options.chat', async () => {
      const bot = new Bot('test-token');
      let observedChatId: number | undefined;

      bot.on('message:document', (ctx) => {
        observedChatId = ctx.message.chat.id;
      });

      const { chats } = await prepareBot(bot);
      const user = chats.newUser();
      const group = chats.newSupergroup();

      await user.sendDocument('doc-001', { chat: group });

      expect(observedChatId).toBe(group.id);
    });
  });

  describe('sendVideo', () => {
    it('bot handler receives correct file_id from sendVideo', async () => {
      const bot = new Bot('test-token');
      let observedFileId: string | undefined;

      bot.on('message:video', (ctx) => {
        observedFileId = ctx.message.video.file_id;
      });

      const { chats } = await prepareBot(bot);
      const user = chats.newUser();

      await user.sendVideo('vid-001');

      expect(observedFileId).toBe('vid-001');
    });

    it('dispatches into a group via options.chat', async () => {
      const bot = new Bot('test-token');
      let observedChatId: number | undefined;

      bot.on('message:video', (ctx) => {
        observedChatId = ctx.message.chat.id;
      });

      const { chats } = await prepareBot(bot);
      const user = chats.newUser();
      const group = chats.newSupergroup();

      await user.sendVideo('vid-001', { chat: group });

      expect(observedChatId).toBe(group.id);
    });
  });

  describe('reply.media', () => {
    it('reply.media reflects the file_id when bot echoes a photo back', async () => {
      const bot = new Bot('test-token');

      bot.on('message:photo', async (ctx) => {
        await ctx.replyWithPhoto(ctx.message.photo[0].file_id);
      });

      const { chats } = await prepareBot(bot);
      const user = chats.newUser();

      await user.sendPhoto('img-echo');

      const reply = chats.repliesFor(user).last;

      expect(reply?.media?.type).toBe('photo');
      expect(reply?.media?.fileId).toBe('img-echo');
    });

    it('reply.media is undefined for text-only replies', async () => {
      const bot = new Bot('test-token');

      bot.on('message:text', async (ctx) => {
        await ctx.reply('hello');
      });

      const { chats } = await prepareBot(bot);
      const user = chats.newUser();

      await user.sendText('trigger');

      expect(chats.repliesFor(user).last?.media).toBeUndefined();
    });
  });
});
