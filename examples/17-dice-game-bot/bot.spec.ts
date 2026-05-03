import { prepareBot } from '@grammyjs/testing';
import { describe, expect, it } from 'vitest';

import { createDiceGameBot, WINNING_VALUE } from './bot';

describe('dice-game-bot', () => {
  it('replies when a user sends a dice', async () => {
    const { chats } = await prepareBot(createDiceGameBot());
    const user = chats.newUser();

    await user.sendDice('🎲');

    expect(user.replies.lastOrThrow().text).toBeDefined();
  });

  it('shows "try again" for a non-winning roll (value 1)', async () => {
    const { chats } = await prepareBot(createDiceGameBot());
    const user = chats.newUser();

    await user.sendDice('🎲');

    expect(user.replies.lastOrThrow().text).toContain('try again');
  });

  it('includes the rolled value in the reply', async () => {
    const { chats } = await prepareBot(createDiceGameBot());
    const user = chats.newUser();

    await user.sendDice('🎲');

    expect(user.replies.lastOrThrow().text).toContain('1');
  });

  it('WINNING_VALUE is 6 (the maximum dice value)', () => {
    expect(WINNING_VALUE).toBe(6);
  });
});
