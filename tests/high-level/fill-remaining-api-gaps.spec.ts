import { Bot } from 'grammy';
import { describe, expect, it } from 'vitest';

import { GROUP_ANONYMOUS_BOT, prepareBot } from '../../src/index';

// ─── #24: Chat factory ID override ─────────────────────────────────────────

describe('Chat factory ID override (#24)', () => {
  describe('newSupergroup', () => {
    it('accepts { id, title } and uses the supplied values', async () => {
      const bot = new Bot('test-token');
      const { chats } = await prepareBot(bot);
      const group = chats.newSupergroup({ id: 1_234_567, title: 'Logs' });

      expect(group.id).toBe(1_234_567);
      expect(group.title).toBe('Logs');
    });

    it('defaults title to Supergroup<abs(id)> when id supplied without title', async () => {
      const bot = new Bot('test-token');
      const { chats } = await prepareBot(bot);
      const group = chats.newSupergroup({ id: 1_234_567 });

      expect(group.id).toBe(1_234_567);
      expect(group.title).toBe('Supergroup1234567');
    });

    it('string form still works unchanged', async () => {
      const bot = new Bot('test-token');
      const { chats } = await prepareBot(bot);
      const group = chats.newSupergroup('My Group');

      expect(group.title).toBe('My Group');
      expect(typeof group.id).toBe('number');
    });

    it('no-arg form still works unchanged', async () => {
      const bot = new Bot('test-token');
      const { chats } = await prepareBot(bot);
      const group = chats.newSupergroup();

      expect(typeof group.id).toBe('number');
      expect(group.title).toMatch(/^Supergroup\d+$/);
    });
  });

  describe('newGroup', () => {
    it('accepts { id, title }', async () => {
      const bot = new Bot('test-token');
      const { chats } = await prepareBot(bot);
      const group = chats.newGroup({ id: -999, title: 'Training' });

      expect(group.id).toBe(-999);
      expect(group.title).toBe('Training');
    });

    it('defaults title to Group<abs(id)>', async () => {
      const bot = new Bot('test-token');
      const { chats } = await prepareBot(bot);
      const group = chats.newGroup({ id: -999 });

      expect(group.title).toBe('Group999');
    });
  });

  describe('newChannel', () => {
    it('accepts { id, title }', async () => {
      const bot = new Bot('test-token');
      const { chats } = await prepareBot(bot);
      const channel = chats.newChannel({ id: -500, title: 'Alerts' });

      expect(channel.id).toBe(-500);
      expect(channel.title).toBe('Alerts');
    });

    it('defaults title to Channel<abs(id)>', async () => {
      const bot = new Bot('test-token');
      const { chats } = await prepareBot(bot);
      const channel = chats.newChannel({ id: -500 });

      expect(channel.title).toBe('Channel500');
    });
  });

  describe('auto-derivation with specific-ID chat', () => {
    it('getChat auto-derivation works for a specific-ID supergroup', async () => {
      const bot = new Bot('test-token');
      let resolvedChatId: number | undefined;

      bot.on('message', async (ctx) => {
        const chat = await ctx.getChat();

        resolvedChatId = chat.id;
      });

      const { chats } = await prepareBot(bot);
      const group = chats.newSupergroup({ id: 1_234_567, title: 'Logs' });
      const user = chats.newUser();

      group.join(user);

      await user.sendText('hi', { chat: group });

      expect(resolvedChatId).toBe(1_234_567);
    });

    it('getChatAdministrators auto-derivation works for a specific-ID supergroup', async () => {
      const bot = new Bot('test-token');
      let adminCount = 0;

      bot.on('message', async (ctx) => {
        const admins = await ctx.getChatAdministrators();

        adminCount = admins.length;
      });

      const { chats } = await prepareBot(bot);
      const group = chats.newSupergroup({ id: 5_555_555, title: 'Ops' });
      const admin = chats.newUser();

      group.promote(admin);

      await admin.sendText('ping', { chat: group });

      expect(adminCount).toBe(1);
    });
  });
});

