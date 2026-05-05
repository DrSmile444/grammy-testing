/**
 * Pattern: Membership and role transitions (my_chat_member status changes).
 *
 * What this exercises: per-chat role transitions for users — promote /
 * restrict / changeMemberStatus. Includes admin-only command guards
 * driven by `chat.changeMemberStatus` and `user.in(group)` reads.
 *
 * v0.2 API expression: group.promote(user, perms?), group.restrict(user,
 * perms?, untilDate?), chat.changeMemberStatus(user, transition),
 * user.in(group).
 *
 * v0.2.x gaps: none for this pattern category at v0.2 — high-frequency
 * gap #7 was a v0.2 must-have and is fully addressed.
 */

import { Bot } from 'grammy';
import { describe, expect, it } from 'vitest';

import { prepareBot } from '../../src/index';

describe('reference: membership', () => {
  it('promote granted-then-asserted', async () => {
    const bot = new Bot('test-token');
    const { chats } = await prepareBot(bot);
    const user = chats.newUser();
    const group = chats.newSupergroup();

    group.promote(user, { can_delete_messages: true });

    const membership = user.in(group);

    expect(membership?.status).toBe('administrator');
    expect(membership?.permissions.can_delete_messages).toBe(true);
  });

  it('restrict with permission flags + untilDate is observable', async () => {
    const bot = new Bot('test-token');
    const { chats } = await prepareBot(bot);
    const user = chats.newUser();
    const group = chats.newSupergroup();

    group.restrict(user, { can_send_messages: false, can_send_photos: false }, 1_700_000_000);

    const membership = user.in(group);

    expect(membership?.status).toBe('restricted');
    expect(membership?.permissions.can_send_messages).toBe(false);
    expect(membership?.permissions.can_send_photos).toBe(false);
    expect(membership?.untilDate).toBe(1_700_000_000);
  });

  it('changeMemberStatus dispatches my_chat_member with old + new', async () => {
    const bot = new Bot('test-token');
    let oldStatus: string | undefined;
    let newStatus: string | undefined;

    bot.on('my_chat_member', (context) => {
      oldStatus = context.myChatMember.old_chat_member.status;
      newStatus = context.myChatMember.new_chat_member.status;
    });

    const { chats } = await prepareBot(bot);
    const user = chats.newUser();
    const group = chats.newSupergroup();

    await group.changeMemberStatus(user, {
      from: 'member',
      to: 'restricted',
      permissions: { can_send_messages: false },
      untilDate: 1_700_000_000,
    });

    expect(oldStatus).toBe('member');
    expect(newStatus).toBe('restricted');
  });

  it('bot membership map reflects the latest transition', async () => {
    const bot = new Bot('test-token');

    bot.on('my_chat_member', () => {});

    const { chats } = await prepareBot(bot);
    const user = chats.newUser();
    const group = chats.newSupergroup();

    group.promote(user);

    expect(user.in(group)?.status).toBe('administrator');

    await group.changeMemberStatus(user, { to: 'member' });

    // changeMemberStatus tracks the BOT's status, not the trigger actor's
    expect(group.members.get(bot.botInfo.id)?.status).toBe('member');
    expect(user.in(group)?.status).toBe('administrator'); // promote() unaffected
  });
});
