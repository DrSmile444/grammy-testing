import { describe, expect, it } from 'vitest';

import { prepareBot } from 'grammy-testing';

import { createRichMessageBot } from './bot';

describe('rich-message-bot', () => {
  it('streams a draft before the final rich message', async () => {
    const { chats } = await prepareBot(createRichMessageBot());
    const user = chats.newUser();

    await user.sendText('hello world');

    expect(user.drafts.length).toBe(1);
    expect((user.drafts.lastOrThrow().payload.rich_message as { html?: string }).html).toBe('<b>Thinking…</b>');
  });

  it('sends a final rich message echoing the user text', async () => {
    const { chats } = await prepareBot(createRichMessageBot());
    const user = chats.newUser();

    await user.sendText('hello world');

    const reply = user.replies.lastOrThrow();

    expect(reply.richMessage?.html).toBe('<b>You said:</b> hello world');
    expect(reply.richMessage?.plainText).toBe('You said: hello world');
  });
});
