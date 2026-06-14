import { describe, expect, it } from 'vitest';

import { prepareBot } from '@grammyjs/testing';

import { createGuestModeBot } from './bot';

describe('guest-mode-bot', () => {
  it('answers a guest query for the originating user', async () => {
    const { chats } = await prepareBot(createGuestModeBot());
    const group = chats.newSupergroup();
    const guest = chats.newUser({ first_name: 'Ada' });

    const queryId = await guest.sendGuestMessage(group, 'is anyone there?');

    const answer = chats.outgoing.requests.find((request) => request.method === 'answerGuestQuery');

    expect(answer).toBeDefined();
    expect((answer?.payload as { guest_query_id: string }).guest_query_id).toBe(queryId);
    expect(chats.guestQueryUser(queryId)?.id).toBe(guest.id);
  });

  it('does not record the guest reply in the chat messages log', async () => {
    const { chats } = await prepareBot(createGuestModeBot());
    const group = chats.newSupergroup();
    const guest = chats.newUser();

    await guest.sendGuestMessage(group, 'hi');

    expect(group.messages.length).toBe(0);
  });
});
