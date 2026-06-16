import { describe, expect, it } from 'vitest';

import { prepareBot } from 'grammy-testing';

import { createCommandBot } from './bot';

describe('command-bot', () => {
  it('replies to /start', async () => {
    const { chats } = await prepareBot(createCommandBot());
    const user = chats.newUser();

    await user.sendCommand('/start');

    expect(user.replies.lastOrThrow().text).toContain('Welcome');
  });

  it('replies to /help', async () => {
    const { chats } = await prepareBot(createCommandBot());
    const user = chats.newUser();

    await user.sendCommand('/help');

    expect(user.replies.lastOrThrow().text).toContain('/start');
    expect(user.replies.lastOrThrow().text).toContain('/help');
  });

  it('does not reply to plain text', async () => {
    const { chats } = await prepareBot(createCommandBot());
    const user = chats.newUser();

    await user.sendText('hello');

    expect(user.replies.length).toBe(0);
  });

  it('leading slash is optional in sendCommand', async () => {
    const { chats } = await prepareBot(createCommandBot());
    const user = chats.newUser();

    await user.sendCommand('start');

    expect(user.replies.lastOrThrow().text).toContain('Welcome');
  });
});
