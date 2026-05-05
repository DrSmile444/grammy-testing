import assert from 'node:assert';

import { Bot } from 'grammy';
import type { ChatMember } from 'grammy/types';
import { describe, expect, it, vi } from 'vitest';

import { prepareBot } from '../../src/index';

// ─── own() / join() ───────────────────────────────────────────────────────────

describe('group.own', () => {
  it('sets creator status in the members map', async () => {
    const bot = new Bot('test-token');
    const { chats } = await prepareBot(bot);
    const user = chats.newUser();
    const group = chats.newSupergroup();

    group.own(user);

    expect(user.in(group)?.status).toBe('creator');
  });

  it('returns the Membership record', async () => {
    const bot = new Bot('test-token');
    const { chats } = await prepareBot(bot);
    const user = chats.newUser();
    const group = chats.newSupergroup();

    const membership = group.own(user);

    expect(membership.status).toBe('creator');
    expect(membership.user).toBe(user);
    expect(membership.chat).toBe(group);
  });

  it('overwrites a prior status', async () => {
    const bot = new Bot('test-token');
    const { chats } = await prepareBot(bot);
    const user = chats.newUser();
    const group = chats.newSupergroup();

    group.promote(user);
    group.own(user);

    expect(user.in(group)?.status).toBe('creator');
  });

  it('does not dispatch any update', async () => {
    const bot = new Bot('test-token');
    const handler = vi.fn();

    bot.on('my_chat_member', handler);

    const { chats } = await prepareBot(bot);
    const user = chats.newUser();
    const group = chats.newSupergroup();

    group.own(user);
    await chats.idle();

    expect(handler).not.toHaveBeenCalled();
  });

  it('works on Group as well as Supergroup', async () => {
    const bot = new Bot('test-token');
    const { chats } = await prepareBot(bot);
    const user = chats.newUser();
    const group = chats.newGroup();

    group.own(user);

    expect(user.in(group)?.status).toBe('creator');
  });
});

describe('group.join', () => {
  it('sets member status in the members map', async () => {
    const bot = new Bot('test-token');
    const { chats } = await prepareBot(bot);
    const user = chats.newUser();
    const group = chats.newSupergroup();

    group.join(user);

    expect(user.in(group)?.status).toBe('member');
  });

  it('returns the Membership record', async () => {
    const bot = new Bot('test-token');
    const { chats } = await prepareBot(bot);
    const user = chats.newUser();
    const group = chats.newSupergroup();

    const membership = group.join(user);

    expect(membership.status).toBe('member');
    expect(membership.user).toBe(user);
  });

  it('does not dispatch any update', async () => {
    const bot = new Bot('test-token');
    const handler = vi.fn();

    bot.on('my_chat_member', handler);

    const { chats } = await prepareBot(bot);
    const user = chats.newUser();
    const group = chats.newSupergroup();

    group.join(user);
    await chats.idle();

    expect(handler).not.toHaveBeenCalled();
  });

  it('works on Group as well as Supergroup', async () => {
    const bot = new Bot('test-token');
    const { chats } = await prepareBot(bot);
    const user = chats.newUser();
    const group = chats.newGroup();

    group.join(user);

    expect(user.in(group)?.status).toBe('member');
  });
});

// ─── chats.newOwner ───────────────────────────────────────────────────────────

describe('chats.newOwner', () => {
  it('creates a user and sets creator status in the default group', async () => {
    const bot = new Bot('test-token');
    const { chats } = await prepareBot(bot);

    const owner = chats.newOwner();

    assert.ok(chats.defaultGroup);
    expect(owner.in(chats.defaultGroup)?.status).toBe('creator');
  });

  it('lazily creates the default group', async () => {
    const bot = new Bot('test-token');
    const { chats } = await prepareBot(bot);

    expect(chats.defaultGroup).toBeUndefined();
    chats.newOwner();
    expect(chats.defaultGroup).toBeDefined();
  });

  it('accepts a profile override', async () => {
    const bot = new Bot('test-token');
    const { chats } = await prepareBot(bot);

    const owner = chats.newOwner({ first_name: 'Alice' });

    expect(owner.first_name).toBe('Alice');
    assert.ok(chats.defaultGroup);
    expect(owner.in(chats.defaultGroup)?.status).toBe('creator');
  });

  it('returns a registered User actor', async () => {
    const bot = new Bot('test-token');
    const { chats } = await prepareBot(bot);

    const owner = chats.newOwner();

    expect(typeof owner.id).toBe('number');
    expect(owner.is_bot).toBe(false);
  });
});

// ─── getChatMember auto-derive ────────────────────────────────────────────────

