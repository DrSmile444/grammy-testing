import { describe, expect, it } from 'vitest';

import { prepareBot } from '@grammyjs/testing';

import { createReactionRemovalBot } from './bot';

const COMMAND_ENTITY = [{ type: 'bot_command' as const, offset: 0, length: '/clearreactions'.length }];

describe('reaction-removal-bot', () => {
  it('clears reactions on the replied-to message', async () => {
    const { chats } = await prepareBot(createReactionRemovalBot());
    const user = chats.newUser();

    const target = await user.sendText('spam reactions here');

    await user.sendText('/clearreactions', {
      entities: COMMAND_ENTITY,
      reply_to_message: { message_id: target.message_id },
    });

    expect(chats.reactionRemovals.length).toBe(1);
    expect(chats.reactionRemovals.lastOrThrow().messageId).toBe(target.message_id);
    expect(user.replies.lastOrThrow().text).toBe('Reactions cleared.');
  });

  it('asks for a reply when used without one', async () => {
    const { chats } = await prepareBot(createReactionRemovalBot());
    const user = chats.newUser();

    await user.sendText('/clearreactions', { entities: COMMAND_ENTITY });

    expect(chats.reactionRemovals.length).toBe(0);
    expect(user.replies.lastOrThrow().text).toBe('Reply to a message to clear its reactions.');
  });
});
