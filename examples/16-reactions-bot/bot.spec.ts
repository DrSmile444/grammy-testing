import { describe, expect, it } from 'vitest';

import { prepareBot } from '@grammyjs/testing';

import { createReactionsBot } from './bot';

describe('reactions-bot', () => {
  it('replies to a text message', async () => {
    const { chats } = await prepareBot(createReactionsBot());
    const user = chats.newUser();

    await user.sendText('hello');

    expect(user.replies.lastOrThrow().text).toBe('Message received! React to this with an emoji.');
  });

  it('handles a reaction to the bot reply', async () => {
    const { chats } = await prepareBot(createReactionsBot());
    const user = chats.newUser();

    await user.sendText('hello');
    const reply = user.replies.lastOrThrow();

    await user.reactTo(reply, '👍');

    const thankCall = chats.outgoing.requests.find(
      (request) => request.method === 'sendMessage' && (request.payload as { text: string }).text.includes('Thanks for reacting'),
    );

    expect(thankCall).toBeDefined();
    expect((thankCall?.payload as { text: string }).text).toContain('👍');
  });

  it('includes the emoji in the thank-you message', async () => {
    const { chats } = await prepareBot(createReactionsBot());
    const user = chats.newUser();

    await user.sendText('hey');
    const reply = user.replies.lastOrThrow();

    await user.reactTo(reply, '🔥');

    const thankCall = chats.outgoing.requests.find(
      (request) => request.method === 'sendMessage' && (request.payload as { text: string }).text.includes('🔥'),
    );

    expect(thankCall).toBeDefined();
  });
});
