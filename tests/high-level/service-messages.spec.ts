import { Bot } from 'grammy';
import { describe, expect, it } from 'vitest';

import { prepareBot } from '../../src/index';

describe('User.joinChat', () => {
  it('dispatches new_chat_members service message observable by the bot', async () => {
    const bot = new Bot('test-token');
    let observedJoiner: number | undefined;

    bot.on('message:new_chat_members', (context) => {
      observedJoiner = context.message.new_chat_members[0]?.id;
    });

    const { chats } = await prepareBot(bot);
    const user = chats.newUser({ username: 'alice' });
    const group = chats.newSupergroup();

    await user.joinChat(group);

    expect(observedJoiner).toBe(user.id);
  });

  it('updates a fresh user to status "member"', async () => {
    const bot = new Bot('test-token');

    bot.on('message:new_chat_members', () => {});

    const { chats } = await prepareBot(bot);
    const user = chats.newUser();
    const group = chats.newSupergroup();

    await user.joinChat(group);

    expect(user.in(group)?.status).toBe('member');
  });

  it('does NOT downgrade an administrator', async () => {
    const bot = new Bot('test-token');

    bot.on('message:new_chat_members', () => {});

    const { chats } = await prepareBot(bot);
    const user = chats.newUser();
    const group = chats.newSupergroup();

    group.promote(user, { can_delete_messages: true });

    await user.joinChat(group);

    expect(user.in(group)?.status).toBe('administrator');
    expect(user.in(group)?.permissions.can_delete_messages).toBe(true);
  });

  it('throws on a private chat target', async () => {
    const bot = new Bot('test-token');
    const { chats } = await prepareBot(bot);
    const user = chats.newUser();
    const dm = chats.newPrivateChat(user);

    await expect(user.joinChat(dm as never)).rejects.toThrow(/private/);
  });

  it('throws on a channel target', async () => {
    const bot = new Bot('test-token');
    const { chats } = await prepareBot(bot);
    const user = chats.newUser();
    const channel = chats.newChannel();

    await expect(user.joinChat(channel as never)).rejects.toThrow(/channel/);
  });
});

describe('User.leaveChat', () => {
  it('dispatches left_chat_member service message observable by the bot', async () => {
    const bot = new Bot('test-token');
    let observedLeaver: number | undefined;

    bot.on('message:left_chat_member', (context) => {
      observedLeaver = context.message.left_chat_member.id;
    });

    const { chats } = await prepareBot(bot);
    const user = chats.newUser();
    const group = chats.newSupergroup();

    await user.leaveChat(group);

    expect(observedLeaver).toBe(user.id);
  });

  it('updates membership to status "left"', async () => {
    const bot = new Bot('test-token');

    bot.on('message:left_chat_member', () => {});

    const { chats } = await prepareBot(bot);
    const user = chats.newUser();
    const group = chats.newSupergroup();

    group.promote(user);
    await user.leaveChat(group);

    expect(user.in(group)?.status).toBe('left');
  });

  it('leaving a chat the user was never in still works', async () => {
    const bot = new Bot('test-token');

    bot.on('message:left_chat_member', () => {});

    const { chats } = await prepareBot(bot);
    const user = chats.newUser();
    const group = chats.newSupergroup();

    await user.leaveChat(group);

    expect(user.in(group)?.status).toBe('left');
  });

  it('re-joining after leaveChat upgrades "left" to "member"', async () => {
    const bot = new Bot('test-token');

    bot.on('message:new_chat_members', () => {});
    bot.on('message:left_chat_member', () => {});

    const { chats } = await prepareBot(bot);
    const user = chats.newUser();
    const group = chats.newSupergroup();

    await user.joinChat(group);
    expect(user.in(group)?.status).toBe('member');

    await user.leaveChat(group);
    expect(user.in(group)?.status).toBe('left');

    await user.joinChat(group);
    expect(user.in(group)?.status).toBe('member');
  });
});

describe('user.replies filter respects "left" status', () => {
  it('after leaveChat, mention-bearing broadcast does NOT land in user.replies', async () => {
    const bot = new Bot('test-token');

    bot.on('message:left_chat_member', () => {});

    const { chats } = await prepareBot(bot);
    const user = chats.newUser({ username: 'alice' });
    const group = chats.newSupergroup();

    group.promote(user); // user is an active participant

    // First broadcast — user is active, mention-rule lands it in user.replies:
    await bot.api.sendMessage(group.id, 'Hello @alice — welcome!', {
      entities: [{ type: 'mention', offset: 6, length: 6 }],
    });

    expect(chats.repliesFor(user).length).toBe(1);

    // User leaves:
    await user.leaveChat(group);

    // Second broadcast (also mentions @alice) — should NOT land:
    await bot.api.sendMessage(group.id, 'Goodbye @alice', {
      entities: [{ type: 'mention', offset: 8, length: 6 }],
    });

    expect(chats.repliesFor(user).length).toBe(1); // unchanged
    expect(group.messages.length).toBe(2); // canonical log still has both
  });
});
