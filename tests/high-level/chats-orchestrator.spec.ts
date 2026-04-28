import { Bot } from 'grammy';
import { describe, expect, it } from 'vitest';

import { prepareBot } from '../../src/index';

describe('Chats orchestrator', () => {
  describe('newUser', () => {
    it('mints a user with a default profile', async () => {
      const bot = new Bot('test-token');
      const { chats } = await prepareBot(bot);
      const user = chats.newUser();

      expect(typeof user.id).toBe('number');
      expect(typeof user.first_name).toBe('string');
      expect(user.first_name.length).toBeGreaterThan(0);
      expect(user.is_bot).toBe(false);
    });

    it('honors profile overrides', async () => {
      const bot = new Bot('test-token');
      const { chats } = await prepareBot(bot);
      const user = chats.newUser({ id: 42, username: 'alice' });

      expect(user.id).toBe(42);
      expect(user.username).toBe('alice');
    });

    it('generates unique ids for each user', async () => {
      const bot = new Bot('test-token');
      const { chats } = await prepareBot(bot);
      const ids = new Set([chats.newUser().id, chats.newUser().id, chats.newUser().id]);

      expect(ids.size).toBe(3);
    });
  });

  describe('newAdmin (sugar)', () => {
    it('creates a user and promotes in default group', async () => {
      const bot = new Bot('test-token');
      const { chats } = await prepareBot(bot);
      const admin = chats.newAdmin();

      expect(chats.defaultGroup).toBeDefined();
      const membership = admin.in(chats.defaultGroup!);

      expect(membership?.status).toBe('administrator');
    });

    it('honors permission overrides', async () => {
      const bot = new Bot('test-token');
      const { chats } = await prepareBot(bot);
      const admin = chats.newAdmin(undefined, {
        can_delete_messages: true,
        can_restrict_members: false,
      });

      const m = admin.in(chats.defaultGroup!);

      expect(m?.permissions.can_delete_messages).toBe(true);
      expect(m?.permissions.can_restrict_members).toBe(false);
    });
  });

  describe('chat factories', () => {
    it('produces the right chat type', async () => {
      const bot = new Bot('test-token');
      const { chats } = await prepareBot(bot);
      const user = chats.newUser();

      const dm = chats.newPrivateChat(user);
      const group = chats.newGroup();
      const supergroup = chats.newSupergroup();
      const channel = chats.newChannel();

      expect(dm.type).toBe('private');
      expect(group.type).toBe('group');
      expect(supergroup.type).toBe('supergroup');
      expect(channel.type).toBe('channel');
    });

    it('private chat id matches user id', async () => {
      const bot = new Bot('test-token');
      const { chats } = await prepareBot(bot);
      const user = chats.newUser();
      const dm = chats.newPrivateChat(user);

      expect(dm.id).toBe(user.id);
    });

    it('chat ids are unique within a Chats instance', async () => {
      const bot = new Bot('test-token');
      const { chats } = await prepareBot(bot);
      const ids = new Set([chats.newGroup().id, chats.newSupergroup().id, chats.newChannel().id]);

      expect(ids.size).toBe(3);
    });
  });

  describe('v0.1 surface preserved', () => {
    it('chats.outgoing and chats.idle work alongside v0.2 surface', async () => {
      const bot = new Bot('test-token');
      const { chats } = await prepareBot(bot);

      expect(chats.outgoing).toBeDefined();
      expect(typeof chats.idle).toBe('function');
      expect(typeof chats.newUser).toBe('function');
      expect(typeof chats.newAdmin).toBe('function');
    });
  });
});
