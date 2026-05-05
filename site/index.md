---
layout: home

hero:
  image:
    src: /logo.svg
    alt: grammY Testing logo
  name: 'grammY Testing'
  text: 'Production-grade testing for Telegram bots'
  tagline: 'Drive your real bot in-process. Capture every API call. Assert on replies — no tokens, no network, no waiting.'
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: API Reference
      link: /api/prepare-bot

features:
  - icon: ⚡
    title: In-Process Testing
    details: Your bot runs entirely in-process. No Telegram token, no network round-trips, no flaky timeouts. Tests are deterministic and fast.
  - icon: 🎭
    title: Real Bot, Synthetic Updates
    details: Uses your actual grammY bot with a transformer that intercepts outgoing calls. No mocking of grammY internals — every handler runs exactly as in production.
  - icon: 🏗️
    title: Two-Layer API
    details: A high-level actor API (User, Group, Channel) for readable tests, plus a low-level escape hatch for edge cases. Use what fits each test.
  - icon: 🧪
    title: Any Test Framework
    details: Works with Vitest, Jest, and Deno's built-in test runner. Zero framework-specific dependencies in the library itself.
---

## Quick look

```ts
import { prepareBot } from '@grammyjs/testing';
import { Bot } from 'grammy';
import { describe, expect, it } from 'vitest';

const bot = new Bot('token');
bot.command('start', (ctx) => ctx.reply('Hello!'));

it('replies to /start', async () => {
  const { chats } = await prepareBot(bot);
  const user = chats.newUser();

  await user.sendCommand('/start');

  expect(user.replies.lastOrThrow().text).toBe('Hello!');
});
```

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

```ts [Deno]
import { prepareBot } from 'jsr:@grammyjs/testing';
```

:::
