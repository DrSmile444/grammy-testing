import { prepareBot } from '@grammyjs/testing';
import { describe, expect, it } from 'vitest';

import { createModerationBot } from './bot';

describe('moderation-bot', () => {
  it('bans the specified user and confirms', async () => {
    const { chats } = await prepareBot(createModerationBot());
    const admin = chats.newAdmin();
    const target = chats.newUser({ id: 777 });
    const group = chats.defaultGroup ?? chats.newSupergroup();

    group.own(target);

    await admin.sendCommand('/ban', '777', { chat: group });

    const banCall = chats.outgoing.requests.find((request) => request.method === 'banChatMember');

    expect(banCall).toBeDefined();
    expect((banCall?.payload as { user_id: number }).user_id).toBe(777);
    expect(group.messages.last?.text).toBe('User 777 has been banned.');
  });

  it('restricts the specified user', async () => {
    const { chats } = await prepareBot(createModerationBot());
    const admin = chats.newAdmin();
    const target = chats.newUser({ id: 888 });
    const group = chats.defaultGroup ?? chats.newSupergroup();

    group.own(target);

    await admin.sendCommand('/restrict', '888', { chat: group });

    const restrictCall = chats.outgoing.requests.find((request) => request.method === 'restrictChatMember');

    expect(restrictCall).toBeDefined();
    expect(group.messages.last?.text).toBe('User 888 has been restricted.');
  });

  it('replies with usage hint when no user_id is provided to /ban', async () => {
    const { chats } = await prepareBot(createModerationBot());
    const admin = chats.newAdmin();
    const group = chats.defaultGroup ?? chats.newSupergroup();

    await admin.sendCommand('/ban', undefined, { chat: group });

    expect(group.messages.last?.text).toBe('Usage: /ban <user_id>');
  });

  it('replies with invalid ID message for non-numeric input', async () => {
    const { chats } = await prepareBot(createModerationBot());
    const admin = chats.newAdmin();
    const group = chats.defaultGroup ?? chats.newSupergroup();

    await admin.sendCommand('/ban', 'notanumber', { chat: group });

    expect(group.messages.last?.text).toBe('Invalid user ID.');
  });
});
