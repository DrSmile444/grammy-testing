import { describe, expect, it } from 'vitest';

import { prepareBot } from 'grammy-testing';

import { createHydrateBot } from './bot';

describe('hydrate-bot', () => {
  it('echoes the message text back as first reply', async () => {
    const { chats } = await prepareBot(createHydrateBot());
    const user = chats.newUser();

    await user.sendText('hello world');

    expect(user.replies.length).toBe(2);

    const replyTexts = chats.outgoing.requests
      .filter((outRequest) => outRequest.method === 'sendMessage')
      .map((outRequest) => (outRequest.payload as { text?: string }).text ?? '');

    expect(replyTexts.includes('You said: hello world')).toBe(true);
  });

  it('sends a second reply with the message ID', async () => {
    const { chats } = await prepareBot(createHydrateBot());
    const user = chats.newUser();

    await user.sendText('ping');

    expect(user.replies.length).toBe(2);
    expect(user.replies.last?.text).toMatch(/^Message ID: \d+/);
  });

  it('processes multiple messages independently', async () => {
    const { chats } = await prepareBot(createHydrateBot());
    const user = chats.newUser();

    await user.sendText('first');
    await user.sendText('second');

    expect(user.replies.length).toBe(4);

    const replyTexts = new Set(
      chats.outgoing.requests
        .filter((outRequest) => outRequest.method === 'sendMessage')
        .map((outRequest) => (outRequest.payload as { text?: string }).text ?? ''),
    );

    expect(replyTexts.has('You said: first')).toBe(true);
    expect(replyTexts.has('You said: second')).toBe(true);
  });
});