// ─── #22a: Anonymous admin dispatch ────────────────────────────────────────

describe('Anonymous admin dispatch (#22a)', () => {
  it('sendText with anonymous: true sets from to GroupAnonymousBot', async () => {
    const bot = new Bot('test-token');
    let capturedFrom: unknown;

    bot.on('message', (ctx) => {
      capturedFrom = ctx.message.from;
    });

    const { chats } = await prepareBot(bot);
    const group = chats.newSupergroup('Test Group');
    const user = chats.newUser();

    await user.sendText('hello', { chat: group, anonymous: true });

    expect(capturedFrom).toMatchObject({
      id: 1_087_968_824,
      username: 'GroupAnonymousBot',
      is_bot: false,
    });
  });

  it('sendText with anonymous: true sets sender_chat to the target group', async () => {
    const bot = new Bot('test-token');
    let capturedSenderChat: unknown;

    bot.on('message', (ctx) => {
      capturedSenderChat = ctx.message.sender_chat;
    });

    const { chats } = await prepareBot(bot);
    const group = chats.newSupergroup('Test Group');
    const user = chats.newUser();

    await user.sendText('hello', { chat: group, anonymous: true });

    expect((capturedSenderChat as { id: number } | undefined)?.id).toBe(group.id);
  });

  it('sendCommand with anonymous: true sets from to GroupAnonymousBot and preserves bot_command entity', async () => {
    const bot = new Bot('test-token');
    let capturedFrom: unknown;
    let capturedEntities: unknown;

    bot.on('message', (ctx) => {
      capturedFrom = ctx.message.from;
      capturedEntities = ctx.message.entities;
    });

    const { chats } = await prepareBot(bot);
    const group = chats.newSupergroup('Test Group');
    const user = chats.newUser();

    await user.sendCommand('/role', 'admin', { chat: group, anonymous: true });

    expect((capturedFrom as { id: number } | undefined)?.id).toBe(1_087_968_824);
    expect(capturedEntities).toEqual(expect.arrayContaining([expect.objectContaining({ type: 'bot_command' })]));
  });

  it('sendCommand with anonymous: true sets sender_chat', async () => {
    const bot = new Bot('test-token');
    let capturedSenderChat: unknown;

    bot.on('message', (ctx) => {
      capturedSenderChat = ctx.message.sender_chat;
    });

    const { chats } = await prepareBot(bot);
    const group = chats.newSupergroup('Test Group');
    const user = chats.newUser();

    await user.sendCommand('/role', 'admin', { chat: group, anonymous: true });

    expect((capturedSenderChat as { id: number } | undefined)?.id).toBe(group.id);
  });

  it('sendText with anonymous: true throws when chat is absent', async () => {
    const bot = new Bot('test-token');
    const { chats } = await prepareBot(bot);
    const user = chats.newUser();

    await expect(user.sendText('hello', { anonymous: true })).rejects.toThrow(
      'anonymous: true requires options.chat to be a Group or Supergroup',
    );
  });

  it('sendText with anonymous: true throws when chat is a Channel', async () => {
    const bot = new Bot('test-token');
    const { chats } = await prepareBot(bot);
    const user = chats.newUser();
    const channel = chats.newChannel('Test Channel');

    await expect(user.sendText('hello', { chat: channel, anonymous: true })).rejects.toThrow(
      'anonymous: true requires options.chat to be a Group or Supergroup',
    );
  });

  it('sendText without anonymous leaves from as the user and no sender_chat', async () => {
    const bot = new Bot('test-token');
    let capturedFrom: unknown;
    let capturedSenderChat: unknown;

    bot.on('message', (ctx) => {
      capturedFrom = ctx.message.from;
      capturedSenderChat = ctx.message.sender_chat;
    });

    const { chats } = await prepareBot(bot);
    const group = chats.newSupergroup('Test Group');
    const user = chats.newUser();

    await user.sendText('hello', { chat: group });

    expect((capturedFrom as { id: number } | undefined)?.id).toBe(user.id);
    expect(capturedSenderChat).toBeUndefined();
  });

  it('GROUP_ANONYMOUS_BOT constant is exported with correct values', () => {
    expect(GROUP_ANONYMOUS_BOT.id).toBe(1_087_968_824);
    expect(GROUP_ANONYMOUS_BOT.username).toBe('GroupAnonymousBot');
    expect(GROUP_ANONYMOUS_BOT.is_bot).toBe(false);
    expect(GROUP_ANONYMOUS_BOT.first_name).toBe('Group');
  });
});

