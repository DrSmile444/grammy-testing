import { describe, expect, it } from 'vitest';

import { prepareBot } from '@grammyjs/testing';

import { createGreetingBot } from './bot';

describe('greeting-bot', () => {
  it('greets the user by first name', async () => {
    const { chats } = await prepareBot(createGreetingBot());
    const user = chats.newUser({ first_name: 'Alice' });

    await user.sendCommand('/greet');

    expect(user.replies.lastOrThrow().text).toBe('Hello, Alice!');
  });

  it('greets a different user with their own name', async () => {
    const { chats } = await prepareBot(createGreetingBot());
    const bob = chats.newUser({ first_name: 'Bob' });

    await bob.sendCommand('/greet');

    expect(bob.replies.lastOrThrow().text).toBe('Hello, Bob!');
  });

  it('greets a user whose name is exactly their default', async () => {
    const { chats } = await prepareBot(createGreetingBot());
    const user = chats.newUser({ first_name: 'Charlie' });

    await user.sendCommand('/greet');

    expect(user.replies.lastOrThrow().text).toBe('Hello, Charlie!');
  });
});
