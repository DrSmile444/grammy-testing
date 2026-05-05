# Getting Started

Get your first test passing in under five minutes.

## Install

::: code-group

```sh [npm]
npm install --save-dev @grammyjs/testing
```

```sh [yarn]
yarn add --dev @grammyjs/testing
```

```sh [pnpm]
pnpm add --save-dev @grammyjs/testing
```

```ts [Deno (jsr)]
import { prepareBot } from 'jsr:@grammyjs/testing';
```

:::

grammY itself must be installed as well — it is a peer dependency:

```sh
npm install grammy
```

## Your first test

Given a simple echo bot:

```ts
// bot.ts
import { Bot } from 'grammy';

export function createBot() {
  const bot = new Bot('token');

  bot.on('message:text', async (ctx) => {
    await ctx.reply(`You said: ${ctx.message.text}`);
  });

  return bot;
}
```

Write a test:

```ts
// bot.spec.ts
import { prepareBot } from '@grammyjs/testing';
import { describe, expect, it } from 'vitest';

import { createBot } from './bot';

describe('echo bot', () => {
  it('echoes the message back', async () => {
    // 1. Prepare the bot for testing
    const { chats } = await prepareBot(createBot());

    // 2. Create a synthetic user
    const user = chats.newUser();

    // 3. Send a message
    await user.sendText('hello');

    // 4. Assert on the reply
    expect(user.replies.lastOrThrow().text).toBe('You said: hello');
  });
});
```

Run it:

```sh
npx vitest run
```

## What just happened?

- `prepareBot(bot)` — installs the capture transformer and initialises the bot in-process.
- `chats.newUser()` — creates a synthetic Telegram user with an auto-generated ID.
- `user.sendText('hello')` — dispatches a `message` update to your bot.
- `user.replies.lastOrThrow()` — returns the last `Reply` captured from your bot.
- `.text` — the text the bot sent in `ctx.reply(...)`.

## Commands

Use `sendCommand` to dispatch `/command` updates:

```ts
const { chats } = await prepareBot(createBot());
const user = chats.newUser();

await user.sendCommand('/start');

expect(user.replies.lastOrThrow().text).toBe('Welcome!');
```

## Multi-user scenarios

```ts
const { chats } = await prepareBot(createBot());
const alice = chats.newUser({ first_name: 'Alice' });
const bob = chats.newUser({ first_name: 'Bob' });
const group = chats.newSupergroup('Test Group');

group.join(alice);
group.join(bob);

await alice.sendText('hi', { chat: group });
await bob.sendText('hey', { chat: group });

expect(group.messages.all).toHaveLength(2);
```

## Next steps

- [How It Works](/guide/how-it-works) — understand the transformer and idle tracking
- [User](/high-level/user) — all 50+ dispatch methods
- [Reply](/high-level/reply) — every accessor on the Reply object including `clickButton`
- [With Vitest](/guide/with-vitest) — full Vitest project setup
