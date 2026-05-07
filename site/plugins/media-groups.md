# Media Groups Plugin

Testing bots that use [grammy-media-groups](https://github.com/PonomareVlad/grammy-media-groups) works
out of the box with `@grammyjs/testing` v0.24.0 and later.

## What grammy-media-groups does

`grammy-media-groups` provides two complementary features:

| Feature                              | Install API                                          | What it does                                                                                                          |
| ------------------------------------ | ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| **`mediaGroupTransformer(adapter)`** | `bot.api.config.use(mediaGroupTransformer(adapter))` | Intercepts outgoing `sendMediaGroup` responses and stores returned messages in the adapter, keyed by `media_group_id` |
| **`mediaGroups()` middleware**       | `bot.use(mediaGroups())`                             | Hydrates the context with `ctx.mediaGroups.*` helpers for reading stored groups from incoming updates                 |

This page covers the transformer path. The middleware path uses `bot.use()` and never had the chain-ordering issue.

## Why v0.24.0 is required

`mediaGroupTransformer` calls `prev()` to get the API response, then reads `message.chat.id` for
deduplication and groups messages by `media_group_id` before writing to the adapter. Before v0.24.0,
the library's synthetic `sendMediaGroup` response only contained `message_id` and `date` — the
transformer silently skipped every message and stored nothing.

v0.24.0 adds both fields to every message in the default `sendMediaGroup` response:

```ts
// v0.24.0+ synthetic sendMediaGroup result (per message)
{
  message_id: <auto-incremented>,
  date: <unix>,
  chat: { id: ..., type: 'private' },      // required by storeMessages deduplication
  media_group_id: 'mg-1',                   // required for grouping; unique per call
}
```

## Setup

Install `mediaGroupTransformer(adapter)` **before** `prepareBot`:

```ts
import { MemorySessionStorage } from 'grammy';
import { Bot } from 'grammy';
import { mediaGroupTransformer } from 'grammy-media-groups';
import { prepareBot } from '@grammyjs/testing';

const adapter = new MemorySessionStorage();
const bot = new Bot('token');

bot.api.config.use(mediaGroupTransformer(adapter)); // before prepareBot ✓

const { chats } = await prepareBot(bot);
```

## Asserting on stored messages

The transformer stores messages keyed by `media_group_id`. Read the `media_group_id` from the
`sendMediaGroup` return value and use it to query the adapter:

```ts
bot.on('message:text', async (ctx) => {
  const results = await ctx.api.sendMediaGroup(ctx.chat.id, [
    { type: 'photo', media: 'file-id-1' },
    { type: 'photo', media: 'file-id-2' },
  ]);

  const mediaGroupId = results[0].media_group_id;
  const stored = adapter.read(mediaGroupId);
  // stored is Message[] — the same messages the transformer received
});
```

## Example test

```ts
import { MemorySessionStorage } from 'grammy';
import { Bot } from 'grammy';
import type { Message } from 'grammy/types';
import { mediaGroupTransformer } from 'grammy-media-groups';
import { describe, expect, it } from 'vitest';
import { prepareBot } from '@grammyjs/testing';

describe('grammy-media-groups', () => {
  it('adapter contains stored messages after sendMediaGroup', async () => {
    const adapter = new MemorySessionStorage<Message[]>();
    const bot = new Bot('test-token');

    bot.api.config.use(mediaGroupTransformer(adapter));

    let capturedMediaGroupId: string | undefined;

    bot.on('message:text', async (ctx) => {
      const results = await ctx.api.sendMediaGroup(ctx.chat.id, [
        { type: 'photo', media: 'file-id-1' },
        { type: 'photo', media: 'file-id-2' },
      ]);

      capturedMediaGroupId = (results[0] as any).media_group_id;
    });

    const { chats } = await prepareBot(bot);
    await chats.newUser().sendText('trigger');

    const stored = adapter.read(capturedMediaGroupId!);
    expect(stored).toBeDefined();
    expect(stored!.length).toBe(2);
  });

  it('two sendMediaGroup calls produce distinct media_group_ids', async () => {
    const adapter = new MemorySessionStorage<Message[]>();
    const bot = new Bot('test-token');

    bot.api.config.use(mediaGroupTransformer(adapter));

    const ids: string[] = [];

    bot.on('message:text', async (ctx) => {
      for (let index = 0; index < 2; index++) {
        const results = await ctx.api.sendMediaGroup(ctx.chat.id, [{ type: 'photo', media: `img-${String(index)}` }]);
        ids.push((results[0] as any).media_group_id);
      }
    });

    const { chats } = await prepareBot(bot);
    await chats.newUser().sendText('trigger');

    expect(ids[0]).not.toBe(ids[1]);
    expect(adapter.read(ids[0])).toBeDefined();
    expect(adapter.read(ids[1])).toBeDefined();
  });
});
```

See `tests/plugins/media-groups.spec.ts` for the full test suite.

## Using mg.transformer shorthand

`mediaGroups()` exposes `.transformer` as a convenience alias for `mediaGroupTransformer(adapter)`:

```ts
import { mediaGroups } from 'grammy-media-groups';

const mg = mediaGroups(); // uses MemorySessionStorage by default
bot.use(mg);
bot.api.config.use(mg.transformer); // same as mediaGroupTransformer(mg.adapter)

const { chats } = await prepareBot(bot);
// mg.adapter is readable directly in tests
const stored = await mg.getMediaGroup('mg-1');
```

## Middleware path (no transformer needed)

The `mediaGroups()` middleware handles **incoming** media group updates from Telegram. It reads
`ctx.msg.media_group_id` from each update and stores the message automatically. This path does not
use `bot.api.config.use()` and was never affected by the chain-ordering issue.

```ts
const mg = mediaGroups();
bot.use(mg);

// In tests, dispatch individual messages with the same media_group_id:
await user.sendDocument('file-1', { media_group_id: 'group-abc' });
await user.sendDocument('file-2', { media_group_id: 'group-abc' });

const stored = await mg.getMediaGroup('group-abc');
expect(stored).toHaveLength(2);
```
