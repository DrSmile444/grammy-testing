import { prepareBot } from '@grammyjs/testing';
import { describe, expect, it } from 'vitest';

import { createPollBot } from './bot';

describe('poll-bot', () => {
  it('sends a quiz poll on /poll', async () => {
    const { chats } = await prepareBot(createPollBot());
    const user = chats.newUser();

    await user.sendCommand('/poll');

    const sentPoll = chats.outgoing.requests.find((request) => request.method === 'sendPoll');

    expect(sentPoll).toBeDefined();
    expect((sentPoll?.payload as { question: string }).question).toBe('What is 2 + 2?');
  });

  it('bot sends a "Correct!" message when the user picks the right option', async () => {
    const { chats } = await prepareBot(createPollBot());
    const user = chats.newUser();

    await user.sendCommand('/poll');
    const pollReply = user.replies.lastOrThrow();

    await user.answerPoll(pollReply, [1]);

    const sendMessageCall = chats.outgoing.requests.find(
      (request) => request.method === 'sendMessage' && (request.payload as { text: string }).text === 'Correct!',
    );

    expect(sendMessageCall).toBeDefined();
  });

  it('bot sends a "Try again!" message for a wrong answer', async () => {
    const { chats } = await prepareBot(createPollBot());
    const user = chats.newUser();

    await user.sendCommand('/poll');
    const pollReply = user.replies.lastOrThrow();

    await user.answerPoll(pollReply, [0]);

    const sendMessageCall = chats.outgoing.requests.find(
      (request) => request.method === 'sendMessage' && (request.payload as { text: string }).text === 'Try again!',
    );

    expect(sendMessageCall).toBeDefined();
  });
});
