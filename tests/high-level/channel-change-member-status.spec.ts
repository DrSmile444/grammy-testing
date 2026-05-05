import assert from 'node:assert';

import { Bot } from 'grammy';
import type { ChatMemberUpdated } from 'grammy/types';
import { describe, expect, it } from 'vitest';

import { prepareBot } from '../../src/index';

describe('channel.changeMemberStatus', () => {
  it('dispatches my_chat_member with chat.type === channel', async () => {
    const bot = new Bot('test-token');
    let observed: ChatMemberUpdated | undefined;

    bot.on('my_chat_member', (ctx) => {
      observed = ctx.update.my_chat_member;
    });

    const { chats } = await prepareBot(bot);
    const user = chats.newUser();
    const channel = chats.newChannel();

    await channel.changeMemberStatus(user, { from: 'left', to: 'administrator' });

    assert.ok(observed);
    expect(observed.chat.type).toBe('channel');
    expect(observed.chat.id).toBe(channel.id);
  });

  it('from field carries the trigger user', async () => {
    const bot = new Bot('test-token');
    let observed: ChatMemberUpdated | undefined;

    bot.on('my_chat_member', (ctx) => {
      observed = ctx.update.my_chat_member;
    });

    const { chats } = await prepareBot(bot);
    const user = chats.newUser();
    const channel = chats.newChannel();

    await channel.changeMemberStatus(user, { from: 'member', to: 'administrator' });

    assert.ok(observed);
    expect(observed.from.id).toBe(user.id);
  });

  it('old and new chat_member user is the bot', async () => {
    const bot = new Bot('test-token');
    let observed: ChatMemberUpdated | undefined;

    bot.on('my_chat_member', (ctx) => {
      observed = ctx.update.my_chat_member;
    });

    const { chats } = await prepareBot(bot);
    const user = chats.newUser();
    const channel = chats.newChannel();

    await channel.changeMemberStatus(user, { from: 'member', to: 'administrator' });

    assert.ok(observed);
    expect(observed.old_chat_member.user.id).toBe(bot.botInfo.id);
    expect(observed.new_chat_member.user.id).toBe(bot.botInfo.id);
  });

  it('getChatAdministrators reflects the bot after promotion', async () => {
    const bot = new Bot('test-token');

    bot.on('my_chat_member', () => {});

    const { chats } = await prepareBot(bot);
    const user = chats.newUser();
    const channel = chats.newChannel();

    await channel.changeMemberStatus(user, { from: 'left', to: 'administrator' });

    const admins = await bot.api.getChatAdministrators(channel.id);

    expect(admins.some((admin) => admin.user.id === bot.botInfo.id && admin.status === 'administrator')).toBe(true);
  });

  it('trigger actor membership is not affected', async () => {
    const bot = new Bot('test-token');

    bot.on('my_chat_member', () => {});

    const { chats } = await prepareBot(bot);
    const user = chats.newUser();
    const channel = chats.newChannel();

    await channel.changeMemberStatus(user, { to: 'administrator' });

    expect(user.in(channel)).toBeUndefined();
  });

  it('stores bot status in members map', async () => {
    const bot = new Bot('test-token');

    bot.on('my_chat_member', () => {});

    const { chats } = await prepareBot(bot);
    const user = chats.newUser();
    const channel = chats.newChannel();

    await channel.changeMemberStatus(user, { to: 'administrator' });

    expect(channel.members.get(bot.botInfo.id)?.status).toBe('administrator');
  });

  it('defaults include can_post_messages: true', async () => {
    const bot = new Bot('test-token');
    let observed: ChatMemberUpdated | undefined;

    bot.on('my_chat_member', (ctx) => {
      observed = ctx.update.my_chat_member;
    });

    const { chats } = await prepareBot(bot);
    const user = chats.newUser();
    const channel = chats.newChannel();

    await channel.changeMemberStatus(user, { to: 'administrator' });

    assert.ok(observed);
    expect((observed.new_chat_member as { can_post_messages?: boolean }).can_post_messages).toBe(true);
  });

  it('supplied permissions override defaults', async () => {
    const bot = new Bot('test-token');
    let observed: ChatMemberUpdated | undefined;

    bot.on('my_chat_member', (ctx) => {
      observed = ctx.update.my_chat_member;
    });

    const { chats } = await prepareBot(bot);
    const user = chats.newUser();
    const channel = chats.newChannel();

    await channel.changeMemberStatus(user, { to: 'administrator', permissions: { can_post_messages: false } });

    assert.ok(observed);
    expect((observed.new_chat_member as { can_post_messages?: boolean }).can_post_messages).toBe(false);
  });
});
