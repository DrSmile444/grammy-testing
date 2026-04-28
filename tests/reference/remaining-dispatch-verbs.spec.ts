/**
 * Pattern: Remaining dispatch verbs — audio, voice, video note, animation,
 * sticker, location, contact, venue, poll, dice.
 *
 * Covers all ten new user.send* verbs introduced in v0.3.
 */

import { Bot } from 'grammy';
import type { Message } from 'grammy/types';
import { describe, expect, it } from 'vitest';

import { prepareBot } from '../../src/index';

describe('reference: remaining dispatch verbs', () => {
  describe('sendAudio', () => {
    it('bot handler receives correct file_id', async () => {
      const bot = new Bot('test-token');
      let observed: string | undefined;

      bot.on('message:audio', (ctx) => {
        observed = ctx.message.audio.file_id;
      });

      const { chats } = await prepareBot(bot);
      const user = chats.newUser();
      await user.sendAudio('aud-001');

      expect(observed).toBe('aud-001');
    });

    it('auto-generates a stable file_id when none supplied', async () => {
      const bot = new Bot('test-token');
      let observed: string | undefined;

      bot.on('message:audio', (ctx) => {
        observed = ctx.message.audio.file_id;
      });

      const { chats } = await prepareBot(bot);
      const user = chats.newUser();
      await user.sendAudio();

      expect(observed).toMatch(/^stub-file-\d+$/u);
    });

    it('dispatches into a group via options.chat', async () => {
      const bot = new Bot('test-token');
      let observedChatId: number | undefined;

      bot.on('message:audio', (ctx) => {
        observedChatId = ctx.message.chat.id;
      });

      const { chats } = await prepareBot(bot);
      const user = chats.newUser();
      const group = chats.newSupergroup();
      await user.sendAudio('aud-001', { chat: group });

      expect(observedChatId).toBe(group.id);
    });
  });

  describe('sendVoice', () => {
    it('bot handler receives correct file_id', async () => {
      const bot = new Bot('test-token');
      let observed: string | undefined;

      bot.on('message:voice', (ctx) => {
        observed = ctx.message.voice.file_id;
      });

      const { chats } = await prepareBot(bot);
      const user = chats.newUser();
      await user.sendVoice('voi-001');

      expect(observed).toBe('voi-001');
    });

    it('auto-generates a stable file_id when none supplied', async () => {
      const bot = new Bot('test-token');
      let observed: string | undefined;

      bot.on('message:voice', (ctx) => {
        observed = ctx.message.voice.file_id;
      });

      const { chats } = await prepareBot(bot);
      const user = chats.newUser();
      await user.sendVoice();

      expect(observed).toMatch(/^stub-file-\d+$/u);
    });
  });

  describe('sendVideoNote', () => {
    it('bot handler receives correct file_id', async () => {
      const bot = new Bot('test-token');
      let observed: string | undefined;

      bot.on('message:video_note', (ctx) => {
        observed = ctx.message.video_note.file_id;
      });

      const { chats } = await prepareBot(bot);
      const user = chats.newUser();
      await user.sendVideoNote('vn-001');

      expect(observed).toBe('vn-001');
    });

    it('auto-generates a stable file_id when none supplied', async () => {
      const bot = new Bot('test-token');
      let observed: string | undefined;

      bot.on('message:video_note', (ctx) => {
        observed = ctx.message.video_note.file_id;
      });

      const { chats } = await prepareBot(bot);
      const user = chats.newUser();
      await user.sendVideoNote();

      expect(observed).toMatch(/^stub-file-\d+$/u);
    });
  });

  describe('sendAnimation', () => {
    it('bot handler receives correct file_id', async () => {
      const bot = new Bot('test-token');
      let observed: string | undefined;

      bot.on('message:animation', (ctx) => {
        observed = ctx.message.animation.file_id;
      });

      const { chats } = await prepareBot(bot);
      const user = chats.newUser();
      await user.sendAnimation('anim-001');

      expect(observed).toBe('anim-001');
    });

    it('auto-generates a stable file_id when none supplied', async () => {
      const bot = new Bot('test-token');
      let observed: string | undefined;

      bot.on('message:animation', (ctx) => {
        observed = ctx.message.animation.file_id;
      });

      const { chats } = await prepareBot(bot);
      const user = chats.newUser();
      await user.sendAnimation();

      expect(observed).toMatch(/^stub-file-\d+$/u);
    });
  });

  describe('sendSticker', () => {
    it('bot handler receives correct file_id', async () => {
      const bot = new Bot('test-token');
      let observed: string | undefined;

      bot.on('message:sticker', (ctx) => {
        observed = ctx.message.sticker.file_id;
      });

      const { chats } = await prepareBot(bot);
      const user = chats.newUser();
      await user.sendSticker('stk-001');

      expect(observed).toBe('stk-001');
    });

    it('auto-generates a stable file_id when none supplied', async () => {
      const bot = new Bot('test-token');
      let observed: string | undefined;

      bot.on('message:sticker', (ctx) => {
        observed = ctx.message.sticker.file_id;
      });

      const { chats } = await prepareBot(bot);
      const user = chats.newUser();
      await user.sendSticker();

      expect(observed).toMatch(/^stub-file-\d+$/u);
    });
  });

  describe('sendLocation', () => {
    it('bot handler receives correct coordinates', async () => {
      const bot = new Bot('test-token');
      let observedLat: number | undefined;
      let observedLng: number | undefined;

      bot.on('message:location', (ctx) => {
        observedLat = ctx.message.location.latitude;
        observedLng = ctx.message.location.longitude;
      });

      const { chats } = await prepareBot(bot);
      const user = chats.newUser();
      await user.sendLocation(51.5074, -0.1278);

      expect(observedLat).toBe(51.5074);
      expect(observedLng).toBe(-0.1278);
    });

    it('dispatches into a group via options.chat', async () => {
      const bot = new Bot('test-token');
      let observedChatId: number | undefined;

      bot.on('message:location', (ctx) => {
        observedChatId = ctx.message.chat.id;
      });

      const { chats } = await prepareBot(bot);
      const user = chats.newUser();
      const group = chats.newSupergroup();
      await user.sendLocation(0, 0, { chat: group });

      expect(observedChatId).toBe(group.id);
    });
  });

  describe('sendContact', () => {
    it('bot handler receives phone number and first name', async () => {
      const bot = new Bot('test-token');
      let observedContact: Message['contact'] | undefined;

      bot.on('message:contact', (ctx) => {
        observedContact = ctx.message.contact;
      });

      const { chats } = await prepareBot(bot);
      const user = chats.newUser();
      await user.sendContact('+1234567890', 'Alice');

      expect(observedContact?.phone_number).toBe('+1234567890');
      expect(observedContact?.first_name).toBe('Alice');
    });

    it('optional lastName is included when provided', async () => {
      const bot = new Bot('test-token');
      let observedContact: Message['contact'] | undefined;

      bot.on('message:contact', (ctx) => {
        observedContact = ctx.message.contact;
      });

      const { chats } = await prepareBot(bot);
      const user = chats.newUser();
      await user.sendContact('+1234567890', 'Alice', { lastName: 'Smith' });

      expect(observedContact?.last_name).toBe('Smith');
    });
  });

  describe('sendVenue', () => {
    it('bot handler receives venue title and address', async () => {
      const bot = new Bot('test-token');
      let observedVenue: Message['venue'] | undefined;

      bot.on('message:venue', (ctx) => {
        observedVenue = ctx.message.venue;
      });

      const { chats } = await prepareBot(bot);
      const user = chats.newUser();
      await user.sendVenue(51.5074, -0.1278, 'Big Ben', 'Westminster, London');

      expect(observedVenue?.title).toBe('Big Ben');
      expect(observedVenue?.address).toBe('Westminster, London');
      expect(observedVenue?.location.latitude).toBe(51.5074);
    });
  });

  describe('sendPoll', () => {
    it('bot handler receives question and options', async () => {
      const bot = new Bot('test-token');
      let observedPoll: Message['poll'] | undefined;

      bot.on('message:poll', (ctx) => {
        observedPoll = ctx.message.poll;
      });

      const { chats } = await prepareBot(bot);
      const user = chats.newUser();
      await user.sendPoll('Favorite color?', ['Red', 'Blue', 'Green']);

      expect(observedPoll?.question).toBe('Favorite color?');
      expect(observedPoll?.options).toHaveLength(3);
      expect(observedPoll?.options[0].text).toBe('Red');
    });
  });

  describe('sendDice', () => {
    it('bot handler receives default dice emoji and value 1', async () => {
      const bot = new Bot('test-token');
      let observedDice: Message['dice'] | undefined;

      bot.on('message:dice', (ctx) => {
        observedDice = ctx.message.dice;
      });

      const { chats } = await prepareBot(bot);
      const user = chats.newUser();
      await user.sendDice();

      expect(observedDice?.emoji).toBe('🎲');
      expect(observedDice?.value).toBe(1);
    });

    it('custom emoji is passed through', async () => {
      const bot = new Bot('test-token');
      let observedEmoji: string | undefined;

      bot.on('message:dice', (ctx) => {
        observedEmoji = ctx.message.dice.emoji;
      });

      const { chats } = await prepareBot(bot);
      const user = chats.newUser();
      await user.sendDice('🎯');

      expect(observedEmoji).toBe('🎯');
    });
  });
});
