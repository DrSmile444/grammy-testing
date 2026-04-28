/**
 * Pattern: Media groups (shared media_group_id, N-update dispatch).
 *
 * Source: ua-anti-spam-bot/tests/bot.spec.ts:322-383 (swindler-detection-in-captions)
 * Inspired-by tests: ~20 (high-frequency Coverage-audit gap #4)
 *
 * What this exercises: real Telegram delivers media groups as N separate
 * updates sharing a `media_group_id`. Bots that aggregate (e.g. detect
 * spam across all captions in a group) need to see each update individually.
 *
 * v0.2 API expression: user.sendMediaGroup([{ caption?, photo?, ... }, ...]).
 *
 * v0.2.x gaps: none for this pattern category.
 */

import { Bot } from 'grammy';
import { describe, expect, it } from 'vitest';

import { prepareBot } from '../../src/index';

describe('reference: media groups', () => {
  it('three-item dispatch produces three handler invocations with shared media_group_id', async () => {
    const bot = new Bot('test-token');
    const seenIds: string[] = [];

    bot.on('message', (context) => {
      if (context.message.media_group_id) {
        seenIds.push(context.message.media_group_id);
      }
    });

    const { chats } = await prepareBot(bot);
    const user = chats.newUser();

    await user.sendMediaGroup([{ caption: 'first', photo: 'a.jpg' }, { photo: 'b.jpg' }, { photo: 'c.jpg' }]);

    expect(seenIds).toHaveLength(3);
    expect(new Set(seenIds).size).toBe(1);
  });

  it('bot aggregates by media_group_id and acts after seeing all items', async () => {
    const bot = new Bot('test-token');
    const groupCounts = new Map<string, number>();

    bot.on('message', (context) => {
      const id = context.message.media_group_id;

      if (id) {
        groupCounts.set(id, (groupCounts.get(id) ?? 0) + 1);
      }
    });

    const { chats } = await prepareBot(bot);
    const user = chats.newUser();

    await user.sendMediaGroup([{ caption: 'first', photo: 'a.jpg' }, { photo: 'b.jpg' }, { photo: 'c.jpg' }]);

    expect([...groupCounts.values()][0]).toBe(3);
  });

  it('two distinct calls produce two distinct media_group_ids', async () => {
    const bot = new Bot('test-token');
    const seen: string[] = [];

    bot.on('message', (context) => {
      if (context.message.media_group_id) {
        seen.push(context.message.media_group_id);
      }
    });

    const { chats } = await prepareBot(bot);
    const user = chats.newUser();

    await user.sendMediaGroup([{ photo: 'a.jpg' }, { photo: 'b.jpg' }]);
    await user.sendMediaGroup([{ photo: 'c.jpg' }, { photo: 'd.jpg' }]);

    expect(seen).toHaveLength(4);
    expect(new Set(seen).size).toBe(2);
  });

  it('sendMediaGroup photo string produces a populated PhotoSize stub', async () => {
    const bot = new Bot('test-token');
    const fileIds: (string | undefined)[] = [];

    bot.on('message', (context) => {
      if (context.message.media_group_id) {
        fileIds.push(context.message.photo?.[0]?.file_id);
      }
    });

    const { chats } = await prepareBot(bot);
    const user = chats.newUser();

    await user.sendMediaGroup([{ photo: 'a.jpg' }, { photo: 'b.jpg' }]);

    expect(fileIds[0]).toBe('a.jpg');
    expect(fileIds[1]).toBe('b.jpg');
  });
});
