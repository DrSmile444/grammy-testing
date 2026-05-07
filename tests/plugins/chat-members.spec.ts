/**
 * Plugin recipe: `@grammyjs/chat-members`
 *
 * Pattern: track member join/leave via chat_member updates dispatched through
 * bot.handleUpdate, then inspect the storage adapter directly.
 *
 * Setup notes:
 * - chatMembers(adapter) requires a StorageAdapter; MemorySessionStorage from
 *   grammy core works without any external infrastructure.
 * - The plugin listens to `chat_member` update type — a dedicated Telegram
 *   update type distinct from the `message:new_chat_members` service message.
 *   user.joinChat / user.leaveChat dispatch service messages; use
 *   bot.handleUpdate directly to dispatch `chat_member` updates.
 * - Default storage key is `${chatId}_${userId}` (defaultKeyStrategy).
 * - When a user leaves (status "left"), the plugin deletes the record by
 *   default. Set keepLeftChatMembers: true to retain them.
 * - ctx.chatMembers.getChatMember() is available on every update when the
 *   middleware is installed. It reads from the adapter (no API call if found).
 *
 * hydrateChatMember() setup notes:
 * - Install via bot.api.config.use(hydrateChatMember()) BEFORE prepareBot.
 * - Adds an .is(query) method to getChatMember and getChatAdministrators results.
 * - Works with the library's default responses for those methods without any
 *   custom responses override.
 */

import { chatMembers, type ChatMembersFlavor, hydrateChatMember } from '@grammyjs/chat-members';
import type { Context } from 'grammy';
import { Bot, MemorySessionStorage } from 'grammy';
import type { ChatMember, Update, User } from 'grammy/types';
import { describe, expect, it } from 'vitest';

import { prepareBot } from '../../src/index';

type MyContext = Context & ChatMembersFlavor;

/**
 *
 * @param userId
 * @param firstName
 */
function makeUser(userId: number, firstName: string): User {
  return { id: userId, is_bot: false, first_name: firstName };
}

/**
 *
 * @param userId
 * @param firstName
 */
function asMember(userId: number, firstName: string): ChatMember {
  return { status: 'member', user: makeUser(userId, firstName) };
}

/**
 *
 * @param userId
 * @param firstName
 */
function asLeft(userId: number, firstName: string): ChatMember {
  return { status: 'left', user: makeUser(userId, firstName) };
}

/**
 *
 * @param chatId
 * @param oldMember
 * @param newMember
 * @param updateId
 */
function makeChatMemberUpdate(chatId: number, oldMember: ChatMember, newMember: ChatMember, updateId = 1): Update {
  return {
    update_id: updateId,
    chat_member: {
      chat: { id: chatId, type: 'supergroup', title: 'Test Group' },
      from: { id: 999, is_bot: false, first_name: 'Admin' },
      date: Math.floor(Date.now() / 1000),
      old_chat_member: oldMember,
      new_chat_member: newMember,
    },
  } as Update;
}

describe('plugin: @grammyjs/chat-members', () => {
  it('plugin records a user join in the storage adapter', async () => {
    const adapter = new MemorySessionStorage<ChatMember>();
    const bot = new Bot<MyContext>('test-token');

    bot.use(chatMembers(adapter));

    await prepareBot<MyContext>(bot);

    const chatId = -100_000_001;
    const userId = 42;

    await bot.handleUpdate(makeChatMemberUpdate(chatId, asLeft(userId, 'Alice'), asMember(userId, 'Alice')));

    const stored = adapter.read(`${String(chatId)}_${String(userId)}`);

    expect(stored).toBeDefined();
    expect(stored?.status).toBe('member');
  });

  it('plugin removes a user record when they leave', async () => {
    const adapter = new MemorySessionStorage<ChatMember>();
    const bot = new Bot<MyContext>('test-token');

    bot.use(chatMembers(adapter));

    await prepareBot<MyContext>(bot);

    const chatId = -100_000_002;
    const userId = 43;

    await bot.handleUpdate(makeChatMemberUpdate(chatId, asLeft(userId, 'Bob'), asMember(userId, 'Bob'), 1));
    await bot.handleUpdate(makeChatMemberUpdate(chatId, asMember(userId, 'Bob'), asLeft(userId, 'Bob'), 2));

    const stored = adapter.read(`${String(chatId)}_${String(userId)}`);

    expect(stored).toBeUndefined();
  });

  it('getChatMember returns stored data without an API call', async () => {
    const adapter = new MemorySessionStorage<ChatMember>();
    const bot = new Bot<MyContext>('test-token');

    bot.use(chatMembers(adapter));

    let observedStatus: string | undefined;

    bot.on('message:text', async (ctx) => {
      const member = await ctx.chatMembers.getChatMember();

      observedStatus = member.status;
    });

    const { chats } = await prepareBot<MyContext>(bot);

    const group = chats.newSupergroup();
    const user = chats.newUser({ id: 44, first_name: 'Carol' });

    await bot.handleUpdate(makeChatMemberUpdate(group.id, asLeft(user.id, 'Carol'), asMember(user.id, 'Carol'), 1));

    await user.sendText('hello', { chat: group });

    expect(observedStatus).toBe('member');
  });
});

describe('plugin: @grammyjs/chat-members — hydrateChatMember()', () => {
  it('getChatMember result has .is() method when hydrateChatMember() is installed', async () => {
    const bot = new Bot('test-token');

    bot.api.config.use(hydrateChatMember());

    let hasIsMethod = false;

    bot.on('message:text', async (ctx) => {
      const member = await ctx.api.getChatMember(ctx.chat.id, ctx.from.id);

      hasIsMethod = typeof (member as unknown as { is?: unknown }).is === 'function';
    });

    const { chats } = await prepareBot(bot);
    const group = chats.newSupergroup();
    const user = chats.newUser();

    group.join(user);

    await user.sendText('ping', { chat: group });

    expect(hasIsMethod).toBe(true);
  });

  it('getChatAdministrators results each have .is() method', async () => {
    const bot = new Bot('test-token');

    bot.api.config.use(hydrateChatMember());

    let hasIsMethodOnAll = false;

    bot.on('message:text', async (ctx) => {
      const admins = await ctx.api.getChatAdministrators(ctx.chat.id);

      hasIsMethodOnAll = admins.length > 0 && admins.every((admin) => typeof (admin as unknown as { is?: unknown }).is === 'function');
    });

    const { chats } = await prepareBot(bot);
    const group = chats.newSupergroup();
    const admin = chats.newUser({ first_name: 'Admin' });
    const user = chats.newUser();

    group.promote(admin);
    group.join(user);

    await user.sendText('ping', { chat: group });

    expect(hasIsMethodOnAll).toBe(true);
  });
});
