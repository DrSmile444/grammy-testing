# Chat Members Plugin

`@grammyjs/chat-members` provides two distinct features, both supported by `grammy-testing`:

| Feature                | Install API                               | Supported since |
| ---------------------- | ----------------------------------------- | --------------- |
| `chatMembers(adapter)` | `bot.use(chatMembers(adapter))`           | v0.21.0         |
| `hydrateChatMember()`  | `bot.api.config.use(hydrateChatMember())` | v0.23.0         |

## chatMembers(adapter) middleware

`chatMembers` is a context middleware. It tracks member join/leave events from `chat_member`
updates and stores them in a `StorageAdapter`. `ctx.chatMembers.getChatMember()` reads from the
adapter — no live API call is made.

### Setup

```ts
import { chatMembers } from '@grammyjs/chat-members';
import { Bot, MemorySessionStorage } from 'grammy';
import { prepareBot } from 'grammy-testing';

const adapter = new MemorySessionStorage();
const bot = new Bot('token');
bot.use(chatMembers(adapter));

const { chats } = await prepareBot(bot);
```

### Testing join/leave events

`chatMembers` listens to the `chat_member` update type. Use `bot.handleUpdate` directly to
dispatch these updates — `user.joinChat` / `user.leaveChat` dispatch service messages, not
`chat_member` updates.

```ts
await bot.handleUpdate({
  update_id: 1,
  chat_member: {
    chat: { id: -100_000_001, type: 'supergroup', title: 'Test Group' },
    from: { id: 999, is_bot: false, first_name: 'Admin' },
    date: Math.floor(Date.now() / 1000),
    old_chat_member: { status: 'left', user: { id: 42, is_bot: false, first_name: 'Alice' } },
    new_chat_member: { status: 'member', user: { id: 42, is_bot: false, first_name: 'Alice' } },
  },
});

const stored = adapter.read('-100000001_42');
expect(stored?.status).toBe('member');
```

### Reading from storage in handlers

```ts
bot.on('message:text', async (ctx) => {
  const member = await ctx.chatMembers.getChatMember();
  // member is read from adapter — no API call
  console.log(member.status); // 'member'
});
```

## hydrateChatMember() transformer

`hydrateChatMember()` is a bot-level API transformer. It intercepts `getChatMember` and
`getChatAdministrators` responses and adds an `.is(query)` method to each result, enabling
guard-style status checks like `member.is('administrator')`.

### Why v0.23.0 is required

Before v0.23.0, the library's mock transformer was outermost. Any user-installed transformer
(including `hydrateChatMember()`) was silently skipped — its wrapping logic never ran. The chain
fix in v0.23.0 positions the library transformer innermost, so `hydrateChatMember()` runs and
can augment synthetic responses.

### Setup

Install `hydrateChatMember()` **before** `prepareBot`:

```ts
import { hydrateChatMember } from '@grammyjs/chat-members';
import { Bot } from 'grammy';
import { prepareBot } from 'grammy-testing';

const bot = new Bot('token');
bot.api.config.use(hydrateChatMember()); // before prepareBot ✓

const { chats } = await prepareBot(bot);
```

### Using .is() in handlers

```ts
bot.on('message:text', async (ctx) => {
  const member = await ctx.api.getChatMember(ctx.chat.id, ctx.from.id);

  if (member.is('administrator') || member.is('creator')) {
    await ctx.reply('You have admin privileges.');
  } else {
    await ctx.reply('Members only.');
  }
});
```

### Example test

```ts
import { hydrateChatMember } from '@grammyjs/chat-members';
import { Bot } from 'grammy';
import { describe, expect, it } from 'vitest';
import { prepareBot } from 'grammy-testing';

describe('hydrateChatMember', () => {
  it('getChatMember result has .is() method', async () => {
    const bot = new Bot('test-token');
    bot.api.config.use(hydrateChatMember());

    let hasIsMethod = false;

    bot.on('message:text', async (ctx) => {
      const member = await ctx.api.getChatMember(ctx.chat.id, ctx.from.id);
      hasIsMethod = typeof (member as any).is === 'function';
    });

    const { chats } = await prepareBot(bot);
    await chats.newUser().sendText('ping');

    expect(hasIsMethod).toBe(true);
  });

  it('getChatAdministrators items each have .is() method', async () => {
    const bot = new Bot('test-token');
    bot.api.config.use(hydrateChatMember());

    let allHaveIsMethod = false;

    bot.on('message:text', async (ctx) => {
      const admins = await ctx.api.getChatAdministrators(ctx.chat.id);
      allHaveIsMethod = admins.length > 0 && admins.every((a) => typeof (a as any).is === 'function');
    });

    const { chats } = await prepareBot(bot);
    await chats.newUser().sendText('ping');

    expect(allHaveIsMethod).toBe(true);
  });
});
```

## Combining both

Both features can be used together without conflict:

```ts
const adapter = new MemorySessionStorage();
const bot = new Bot('token');

bot.use(chatMembers(adapter)); // context middleware
bot.api.config.use(hydrateChatMember()); // API transformer

const { chats } = await prepareBot(bot);
```
