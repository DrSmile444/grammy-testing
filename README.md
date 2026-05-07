<img src="./docs/grammy-testing-logo.svg" width="1080" alt="" />

<div align="right">

# Production-grade testing infrastructure for grammY bots.

</div>

<div align="center">

[![npm](https://img.shields.io/npm/v/@grammyjs/testing?style=flat&labelColor=000&color=ffd700)](https://www.npmjs.com/package/@grammyjs/testing)
[![JSR](https://img.shields.io/jsr/v/@grammyjs/testing?style=flat&labelColor=000&color=ffd700)](https://jsr.io/@grammyjs/testing)
[![License: MIT](https://img.shields.io/badge/License-MIT-ffd700?style=flat&labelColor=000)](LICENSE)

## _[docs.](https://drsmile444.github.io/grammy-testing/) [npm.](https://www.npmjs.com/package/@grammyjs/testing) [jsr.](https://jsr.io/@grammyjs/testing) [examples.](./examples/)_

</div>

---

## Why

**Testing a Telegram bot used to mean spinning up a real token, sending live messages, and
hoping the Telegram API behaved.** grammY ships no testing tools itself, and existing
community solutions are either unmaintained, Deno-only, or too low-level to be ergonomic.

`@grammyjs/testing` drives your real bot in-process. No token. No network. No sleep timers.
Dispatch a synthetic update, the bot handles it exactly as it would in production, and you
assert on the captured replies.

## Quick Start

```bash
# npm
npm install --save-dev @grammyjs/testing

# Deno / JSR
npx jsr add --dev @grammyjs/testing
```

```ts
// bot.ts
bot.command('start', async (ctx) => {
  await ctx.reply('Welcome! Use /help to see available commands.');
});
```

```ts
// bot.spec.ts
import { prepareBot } from '@grammyjs/testing';

const { chats } = await prepareBot(createBot());
const user = chats.newUser();

await user.sendCommand('/start');

expect(user.replies.lastOrThrow().text).toContain('Welcome');
```

## Features

**Actors & chat types**

- Create users and admins with custom profiles (`chats.newUser()`, `chats.newAdmin()`)
- Create groups, supergroups, and channels (`chats.newGroup()`, `chats.newSupergroup()`, `chats.newChannel()`)
- Place users into group contexts (`group.own(user)`)

**Dispatch — send anything a real user can send**

- Text messages, commands, photos, documents, stickers, polls, dice, locations, contacts
- Callback queries, inline queries, reactions, media groups
- Member join/leave events, chat member status changes
- Channel posts, forwarded messages, business account messages

**Reply & request assertions**

- `user.replies.lastOrThrow()` — the last reply sent to this user
- `group.messages.last` — the latest message in a group context
- `chats.outgoing.requests` — every raw Telegram API call the bot made

**Session & state injection**

- `mockSession(initial)` — seed a pre-set session state for unit testing
- `mockChatSession(initial)` — per-chat session injection
- `mockState(initial)` — conversations and state machine testing

**Isolation utilities**

- `prepareMiddleware(fn)` — test a single middleware without a full bot
- `prepareComposer(Composer)` — test a composer class in isolation

**Ecosystem**

- Works with Vitest and Jest
- TypeScript-first — all types exported
- Low-level API available for advanced and custom scenarios

**Plugin interop**

| Plugin                            | How it installs                                                         | Supported since   |
| --------------------------------- | ----------------------------------------------------------------------- | ----------------- |
| `@grammyjs/conversations`         | `bot.use(conversations())`                                              | v0.21.0           |
| `@grammyjs/menu`                  | `bot.use(menu)`                                                         | v0.21.0           |
| `@grammyjs/parse-mode`            | formatting utilities, no transformer                                    | v0.21.0           |
| `@grammyjs/chat-members`          | `bot.use(chatMembers(...))` / `bot.api.config.use(hydrateChatMember())` | v0.21.0 / v0.23.0 |
| `@grammyjs/files`                 | `bot.api.config.use(hydrateFiles(...))`                                 | v0.23.0           |
| `@grammyjs/hydrate`               | `bot.api.config.use(hydrateApi())` + `bot.use(hydrate())`               | v0.23.0           |
| `@grammyjs/auto-retry`            | `bot.api.config.use(autoRetry(...))`                                    | v0.23.0           |
| `@grammyjs/transformer-throttler` | `bot.api.config.use(throttler(...))`                                    | v0.23.0           |

## Examples

23 self-contained bots with matching test files live in [`examples/`](./examples/):

| #   | Scenario                                                                                                 |
| --- | -------------------------------------------------------------------------------------------------------- |
| 01  | [Echo bot](./examples/01-echo-bot/) — simplest text-echo handler                                         |
| 02  | [Command bot](./examples/02-command-bot/) — `/start` and `/help`                                         |
| 03  | [Greeting bot](./examples/03-greeting-bot/) — per-user name with fallback                                |
| 04  | [Chat-type filter](./examples/04-chat-type-filter-bot/) — private vs. group routing                      |
| 05  | [Inline keyboard](./examples/05-inline-keyboard-bot/) — regex handler with keyboard                      |
| 06  | [Callback query](./examples/06-callback-query-bot/) — inline keyboard responses                          |
| 07  | [Session counter](./examples/07-session-counter-bot/) — persistent per-user state                        |
| 08  | [Chat settings](./examples/08-chat-settings-bot/) — `mockChatSession` usage                              |
| 09  | [Photo bot](./examples/09-photo-bot/) — caption extraction                                               |
| 10  | [Document bot](./examples/10-document-bot/) — file-ID and MIME type reply                                |
| 11  | [Poll bot](./examples/11-poll-bot/) — quiz creation and answer scoring                                   |
| 12  | [Group welcome](./examples/12-group-welcome-bot/) — `new_chat_members` service event                     |
| 13  | [Admin guard](./examples/13-admin-guard-bot/) — `getChatMember` status check                             |
| 14  | [Moderation bot](./examples/14-moderation-bot/) — `banChatMember` / `restrictChatMember`                 |
| 15  | [Channel post bot](./examples/15-channel-post-bot/) — `channel_post` handler                             |
| 16  | [Reactions bot](./examples/16-reactions-bot/) — `message_reaction` handler                               |
| 17  | [Dice game](./examples/17-dice-game-bot/) — incoming dice value evaluation                               |
| 18  | [Middleware test](./examples/18-middleware-test/) — isolation with `prepareMiddleware`                   |
| 19  | [Composer test](./examples/19-composer-test/) — isolation with `prepareComposer`                         |
| 20  | [Multi-chat scenario](./examples/20-multi-chat-scenario/) — cross-chat summary posting                   |
| 21  | [Files bot](./examples/21-files-bot/) — `@grammyjs/files` — `file.getUrl()` from `ctx.getFile()`         |
| 22  | [Hydrate bot](./examples/22-hydrate-bot/) — `@grammyjs/hydrate` — hydrated replies with `delete()`       |
| 23  | [Auto-retry bot](./examples/23-auto-retry-bot/) — `@grammyjs/auto-retry` — broadcast with error handling |

## Documentation

Full API reference, step-by-step guides, and recipes are available at
**[drsmile444.github.io/grammy-testing/](https://drsmile444.github.io/grammy-testing/)**.

The [examples/](./examples/) directory also covers a wide range of real-world patterns — from
the simplest echo bot to multi-chat scenarios with sessions and admin guards.

## Credits

`@grammyjs/testing` stands on the shoulders of:

- [grammy_tests](https://github.com/dcdunkan/grammy_tests) by dcdunkan — the original
  testing concept for grammY bots that inspired this library's design
- [ua-anti-spam-bot](https://github.com/MoC-OSS/ua-anti-spam-bot) by MoC-OSS — a
  real-world bot whose test patterns shaped the high-level API

## License

MIT — see [LICENSE](LICENSE).
