/**
 * Pattern: Channel posts into a supergroup (sender_chat scenarios).
 *
 * What this exercises: bot detection of messages whose author is a
 * channel rather than a user. Real Telegram inserts `sender_chat = <channel>`
 * and `from = Channel_Bot` (id 136817688) for these.
 *
 * v0.2 API expression: channel.postMessageTo(group, text). The Channel
 * actor handles the sender_chat / Channel_Bot synthesis automatically.
 *
 * v0.2.x gaps: none for this pattern category at v0.2.
 */

import { Bot } from 'grammy';
import { describe, expect, it } from 'vitest';

import { prepareBot } from '../../src/index';

describe('reference: channel posts', () => {
  it('bot detects sender_chat and reacts (e.g. deletes the message)', async () => {
    const bot = new Bot('test-token');

    bot.on('message', async (context) => {
      if (context.message.sender_chat?.type === 'channel') {
        await context.deleteMessage();
      }
    });

    const { chats } = await prepareBot(bot);
    const channel = chats.newChannel('Main');
    const group = chats.newSupergroup('Discussion');

    await channel.postMessageTo(group, 'Channel announcement');

    expect(chats.outgoing.getMethods()).toContain('deleteMessage');
  });

  it('bot discriminates: ignores user messages, acts on channel posts', async () => {
    const bot = new Bot('test-token');
    let userMessages = 0;
    let channelPosts = 0;

    bot.on('message', (context) => {
      if (context.message.sender_chat?.type === 'channel') {
        channelPosts += 1;
      } else {
        userMessages += 1;
      }
    });

    const { chats } = await prepareBot(bot);
    const channel = chats.newChannel('News');
    const group = chats.newSupergroup('Discussion');
    const user = chats.newUser();

    group.promote(user);

    // User-authored message:
    await user.sendText('regular text from a user', { chat: group });
    // Channel-as-author post into the same group:
    await channel.postMessageTo(group, 'announcement from channel');

    expect(userMessages).toBe(1);
    expect(channelPosts).toBe(1);
  });
});
