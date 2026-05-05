import { describe, expect, it } from 'vitest';

import { prepareBot } from '@grammyjs/testing';

import { createDocumentBot } from './bot';

describe('document-bot', () => {
  it('replies with the document file_id', async () => {
    const { chats } = await prepareBot(createDocumentBot());
    const user = chats.newUser();

    await user.sendDocument('abc123');

    expect(user.replies.lastOrThrow().text).toContain('abc123');
  });

  it('shows "unknown" MIME type for stub documents', async () => {
    const { chats } = await prepareBot(createDocumentBot());
    const user = chats.newUser();

    await user.sendDocument('xyz');

    expect(user.replies.lastOrThrow().text).toContain('unknown');
  });

  it('reply text includes "File ID" label', async () => {
    const { chats } = await prepareBot(createDocumentBot());
    const user = chats.newUser();

    await user.sendDocument('doc999');

    expect(user.replies.lastOrThrow().text).toContain('File ID');
  });

  it('does not reply to photos', async () => {
    const { chats } = await prepareBot(createDocumentBot());
    const user = chats.newUser();

    await user.sendPhoto();

    expect(user.replies.length).toBe(0);
  });
});
