# Conversations Plugin

Testing [@grammyjs/conversations](https://grammy.dev/plugins/conversations) v2 requires one
special setup step — the `okFetch` mock client.

## Why okFetch is needed

`@grammyjs/conversations` v2 creates an internal `Api` instance that bypasses the testing
framework's transformer. Without intervention, API calls inside the conversation function
(like `ctx.reply`, `ctx.deleteMessage`) would attempt real HTTP requests to Telegram.

The fix: pass a mock `fetch` implementation to the `Bot` constructor that returns a minimal
success response for every call.

```ts
const okFetch = () =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ ok: true, result: true }),
    text: () => Promise.resolve('{"ok":true,"result":true}'),
  });

const bot = new Bot<MyContext>('test-token', { client: { fetch: okFetch } });
```

## Basic conversation test

```ts
import { conversations, createConversation, type Conversation, type ConversationFlavor } from '@grammyjs/conversations';
import { prepareBot } from 'grammy-testing';
import { Bot, type Context } from 'grammy';
import { describe, expect, it } from 'vitest';

type MyContext = ConversationFlavor<Context>;
type MyConversation = Conversation<MyContext, MyContext>;

const okFetch = () =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ ok: true, result: true }),
    text: () => Promise.resolve('{"ok":true,"result":true}'),
  });

describe('conversations', () => {
  it('multi-step greeting conversation', async () => {
    let observedName: string | undefined;
    let stepReached = 0;

    async function greetingConversation(conversation: MyConversation, ctx: MyContext) {
      stepReached = 1;
      await ctx.reply('What is your name?');
      const nameCtx = await conversation.wait();

      observedName = nameCtx.message?.text;
      stepReached = 2;
      await nameCtx.reply(`Hello, ${observedName ?? 'stranger'}!`);
    }

    const bot = new Bot<MyContext>('test-token', { client: { fetch: okFetch } });

    bot.use(conversations());
    bot.use(createConversation(greetingConversation));
    bot.command('start', (ctx) => ctx.conversation.enter('greetingConversation'));

    const { chats } = await prepareBot<MyContext>(bot);
    const user = chats.newUser();

    await user.sendCommand('/start');
    expect(stepReached).toBe(1);

    await user.sendText('Alice');
    expect(stepReached).toBe(2);
    expect(observedName).toBe('Alice');
  });
});
```

## Asserting on conversation logic

Because API calls inside the conversation bypass the transformer, `user.replies` won't capture
them. Instead, assert on **side effects** — variables set inside the conversation function:

```ts
let collectedItems: string[] = [];

async function shoppingConversation(conversation: MyConversation, ctx: MyContext) {
  await ctx.reply('Add items. Say "done" to finish.');

  while (true) {
    const itemCtx = await conversation.wait();
    const text = itemCtx.message?.text ?? '';
    if (text === 'done') break;
    collectedItems.push(text);
  }
}

// ...
await user.sendCommand('/shop');
await user.sendText('apples');
await user.sendText('bananas');
await user.sendText('done');

expect(collectedItems).toEqual(['apples', 'bananas']);
```

## Multi-step state persistence

```ts
it('persists state across dispatches', async () => {
  let firstSeen: string | undefined;
  let secondSeen: string | undefined;

  async function twoStep(conversation: MyConversation) {
    const first = await conversation.wait();
    firstSeen = first.message?.text;

    const second = await conversation.wait();
    secondSeen = second.message?.text;
  }

  // ... bot setup with okFetch

  await user.sendCommand('/start');
  expect(firstSeen).toBeUndefined();

  await user.sendText('step-one');
  expect(firstSeen).toBe('step-one');
  expect(secondSeen).toBeUndefined();

  await user.sendText('step-two');
  expect(secondSeen).toBe('step-two');
});
```
