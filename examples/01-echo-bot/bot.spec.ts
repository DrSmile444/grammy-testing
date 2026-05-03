import { prepareBot } from '@grammyjs/testing';
import { describe, expect, it } from 'vitest';

import { createEchoBot } from './bot';

describe('echo-bot', () => {
  it('echoes back the user text', async () => {
    const { chats } = await prepareBot(createEchoBot());
    const user = chats.newUser();

    await user.sendText('hello');

    expect(user.replies.lastOrThrow().text).toBe('hello');
  });

  it('echoes each message individually', async () => {
    const { chats } = await prepareBot(createEchoBot());
    const user = chats.newUser();

    await user.sendText('first');
    await user.sendText('second');

    expect(user.replies.lastOrThrow().text).toBe('second');
  });

  it('does not reply to photo updates', async () => {
    const { chats } = await prepareBot(createEchoBot());
    const user = chats.newUser();

    await user.sendPhoto();

    expect(user.replies.length).toBe(0);
  });
});
