/**
 * Pattern: Service messages — new_chat_members / left_chat_member.
 *
 * What this exercises: service messages emitted when users join or leave
 * a chat. Bots routinely delete these or run welcome flows.
 *
 * v0.2 API expression: user.joinChat(group), user.leaveChat(group).
 * Both verbs dispatch the right service-message-shape update AND update
 * the chat's membership map (join → 'member' unless already privileged;
 * leave → 'left'). Closed in v0.2.x via add-service-message-verbs.
 *
 * v0.2.x gaps: none for this pattern category at v0.2.x.
 */

import { Bot } from 'grammy';
import { describe, expect, it } from 'vitest';

import { prepareBot } from '../../src/index';

describe('reference: service messages', () => {
  it('bot reacts to a new-member service message', async () => {
    const bot = new Bot('test-token');

    bot.on('message:new_chat_members', async (context) => {
      await context.deleteMessage();
    });

    const { chats } = await prepareBot(bot);
    const user = chats.newUser();
    const group = chats.newSupergroup();

    await user.joinChat(group);

    expect(chats.outgoing.getMethods()).toEqual(['deleteMessage']);
    expect(user.in(group)?.status).toBe('member');
  });

  it('bot reacts to a left-member service message', async () => {
    const bot = new Bot('test-token');

    bot.on('message:left_chat_member', async (context) => {
      await context.deleteMessage();
    });

    const { chats } = await prepareBot(bot);
    const user = chats.newUser();
    const group = chats.newSupergroup();

    await user.leaveChat(group);

    expect(chats.outgoing.getMethods()).toEqual(['deleteMessage']);
    expect(user.in(group)?.status).toBe('left');
  });
});