describe('getChatMember auto-derive', () => {
  it('returns creator shape for own() user', async () => {
    const bot = new Bot('test-token');
    let result: ChatMember | undefined;

    bot.on('message', async (ctx) => {
      result = await ctx.api.getChatMember(ctx.chat.id, ctx.from.id);
    });

    const { chats } = await prepareBot(bot);
    const user = chats.newUser();
    const group = chats.newSupergroup();

    group.own(user);
    await user.sendText('ping', { chat: group });
    await chats.idle();

    expect(result?.status).toBe('creator');
    assert.ok(result?.status === 'creator');
    expect(result.user.id).toBe(user.id);
    expect(result.is_anonymous).toBe(false);
  });

  it('returns administrator shape for promote() user', async () => {
    const bot = new Bot('test-token');
    let result: ChatMember | undefined;

    bot.on('message', async (ctx) => {
      result = await ctx.api.getChatMember(ctx.chat.id, ctx.from.id);
    });

    const { chats } = await prepareBot(bot);
    const user = chats.newUser();
    const group = chats.newSupergroup();

    group.promote(user, { can_delete_messages: true });
    await user.sendText('ping', { chat: group });
    await chats.idle();

    expect(result?.status).toBe('administrator');
    assert.ok(result?.status === 'administrator');
    expect(result.user.id).toBe(user.id);
    expect(result.can_delete_messages).toBe(true);
  });

  it('returns member shape for join() user', async () => {
    const bot = new Bot('test-token');
    let result: ChatMember | undefined;

    bot.on('message', async (ctx) => {
      result = await ctx.api.getChatMember(ctx.chat.id, ctx.from.id);
    });

    const { chats } = await prepareBot(bot);
    const user = chats.newUser();
    const group = chats.newSupergroup();

    group.join(user);
    await user.sendText('ping', { chat: group });
    await chats.idle();

    expect(result?.status).toBe('member');
    assert.ok(result?.status === 'member');
    expect(result.user.id).toBe(user.id);
  });

  it('returns restricted shape for restrict() user', async () => {
    const bot = new Bot('test-token');
    const { chats } = await prepareBot(bot);
    const sender = chats.newUser();
    const restrictedUser = chats.newUser();
    const group = chats.newSupergroup();

    group.join(sender);
    group.restrict(restrictedUser, { can_send_messages: false }, 1_700_000_000);

    let result: ChatMember | undefined;

    bot.on('message', async (ctx) => {
      result = await ctx.api.getChatMember(ctx.chat.id, restrictedUser.id);
    });

    await sender.sendText('ping', { chat: group });
    await chats.idle();

    expect(result?.status).toBe('restricted');
  });

  it('returns left for a user not in the members map', async () => {
    const bot = new Bot('test-token');
    let result: ChatMember | undefined;

    bot.on('message', async (ctx) => {
      result = await ctx.api.getChatMember(ctx.chat.id, 99_999);
    });

    const { chats } = await prepareBot(bot);
    const sender = chats.newUser();
    const group = chats.newSupergroup();

    group.join(sender);
    await sender.sendText('ping', { chat: group });
    await chats.idle();

    expect(result?.status).toBe('left');
    assert.ok(result?.status === 'left');
    expect(result.user.id).toBe(99_999);
  });

  it('returns left with the User actor when the user is registered but not in the chat', async () => {
    const bot = new Bot('test-token');
    const { chats } = await prepareBot(bot);
    const sender = chats.newUser();
    const outsider = chats.newUser({ first_name: 'Outsider' });
    const group = chats.newSupergroup();
    let result: ChatMember | undefined;

    bot.on('message', async (ctx) => {
      // query another user who is not a member
      result = await ctx.api.getChatMember(ctx.chat.id, outsider.id);
    });

    group.join(sender);
    await sender.sendText('ping', { chat: group });
    await chats.idle();

    expect(result?.status).toBe('left');
    assert.ok(result?.status === 'left');
    expect(result.user.id).toBe(outsider.id);
    expect(result.user.first_name).toBe('Outsider');
  });

  it('falls back to true for an unregistered chat', async () => {
    const bot = new Bot('test-token');
    let result: unknown;

    bot.on('message', async (ctx) => {
      result = await ctx.api.getChatMember(9999, 1);
    });

    const { chats } = await prepareBot(bot, { warnOnUnregisteredChats: false });
    const user = chats.newUser();
    const group = chats.newSupergroup();

    group.join(user);
    await user.sendText('ping', { chat: group });
    await chats.idle();

    expect(result).toBe(true);
  });
});

// ─── getChatAdministrators auto-derive ───────────────────────────────────────

