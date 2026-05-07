/**
 * Plugin interop: `grammy-media-groups`
 *
 * Setup notes:
 * - `mediaGroupTransformer(adapter)` is a bot-level API transformer that
 *   intercepts `sendMediaGroup` responses and stores returned messages in the
 *   adapter, keyed by `media_group_id`.
 * - Install it via `bot.api.config.use(mediaGroupTransformer(adapter))` BEFORE
 *   `prepareBot` so the chain-ordering fix positions it outside the library
 *   transformer. The transformer then runs and receives the synthetic response.
 * - The synthetic `sendMediaGroup` response (v0.24.0+) includes `chat` and
 *   `media_group_id` on every message object. Without these fields the
 *   transformer silently skips all messages and the adapter stays empty.
 * - `storeMessages` groups by `media_group_id` and deduplicates by
 *   `(message_id, chat.id)` — both fields are now present in the default
 *   response shape.
 */

import { Bot, MemorySessionStorage } from 'grammy';
import type { Message } from 'grammy/types';
import { mediaGroupTransformer } from 'grammy-media-groups';
import { describe, expect, it } from 'vitest';

import { prepareBot } from '../../src/index';

type MessageWithGroup = Message & { media_group_id?: string };

describe('plugin: grammy-media-groups — mediaGroupTransformer', () => {
  it('adapter contains stored messages after bot calls sendMediaGroup', async () => {
    const adapter = new MemorySessionStorage<Message[]>();
    const bot = new Bot('test-token');

    bot.api.config.use(mediaGroupTransformer(adapter));

    let capturedMediaGroupId = '';

    bot.on('message:text', async (ctx) => {
      const results = await ctx.api.sendMediaGroup(ctx.chat.id, [
        { type: 'photo', media: 'file-id-1' },
        { type: 'photo', media: 'file-id-2' },
      ]);

      capturedMediaGroupId = (results[0] as unknown as MessageWithGroup).media_group_id ?? '';
    });

    const { chats } = await prepareBot(bot);
    const user = chats.newUser();

    await user.sendText('trigger');

    expect(capturedMediaGroupId).not.toBe('');

    const stored = adapter.read(capturedMediaGroupId);

    expect(stored).toBeDefined();
    expect((stored ?? []).length).toBeGreaterThan(0);
  });

  it('each stored message has chat.id accessible', async () => {
    const adapter = new MemorySessionStorage<Message[]>();
    const bot = new Bot('test-token');

    bot.api.config.use(mediaGroupTransformer(adapter));

    let capturedMediaGroupId = '';

    bot.on('message:text', async (ctx) => {
      const results = await ctx.api.sendMediaGroup(ctx.chat.id, [
        { type: 'photo', media: 'file-id-a' },
        { type: 'photo', media: 'file-id-b' },
      ]);

      capturedMediaGroupId = (results[0] as unknown as MessageWithGroup).media_group_id ?? '';
    });

    const { chats } = await prepareBot(bot);
    const user = chats.newUser();

    await user.sendText('trigger');

    const stored = adapter.read(capturedMediaGroupId);

    expect(stored).toBeDefined();
    expect((stored ?? []).every((message) => typeof message.chat.id === 'number')).toBe(true);
  });

  it('all messages from one sendMediaGroup call share the same media_group_id', async () => {
    const adapter = new MemorySessionStorage<Message[]>();
    const bot = new Bot('test-token');

    bot.api.config.use(mediaGroupTransformer(adapter));

    let firstGroupId = '';
    let secondGroupId = '';

    bot.on('message:text', async (ctx) => {
      const firstResults = await ctx.api.sendMediaGroup(ctx.chat.id, [
        { type: 'photo', media: 'img-1' },
        { type: 'photo', media: 'img-2' },
        { type: 'photo', media: 'img-3' },
      ]);

      const secondResults = await ctx.api.sendMediaGroup(ctx.chat.id, [{ type: 'photo', media: 'img-4' }]);

      firstGroupId = (firstResults[0] as unknown as MessageWithGroup).media_group_id ?? '';
      secondGroupId = (secondResults[0] as unknown as MessageWithGroup).media_group_id ?? '';
    });

    const { chats } = await prepareBot(bot);
    const user = chats.newUser();

    await user.sendText('trigger');

    const firstGroup = adapter.read(firstGroupId);
    const secondGroup = adapter.read(secondGroupId);

    expect(firstGroup).toBeDefined();
    expect((firstGroup ?? []).length).toBe(3);

    expect((firstGroup ?? []).every((message) => (message as unknown as MessageWithGroup).media_group_id === firstGroupId)).toBe(true);

    expect(secondGroup).toBeDefined();
    expect((secondGroup ?? []).length).toBe(1);

    expect(firstGroupId).not.toBe(secondGroupId);
  });
});
