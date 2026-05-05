import { prepareBot } from '@grammyjs/testing';
import { describe, expect, it } from 'vitest';

import { createPhotoBot } from './bot';

describe('photo-bot', () => {
  it('replies when a photo is received', async () => {
    const { chats } = await prepareBot(createPhotoBot());
    const user = chats.newUser();

    await user.sendPhoto();

    expect(user.replies.lastOrThrow().text).toContain('Got your photo!');
  });

  it('includes the caption in the reply', async () => {
    const { chats } = await prepareBot(createPhotoBot());
    const user = chats.newUser();

    await user.sendPhoto(undefined, { caption: 'Sunset view' });

    expect(user.replies.lastOrThrow().text).toBe('Got your photo! Caption: Sunset view');
  });

  it('uses "no caption" when no caption provided', async () => {
    const { chats } = await prepareBot(createPhotoBot());
    const user = chats.newUser();

    await user.sendPhoto();

    expect(user.replies.lastOrThrow().text).toBe('Got your photo! Caption: no caption');
  });

  it('outgoing API call is sendMessage', async () => {
    const { chats } = await prepareBot(createPhotoBot());
    const user = chats.newUser();

    await user.sendPhoto(undefined, { caption: 'test' });

    expect(chats.outgoing.getLast()?.method).toBe('sendMessage');
  });
});
