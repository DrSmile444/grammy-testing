import { describe, expect, it } from 'vitest';

import { prepareBot } from '@grammyjs/testing';

import { createGroupWelcomeBot } from './bot';

describe('group-welcome-bot', () => {
  it('sends a welcome message when a user joins', async () => {
    const { chats } = await prepareBot(createGroupWelcomeBot());
    const user = chats.newUser({ first_name: 'Alice' });
    const group = chats.newSupergroup('Test Group');

    await user.joinChat(group);

    expect(group.messages.last?.text).toBe('Welcome, Alice! 👋');
  });

  it('welcome message goes to the group chat', async () => {
    const { chats } = await prepareBot(createGroupWelcomeBot());
    const user = chats.newUser({ first_name: 'Bob' });
    const group = chats.newSupergroup('Dev Chat');

    await user.joinChat(group);

    const sentMessage = chats.outgoing.getLast();

    expect((sentMessage?.payload as { chat_id: number }).chat_id).toBe(group.id);
  });

  it('does not send a welcome when a user sends a text in private', async () => {
    const { chats } = await prepareBot(createGroupWelcomeBot());
    const user = chats.newUser({ first_name: 'Carol' });

    await user.sendText('hello');

    expect(user.replies.length).toBe(0);
  });

  it('updates the user membership status to "member"', async () => {
    const { chats } = await prepareBot(createGroupWelcomeBot());
    const user = chats.newUser();
    const group = chats.newSupergroup();

    await user.joinChat(group);

    expect(user.in(group)?.status).toBe('member');
  });
});