describe('getChatAdministrators auto-derive', () => {
  it('returns creator and administrators, excludes plain members', async () => {
    const bot = new Bot('test-token');
    let result: ChatMember[] | undefined;

    bot.on('message', async (ctx) => {
      result = await ctx.api.getChatAdministrators(ctx.chat.id);
    });

    const { chats } = await prepareBot(bot);
    const owner = chats.newUser();
    const admin = chats.newUser();
    const member = chats.newUser();
    const group = chats.newSupergroup();

    group.own(owner);
    group.promote(admin);
    group.join(member);

    await owner.sendText('ping', { chat: group });
    await chats.idle();

    assert.ok(result);
    expect(result).toHaveLength(2);

    const statuses = result.map((chatMember) => chatMember.status).toSorted((statusA, statusB) => statusA.localeCompare(statusB));

    expect(statuses).toEqual(['administrator', 'creator']);
  });

  it('includes user ids in the response', async () => {
    const bot = new Bot('test-token');
    let result: ChatMember[] | undefined;

    bot.on('message', async (ctx) => {
      result = await ctx.api.getChatAdministrators(ctx.chat.id);
    });

    const { chats } = await prepareBot(bot);
    const owner = chats.newUser();
    const group = chats.newSupergroup();

    group.own(owner);
    await owner.sendText('ping', { chat: group });
    await chats.idle();

    assert.ok(result);
    expect(result[0]?.user.id).toBe(owner.id);
  });

  it('returns an empty array for unregistered chat', async () => {
    const bot = new Bot('test-token');
    let result: ChatMember[] | undefined;

    bot.on('message', async (ctx) => {
      result = await ctx.api.getChatAdministrators(9999);
    });

    const { chats } = await prepareBot(bot, { warnOnUnregisteredChats: false });
    const user = chats.newUser();
    const group = chats.newSupergroup();

    group.join(user);
    await user.sendText('ping', { chat: group });
    await chats.idle();

    expect(result).toEqual([]);
  });
});

// ─── getChat auto-derive ──────────────────────────────────────────────────────

describe('getChat auto-derive', () => {
  it('returns the enriched chat shape with invite_link for a registered supergroup', async () => {
    const bot = new Bot('test-token');
    let result: { id: number; type: string; invite_link?: string } | undefined;

    bot.on('message', async (ctx) => {
      result = (await ctx.api.getChat(ctx.chat.id)) as typeof result;
    });

    const { chats } = await prepareBot(bot);
    const user = chats.newUser();
    const group = chats.newSupergroup('My Group');

    group.join(user);
    await user.sendText('ping', { chat: group });
    await chats.idle();

    assert.ok(result);
    expect(result.id).toBe(group.id);
    expect(result.type).toBe('supergroup');
    expect(result.invite_link).toBe('');
    expect('invite_link' in result).toBe(true);
  });

  it('returns the enriched chat shape for a registered group', async () => {
    const bot = new Bot('test-token');
    let result: { id: number; type: string; invite_link?: string } | undefined;

    bot.on('message', async (ctx) => {
      result = (await ctx.api.getChat(ctx.chat.id)) as typeof result;
    });

    const { chats } = await prepareBot(bot, { warnOnUnregisteredChats: false });
    const user = chats.newUser();
    const group = chats.newGroup('Plain Group');

    group.join(user);
    await user.sendText('ping', { chat: group });
    await chats.idle();

    assert.ok(result);
    expect(result.id).toBe(group.id);
    expect(result.type).toBe('group');
    expect(result.invite_link).toBe('');
  });

  it('falls back to true for an unregistered chat', async () => {
    const bot = new Bot('test-token');
    let result: unknown;

    bot.on('message', async (ctx) => {
      result = await ctx.api.getChat(9999);
    });

    const { chats } = await prepareBot(bot, { warnOnUnregisteredChats: false });
    const user = chats.newUser();
    const group = chats.newSupergroup();

    group.join(user);
    await user.sendText('ping', { chat: group });
    await chats.idle();

    expect(result).toBe(true);
  });
});

// ─── override precedence ─────────────────────────────────────────────────────

describe('responses override precedence', () => {
  it('user-supplied getChatMember response beats auto-derived', async () => {
    const bot = new Bot('test-token');
    let result: ChatMember | undefined;

    bot.on('message', async (ctx) => {
      result = await ctx.api.getChatMember(ctx.chat.id, ctx.from.id);
    });

    const { chats } = await prepareBot(bot, {
      responses: {
        getChatMember: { status: 'kicked', user: { id: 1, is_bot: false, first_name: 'Overridden' }, until_date: 0 },
      },
    });

    const user = chats.newUser();
    const group = chats.newSupergroup();

    group.own(user); // auto-derive would return 'creator'
    await user.sendText('ping', { chat: group });
    await chats.idle();

    // manual override wins
    expect(result?.status).toBe('kicked');
  });
});
