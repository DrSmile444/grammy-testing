/**
 * Pattern: Service messages — new_chat_members / left_chat_member.
 *
 * Source: ua-anti-spam-bot/tests/bot.spec.ts (NewMember + LeftMember tests)
 * Inspired-by tests: ~10
 *
 * What this exercises: service messages emitted when users join or leave
 * a chat. Bots routinely delete these or run welcome flows.
 *
 * v0.2 API expression: NONE — this pattern currently uses v0.1 low-level
 * NewMemberMockUpdate / LeftMemberMockUpdate builders directly. The
 * high-level Chats / User API does not yet ship verbs for join/leave
 * service-message dispatch.
 *
 * v0.2.x gaps: entire category. Suggested proposal:
 * add-service-message-verbs (e.g. user.joinChat(group), user.leaveChat(group)
 * that synthesize these service-message updates).
 */

import { Bot } from 'grammy';
import { describe, expect, it } from 'vitest';

import { prepareBot } from '../../src/index';
import { LeftMemberMockUpdate, NewMemberMockUpdate } from '../../src/low-level';

describe('reference: service messages', () => {
  it('bot reacts to a new-member service message (low-level escape hatch)', async () => {
    // v0.2.x gap: no user.joinChat verb yet — uses v0.1 NewMemberMockUpdate.
    // Suggested proposal: add-service-message-verbs.
    const bot = new Bot('test-token');

    bot.on('message:new_chat_members', async (context) => {
      await context.deleteMessage();
    });

    const { chats } = await prepareBot(bot);

    await bot.handleUpdate(new NewMemberMockUpdate().build());

    expect(chats.outgoing.getMethods()).toEqual(['deleteMessage']);
  });

  it('bot reacts to a left-member service message (low-level escape hatch)', async () => {
    // v0.2.x gap: no user.leaveChat verb yet — uses v0.1 LeftMemberMockUpdate.
    // Suggested proposal: add-service-message-verbs.
    const bot = new Bot('test-token');

    bot.on('message:left_chat_member', async (context) => {
      await context.deleteMessage();
    });

    const { chats } = await prepareBot(bot);

    await bot.handleUpdate(new LeftMemberMockUpdate().build());

    expect(chats.outgoing.getMethods()).toEqual(['deleteMessage']);
  });
});
