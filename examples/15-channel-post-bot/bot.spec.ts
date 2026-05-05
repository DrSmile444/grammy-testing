import { prepareBot } from '@grammyjs/testing';
import { describe, expect, it } from 'vitest';

import { createChannelPostBot } from './bot';

describe('channel-post-bot', () => {
  it('posts the message to the channel', async () => {
    const { chats } = await prepareBot(createChannelPostBot(-1_001_234_567_890));
    const channel = chats.newChannel({ id: -1_001_234_567_890, title: 'Announcements' });
    const user = chats.newUser();

    await user.sendCommand('/post', 'Hello channel!');

    const postCall = chats.outgoing.requests.find(
      (request) => request.method === 'sendMessage' && (request.payload as { chat_id: number }).chat_id === channel.id,
    );

    expect(postCall).toBeDefined();
    expect((postCall?.payload as { text: string }).text).toBe('Hello channel!');
  });

  it('confirms to the user that the post was sent', async () => {
    const { chats } = await prepareBot(createChannelPostBot(-1_001_234_567_890));
    const user = chats.newUser();

    await user.sendCommand('/post', 'Hello channel!');

    expect(user.replies.lastOrThrow().text).toBe('Posted to channel!');
  });

  it('shows usage hint when no text is provided', async () => {
    const { chats } = await prepareBot(createChannelPostBot(-1_001_234_567_890));
    const user = chats.newUser();

    await user.sendCommand('/post');

    expect(user.replies.lastOrThrow().text).toBe('Usage: /post <text>');
  });

  it('channel id from chats.newChannel matches the configured id', async () => {
    const { chats } = await prepareBot(createChannelPostBot(-1_001_234_567_890));
    const channel = chats.newChannel({ id: -1_001_234_567_890, title: 'News' });

    expect(channel.id).toBe(-1_001_234_567_890);
    expect(channel.title).toBe('News');
  });
});
