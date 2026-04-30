import { Bot } from 'grammy';
import { describe, expect, it } from 'vitest';

import { prepareBot } from '../../src/index';

describe('Membership roles', () => {
  describe('promote', () => {
    it('updates the membership map', async () => {
      const bot = new Bot('test-token');
      const { chats } = await prepareBot(bot);
      const user = chats.newUser();
      const group = chats.newSupergroup();

      group.promote(user, {
        can_delete_messages: true,
        can_restrict_members: true,
      });

      const membership = user.in(group);

      expect(membership?.status).toBe('administrator');
      expect(membership?.permissions.can_delete_messages).toBe(true);
    });

    it('default permissions are permissive', async () => {
      const bot = new Bot('test-token');
      const { chats } = await prepareBot(bot);
      const user = chats.newUser();
      const group = chats.newSupergroup();

      group.promote(user);

      const membership = user.in(group);

      expect(membership?.permissions.can_change_info).toBe(true);
      expect(membership?.permissions.can_delete_messages).toBe(true);
    });
  });

  describe('restrict', () => {
    it('applies restriction with permissions and untilDate', async () => {
      const bot = new Bot('test-token');
      const { chats } = await prepareBot(bot);
      const user = chats.newUser();
      const group = chats.newSupergroup();

      group.restrict(user, { can_send_messages: false }, 1_700_000_000);

      const membership = user.in(group);

      expect(membership?.status).toBe('restricted');
      expect(membership?.permissions.can_send_messages).toBe(false);
      expect(membership?.untilDate).toBe(1_700_000_000);
    });
  });

  describe('changeMemberStatus', () => {
    it('dispatches my_chat_member with old + new', async () => {
      const bot = new Bot('test-token');
      let captured: { old?: string; nu?: string } = {};

      bot.on('my_chat_member', (ctx) => {
        captured = {
          old: ctx.myChatMember.old_chat_member.status,
          nu: ctx.myChatMember.new_chat_member.status,
        };
      });

      const { chats } = await prepareBot(bot);
      const user = chats.newUser();
      const group = chats.newSupergroup();

      group.promote(user); // current = admin

      await group.changeMemberStatus(user, {
        from: 'member',
        to: 'restricted',
        permissions: { can_send_messages: false },
      });

      expect(captured.old).toBe('member');
      expect(captured.nu).toBe('restricted');
    });

    it('updates membership map after dispatch', async () => {
      const bot = new Bot('test-token');

      bot.on('my_chat_member', () => {});

      const { chats } = await prepareBot(bot);
      const user = chats.newUser();
      const group = chats.newSupergroup();

      await group.changeMemberStatus(user, { to: 'administrator' });

      expect(user.in(group)?.status).toBe('administrator');
    });
  });

  describe('user.in', () => {
    it('returns undefined when no membership exists', async () => {
      const bot = new Bot('test-token');
      const { chats } = await prepareBot(bot);
      const user = chats.newUser();
      const group = chats.newSupergroup();

      expect(user.in(group)).toBeUndefined();
    });
  });
});
