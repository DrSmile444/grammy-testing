import { Bot } from 'grammy';
import type { Message } from 'grammy/types';
import { describe, expect, it } from 'vitest';

import { prepareBot } from '../../src/index';

describe('bot.api.sendMediaGroup synthetic response', () => {
  it('default response length matches the number of media items sent', async () => {
    const bot = new Bot('test-token');
    let sentGroup: Message[] | undefined;

    bot.on('message', async (ctx) => {
      sentGroup = await ctx.api.sendMediaGroup(ctx.chat.id, [
        { type: 'photo', media: 'file-a' },
        { type: 'photo', media: 'file-b' },
      ]);
    });

    const { chats } = await prepareBot(bot);
    const user = chats.newUser();

    await user.sendText('trigger');

    expect(sentGroup).toHaveLength(2);
    expect(sentGroup?.[0]?.message_id).toBe(user.replies.lastOrThrow().messageId);
    expect(sentGroup?.[1]?.message_id).toBeTypeOf('number');
  });
});

describe('user.sendMediaGroup', () => {
  it('three-item dispatch produces three handler invocations with shared media_group_id', async () => {
    const bot = new Bot('test-token');
    const seenGroupIds: string[] = [];

    bot.on('message', (ctx) => {
      if (ctx.message.media_group_id) {
        seenGroupIds.push(ctx.message.media_group_id);
      }
    });

    const { chats } = await prepareBot(bot);
    const user = chats.newUser();

    await user.sendMediaGroup([{ caption: 'first', photo: 'a.jpg' }, { photo: 'b.jpg' }, { photo: 'c.jpg' }]);

    expect(seenGroupIds).toHaveLength(3);
    expect(new Set(seenGroupIds).size).toBe(1); // all three same id
  });

  it('caption typically lands on the first item only', async () => {
    const bot = new Bot('test-token');
    const captions: (string | undefined)[] = [];

    bot.on('message', (ctx) => {
      if (ctx.message.media_group_id) {
        captions.push(ctx.message.caption);
      }
    });

    const { chats } = await prepareBot(bot);
    const user = chats.newUser();

    await user.sendMediaGroup([{ caption: 'group caption', photo: 'a.jpg' }, { photo: 'b.jpg' }]);

    expect(captions[0]).toBe('group caption');
    expect(captions[1]).toBeUndefined();
  });

  it('two distinct calls produce two distinct media_group_ids', async () => {
    const bot = new Bot('test-token');
    const seen: string[] = [];

    bot.on('message', (ctx) => {
      if (ctx.message.media_group_id) {
        seen.push(ctx.message.media_group_id);
      }
    });

    const { chats } = await prepareBot(bot);
    const user = chats.newUser();

    await user.sendMediaGroup([{ photo: 'a.jpg' }, { photo: 'b.jpg' }]);
    await user.sendMediaGroup([{ photo: 'c.jpg' }, { photo: 'd.jpg' }]);

    const distinct = new Set(seen);

    expect(seen).toHaveLength(4);
    expect(distinct.size).toBe(2);
  });
});
