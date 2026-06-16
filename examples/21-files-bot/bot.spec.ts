import { describe, expect, it } from 'vitest';

import { prepareBot } from 'grammy-testing';

import { createFilesBot } from './bot';

describe('files-bot', () => {
  it('replies with a download URL when a document is sent', async () => {
    const { chats } = await prepareBot(createFilesBot());
    const user = chats.newUser();

    await user.sendDocument('doc-file-id');

    expect(user.replies.lastOrThrow().text).toMatch(/^Download your file: https?:\/\//);
  });

  it('URL contains the bot token and file path', async () => {
    const { chats } = await prepareBot(createFilesBot());
    const user = chats.newUser();

    await user.sendDocument('doc-file-id');

    const text = user.replies.lastOrThrow().text ?? '';

    expect(text).toContain('token');
    expect(text).toContain('documents/test_file.pdf');
  });

  it('handles multiple documents in sequence', async () => {
    const { chats } = await prepareBot(createFilesBot());
    const user = chats.newUser();

    await user.sendDocument('file-1');
    await user.sendDocument('file-2');

    expect(user.replies.length).toBe(2);
    expect(user.replies.last?.text).toMatch(/^Download your file:/);
  });
});