// ─── #22b: Senderless system message ───────────────────────────────────────

describe('Senderless system message (#22b)', () => {
  it('group.sendSystemMessage dispatches message update with no from', async () => {
    const bot = new Bot('test-token');
    let capturedFrom: unknown = 'NOT_SET';
    let capturedText: string | undefined;

    bot.on('message', (ctx) => {
      capturedFrom = ctx.message.from;
      capturedText = ctx.message.text;
    });

    const { chats } = await prepareBot(bot);
    const group = chats.newSupergroup('Test Group');

    await group.sendSystemMessage('no sender text');

    expect(capturedFrom).toBeUndefined();
    expect(capturedText).toBe('no sender text');
  });

  it('channel.sendSystemMessage dispatches message with no from', async () => {
    const bot = new Bot('test-token');
    let capturedFrom: unknown = 'NOT_SET';

    bot.on('message', (ctx) => {
      capturedFrom = ctx.message.from;
    });

    const { chats } = await prepareBot(bot);
    const channel = chats.newChannel('Test Channel');

    await channel.sendSystemMessage('channel notice');

    expect(capturedFrom).toBeUndefined();
  });

  it('supergroup.sendSystemMessage dispatches message with no from', async () => {
    const bot = new Bot('test-token');
    let capturedFrom: unknown = 'NOT_SET';
    let capturedText: string | undefined;

    bot.on('message', (ctx) => {
      capturedFrom = ctx.message.from;
      capturedText = ctx.message.text;
    });

    const { chats } = await prepareBot(bot);
    const supergroup = chats.newSupergroup('Test Supergroup');

    await supergroup.sendSystemMessage('system notice');

    expect(capturedFrom).toBeUndefined();
    expect(capturedText).toBe('system notice');
  });

  it('options.messageId is reflected in the dispatched update', async () => {
    const bot = new Bot('test-token');
    let capturedMessageId: number | undefined;

    bot.on('message', (ctx) => {
      capturedMessageId = ctx.message.message_id;
    });

    const { chats } = await prepareBot(bot);
    const group = chats.newSupergroup('Test Group');

    await group.sendSystemMessage('text', { messageId: 42 });

    expect(capturedMessageId).toBe(42);
  });

  it('auto-generates message_id when options.messageId is omitted', async () => {
    const bot = new Bot('test-token');
    let capturedMessageId: number | undefined;

    bot.on('message', (ctx) => {
      capturedMessageId = ctx.message.message_id;
    });

    const { chats } = await prepareBot(bot);
    const group = chats.newSupergroup('Test Group');

    await group.sendSystemMessage('text');

    expect(typeof capturedMessageId).toBe('number');
    expect(capturedMessageId).toBeGreaterThan(0);
  });

  it('chat field matches the sending chat', async () => {
    const bot = new Bot('test-token');
    let capturedChatId: number | undefined;

    bot.on('message', (ctx) => {
      capturedChatId = ctx.message.chat.id;
    });

    const { chats } = await prepareBot(bot);
    const group = chats.newSupergroup({ id: 9_876_543, title: 'Sys Group' });

    await group.sendSystemMessage('text');

    expect(capturedChatId).toBe(9_876_543);
  });
});
