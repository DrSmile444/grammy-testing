import type { ChatSessionContext } from '@grammyjs/testing';
import { Bot } from 'grammy';

export interface ChatSettings {
  isMuted: boolean;
}

export type SettingsContext = ChatSessionContext<ChatSettings>;

/**
 * Creates a bot that stores per-chat mute settings using chat session.
 * @returns A configured Bot instance with chat session middleware applied.
 */
export function createChatSettingsBot() {
  const bot = new Bot<SettingsContext>('token');

  bot.command('mute', async (ctx) => {
    ctx.chatSession.isMuted = true;
    await ctx.reply('Chat muted.');
  });

  bot.command('unmute', async (ctx) => {
    ctx.chatSession.isMuted = false;
    await ctx.reply('Chat unmuted.');
  });

  bot.on('message:text', async (ctx) => {
    if (ctx.chatSession.isMuted) {
      await ctx.reply('This chat is muted.');
    }
  });

  return bot;
}
