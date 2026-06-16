import { describe, expect, it } from 'vitest';

import { prepareBot } from 'grammy-testing';

import { createMultiChatBot } from './bot';

describe('multi-chat-scenario', () => {
  it('tracks messages from multiple users in a group', async () => {
    const { chats } = await prepareBot(createMultiChatBot(-100_999));
    const group = chats.newSupergroup('Community');
    const alice = chats.newUser({ first_name: 'Alice', id: 1 });
    const bob = chats.newUser({ first_name: 'Bob', id: 2 });

    group.own(alice);
    group.own(bob);

    await alice.sendText('Hi!', { chat: group });
    await alice.sendText('How are you?', { chat: group });
    await bob.sendText('Hello!', { chat: group });

    const admin = chats.newAdmin({ id: 99 });

    await admin.sendCommand('/summary', undefined, { chat: group });

    const channelPost = chats.outgoing.requests.find(
      (request) => request.method === 'sendMessage' && (request.payload as { chat_id: number }).chat_id === -100_999,
    );

    expect(channelPost).toBeDefined();

    const summaryText = (channelPost?.payload as { text: string }).text;

    expect(summaryText).toContain('User 1: 2 message(s)');
    expect(summaryText).toContain('User 2: 1 message(s)');
  });

  it('confirms to the admin that the summary was posted', async () => {
    const { chats } = await prepareBot(createMultiChatBot(-100_999));
    const group = chats.newSupergroup();
    const user = chats.newUser();
    const admin = chats.newAdmin();

    group.own(user);

    await user.sendText('a message', { chat: group });
    await admin.sendCommand('/summary', undefined, { chat: group });

    expect(group.messages.last?.text).toBe('Summary posted to channel.');
  });

  it('replies with no-data message when no messages tracked', async () => {
    const { chats } = await prepareBot(createMultiChatBot(-100_999));
    const group = chats.newSupergroup();
    const admin = chats.newAdmin();

    await admin.sendCommand('/summary', undefined, { chat: group });

    expect(group.messages.last?.text).toBe('No messages tracked yet.');
  });

  it('uses the channel actor ID for assertions', async () => {
    const { chats } = await prepareBot(createMultiChatBot(-100_999));
    const channel = chats.newChannel({ id: -100_999, title: 'Digest' });
    const group = chats.newSupergroup('Forum');
    const user = chats.newUser({ id: 55 });
    const admin = chats.newAdmin();

    group.own(user);

    await user.sendText('test', { chat: group });
    await admin.sendCommand('/summary', undefined, { chat: group });

    const channelPost = chats.outgoing.requests.find(
      (request) => request.method === 'sendMessage' && (request.payload as { chat_id: number }).chat_id === channel.id,
    );

    expect(channelPost).toBeDefined();
    expect((channelPost?.payload as { text: string }).text).toContain('User 55');
  });
});
