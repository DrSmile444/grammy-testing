import { Bot } from 'grammy';
import { describe, expect, it } from 'vitest';

import { prepareBot } from '../../src/index';

describe('user.replies filter rule', () => {
  it('DM reply lands in user.replies', async () => {
    const bot = new Bot('test-token');

    bot.on('message:text', async (ctx) => {
      await ctx.reply('hello');
    });

    const { chats } = await prepareBot(bot);
    const user = chats.newUser();

    await user.sendText('hi');

    expect(chats.repliesFor(user).last?.text).toBe('hello');
  });

  it('Group broadcast does NOT land in user.replies (lands in chat.messages)', async () => {
    const bot = new Bot('test-token');
    const { chats } = await prepareBot(bot);
    const user = chats.newUser();
    const group = chats.newSupergroup();

    group.promote(user); // user is now a member of the group
    chats.repliesFor(user); // ensure inbox exists

    // Bot broadcasts to the group with no addressee:
    await bot.api.sendMessage(group.id, 'broadcast to all');

    expect(group.messages.last?.text).toBe('broadcast to all');
    expect(chats.repliesFor(user).all).toHaveLength(0);
  });

  it('Mention of @username lands in that user.replies', async () => {
    const bot = new Bot('test-token');

    bot.on('message:text', async (ctx) => {
      // Reply with @-mention of the sending user; mark the mention via entities.
      const { username } = ctx.message.from;

      if (!username) {
        return;
      }

      const text = `Welcome, @${username}!`;
      const offset = text.indexOf(`@${username}`);

      await ctx.api.sendMessage(ctx.chat.id, text, {
        entities: [{ type: 'mention', offset, length: username.length + 1 }],
      });
    });

    const { chats } = await prepareBot(bot);
    const group = chats.newSupergroup();
    const alice = chats.newUser({ username: 'alice' });

    group.promote(alice);

    await alice.sendText('hi', { chat: group });

    expect(chats.repliesFor(alice).last?.text).toContain('@alice');
  });
});
