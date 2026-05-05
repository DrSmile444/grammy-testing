import { describe, expect, it } from 'vitest';

import { prepareBot } from '@grammyjs/testing';

import { createChatTypeFilterBot } from './bot';

describe('chat-type-filter-bot', () => {
  it('replies in private chat', async () => {
    const { chats } = await prepareBot(createChatTypeFilterBot());
    const user = chats.newUser();

    await user.sendCommand('/info');

    expect(user.replies.lastOrThrow().text).toBe('You are in a private chat.');
  });

  it('replies in a supergroup with the group title', async () => {
    const { chats } = await prepareBot(createChatTypeFilterBot());
    const user = chats.newUser();
    const group = chats.newSupergroup('Dev Chat');

    group.join(user);

    await user.sendCommand('/info', undefined, { chat: group });

    expect(group.messages.last?.text).toBe('You are in a group: Dev Chat');
  });

  it('does not cross-reply between chats', async () => {
    const { chats } = await prepareBot(createChatTypeFilterBot());
    const alice = chats.newUser({ first_name: 'Alice' });
    const bob = chats.newUser({ first_name: 'Bob' });

    await alice.sendCommand('/info');
    await bob.sendCommand('/info');

    expect(alice.replies.length).toBe(1);
    expect(bob.replies.length).toBe(1);
  });
});
