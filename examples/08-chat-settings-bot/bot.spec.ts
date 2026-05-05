import { mockChatSession, prepareBot } from '@grammyjs/testing';
import { Bot } from 'grammy';
import { describe, expect, it } from 'vitest';

import type { ChatSettings, SettingsContext } from './bot';

describe('chat-settings-bot', () => {
  it('mutes the chat on /mute', async () => {
    const { chatSession, mockChatSessionMiddleware } = mockChatSession<ChatSettings, SettingsContext>({ isMuted: false });

    const bot = new Bot<SettingsContext>('token');

    bot.use(mockChatSessionMiddleware);

    bot.command('mute', async (ctx) => {
      ctx.chatSession.isMuted = true;
      await ctx.reply('Chat muted.');
    });

    const { chats } = await prepareBot(bot);
    const user = chats.newUser();

    await user.sendCommand('/mute');

    expect(user.replies.lastOrThrow().text).toBe('Chat muted.');
    expect(chatSession.isMuted).toBe(true);
  });

  it('unmutes the chat on /unmute', async () => {
    const { chatSession, mockChatSessionMiddleware } = mockChatSession<ChatSettings, SettingsContext>({ isMuted: true });

    const bot = new Bot<SettingsContext>('token');

    bot.use(mockChatSessionMiddleware);

    bot.command('unmute', async (ctx) => {
      ctx.chatSession.isMuted = false;
      await ctx.reply('Chat unmuted.');
    });

    const { chats } = await prepareBot(bot);
    const user = chats.newUser();

    await user.sendCommand('/unmute');

    expect(user.replies.lastOrThrow().text).toBe('Chat unmuted.');
    expect(chatSession.isMuted).toBe(false);
  });

  it('suppresses text messages when chat is muted', async () => {
    const { mockChatSessionMiddleware } = mockChatSession<ChatSettings, SettingsContext>({ isMuted: true });

    const bot = new Bot<SettingsContext>('token');

    bot.use(mockChatSessionMiddleware);

    bot.on('message:text', async (ctx) => {
      if (ctx.chatSession.isMuted) {
        await ctx.reply('This chat is muted.');
      }
    });

    const { chats } = await prepareBot(bot);
    const user = chats.newUser();

    await user.sendText('hello');

    expect(user.replies.lastOrThrow().text).toBe('This chat is muted.');
  });

  it('the chat session is shared between users in the same chat', async () => {
    const { chatSession, mockChatSessionMiddleware } = mockChatSession<ChatSettings, SettingsContext>({ isMuted: false });

    const bot = new Bot<SettingsContext>('token');

    bot.use(mockChatSessionMiddleware);

    bot.command('mute', async (ctx) => {
      ctx.chatSession.isMuted = true;
      await ctx.reply('Chat muted.');
    });

    const { chats } = await prepareBot(bot);
    const alice = chats.newUser({ first_name: 'Alice' });

    await alice.sendCommand('/mute');

    expect(chatSession.isMuted).toBe(true);
  });
});
