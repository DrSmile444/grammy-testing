import { describe, expect, it } from 'vitest';

import { prepareBot } from 'grammy-testing';

import { createAutoRetryBot } from './bot';

describe('auto-retry-bot', () => {
  it('sends broadcast and reports success when all calls succeed', async () => {
    const { chats } = await prepareBot(createAutoRetryBot());
    const user = chats.newUser();

    await user.sendCommand('/broadcast');

    expect(user.replies.lastOrThrow().text).toBe('Broadcast sent successfully!');
  });

  it('reports partial failure when some chats are blocked', async () => {
    const { chats } = await prepareBot(createAutoRetryBot());
    const user = chats.newUser();

    chats.outgoing.failNext('sendMessage', { code: 403, description: 'Forbidden: bot was blocked by the user' });

    await user.sendCommand('/broadcast');

    const replyText = user.replies.lastOrThrow().text ?? '';

    expect(replyText).toContain('Failed for 1 chat(s)');
  });

  it('captures all broadcast API calls', async () => {
    const { chats } = await prepareBot(createAutoRetryBot());
    const user = chats.newUser();

    await user.sendCommand('/broadcast');

    const broadcastRequests = chats.outgoing.requests.filter(
      (outRequest) =>
        outRequest.method === 'sendMessage' && [1001, 1002, 1003].includes((outRequest.payload as { chat_id: number }).chat_id),
    );

    expect(broadcastRequests).toHaveLength(3);
  });
});
