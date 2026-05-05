import { describe, expect, it } from 'vitest';

import { prepareBot } from '@grammyjs/testing';

import { createAdminGuardBot } from './bot';

describe('admin-guard-bot', () => {
  it('allows an admin to run the command', async () => {
    const { chats } = await prepareBot(createAdminGuardBot());
    const admin = chats.newAdmin();
    const group = chats.defaultGroup ?? chats.newSupergroup();

    await admin.sendCommand('/admin_only', undefined, { chat: group });

    expect(group.messages.last?.text).toBe('Admin command executed!');
  });

  it('rejects a regular member', async () => {
    const { chats } = await prepareBot(createAdminGuardBot());
    const user = chats.newUser();
    const group = chats.newSupergroup();

    group.join(user);

    await user.sendCommand('/admin_only', undefined, { chat: group });

    expect(group.messages.last?.text).toBe('This command is for admins only.');
  });

  it('the admin is recognized in the default group', async () => {
    const { chats } = await prepareBot(createAdminGuardBot());
    const admin = chats.newAdmin();

    expect(admin.in(chats.defaultGroup ?? chats.newSupergroup())?.status).toBe('administrator');
  });

  it('a regular user in the group has member status', async () => {
    const { chats } = await prepareBot(createAdminGuardBot());
    const user = chats.newUser();
    const group = chats.newSupergroup();

    group.join(user);

    expect(user.in(group)?.status).toBe('member');
  });
});
