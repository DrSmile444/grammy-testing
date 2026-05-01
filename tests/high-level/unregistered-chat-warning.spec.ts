import { Bot } from 'grammy';
import { describe, expect, it, vi } from 'vitest';

import { prepareBot } from '../../src/index';

describe('warnOnUnregisteredChats', () => {
  it('emits console.warn by default when sendMessage targets an unknown chat', async () => {
    const bot = new Bot('test-token');
    const EXTERNAL_CHAT_ID = -999_888_777;

    bot.on('message:text', async (ctx) => {
      await ctx.api.sendMessage(EXTERNAL_CHAT_ID, 'log entry');
    });

    const { chats } = await prepareBot(bot);
    const user = chats.newUser();
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    await user.sendText('trigger');

    expect(warnSpy).toHaveBeenCalledOnce();
    expect(warnSpy.mock.calls[0]?.[0]).toContain('[grammy-testing]');
    expect(warnSpy.mock.calls[0]?.[0]).toContain('sendMessage');
    expect(warnSpy.mock.calls[0]?.[0]).toContain(String(EXTERNAL_CHAT_ID));

    // call is still captured in outgoing
    expect(chats.outgoing.getMethods()).toContain('sendMessage');

    warnSpy.mockRestore();
  });

  it('suppresses warning when warnOnUnregisteredChats is false', async () => {
    const bot = new Bot('test-token');
    const EXTERNAL_CHAT_ID = -999_888_777;

    bot.on('message:text', async (ctx) => {
      await ctx.api.sendMessage(EXTERNAL_CHAT_ID, 'log entry');
    });

    const { chats } = await prepareBot(bot, { warnOnUnregisteredChats: false });
    const user = chats.newUser();
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    await user.sendText('trigger');

    expect(warnSpy).not.toHaveBeenCalled();

    // call is still captured in outgoing
    expect(chats.outgoing.getMethods()).toContain('sendMessage');

    warnSpy.mockRestore();
  });

  it('emits warning for sendChatAction to unknown chat', async () => {
    const bot = new Bot('test-token');
    const EXTERNAL_CHAT_ID = -999_888_777;

    bot.on('message:text', async (ctx) => {
      await ctx.api.sendChatAction(EXTERNAL_CHAT_ID, 'typing');
    });

    const { chats } = await prepareBot(bot);
    const user = chats.newUser();
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    await user.sendText('trigger');

    expect(warnSpy).toHaveBeenCalledOnce();
    expect(warnSpy.mock.calls[0]?.[0]).toContain('sendChatAction');

    warnSpy.mockRestore();
  });

  it('emits warning for deleteMessage to unknown chat', async () => {
    const bot = new Bot('test-token');
    const EXTERNAL_CHAT_ID = -999_888_777;

    bot.on('message:text', async (ctx) => {
      await ctx.api.deleteMessage(EXTERNAL_CHAT_ID, 123);
    });

    const { chats } = await prepareBot(bot);
    const user = chats.newUser();
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    await user.sendText('trigger');

    expect(warnSpy).toHaveBeenCalledOnce();
    expect(warnSpy.mock.calls[0]?.[0]).toContain('deleteMessage');

    warnSpy.mockRestore();
  });

  it('does not emit warning for editMessageText targeting unknown message ID', async () => {
    const bot = new Bot('test-token');

    bot.on('message:text', async (ctx) => {
      // Edit a message ID that was never captured during this test
      await ctx.api.editMessageText(ctx.chat.id, 99_999, 'new text').catch(() => {});
    });

    const { chats } = await prepareBot(bot);
    const user = chats.newUser();

    chats.newPrivateChat(user);
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    await user.sendText('trigger');

    expect(warnSpy).not.toHaveBeenCalled();

    warnSpy.mockRestore();
  });

  it('does not warn when sendMessage targets a registered chat', async () => {
    const bot = new Bot('test-token');

    bot.on('message:text', async (ctx) => {
      await ctx.reply('hello');
    });

    const { chats } = await prepareBot(bot);
    const user = chats.newUser();
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    await user.sendText('trigger');

    expect(warnSpy).not.toHaveBeenCalled();

    warnSpy.mockRestore();
  });
});
